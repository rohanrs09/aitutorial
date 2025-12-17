import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Create client only if configured (avoids errors when not set up)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Validate Supabase connection
export async function validateSupabaseConnection(): Promise<{
  isConnected: boolean;
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return { isConnected: false, error: 'Supabase not configured' };
  }
  
  try {
    // Try a simple query to check connection
    const { error } = await supabase
      .from('learning_topics')
      .select('id')
      .limit(1);
    
    if (error) {
      return { isConnected: false, error: error.message };
    }
    
    return { isConnected: true };
  } catch (err) {
    return { isConnected: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// =============================================
// Database Types
// =============================================

export interface UserProfile {
  id: string;
  clerk_user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'pro' | 'team';
  subscription_status: 'active' | 'cancelled' | 'past_due';
  sessions_this_month: number;
  sessions_limit: number;
  streak_days: number;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  adaptive_learning: boolean;
  emotion_detection: boolean;
  notifications: boolean;
  sound_effects: boolean;
  dark_mode: boolean;
  preferred_voice: string;
  preferred_language: string;
  voice_speed: number;
  created_at: string;
  updated_at: string;
}

export interface LearningTopic {
  id: string;
  name: string;
  category: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_premium: boolean;
  created_at: string;
}

export interface UserCustomTopic {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  content: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LearningSession {
  id: string;
  user_id: string | null;
  session_id: string;
  topic_id: string | null;
  custom_topic_id: string | null;
  topic_name: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  total_messages: number;
  quiz_score: number | null;
  emotions_detected: string[];
  primary_emotion: string | null;
  created_at: string;
}

export interface ConversationMessage {
  id: string;
  session_id: string;
  user_id: string | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  emotion: string | null;
  audio_url: string | null;
  timestamp: string;
  created_at: string;
}

export interface SessionNote {
  id: string;
  session_id: string;
  user_id: string | null;
  title: string | null;
  content: string;
  is_auto_generated: boolean;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  topic_id: string;
  mastery_level: number;
  sessions_completed: number;
  total_time_minutes: number;
  last_quiz_score: number | null;
  concepts_mastered: string[];
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_key: string;
  achievement_name: string;
  description: string | null;
  unlocked_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

// =============================================
// User Service Functions
// =============================================

export async function getOrCreateUserProfile(clerkUserId: string, userData?: {
  email?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}): Promise<UserProfile | null> {
  // Try to get existing profile
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (existing) {
    return existing as UserProfile;
  }

  // Create new profile
  const { data: newProfile, error } = await supabase
    .from('user_profiles')
    .insert({
      clerk_user_id: clerkUserId,
      email: userData?.email,
      first_name: userData?.firstName,
      last_name: userData?.lastName,
      avatar_url: userData?.avatarUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user profile:', error);
    return null;
  }

  // Create default preferences
  if (newProfile) {
    await supabase
      .from('user_preferences')
      .insert({ user_id: newProfile.id });
  }

  return newProfile as UserProfile;
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error getting user preferences:', error);
    return null;
  }

  return data as UserPreferences;
}

export async function updateUserPreferences(
  userId: string, 
  preferences: Partial<UserPreferences>
): Promise<boolean> {
  const { error } = await supabase
    .from('user_preferences')
    .update(preferences)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating preferences:', error);
    return false;
  }

  return true;
}

export async function getUserSessions(userId: string, limit = 10): Promise<LearningSession[]> {
  const { data, error } = await supabase
    .from('learning_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error getting user sessions:', error);
    return [];
  }

  return data as LearningSession[];
}

export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error getting user progress:', error);
    return [];
  }

  return data as UserProgress[];
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });

  if (error) {
    console.error('Error getting achievements:', error);
    return [];
  }

  return data as UserAchievement[];
}

export async function getAvailableTopics(includePremium = false): Promise<LearningTopic[]> {
  let query = supabase
    .from('learning_topics')
    .select('*')
    .order('category', { ascending: true });

  if (!includePremium) {
    query = query.eq('is_premium', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error getting topics:', error);
    return [];
  }

  return data as LearningTopic[];
}

export async function trackAnalyticsEvent(
  eventType: string,
  eventData?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  await supabase
    .from('analytics_events')
    .insert({
      event_type: eventType,
      event_data: eventData,
      user_id: userId,
    });
}

export async function getUserStats(userId: string): Promise<{
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  averageScore: number;
  topicsCompleted: number;
}> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('streak_days, sessions_this_month')
    .eq('id', userId)
    .single();

  const { data: sessions } = await supabase
    .from('learning_sessions')
    .select('duration_minutes, quiz_score')
    .eq('user_id', userId);

  const { count: topicsCount } = await supabase
    .from('user_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('mastery_level', 70);

  const totalSessions = sessions?.length || 0;
  const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
  const scores = sessions?.filter(s => s.quiz_score !== null).map(s => s.quiz_score!) || [];
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return {
    totalSessions,
    totalMinutes,
    currentStreak: profile?.streak_days || 0,
    averageScore,
    topicsCompleted: topicsCount || 0,
  };
}
