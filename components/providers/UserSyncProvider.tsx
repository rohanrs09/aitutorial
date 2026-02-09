'use client';

/**
 * USER SYNC PROVIDER
 * 
 * Wraps the app to ensure user data is synced to Supabase
 * Must be placed inside AuthProvider in the component tree
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useUserSync } from '@/hooks/useUserSync';

interface UserSyncContextType {
  isSynced: boolean;
  isSyncing: boolean;
  error: string | null;
  userId: string | null;
  currentUser: ReturnType<typeof useUserSync>['currentUser'];
  isAuthLoaded: boolean;
  retry: () => void;
}

const UserSyncContext = createContext<UserSyncContextType | null>(null);

export function UserSyncProvider({ children }: { children: ReactNode }) {
  const syncData = useUserSync();

  return (
    <UserSyncContext.Provider value={syncData}>
      {children}
    </UserSyncContext.Provider>
  );
}

export function useUserSyncContext() {
  const context = useContext(UserSyncContext);
  if (!context) {
    throw new Error('useUserSyncContext must be used within a UserSyncProvider');
  }
  return context;
}

export default UserSyncProvider;
