import { supabase, isSupabaseConfigured, getOrCreateUserProfile } from './supabase';

export interface LearningProgress {
  id: string;
  user_id?: string;
  session_id: string;
  topic_name: string;
  completed_at?: string;
  last_accessed_at: string;
  progress_percentage: number;
  status: 'started' | 'in_progress' | 'completed' | 'paused';
  content_position: {
    currentStep: number;
    totalSteps: number;
    bookmarks: number[];
  };
  concepts_covered?: string[];
  primary_emotion?: string;
  quiz_score?: number;
  total_time_minutes?: number;
  mastery_level?: number;
}

export interface UserLearningState {
  userId?: string;
  currentSessionId?: string;
  currentTopic?: string;
  lastAccessedAt: string;
  completedTopics: string[];
  totalSessionsCount: number;
  totalLearningTime: number; // in minutes
}

// Store progress in localStorage as fallback
const PROGRESS_STORAGE_KEY = 'learning_progress';
const SESSION_STORAGE_KEY = 'current_session';

function sanitizeProgressForSupabase(progressData: Partial<LearningProgress> & Record<string, unknown>): Partial<LearningProgress> {
  const cleaned: Partial<LearningProgress> = {};

  if (typeof progressData.progress_percentage === 'number') {
    cleaned.progress_percentage = Math.round(progressData.progress_percentage);
  }
  if (typeof progressData.status === 'string') {
    cleaned.status = progressData.status as LearningProgress['status'];
  }
  if (progressData.content_position && typeof progressData.content_position === 'object') {
    cleaned.content_position = progressData.content_position as LearningProgress['content_position'];
  }
  if (Array.isArray((progressData as any).concepts_covered)) {
    cleaned.concepts_covered = (progressData as any).concepts_covered;
  }
  if (Array.isArray((progressData as any).conceptsCovered)) {
    cleaned.concepts_covered = (progressData as any).conceptsCovered;
  }
  if (typeof (progressData as any).primary_emotion === 'string') {
    cleaned.primary_emotion = (progressData as any).primary_emotion;
  }
  if (typeof (progressData as any).primaryEmotion === 'string') {
    cleaned.primary_emotion = (progressData as any).primaryEmotion;
  }
  if (typeof (progressData as any).quiz_score === 'number') {
    cleaned.quiz_score = (progressData as any).quiz_score;
  }
  if (typeof (progressData as any).quizScore === 'number') {
    cleaned.quiz_score = (progressData as any).quizScore;
  }
  if (typeof (progressData as any).total_time_minutes === 'number') {
    cleaned.total_time_minutes = (progressData as any).total_time_minutes;
  }
  if (typeof (progressData as any).timeSpent === 'number') {
    cleaned.total_time_minutes = Math.max(0, Math.round(((progressData as any).timeSpent as number) / 60));
  }
  if (typeof (progressData as any).mastery_level === 'number') {
    cleaned.mastery_level = (progressData as any).mastery_level;
  }
  if (typeof (progressData as any).masteryLevel === 'number') {
    cleaned.mastery_level = (progressData as any).masteryLevel;
  }

  return cleaned;
}

/**
 * Save learning progress to Supabase and localStorage
 */
export async function saveProgress(
  userId: string,
  sessionId: string,
  topicName: string,
  progressData: Partial<LearningProgress>
) {
  const sanitizedProgress = sanitizeProgressForSupabase(progressData as any);

  // Fallback: Save to localStorage
  const localProgress: any = {
    ...sanitizedProgress,
    session_id: sessionId,
    topic_name: topicName,
    last_accessed_at: new Date().toISOString(),
  };
  
  // Add the appropriate user ID field based on format
  if (userId.startsWith('user_')) {
    // Legacy user ID format
    localProgress.user_id = userId;
  } else {
    // UUID format
    localProgress.user_id = userId;
  };

  try {
    localStorage.setItem(`${PROGRESS_STORAGE_KEY}_${sessionId}`, JSON.stringify(localProgress));
  } catch (err) {
    console.warn('[Progress] LocalStorage save failed:', err);
  }

  // Always try to save to Supabase (even if not configured, will fail gracefully)
  if (!isSupabaseConfigured) {
    console.warn('[Progress] Supabase not configured, saved to localStorage only');
    return { success: true, source: 'localStorage' };
  }

  console.log('[Progress] Attempting to save to Supabase for user:', userId);

  // Determine user ID format
  const upsertData: any = {
    session_id: sessionId,
    topic_name: topicName,
    ...sanitizedProgress,
    last_accessed_at: new Date().toISOString(),
  };
  
  // Always use user_id for consistent user scoping
  upsertData.user_id = userId;
  console.log('[Progress] Saving progress for user:', userId, 'session:', sessionId);
  
  // Ensure user profile exists for legacy user IDs
  if (userId.startsWith('user_')) {
    try {
      await getOrCreateUserProfile(userId);
    } catch (err) {
      console.warn('[Progress] Failed to create user profile:', err);
    }
  }
  
  try {
    console.log('[Progress] Upserting to Supabase with data:', JSON.stringify(upsertData, null, 2));
    
    const { data, error } = await supabase
      .from('learning_progress')
      .upsert(
        upsertData,
        { onConflict: 'session_id' }
      )
      .select()
      .maybeSingle();

    if (error) {
      // Silently handle database errors - progress is cached locally
      console.log('[Progress] Using local cache (database not available)');
      return { success: true, source: 'local' };
    }

    if (!data) {
      console.warn('[Progress] ⚠️ Save completed but no data returned');
      return { success: true, source: 'supabase', data: null };
    }

    console.log('[Progress] ✅ Saved successfully to Supabase:', data);
    return { success: true, data, source: 'supabase' };
  } catch (err: any) {
    console.error('[Progress] ❌ Unexpected error saving progress:', err);
    console.error('[Progress] Error stack:', err.stack);
    return { success: false, error: String(err), source: 'supabase' };
  }
}

