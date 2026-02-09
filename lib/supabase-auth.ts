import { createBrowserClient as createBrowserSupabaseClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client (for use in components)
export const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createBrowserSupabaseClient(supabaseUrl, supabaseAnonKey);
};

// Admin client with service role (for server-side operations)
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Helper to get user profile
export async function getUserProfile(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('[Auth] Error fetching user profile:', error);
    return null;
  }
  
  return data;
}

// Helper to create or update user profile
export async function upsertUserProfile(userId: string, userData: {
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}) {
  const supabase = createAdminClient();
  
  const profileData: any = {
    id: userId,
    updated_at: new Date().toISOString()
  };
  
  if (userData.email) profileData.email = userData.email;
  if (userData.first_name) profileData.first_name = userData.first_name;
  if (userData.last_name) profileData.last_name = userData.last_name;
  if (userData.avatar_url) profileData.avatar_url = userData.avatar_url;
  
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(profileData, { onConflict: 'id' })
    .select()
    .single();
  
  if (error) {
    console.error('[Auth] Error upserting user profile:', error);
    throw error;
  }
  
  return data;
}

// Sign in with OAuth (Google, GitHub, etc.)
export async function signInWithOAuth(provider: 'google' | 'github') {
  const supabase = createBrowserClient();
  const redirectUrl = `${window.location.origin}/auth/callback`;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });
  
  if (error) {
    console.error(`[Auth] Error signing in with ${provider}:`, error);
    throw error;
  }
  
  return data;
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    console.error('[Auth] Error signing in with email:', error);
    throw error;
  }
  
  return data;
}

// Sign up with email and password
export async function signUpWithEmail(email: string, password: string, metadata?: {
  first_name?: string;
  last_name?: string;
}) {
  const supabase = createBrowserClient();
  const redirectUrl = `${window.location.origin}/auth/callback`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: metadata
    }
  });
  
  if (error) {
    console.error('[Auth] Error signing up:', error);
    throw error;
  }
  
  return data;
}

// Sign out
export async function signOut() {
  const supabase = createBrowserClient();
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('[Auth] Error signing out:', error);
    throw error;
  }
}

// Send password reset email
export async function resetPassword(email: string) {
  const supabase = createBrowserClient();
  const redirectUrl = `${window.location.origin}/auth/reset-password`;
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl
  });
  
  if (error) {
    console.error('[Auth] Error sending reset email:', error);
    throw error;
  }
}

// Update password
export async function updatePassword(newPassword: string) {
  const supabase = createBrowserClient();
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (error) {
    console.error('[Auth] Error updating password:', error);
    throw error;
  }
}

// Check if user is authenticated (client-side)
export async function isAuthenticated() {
  const supabase = createBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}
