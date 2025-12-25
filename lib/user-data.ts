'use client';

import { supabase, isSupabaseConfigured, validateSupabaseConnection } from './supabase';

// =============================================
// User Session Context
// =============================================

export interface UserSession {
  id: string;
  clerkUserId: string | null;
  sessionId: string;
  topicName: string;
  startedAt: Date;
  endedAt: Date | null;
  durationMinutes: number;
  totalMessages: number;
  quizScore: number | null;
  emotionsDetected: string[];
  primaryEmotion: string | null;
}

export interface UserStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  averageScore: number;
  topicsCompleted: number;
  emotionInsights: {
    engaged: number;
    curious: number;
    confused: number;
    confident: number;
  };
}

export interface SessionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  emotion: string | null;
  timestamp: Date;
}

// =============================================
// Session ID Generator
// =============================================

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================
// Local Storage Keys
// =============================================

const STORAGE_KEYS = {
  CURRENT_SESSION: 'ai_tutor_current_session',
  SESSION_HISTORY: 'ai_tutor_session_history',
  USER_STATS: 'ai_tutor_user_stats',
  USER_PREFERENCES: 'ai_tutor_preferences',
};

// =============================================
// Session Management (Local + Supabase)
// =============================================

export async function createSession(
  topicName: string,
  clerkUserId?: string
): Promise<string> {
  const sessionId = generateSessionId();
  
  const sessionData = {
    sessionId,
    topicName,
    startedAt: new Date(),
    endedAt: null,
    messages: [] as SessionMessage[],
    emotionsDetected: [] as string[],
    quizScore: null as number | null,
  };
  
  // Store in localStorage for immediate access
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(sessionData));
    console.log('[Session] Created session:', { sessionId, topicName });
  }
  
  // Try to save to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      // Validate connection and tables
      const validation = await validateSupabaseConnection();
      
      if (!validation.isConnected) {
        console.warn('[Supabase] Connection failed - using localStorage only:', validation.error);
        return sessionId;
      }
      
      if (!validation.tablesExist) {
        console.warn('[Supabase] Tables not created - using localStorage only');
        console.info('[Setup] To enable Supabase persistence, run: migrations/001_create_tables.sql');
        return sessionId;
      }

      console.log('[Supabase] Saving session to database...');
      const response = await supabase
        .from('learning_sessions')
        .insert({
          session_id: sessionId,
          topic_name: topicName,
          clerk_user_id: clerkUserId || null,
          started_at: new Date().toISOString(),
        })
        .select();
      
      if (response.error) {
        console.warn('[Supabase] Could not save session:', response.error.message);
        if (response.error.code === 'PGRST116' || response.error.message.includes('not found')) {
          console.info('[Setup] Tables missing - app will use local storage only');
        }
      } else {
        console.log('[Supabase] ✅ Session saved successfully');
      }
    } catch (error) {
      console.warn('[Supabase] Error saving session:', error instanceof Error ? error.message : String(error));
    }
  }
  
  return sessionId;
}

export async function updateSession(
  sessionId: string,
  updates: {
    messages?: SessionMessage[];
    emotionsDetected?: string[];
    quizScore?: number;
  }
): Promise<void> {
  // Update localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    if (stored) {
      const session = JSON.parse(stored);
      if (session.sessionId === sessionId) {
        if (updates.messages) session.messages = updates.messages;
        if (updates.emotionsDetected) session.emotionsDetected = updates.emotionsDetected;
        if (updates.quizScore !== undefined) session.quizScore = updates.quizScore;
        localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
        console.log('[Session] Updated in localStorage:', { sessionId, updates });
      }
    }
  }
  
  // Try to update Supabase (skip if not configured)
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    const updateData: Record<string, unknown> = {
      total_messages: updates.messages?.length || 0,
    };
    if (updates.emotionsDetected) {
      updateData.emotions_detected = updates.emotionsDetected;
    }
    if (updates.quizScore !== undefined) {
      updateData.quiz_score = updates.quizScore;
    }
    
    console.log('[Supabase] Updating session:', { sessionId, updates });
    const response = await supabase
      .from('learning_sessions')
      .update(updateData)
      .eq('session_id', sessionId);
    
    if (response.error) {
      console.warn('[Supabase] Error updating session:', response.error.message);
    } else {
      console.log('[Supabase] ✅ Session updated successfully');
    }
  } catch (error) {
    console.warn('[Supabase] Could not update session:', error instanceof Error ? error.message : String(error));
  }
}

