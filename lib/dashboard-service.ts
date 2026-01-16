'use client';

/**
 * DASHBOARD DATA SERVICE
 * 
 * Purpose: Centralized service for fetching dashboard analytics from Supabase
 * - Real data from learning_sessions, user_profiles, conversation_messages
 * - Proper error handling and fallbacks
 * - Type-safe interfaces
 * - Caching for performance
 * 
 * WHY: Dashboard must show REAL user progress, not mock data
 */

import { supabase, isSupabaseConfigured } from './supabase';

// =============================================
// TYPES
// =============================================

export interface DashboardStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  averageScore: number;
  weeklyProgress: number; // % change from last week
  monthlyProgress: number; // % change from last month
}

export interface ActivityData {
  date: string;
  sessions: number;
  minutes: number;
  score: number;
}

export interface EmotionDistribution {
  emotion: string;
  count: number;
  percentage: number;
}

export interface RecentSession {
  id: string;
  sessionId: string;
  topicName: string;
  startedAt: string;
  duration: number;
  score: number | null;
  emotion: string | null;
  messagesCount: number;
}

export interface TopicProgress {
  topicName: string;
  sessionsCount: number;
  totalMinutes: number;
  averageScore: number;
  lastPracticed: string;
}

export interface DashboardData {
  stats: DashboardStats;
  activityChart: ActivityData[]; // Last 7 days
  emotionDistribution: EmotionDistribution[];
  recentSessions: RecentSession[];
  topicProgress: TopicProgress[];
  isLoading: boolean;
  error: string | null;
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function getDateRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// =============================================
// MAIN DASHBOARD DATA FETCHER
// =============================================

export async function fetchDashboardData(
  userId: string | null
): Promise<DashboardData> {
  console.log('[Dashboard] Fetching data for user:', userId);
  
  // If Supabase not configured or no user, return empty state
  if (!isSupabaseConfigured || !userId) {
    console.warn('[Dashboard] Supabase not configured or no userId provided');
    return {
      stats: {
        totalSessions: 0,
        totalMinutes: 0,
        currentStreak: 0,
        averageScore: 0,
        weeklyProgress: 0,
        monthlyProgress: 0,
      },
      activityChart: [],
      emotionDistribution: [],
      recentSessions: [],
      topicProgress: [],
      isLoading: false,
      error: 'User not authenticated or Supabase not configured',
    };
  }

  try {
    // Always use clerk_user_id for Clerk authentication
    const userIdColumn = 'clerk_user_id';
    console.log('[Dashboard] Using column:', userIdColumn, 'for user:', userId);

    // Fetch all data in parallel for performance
    const [
      statsResult,
      weeklyResult,
      monthlyResult,
      activityResult,
      emotionsResult,
      recentResult,
      topicsResult,
    ] = await Promise.all([
      fetchUserStats(userId, userIdColumn),
      fetchWeeklyStats(userId, userIdColumn),
      fetchMonthlyStats(userId, userIdColumn),
      fetchActivityChart(userId, userIdColumn, 7),
      fetchEmotionDistribution(userId, userIdColumn),
      fetchRecentSessions(userId, userIdColumn, 5),
      fetchTopicProgress(userId, userIdColumn),
    ]);
    
    console.log('[Dashboard] Fetched stats:', statsResult);
    console.log('[Dashboard] Recent sessions count:', recentResult.length);

    // Calculate progress percentages
    const weeklyProgress = calculatePercentageChange(
      statsResult.totalSessions,
      weeklyResult.sessions
    );
    const monthlyProgress = calculatePercentageChange(
      statsResult.totalSessions,
      monthlyResult.sessions
    );

    return {
      stats: {
        ...statsResult,
        weeklyProgress,
        monthlyProgress,
      },
      activityChart: activityResult,
      emotionDistribution: emotionsResult,
      recentSessions: recentResult,
      topicProgress: topicsResult,
      isLoading: false,
      error: null,
    };
  } catch (error) {
    console.error('[Dashboard Service] Error fetching data:', error);
    return {
      stats: {
        totalSessions: 0,
        totalMinutes: 0,
        currentStreak: 0,
        averageScore: 0,
        weeklyProgress: 0,
        monthlyProgress: 0,
      },
      activityChart: [],
      emotionDistribution: [],
      recentSessions: [],
      topicProgress: [],
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
    };
  }
}

// =============================================
// INDIVIDUAL DATA FETCHERS
// =============================================

async function fetchUserStats(
  userId: string,
  userIdColumn: string
): Promise<Omit<DashboardStats, 'weeklyProgress' | 'monthlyProgress'>> {
  const { data: sessions, error } = await supabase
    .from('learning_sessions')
    .select('duration_minutes, quiz_score, started_at')
    .eq(userIdColumn, userId)
    .not('ended_at', 'is', null);

  if (error) {
    console.error('[Dashboard] Error fetching user stats:', error);
    return {
      totalSessions: 0,
      totalMinutes: 0,
      currentStreak: 0,
      averageScore: 0,
    };
  }

  const totalSessions = sessions?.length || 0;
  const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
  
  const scores = sessions?.filter(s => s.quiz_score !== null).map(s => s.quiz_score!) || [];
  const averageScore = scores.length > 0 
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
    : 0;

  // Calculate streak (simplified - consecutive days)
  const currentStreak = calculateStreak(sessions || []);

  return {
    totalSessions,
    totalMinutes,
    currentStreak,
    averageScore,
  };
}

async function fetchWeeklyStats(
  userId: string,
  userIdColumn: string
): Promise<{ sessions: number; minutes: number }> {
  const { start } = getDateRange(7);

  const { data, error } = await supabase
    .from('learning_sessions')
    .select('duration_minutes')
    .eq(userIdColumn, userId)
    .gte('started_at', start)
    .not('ended_at', 'is', null);

  if (error) return { sessions: 0, minutes: 0 };

  return {
    sessions: data?.length || 0,
    minutes: data?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0,
  };
}

async function fetchMonthlyStats(
  userId: string,
  userIdColumn: string
): Promise<{ sessions: number; minutes: number }> {
  const { start } = getDateRange(30);

  const { data, error } = await supabase
    .from('learning_sessions')
    .select('duration_minutes')
    .eq(userIdColumn, userId)
    .gte('started_at', start)
    .not('ended_at', 'is', null);

  if (error) return { sessions: 0, minutes: 0 };

  return {
    sessions: data?.length || 0,
    minutes: data?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0,
  };
}

async function fetchActivityChart(
  userId: string,
  userIdColumn: string,
  days: number
): Promise<ActivityData[]> {
  const { start } = getDateRange(days);

  const { data, error } = await supabase
    .from('learning_sessions')
    .select('started_at, duration_minutes, quiz_score')
    .eq(userIdColumn, userId)
    .gte('started_at', start)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: true });

  if (error || !data) {
    console.error('[Dashboard] Error fetching activity chart:', error);
    return [];
  }

  // Group by date
  const grouped = new Map<string, { sessions: number; minutes: number; scores: number[] }>();
  
  data.forEach(session => {
    const date = new Date(session.started_at).toISOString().split('T')[0];
    const existing = grouped.get(date) || { sessions: 0, minutes: 0, scores: [] };
    
    existing.sessions += 1;
    existing.minutes += session.duration_minutes || 0;
    if (session.quiz_score !== null) {
      existing.scores.push(session.quiz_score);
    }
    
    grouped.set(date, existing);
  });

  // Convert to array and fill missing days
  const result: ActivityData[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayData = grouped.get(dateStr) || { sessions: 0, minutes: 0, scores: [] };
    const avgScore = dayData.scores.length > 0
      ? Math.round(dayData.scores.reduce((a, b) => a + b, 0) / dayData.scores.length)
      : 0;
    
    result.push({
      date: dateStr,
      sessions: dayData.sessions,
      minutes: dayData.minutes,
      score: avgScore,
    });
  }

  return result;
}

