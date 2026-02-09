'use client';

import { supabase, isSupabaseConfigured, validateSupabaseConnection } from './supabase';

// =============================================
// User Session Context
// =============================================

export interface UserSession {
  id: string;
  userId: string | null;
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

function getLocalSessionTopicName(sessionId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    if (!stored) return null;
    const session = JSON.parse(stored);
    if (session?.sessionId !== sessionId) return null;
    return session.topicName || null;
  } catch {
    return null;
  }
}

// =============================================
// Session Management (Local + Supabase)
// =============================================

export async function createSession(
  topicName: string,
  userId?: string
): Promise<string> {
  const sessionId = generateSessionId();
  
  const sessionData = {
    sessionId,
    topicName,
    userId: userId || null,
    startedAt: new Date(),
    endedAt: null,
    messages: [] as SessionMessage[],
    emotionsDetected: [] as string[],
    quizScore: null as number | null,
  };
  
  // Store in localStorage for immediate access
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(sessionData));
    console.log('[Session] Created session:', { sessionId, topicName, userId });
  }
  
  // Try to save to Supabase if configured
  if (isSupabaseConfigured && userId) {
    try {
      // Validate connection and tables
      const validation = await validateSupabaseConnection();
      
      if (!validation.isConnected) {
        console.warn('[Supabase] Connection failed - using localStorage only:', validation.error);
        return sessionId;
      }
      
      if (!validation.tablesExist) {
        console.warn('[Supabase] Tables not created - using localStorage only');
        console.info('[Setup] To enable Supabase persistence, run: migrations/003_reset_and_fix_schema.sql');
        return sessionId;
      }

      console.log('[Supabase] Saving session to database for user:', userId);

      // Always upsert user profile first to ensure user exists
      // user_profiles PK is 'id' which references auth.users(id)
      const profileUpsert = await supabase
        .from('user_profiles')
        .upsert(
          {
            id: userId,
            last_active_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (profileUpsert.error) {
        console.warn('[Supabase] Could not upsert user profile:', profileUpsert.error.message);
      } else {
        console.log('[Supabase] ✅ User profile upserted');
      }
      
      // Insert session with user_id (required field)
      const insertData = {
        session_id: sessionId,
        topic_name: topicName,
        user_id: userId,
        started_at: new Date().toISOString(),
        total_messages: 0,
      };
      
      const response = await supabase
        .from('learning_sessions')
        .insert(insertData)
        .select();
      
      if (response.error) {
        console.error('[Supabase] Could not save session:', response.error.message);
        if (response.error.code === 'PGRST116' || response.error.message.includes('not found')) {
          console.info('[Setup] Tables missing - run: migrations/003_reset_and_fix_schema.sql');
        }
      } else {
        console.log('[Supabase] ✅ Session saved successfully:', response.data);
      }
    } catch (error) {
      console.error('[Supabase] Error saving session:', error instanceof Error ? error.message : String(error));
    }
  } else if (!userId) {
    console.warn('[Session] No userId provided - session will only be saved locally');
  }
  
  return sessionId;
}

export async function updateSession(
  sessionId: string,
  updates: {
    messages?: SessionMessage[];
    emotionsDetected?: string[];
    quizScore?: number;
  },
  userId?: string
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
  
  // Try to update Supabase (skip if not configured or no user)
  if (!isSupabaseConfigured || !userId) {
    if (!userId) {
      console.warn('[Session] No userId - skipping Supabase update');
    }
    return;
  }
  
  try {
    const updateData: Record<string, unknown> = {
      total_messages: updates.messages?.length || 0,
    };
    if (updates.emotionsDetected) {
      updateData.emotions_detected = updates.emotionsDetected;
      // Set primary emotion as the most recent one
      if (updates.emotionsDetected.length > 0) {
        updateData.primary_emotion = updates.emotionsDetected[updates.emotionsDetected.length - 1];
      }
    }
    if (updates.quizScore !== undefined) {
      updateData.quiz_score = updates.quizScore;
    }
    
    const topicName = getLocalSessionTopicName(sessionId) || 'General Learning';

    console.log('[Supabase] Updating session:', { sessionId, userId, updates: Object.keys(updateData) });
    
    // Use upsert with user_id to ensure proper user association
    const response = await supabase
      .from('learning_sessions')
      .upsert(
        {
          session_id: sessionId,
          user_id: userId,
          topic_name: topicName,
          ...updateData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'session_id' }
      );
    
    if (response.error) {
      console.error('[Supabase] Error updating session:', response.error.message);
    } else {
      console.log('[Supabase] ✅ Session updated successfully');
    }
  } catch (error) {
    console.error('[Supabase] Could not update session:', error instanceof Error ? error.message : String(error));
  }
}

export async function endSession(sessionId: string, userId?: string): Promise<void> {
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
        
        // Check achievements after session ends
        if (userId) {
          try {
            const { checkAchievements } = await import('./achievements');
            const updatedStats = await getUserStats(userId);
            await checkAchievements(userId, {
              totalSessions: updatedStats.totalSessions,
              currentStreak: updatedStats.currentStreak,
              averageScore: updatedStats.averageScore,
              totalMinutes: updatedStats.totalMinutes,
              maxQuizScore: session.quizScore || undefined,
              lastSessionDuration: session.durationMinutes,
            });
          } catch (error) {
            console.warn('[Achievements] Error checking achievements:', error);
          }
        }
        
        // Clear current session
        localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
      }
    }
  }
  
  // Update Supabase (skip if not configured or no user)
  if (!isSupabaseConfigured || !userId) {
    if (!userId) {
      console.warn('[Session] No userId provided - skipping Supabase end session');
    }
    return;
  }
  
  try {
    // Compute duration and get session data from localStorage
    let durationMinutes: number | null = null;
    let topicName = 'General Learning';
    let primaryEmotion: string | null = null;
    let totalMessages = 0;
    let quizScore: number | null = null;
    
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
        if (stored) {
          const localSession = JSON.parse(stored);
          if (localSession?.sessionId === sessionId && localSession?.startedAt) {
            const startTime = new Date(localSession.startedAt);
            durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
            topicName = localSession.topicName || topicName;
            primaryEmotion = localSession.emotionsDetected?.[localSession.emotionsDetected.length - 1] || null;
            totalMessages = localSession.messages?.length || 0;
            quizScore = localSession.quizScore || null;
          }
        }
      } catch {
        // ignore
      }
    }

    // If duration still unknown, fall back to Supabase read (GET)
    if (durationMinutes === null) {
      const { data: session, error: selectError } = await supabase
        .from('learning_sessions')
        .select('started_at, topic_name')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (!selectError && session?.started_at) {
        const startTime = new Date(session.started_at);
        durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
        topicName = session.topic_name || topicName;
      }
    }

    console.log('[Supabase] Ending session:', { sessionId, userId, durationMinutes, topicName });

    // Build upsert data with user_id
    const upsertData: Record<string, unknown> = {
      session_id: sessionId,
      topic_name: topicName,
      user_id: userId,
      ended_at: endTime.toISOString(),
      duration_minutes: durationMinutes ?? null,
      total_messages: totalMessages,
      updated_at: new Date().toISOString(),
    };
    
    if (primaryEmotion) {
      upsertData.primary_emotion = primaryEmotion;
    }
    if (quizScore !== null) {
      upsertData.quiz_score = quizScore;
    }

    const response = await supabase
      .from('learning_sessions')
      .upsert(upsertData, { onConflict: 'session_id' });

    if (response.error) {
      console.log('[Supabase] Session end not saved (using local cache)');
    } else {
      console.log('[Supabase] ✅ Session ended successfully');
    }
  } catch (error) {
    console.error('[Supabase] Error ending session:', error instanceof Error ? error.message : String(error));
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

export async function getUserStats(userId?: string): Promise<UserStats> {
  // Try Supabase first if configured
  try {
    if (isSupabaseConfigured && userId) {
      const query = supabase
        .from('learning_sessions')
        .select('duration_minutes, quiz_score, emotions_detected, primary_emotion')
        .eq('user_id', userId)
        .not('ended_at', 'is', null);
      
      const { data: sessions } = await query;
      
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
  userId?: string,
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
    if (isSupabaseConfigured && userId) {
      const query = supabase
        .from('learning_sessions')
        .select('session_id, topic_name, started_at, duration_minutes, quiz_score, primary_emotion')
        .eq('user_id', userId)
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false })
        .limit(limit);
      
      const { data: sessions } = await query;
      
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
  userId?: string
): Promise<void> {
  // Skip if no user ID
  if (!userId) {
    console.warn('[Message] No userId - skipping Supabase save');
    return;
  }
  
  // Try Supabase
  try {
    if (isSupabaseConfigured) {
      const insertData = {
        session_id: sessionId,
        role: message.role,
        content: message.content,
        emotion: message.emotion || null,
        user_id: userId,
        timestamp: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('conversation_messages')
        .insert(insertData);
        
      if (error) {
        console.error('[Message] Error saving to Supabase:', error.message);
      }
    }
  } catch (error) {
    console.error('[Message] Could not save message to Supabase:', error);
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