export async function endSession(sessionId: string): Promise<void> {
  const endTime = new Date();
  
  // Update localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    if (stored) {
      const session = JSON.parse(stored);
      if (session.sessionId === sessionId) {
        session.endedAt = endTime;
        const startTime = new Date(session.startedAt);
        session.durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
        
        // Save to history
        const historyStr = localStorage.getItem(STORAGE_KEYS.SESSION_HISTORY);
        const history = historyStr ? JSON.parse(historyStr) : [];
        history.unshift({
          id: sessionId,
          topicName: session.topicName,
          date: session.startedAt,
          duration: session.durationMinutes,
          score: session.quizScore,
          emotion: session.emotionsDetected[0] || 'neutral',
          messagesCount: session.messages?.length || 0,
        });
        // Keep only last 50 sessions
        localStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(history.slice(0, 50)));
        
        // Update stats
        updateLocalStats(session);
        
        // Clear current session
        localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
      }
    }
  }
  
  // Update Supabase (skip if not configured)
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    const { data: session, error: selectError } = await supabase
      .from('learning_sessions')
      .select('started_at')
      .eq('session_id', sessionId)
      .single();
    
    if (selectError) {
      console.warn('Error fetching session from Supabase:', selectError.message);
      return;
    }
    
    if (session) {
      const startTime = new Date(session.started_at);
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      
      const { error: updateError } = await supabase
        .from('learning_sessions')
        .update({
          ended_at: endTime.toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq('session_id', sessionId);
      
      if (updateError) {
        console.warn('Error updating session end time in Supabase:', updateError.message);
      }
    }
  } catch (error) {
    console.warn('Error ending session in Supabase:', error instanceof Error ? error.message : String(error));
  }
}

function updateLocalStats(session: {
  durationMinutes?: number;
  quizScore?: number | null;
  emotionsDetected?: string[];
}): void {
  if (typeof window === 'undefined') return;
  
  const statsStr = localStorage.getItem(STORAGE_KEYS.USER_STATS);
  const stats: UserStats = statsStr ? JSON.parse(statsStr) : {
    totalSessions: 0,
    totalMinutes: 0,
    currentStreak: 0,
    averageScore: 0,
    topicsCompleted: 0,
    emotionInsights: { engaged: 0, curious: 0, confused: 0, confident: 0 },
  };
  
  stats.totalSessions += 1;
  stats.totalMinutes += session.durationMinutes || 0;
  
  if (session.quizScore !== null && session.quizScore !== undefined) {
    const totalScore = stats.averageScore * (stats.totalSessions - 1) + session.quizScore;
    stats.averageScore = Math.round(totalScore / stats.totalSessions);
    if (session.quizScore >= 70) {
      stats.topicsCompleted += 1;
    }
  }
  
  // Update emotion insights
  if (session.emotionsDetected) {
    session.emotionsDetected.forEach((emotion: string) => {
      const key = emotion.toLowerCase() as keyof typeof stats.emotionInsights;
      if (key in stats.emotionInsights) {
        stats.emotionInsights[key] += 1;
      }
    });
  }
  
  // Update streak (simple logic - just increment if session today)
  const lastSessionDate = localStorage.getItem('last_session_date');
  const today = new Date().toDateString();
  if (lastSessionDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastSessionDate === yesterday) {
      stats.currentStreak += 1;
    } else {
      stats.currentStreak = 1;
    }
    localStorage.setItem('last_session_date', today);
  }
  
  localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(stats));
}

// =============================================
// Data Retrieval
// =============================================

