/**
 * ==========================================================
 * SUPABASE CONNECTION FIX
 * ==========================================================
 * 
 * Fixes common Supabase connection and sync issues:
 * - Connection pooling and retry logic
 * - Real-time subscription management
 * - Offline queue for failed operations
 * - Automatic reconnection
 * 
 * ==========================================================
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface QueuedOperation {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
}

class SupabaseConnectionManager {
  private operationQueue: QueuedOperation[] = [];
  private isProcessingQueue = false;
  private subscriptions: Map<string, RealtimeChannel> = new Map();
  private connectionStatus: 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadQueueFromStorage();
      this.startConnectionMonitor();
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  /**
   * Check connection status
   */
  async checkConnection(): Promise<boolean> {
    if (!isSupabaseConfigured) {
      console.warn('[Supabase] Not configured');
      return false;
    }

    try {
      const { error } = await supabase.from('learning_sessions').select('id').limit(1);
      if (error) {
        console.error('[Supabase] Connection check failed:', error.message);
        this.connectionStatus = 'disconnected';
        return false;
      }
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      return true;
    } catch (err) {
      console.error('[Supabase] Connection exception:', err);
      this.connectionStatus = 'disconnected';
      return false;
    }
  }

  /**
   * Execute operation with retry logic
   */
  async executeOperation<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      retryDelay?: number;
      fallbackValue?: T;
    } = {}
  ): Promise<T> {
    const { maxRetries = 3, retryDelay = 1000, fallbackValue } = options;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await operation();
        return result;
      } catch (error: any) {
        lastError = error;
        console.error(`[Supabase] Operation failed (attempt ${attempt + 1}/${maxRetries}):`, error.message);

        if (attempt < maxRetries - 1) {
          const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (fallbackValue !== undefined) {
      console.warn('[Supabase] Using fallback value after all retries failed');
      return fallbackValue;
    }

    throw lastError || new Error('Operation failed after all retries');
  }

  /**
   * Queue operation for later execution
   */
  queueOperation(
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: any
  ): void {
    const queuedOp: QueuedOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      table,
      operation,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    this.operationQueue.push(queuedOp);
    this.saveQueueToStorage();
    console.log(`[Supabase] Queued ${operation} operation for ${table}`);

    // Try to process queue if online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  /**
   * Process queued operations
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    console.log(`[Supabase] Processing ${this.operationQueue.length} queued operations`);

    const isConnected = await this.checkConnection();
    if (!isConnected) {
      console.warn('[Supabase] Not connected, will retry later');
      this.isProcessingQueue = false;
      return;
    }

    const operations = [...this.operationQueue];
    this.operationQueue = [];

    for (const op of operations) {
      try {
        await this.executeQueuedOperation(op);
        console.log(`[Supabase] ✓ Processed queued ${op.operation} for ${op.table}`);
      } catch (error: any) {
        console.error(`[Supabase] Failed to process queued operation:`, error.message);
        
        // Re-queue if not too many retries
        if (op.retries < 3) {
          op.retries++;
          this.operationQueue.push(op);
        } else {
          console.error(`[Supabase] Dropping operation after ${op.retries} retries:`, op);
        }
      }
    }

    this.saveQueueToStorage();
    this.isProcessingQueue = false;
  }

  /**
   * Execute a queued operation
   */
  private async executeQueuedOperation(op: QueuedOperation): Promise<void> {
    switch (op.operation) {
      case 'insert':
        const { error: insertError } = await supabase.from(op.table).insert(op.data);
        if (insertError) throw insertError;
        break;
      
      case 'update':
        const { error: updateError } = await supabase
          .from(op.table)
          .update(op.data.updates)
          .match(op.data.match);
        if (updateError) throw updateError;
        break;
      
      case 'delete':
        const { error: deleteError } = await supabase
          .from(op.table)
          .delete()
          .match(op.data);
        if (deleteError) throw deleteError;
        break;
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueueToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('supabase_operation_queue', JSON.stringify(this.operationQueue));
    } catch (error) {
      console.error('[Supabase] Failed to save queue to storage:', error);
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueueFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('supabase_operation_queue');
      if (stored) {
        this.operationQueue = JSON.parse(stored);
        console.log(`[Supabase] Loaded ${this.operationQueue.length} queued operations from storage`);
      }
    } catch (error) {
      console.error('[Supabase] Failed to load queue from storage:', error);
    }
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    console.log('[Supabase] Network online - processing queue');
    this.processQueue();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('[Supabase] Network offline - operations will be queued');
    this.connectionStatus = 'disconnected';
  }

  /**
   * Start connection monitor
   */
  private startConnectionMonitor(): void {
    setInterval(async () => {
      if (this.connectionStatus === 'disconnected' && navigator.onLine) {
        console.log('[Supabase] Attempting to reconnect...');
        this.connectionStatus = 'reconnecting';
        const connected = await this.checkConnection();
        if (connected) {
          console.log('[Supabase] Reconnected successfully');
          this.processQueue();
        } else {
          this.reconnectAttempts++;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[Supabase] Max reconnect attempts reached');
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30s
          }
        }
      }
    }, this.reconnectDelay);
  }

  /**
   * Subscribe to real-time updates
   */
  subscribeToTable(
    table: string,
    callback: (payload: any) => void,
    filter?: { column: string; value: any }
  ): () => void {
    if (!isSupabaseConfigured) {
      console.warn('[Supabase] Cannot subscribe - not configured');
      return () => {};
    }

    const channelName = filter 
      ? `${table}_${filter.column}_${filter.value}`
      : table;

    // Remove existing subscription if any
    this.unsubscribeFromTable(channelName);

    let channel = supabase.channel(channelName);

    if (filter) {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `${filter.column}=eq.${filter.value}`,
        },
        callback
      );
    } else {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
        },
        callback
      );
    }

    channel.subscribe((status) => {
      console.log(`[Supabase] Subscription status for ${channelName}:`, status);
    });

    this.subscriptions.set(channelName, channel);

    // Return unsubscribe function
    return () => this.unsubscribeFromTable(channelName);
  }

  /**
   * Unsubscribe from table
   */
  private unsubscribeFromTable(channelName: string): void {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
      console.log(`[Supabase] Unsubscribed from ${channelName}`);
    }
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    this.subscriptions.forEach((channel, name) => {
      this.unsubscribeFromTable(name);
    });
  }

  /**
   * Get connection status
   */
  getStatus(): {
    status: 'connected' | 'disconnected' | 'reconnecting';
    queuedOperations: number;
    reconnectAttempts: number;
  } {
    return {
      status: this.connectionStatus,
      queuedOperations: this.operationQueue.length,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Export singleton instance
export const supabaseConnection = new SupabaseConnectionManager();

// Helper functions for easy use
export async function safeSupabaseOperation<T>(
  operation: () => Promise<T>,
  fallbackValue?: T
): Promise<T> {
  return supabaseConnection.executeOperation(operation, { fallbackValue });
}

export function queueSupabaseOperation(
  table: string,
  operation: 'insert' | 'update' | 'delete',
  data: any
): void {
  supabaseConnection.queueOperation(table, operation, data);
}