/**
 * Load progress for a specific session
 */
export async function loadProgress(sessionId: string) {
  // Try Supabase first
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (!error && data) {
        console.log('[Progress] Loaded from Supabase:', data);
        return { data, source: 'supabase' };
      }
    } catch (err) {
      console.warn('[Progress] Supabase load failed, trying localStorage:', err);
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(`${PROGRESS_STORAGE_KEY}_${sessionId}`);
    if (stored) {
      const data = JSON.parse(stored);
      console.log('[Progress] Loaded from localStorage:', data);
      return { data, source: 'localStorage' };
    }
  } catch (err) {
    console.warn('[Progress] LocalStorage load failed:', err);
  }

  return { data: null, source: 'none' };
}

/**
 * Get user's learning history (all completed sessions)
 */
export async function getUserLearningHistory(userId: string) {
  if (!isSupabaseConfigured) {
    console.warn('[Progress] Supabase not configured');
    return { data: [], source: 'localStorage' };
  }

  try {
    // Ensure user profile exists for legacy user IDs
    if (userId.startsWith('user_')) {
      try {
        await getOrCreateUserProfile(userId);
      } catch (err) {
        console.warn('[Progress] Failed to create user profile:', err);
      }
    }
    
    // Always use user_id for consistent user scoping
    console.log('[Progress] Loading history for user:', userId);
    
    const { data, error } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId)
      .order('last_accessed_at', { ascending: false });

    if (error) {
      console.log('[Progress] History not available (using local cache)');
      return { data: [], error: null };
    }

    console.log('[Progress] Loaded history:', data?.length, 'sessions');
    return { data: data || [], source: 'supabase' };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Progress] Unexpected error loading history:', errorMsg);
    return { data: [], error: errorMsg };
  }
}

/**
 * Resume session - get the last active session or create new one
 */
export async function resumeSession(userId: string, topicName?: string) {
  try {
    // Check localStorage for active session
    const activeSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (activeSession) {
      try {
        const session = JSON.parse(activeSession);
        // Check if the session belongs to the user (handle both user ID formats)
        const sessionUserId = session.userId;
        if (sessionUserId === userId && (!topicName || session.topic === topicName)) {
          console.log('[Progress] Resuming from localStorage:', session);
          return { session, source: 'localStorage' };
        }
      } catch (err) {
        console.warn('[Progress] Invalid active session in localStorage:', err);
      }
    }

    // Try to get last session from Supabase
    if (isSupabaseConfigured) {
      // Ensure user profile exists
      try {
        await getOrCreateUserProfile(userId);
      } catch (err) {
        console.warn('[Progress] Failed to create user profile:', err);
      }
      
      const { data, error } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'completed')
        .order('last_accessed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        console.log('[Progress] Resuming from Supabase:', data);
        // Update localStorage with active session
        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            userId,
            sessionId: data.session_id,
            topic: data.topic_name,
            timestamp: new Date().toISOString(),
          })
        );
        return { session: data, source: 'supabase' };
      }
    }

    // No existing session - create new one
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSession: any = {
      sessionId: newSessionId,
      topic: topicName || 'default',
      timestamp: new Date().toISOString(),
    };
    
    newSession.userId = userId;

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
    console.log('[Progress] Created new session:', newSession);
    return { session: newSession, source: 'new' };
  } catch (err) {
    console.error('[Progress] Error resuming session:', err);
    return { session: null, error: String(err) };
  }
}

