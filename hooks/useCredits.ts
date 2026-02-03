'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface CreditsData {
  total: number;
  used: number;
  bonus: number;
  remaining: number | 'unlimited';
  lastResetAt: string;
}

export interface SubscriptionData {
  tier: 'starter' | 'pro' | 'unlimited';
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface UseCreditsReturn {
  credits: CreditsData | null;
  subscription: SubscriptionData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  checkCredits: (required: number) => boolean;
  hasEnoughCredits: (required: number) => boolean;
}

// Global cache to prevent multiple API calls across components
let creditsCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 seconds

export function useCredits(): UseCreditsReturn {
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchCredits = useCallback(async (force = false) => {
    // Check cache first
    if (!force && creditsCache && Date.now() - creditsCache.timestamp < CACHE_DURATION) {
      setCredits(creditsCache.data.credits);
      setSubscription(creditsCache.data.subscription);
      setIsLoading(false);
      return;
    }

    // Prevent duplicate simultaneous requests
    if (fetchingRef.current) return;

    try {
      fetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/credits', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }

      const data = await response.json();

      if (data.success) {
        // Update cache
        creditsCache = {
          data: { credits: data.credits, subscription: data.subscription },
          timestamp: Date.now()
        };
        
        setCredits(data.credits);
        setSubscription(data.subscription);
      } else {
        throw new Error(data.error || 'Failed to fetch credits');
      }
    } catch (err) {
      console.error('[useCredits] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const checkCredits = useCallback((required: number): boolean => {
    if (!credits) return false;
    if (credits.remaining === 'unlimited') return true;
    return typeof credits.remaining === 'number' && credits.remaining >= required;
  }, [credits]);

  const hasEnoughCredits = useCallback((required: number): boolean => {
    return checkCredits(required);
  }, [checkCredits]);

  return {
    credits,
    subscription,
    isLoading,
    error,
    refetch: () => fetchCredits(true), // Force refresh when manually called
    checkCredits,
    hasEnoughCredits,
  };
}
