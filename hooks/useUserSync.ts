'use client';

/**
 * USER SYNC HOOK
 * 
 * Purpose: Ensures Clerk user is synced to Supabase on every page load
 * - Creates user_profile if it doesn't exist
 * - Updates last_active_at on each visit
 * - Handles the critical user-to-database sync issue
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface SyncStatus {
  isSynced: boolean;
  isSyncing: boolean;
  error: string | null;
  userId: string | null;
}

export function useUserSync() {
  const { user, isLoaded } = useUser();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSynced: false,
    isSyncing: false,
    error: null,
    userId: null,
  });
  const syncAttemptedRef = useRef(false);

  const syncUserToSupabase = useCallback(async () => {
    if (!user || !isSupabaseConfigured || syncAttemptedRef.current) {
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
          clerk_user_id: user.id,
          email: user.emailAddresses?.[0]?.emailAddress || null,
          first_name: user.firstName || null,
          last_name: user.lastName || null,
          avatar_url: user.imageUrl || null,
          last_active_at: new Date().toISOString(),
          // Only set these on initial creation
          subscription_tier: 'free',
          subscription_status: 'active',
          sessions_this_month: 0,
          sessions_limit: 100,
          streak_days: 0,
        }, {
          onConflict: 'clerk_user_id',
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
          .insert({
            user_id: newUser.id,
            clerk_user_id: user.id,
            adaptive_learning: true,
            emotion_detection: true,
            notifications: true,
            sound_effects: true,
            dark_mode: false,
            preferred_voice: 'alloy',
            preferred_language: 'en',
            voice_speed: 1.0,
          });

        if (prefError && prefError.code !== '23505') {
          console.warn('[UserSync] Failed to create preferences:', prefError);
        }
      }

      setSyncStatus({
        isSynced: true,
        isSyncing: false,
        error: null,
        userId: user.id,
      });

    } catch (error) {
      console.error('[UserSync] Sync failed:', error);
      setSyncStatus({
        isSynced: false,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Unknown sync error',
        userId: user?.id || null,
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
    clerkUser: user,
    isClerkLoaded: isLoaded,
    retry: () => {
      syncAttemptedRef.current = false;
      syncUserToSupabase();
    },
  };
}

export default useUserSync;