/**
 * Mark session as completed
 */
export async function completeSession(sessionId: string, userId: string) {
  // Update in Supabase
  if (isSupabaseConfigured) {
    try {
      // learning_progress.topic_name is NOT NULL, so provide it for upsert.
      // Prefer localStorage (fast), fall back to loadProgress.
      let topicName = 'default';
      try {
        const stored = localStorage.getItem(`${PROGRESS_STORAGE_KEY}_${sessionId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          topicName = parsed.topic_name || parsed.topicName || topicName;
        }
      } catch {
        // ignore
      }

      if (!topicName || topicName === 'default') {
        try {
          const loaded = await loadProgress(sessionId);
          if (loaded.data?.topic_name) topicName = loaded.data.topic_name;
        } catch {
          // ignore
        }
      }

      const { error } = await supabase
        .from('learning_progress')
        .upsert(
          {
            session_id: sessionId,
            topic_name: topicName,
            status: 'completed',
            completed_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString(),
            progress_percentage: 100,
            ...(userId.startsWith('user_') ? { user_id: userId } : { user_id: userId }),
          },
          { onConflict: 'session_id' }
        );

      if (error) {
        console.log('[Progress] Session completion not saved to database');
        return { success: true };
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[Progress] Error completing session:', errMsg);
      return { success: false, error: errMsg };
    }
  }

  // Clear from localStorage
  try {
    localStorage.removeItem(`${PROGRESS_STORAGE_KEY}_${sessionId}`);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.warn('[Progress] LocalStorage cleanup failed:', err);
  }

  return { success: true };
}

/**
 * Get progress summary for dashboard
 */
export async function getProgressSummary(userId: string) {
  try {
    const history = await getUserLearningHistory(userId);

    if (!history.data || history.data.length === 0) {
      return {
        totalSessions: 0,
        completedSessions: 0,
        totalLearningTime: 0,
        completedTopics: [],
        lastSessionDate: null,
      };
    }

    const completedSessions = history.data.filter((s: any) => s.status === 'completed').length;
    const totalTime = history.data.reduce((sum: number, s: any) => {
      const duration = (new Date(s.last_accessed_at).getTime() - new Date(s.created_at).getTime()) / (1000 * 60);
      return sum + duration;
    }, 0);

    const completedTopics = [
      ...new Set(
        history.data
          .filter((s: any) => s.status === 'completed')
          .map((s: any) => s.topic_name)
      ),
    ];

    return {
      totalSessions: history.data.length,
      completedSessions,
      totalLearningTime: Math.round(totalTime),
      completedTopics,
      lastSessionDate: history.data[0]?.last_accessed_at || null,
    };
  } catch (err) {
    console.error('[Progress] Error getting summary:', err);
    return {
      totalSessions: 0,
      completedSessions: 0,
      totalLearningTime: 0,
      completedTopics: [],
      lastSessionDate: null,
    };
  }
}

/**
 * Update content position in current session
 */
export async function updateContentPosition(
  sessionId: string,
  currentStep: number,
  totalSteps: number
) {
  try {
    // Load current progress
    const { data } = await loadProgress(sessionId);

    if (!data) {
      console.warn('[Progress] No progress data found for update');
      return { success: false };
    }

    const progressPercentage = (currentStep / totalSteps) * 100;

    // Update
    const userId = data.user_id;
    
    const result = await saveProgress(
      userId,
      sessionId,
      data.topic_name,
      {
        ...data,
        progress_percentage: Math.round(progressPercentage),
        content_position: {
          currentStep,
          totalSteps,
          bookmarks: data.content_position?.bookmarks || [],
        },
      }
    );

    return { success: result.success };
  } catch (err) {
    console.error('[Progress] Error updating position:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Add bookmark to session content
 */
export async function addBookmark(sessionId: string, stepNumber: number) {
  try {
    const { data } = await loadProgress(sessionId);

    if (!data) {
      console.warn('[Progress] No progress data found for bookmark');
      return { success: false };
    }

    const bookmarks = data.content_position?.bookmarks || [];
    if (!bookmarks.includes(stepNumber)) {
      bookmarks.push(stepNumber);
    }

    const userId = data.user_id;
    
    const result = await saveProgress(
      userId,
      sessionId,
      data.topic_name,
      {
        ...data,
        content_position: {
          ...data.content_position,
          bookmarks,
        },
      }
    );

    return { success: result.success, bookmarks };
  } catch (err) {
    console.error('[Progress] Error adding bookmark:', err);
    return { success: false, error: String(err) };
  }
}
