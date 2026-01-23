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

      // Check if user already exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id, clerk_user_id')
        .eq('clerk_user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('[UserSync] Error checking user:', fetchError);
        
        // If table doesn't exist, log helpful message
        if (fetchError.message?.includes('does not exist') || fetchError.code === 'PGRST116') {
          console.error('[UserSync] Tables not created! Run migrations/003_reset_and_fix_schema.sql in Supabase SQL Editor');
          setSyncStatus({
            isSynced: false,
            isSyncing: false,
            error: 'Database tables not created. Please run migrations.',
            userId: user.id,
          });
          return;
        }
        
        throw fetchError;
      }

      if (existingUser) {
        // User exists, update last_active_at
        console.log('[UserSync] User exists, updating last_active_at');
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            last_active_at: new Date().toISOString(),
            email: user.emailAddresses?.[0]?.emailAddress || null,
            first_name: user.firstName || null,
            last_name: user.lastName || null,
            avatar_url: user.imageUrl || null,
          })
          .eq('clerk_user_id', user.id);

        if (updateError) {
          console.warn('[UserSync] Failed to update user:', updateError);
        }

        setSyncStatus({
          isSynced: true,
          isSyncing: false,
          error: null,
          userId: user.id,
        });
        console.log('[UserSync] ✅ User sync complete (existing user)');
        return;
      }

      // User doesn't exist, create new profile
      console.log('[UserSync] Creating new user profile');
      const { data: newUser, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          clerk_user_id: user.id,
          email: user.emailAddresses?.[0]?.emailAddress || null,
          first_name: user.firstName || null,
          last_name: user.lastName || null,
          avatar_url: user.imageUrl || null,
          subscription_tier: 'free',
          subscription_status: 'active',
          sessions_this_month: 0,
          sessions_limit: 100,
          streak_days: 0,
          last_active_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        // Check if it's a duplicate key error (user was created in parallel)
        if (insertError.code === '23505') {
          console.log('[UserSync] User already exists (parallel creation)');
          setSyncStatus({
            isSynced: true,
            isSyncing: false,
            error: null,
            userId: user.id,
          });
          return;
        }
        throw insertError;
      }

      console.log('[UserSync] ✅ New user profile created:', newUser?.id);

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
