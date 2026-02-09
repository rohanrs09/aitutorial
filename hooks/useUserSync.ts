'use client';

/**
 * USER SYNC HOOK
 * 
 * Purpose: Syncs user data with Supabase
 * - Fetches latest credits from database
 * - Updates last_active_at on each visit
 * - Works with Supabase Auth (no Clerk dependency)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useUser } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface SyncStatus {
  isSynced: boolean;
  isSyncing: boolean;
  error: string | null;
  userId: string | null;
  credits: {
    total: number;
    used: number;
    remaining: number;
  } | null;
  subscription: {
    tier: 'starter' | 'pro' | 'unlimited';
    status: string;
  } | null;
}

export function useUserSync() {
  const { user, isLoaded } = useUser();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSynced: false,
    isSyncing: false,
    error: null,
    userId: null,
    credits: null,
    subscription: null,
  });
  const syncAttemptedRef = useRef(false);

  const syncUserToSupabase = useCallback(async () => {
    if (!user || syncAttemptedRef.current) {
      return;
    }

    // If Supabase not configured, set default state and return
    if (!isSupabaseConfigured) {
      console.warn('[UserSync] Supabase not configured - using default subscription');
      setSyncStatus({
        isSynced: true,
        isSyncing: false,
        error: null,
        userId: user.id,
        credits: { total: 50, used: 0, remaining: 50 },
        subscription: { tier: 'starter', status: 'active' },
      });
      syncAttemptedRef.current = true;
      return;
    }

    syncAttemptedRef.current = true;
    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      console.log('[UserSync] Syncing user to Supabase:', user.id);

      // Use UPSERT to avoid CORS PATCH issues
      // This creates or updates the user in one operation
      console.log('[UserSync] Upserting user profile');
      const { data: upsertedUser, error: upsertError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress || null,
          first_name: user.firstName || null,
          last_name: user.lastName || null,
          avatar_url: user.imageUrl || null,
          last_active_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (upsertError) {
        console.error('[UserSync] Upsert error:', upsertError);
        
        // If table doesn't exist, log helpful message
        if (upsertError.message?.includes('does not exist') || upsertError.code === 'PGRST116') {
          console.error('[UserSync] Tables not created! Run migrations/003_reset_and_fix_schema.sql in Supabase SQL Editor');
          setSyncStatus({
            isSynced: false,
            isSyncing: false,
            error: 'Database tables not created. Please run migrations.',
            userId: user.id,
            credits: null,
            subscription: null,
          });
          return;
        }
        
        throw upsertError;
      }

      console.log('[UserSync] ✅ User profile upserted:', upsertedUser?.id);
      const newUser = upsertedUser;

      // Also create default preferences
      if (newUser) {
        const { error: prefError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: newUser.id,
            voice_enabled: true,
            emotion_detection_enabled: true,
            auto_generate_notes: true,
            difficulty_level: 'intermediate',
            preferred_language: 'en',
            theme: 'dark',
          }, { onConflict: 'user_id' });

        if (prefError && prefError.code !== '23505') {
          console.warn('[UserSync] Failed to create preferences:', prefError);
        }
      }

      // Initialize or fetch subscription and credits from database
      console.log('[UserSync] Fetching subscription and credits from database...');
      
      // Fetch subscription
      const { data: subscriptionData } = await supabase
        .from('user_subscriptions')
        .select('tier, status')
        .eq('id', user.id)
        .single();
      
      // Fetch credits
      const { data: creditsData } = await supabase
        .from('user_credits')
        .select('total_credits, used_credits, bonus_credits')
        .eq('id', user.id)
        .single();
      
      // If no subscription exists, create one via API
      if (!subscriptionData) {
        console.log('[UserSync] No subscription found, calling API to initialize...');
        try {
          const response = await fetch('/api/credits', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          if (response.ok) {
            const data = await response.json();
            console.log('[UserSync] ✅ Subscription initialized via API:', data);
          }
        } catch (apiError) {
          console.warn('[UserSync] Could not initialize subscription via API:', apiError);
        }
      }
      
      // Calculate credits
      const credits = creditsData ? {
        total: creditsData.total_credits,
        used: creditsData.used_credits,
        remaining: creditsData.total_credits - creditsData.used_credits + (creditsData.bonus_credits || 0)
      } : null;
      
      const subscription = subscriptionData ? {
        tier: subscriptionData.tier as 'starter' | 'pro' | 'unlimited',
        status: subscriptionData.status
      } : null;
      
      console.log('[UserSync] ✅ Sync complete:', { credits, subscription });

      setSyncStatus({
        isSynced: true,
        isSyncing: false,
        error: null,
        userId: user.id,
        credits,
        subscription,
      });

    } catch (error) {
      console.error('[UserSync] Sync failed:', error);
      console.warn('[UserSync] Using default subscription as fallback');
      
      // Use default subscription when database is unavailable
      setSyncStatus({
        isSynced: true, // Mark as synced to not block app
        isSyncing: false,
        error: null, // Don't show error to user
        userId: user?.id || null,
        credits: { total: 50, used: 0, remaining: 50 },
        subscription: { tier: 'starter', status: 'active' },
      });
    }
  }, [user]);

  useEffect(() => {
    if (isLoaded && user && isSupabaseConfigured && !syncAttemptedRef.current) {
      syncUserToSupabase();
    }
  }, [isLoaded, user, syncUserToSupabase]);

  // Reset sync attempt when user changes
  useEffect(() => {
    syncAttemptedRef.current = false;
  }, [user?.id]);

  return {
    ...syncStatus,
    currentUser: user,
    isAuthLoaded: isLoaded,
    retry: () => {
      syncAttemptedRef.current = false;
      syncUserToSupabase();
    },
  };
}

export default useUserSync;
