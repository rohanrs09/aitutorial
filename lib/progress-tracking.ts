import { supabase, isSupabaseConfigured } from './supabase';

export interface LearningProgress {
  id: string;
  user_id: string;
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
}

export interface UserLearningState {
  userId: string;
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

/**
 * Save learning progress to Supabase and localStorage
 */
export async function saveProgress(
  userId: string,
  sessionId: string,
  topicName: string,
  progressData: Partial<LearningProgress>
) {
  // Fallback: Save to localStorage
  const localProgress = {
    ...progressData,
    user_id: userId,
    session_id: sessionId,
    topic_name: topicName,
    last_accessed_at: new Date().toISOString(),
  };

  try {
    localStorage.setItem(`${PROGRESS_STORAGE_KEY}_${sessionId}`, JSON.stringify(localProgress));
  } catch (err) {
    console.warn('[Progress] LocalStorage save failed:', err);
  }

  // Try to save to Supabase
  if (!isSupabaseConfigured) {
    console.warn('[Progress] Supabase not configured, using localStorage only');
    return { success: true, source: 'localStorage' };
  }

  try {
    const { data, error } = await supabase
      .from('learning_progress')
      .upsert(
        {
          user_id: userId,
          session_id: sessionId,
          topic_name: topicName,
          ...progressData,
          last_accessed_at: new Date().toISOString(),
        },
        { onConflict: 'session_id' }
      )
      .select()
      .single();

    if (error) {
      const errorMsg = error?.message || JSON.stringify(error) || 'Unknown error';
      console.error('[Progress] Save failed:', errorMsg);
      return { success: false, error: errorMsg, source: 'supabase' };
    }

    if (!data) {
      console.warn('[Progress] Save completed but no data returned');
      return { success: true, source: 'supabase', data: null };
    }

    console.log('[Progress] Saved successfully:', data);
    return { success: true, data, source: 'supabase' };
  } catch (err) {
    console.error('[Progress] Unexpected error saving progress:', err);
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
        .single();

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
    const { data, error } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId)
      .order('last_accessed_at', { ascending: false });

    if (error) {
      const errorMsg = error?.message || JSON.stringify(error) || 'Failed to load history';
      console.error('[Progress] Failed to load history:', errorMsg);
      return { data: [], error: errorMsg };
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
        if (session.userId === userId && (!topicName || session.topic === topicName)) {
          console.log('[Progress] Resuming from localStorage:', session);
          return { session, source: 'localStorage' };
        }
      } catch (err) {
        console.warn('[Progress] Invalid active session in localStorage:', err);
      }
    }

    // Try to get last session from Supabase
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'completed')
        .order('last_accessed_at', { ascending: false })
        .limit(1)
        .single();

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
    const newSession = {
      userId,
      sessionId: newSessionId,
      topic: topicName || 'default',
      timestamp: new Date().toISOString(),
    };

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
      const { error } = await supabase
        .from('learning_progress')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId);

      if (error) {
        const errMsg = error?.message || JSON.stringify(error) || 'Failed to complete';
        console.error('[Progress] Failed to complete session:', errMsg);
        return { success: false, error: errMsg };
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
    const result = await saveProgress(
      data.user_id,
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

    const result = await saveProgress(
      data.user_id,
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