export async function getUserStats(clerkUserId?: string): Promise<UserStats> {
  // Try Supabase first if configured
  try {
    if (isSupabaseConfigured && clerkUserId) {
      const { data: sessions } = await supabase
        .from('learning_sessions')
        .select('duration_minutes, quiz_score, emotions_detected, primary_emotion')
        .not('ended_at', 'is', null);
      
      if (sessions && sessions.length > 0) {
        const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
        const scores = sessions.filter(s => s.quiz_score !== null).map(s => s.quiz_score!);
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        
        const emotionCounts = { engaged: 0, curious: 0, confused: 0, confident: 0 };
        sessions.forEach(s => {
          if (s.primary_emotion && s.primary_emotion in emotionCounts) {
            emotionCounts[s.primary_emotion as keyof typeof emotionCounts] += 1;
          }
        });
        
        // Convert to percentages
        const total = Object.values(emotionCounts).reduce((a, b) => a + b, 0) || 1;
        const emotionInsights = {
          engaged: Math.round((emotionCounts.engaged / total) * 100),
          curious: Math.round((emotionCounts.curious / total) * 100),
          confused: Math.round((emotionCounts.confused / total) * 100),
          confident: Math.round((emotionCounts.confident / total) * 100),
        };
        
        return {
          totalSessions: sessions.length,
          totalMinutes,
          currentStreak: 0, // Would need more complex calculation
          averageScore: avgScore,
          topicsCompleted: scores.filter(s => s >= 70).length,
          emotionInsights,
        };
      }
    }
  } catch (error) {
    console.warn('Could not fetch stats from Supabase:', error);
  }
  
  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const statsStr = localStorage.getItem(STORAGE_KEYS.USER_STATS);
    if (statsStr) {
      return JSON.parse(statsStr);
    }
  }
  
  // Return default stats
  return {
    totalSessions: 0,
    totalMinutes: 0,
    currentStreak: 0,
    averageScore: 0,
    topicsCompleted: 0,
    emotionInsights: { engaged: 40, curious: 30, confused: 20, confident: 10 },
  };
}

export async function getRecentSessions(
  clerkUserId?: string,
  limit: number = 10
): Promise<Array<{
  id: string;
  topic: string;
  date: string;
  duration: number;
  score: number | null;
  emotion: string;
}>> {
  // Try Supabase first if configured
  try {
    if (isSupabaseConfigured && clerkUserId) {
      const { data: sessions } = await supabase
        .from('learning_sessions')
        .select('session_id, topic_name, started_at, duration_minutes, quiz_score, primary_emotion')
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false })
        .limit(limit);
      
      if (sessions && sessions.length > 0) {
        return sessions.map(s => ({
          id: s.session_id,
          topic: s.topic_name || 'Unknown Topic',
          date: s.started_at,
          duration: s.duration_minutes || 0,
          score: s.quiz_score,
          emotion: s.primary_emotion || 'neutral',
        }));
      }
    }
  } catch (error) {
    console.warn('Could not fetch sessions from Supabase:', error);
  }
  
  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const historyStr = localStorage.getItem(STORAGE_KEYS.SESSION_HISTORY);
    if (historyStr) {
      const history = JSON.parse(historyStr);
      return history.slice(0, limit).map((s: { id: string; topicName: string; date: string; duration: number; score: number | null; emotion: string }) => ({
        id: s.id,
        topic: s.topicName,
        date: s.date,
        duration: s.duration,
        score: s.score,
        emotion: s.emotion,
      }));
    }
  }
  
  return [];
}

export async function saveMessage(
  sessionId: string,
  message: { role: 'user' | 'assistant'; content: string; emotion?: string },
  clerkUserId?: string
): Promise<void> {
  // Try Supabase
  try {
    if (isSupabaseConfigured) {
      await supabase
        .from('conversation_messages')
        .insert({
          session_id: sessionId,
          role: message.role,
          content: message.content,
          emotion: message.emotion || null,
          user_id: clerkUserId || null,
        });
    }
  } catch (error) {
    console.warn('Could not save message to Supabase:', error);
  }
}

// =============================================
// User Preferences
// =============================================

export interface UserPreferences {
  adaptiveLearning: boolean;
  emotionDetection: boolean;
  notifications: boolean;
  soundEffects: boolean;
  darkMode: boolean;
  preferredVoice: string;
  voiceSpeed: number;
}

export function getLocalPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return getDefaultPreferences();
  }
  
  const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
  if (stored) {
    return { ...getDefaultPreferences(), ...JSON.parse(stored) };
  }
  return getDefaultPreferences();
}

export function saveLocalPreferences(prefs: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') return;
  
  const current = getLocalPreferences();
  const updated = { ...current, ...prefs };
  localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
}

function getDefaultPreferences(): UserPreferences {
  return {
    adaptiveLearning: true,
    emotionDetection: true,
    notifications: true,
    soundEffects: true,
    darkMode: true,
    preferredVoice: 'alloy',
    voiceSpeed: 1.0,
  };
}

// =============================================
// Current Session Helper
// =============================================

export function getCurrentSession(): {
  sessionId: string;
  topicName: string;
  startedAt: Date;
  messages: SessionMessage[];
} | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
  if (!stored) return null;
  
  try {
    const session = JSON.parse(stored);
    return {
      sessionId: session.sessionId,
      topicName: session.topicName,
      startedAt: new Date(session.startedAt),
      messages: session.messages || [],
    };
  } catch {
    return null;
  }
}