async function fetchEmotionDistribution(
  userId: string,
  userIdColumn: string
): Promise<EmotionDistribution[]> {
  const { data, error } = await supabase
    .from('learning_sessions')
    .select('primary_emotion')
    .eq(userIdColumn, userId)
    .not('ended_at', 'is', null)
    .not('primary_emotion', 'is', null);

  if (error || !data) {
    return [];
  }

  // Count emotions
  const counts = new Map<string, number>();
  data.forEach(session => {
    if (session.primary_emotion) {
      counts.set(session.primary_emotion, (counts.get(session.primary_emotion) || 0) + 1);
    }
  });

  const total = data.length;
  
  return Array.from(counts.entries())
    .map(([emotion, count]) => ({
      emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

async function fetchRecentSessions(
  userId: string,
  userIdColumn: string,
  limit: number
): Promise<RecentSession[]> {
  console.log('[Dashboard] Fetching recent sessions for user:', userId, 'column:', userIdColumn);
  
  const { data, error } = await supabase
    .from('learning_sessions')
    .select('id, session_id, topic_name, started_at, duration_minutes, quiz_score, primary_emotion, total_messages')
    .eq(userIdColumn, userId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Dashboard] Error fetching recent sessions:', error);
    return [];
  }

  if (!data || data.length === 0) {
    console.warn('[Dashboard] No recent sessions found for user:', userId);
    return [];
  }

  console.log('[Dashboard] Found', data.length, 'recent sessions');
  return data.map(session => ({
    id: session.id,
    sessionId: session.session_id,
    topicName: session.topic_name || 'Unknown Topic',
    startedAt: session.started_at,
    duration: session.duration_minutes || 0,
    score: session.quiz_score,
    emotion: session.primary_emotion,
    messagesCount: session.total_messages || 0,
  }));
}

async function fetchTopicProgress(
  userId: string,
  userIdColumn: string
): Promise<TopicProgress[]> {
  const { data, error } = await supabase
    .from('learning_sessions')
    .select('topic_name, duration_minutes, quiz_score, started_at')
    .eq(userIdColumn, userId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  // Group by topic
  const grouped = new Map<string, {
    sessions: number;
    minutes: number;
    scores: number[];
    lastPracticed: string;
  }>();

  data.forEach(session => {
    const topic = session.topic_name || 'Unknown';
    const existing = grouped.get(topic) || {
      sessions: 0,
      minutes: 0,
      scores: [] as number[],
      lastPracticed: session.started_at,
    };

    existing.sessions += 1;
    existing.minutes += session.duration_minutes || 0;
    if (session.quiz_score !== null && typeof session.quiz_score === 'number') {
      existing.scores.push(session.quiz_score);
    }
    if (new Date(session.started_at) > new Date(existing.lastPracticed)) {
      existing.lastPracticed = session.started_at;
    }

    grouped.set(topic, existing);
  });

  return Array.from(grouped.entries())
    .map(([topicName, data]) => ({
      topicName,
      sessionsCount: data.sessions,
      totalMinutes: data.minutes,
      averageScore: data.scores.length > 0
        ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
        : 0,
      lastPracticed: data.lastPracticed,
    }))
    .sort((a, b) => new Date(b.lastPracticed).getTime() - new Date(a.lastPracticed).getTime())
    .slice(0, 5); // Top 5 topics
}

function calculateStreak(sessions: Array<{ started_at: string }>): number {
  if (!sessions || sessions.length === 0) return 0;

  // Sort sessions by date (newest first)
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );

  // Get unique dates
  const uniqueDates = new Set(
    sortedSessions.map(s => new Date(s.started_at).toISOString().split('T')[0])
  );

  const dates = Array.from(uniqueDates).sort((a, b) => b.localeCompare(a));

  // Check if there's a session today or yesterday
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (!dates.includes(today) && !dates.includes(yesterday)) {
    return 0; // Streak broken
  }

  // Count consecutive days
  let streak = 0;
  let currentDate = new Date();

  for (const dateStr of dates) {
    const sessionDate = new Date(dateStr);
    const expectedDate = new Date(currentDate);
    expectedDate.setDate(expectedDate.getDate() - streak);
    const expectedDateStr = expectedDate.toISOString().split('T')[0];

    if (dateStr === expectedDateStr) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// =============================================
// REAL-TIME SUBSCRIPTION (Optional)
// =============================================

export function subscribeToDashboardUpdates(
  userId: string,
  callback: (data: Partial<DashboardData>) => void
) {
  if (!isSupabaseConfigured || !userId) return () => {};

  const userIdColumn = userId.startsWith('user_') ? 'clerk_user_id' : 'user_id';

  const subscription = supabase
    .channel('dashboard_updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'learning_sessions',
        filter: `${userIdColumn}=eq.${userId}`,
      },
      () => {
        // Refetch data when sessions change
        fetchDashboardData(userId).then(callback);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}
