'use client';

import { supabase, isSupabaseConfigured } from './supabase';
import { UserStats } from './user-data';

// =============================================
// Comparative Analytics Types
// =============================================

export interface ComparativeStats {
  current: UserStats;
  previous: UserStats;
  trends: {
    sessions: TrendData;
    minutes: TrendData;
    streak: TrendData;
    score: TrendData;
  };
}

export interface TrendData {
  current: number;
  previous: number;
  change: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

// =============================================
// Helper Functions
// =============================================

function calculateTrend(current: number, previous: number): TrendData {
  const change = current - previous;
  const percentage = previous === 0 ? 100 : Math.round((change / previous) * 100);
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (Math.abs(percentage) < 5) {
    trend = 'stable';
  } else if (change > 0) {
    trend = 'up';
  } else {
    trend = 'down';
  }

  return {
    current,
    previous,
    change,
    percentage,
    trend,
  };
}

function getDateRange(period: 'week' | 'month'): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  if (period === 'week') {
    start.setDate(start.getDate() - 7);
  } else {
    start.setMonth(start.getMonth() - 1);
  }
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

function getPreviousDateRange(period: 'week' | 'month'): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  
  if (period === 'week') {
    end.setDate(end.getDate() - 7);
  } else {
    end.setMonth(end.getMonth() - 1);
  }
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  if (period === 'week') {
    start.setDate(start.getDate() - 7);
  } else {
    start.setMonth(start.getMonth() - 1);
  }
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

// =============================================
// Stats Calculation
// =============================================

async function getStatsForPeriod(
  userId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<UserStats> {
  // Try Supabase first
  if (isSupabaseConfigured && userId) {
    try {
      let query = supabase
        .from('learning_sessions')
        .select('duration_minutes, quiz_score, emotions_detected, primary_emotion')
        .not('ended_at', 'is', null)
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString());

      // Handle both legacy user IDs and UUIDs
      if (userId.startsWith('user_')) {
        query = query.eq('user_id', userId);
      } else {
        query = query.eq('user_id', userId);
      }

      const { data: sessions, error } = await query;

      if (!error && sessions && sessions.length > 0) {
        const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
        const scores = sessions.filter(s => s.quiz_score !== null).map(s => s.quiz_score!);
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

        const emotionCounts = { engaged: 0, curious: 0, confused: 0, confident: 0 };
        sessions.forEach(s => {
          if (s.primary_emotion && s.primary_emotion in emotionCounts) {
            emotionCounts[s.primary_emotion as keyof typeof emotionCounts] += 1;
          }
        });

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
          currentStreak: 0,
          averageScore: avgScore,
          topicsCompleted: scores.filter(s => s >= 70).length,
          emotionInsights,
        };
      }
    } catch (error) {
      console.warn('[Analytics] Error fetching from Supabase:', error);
    }
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const historyStr = localStorage.getItem('ai_tutor_session_history');
    if (historyStr) {
      const history = JSON.parse(historyStr);
      const filteredSessions = history.filter((s: any) => {
        const sessionDate = new Date(s.date);
        return sessionDate >= startDate && sessionDate <= endDate;
      });

      if (filteredSessions.length > 0) {
        const totalMinutes = filteredSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
        const scores = filteredSessions.filter((s: any) => s.score !== null).map((s: any) => s.score);
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;

        return {
          totalSessions: filteredSessions.length,
          totalMinutes,
          currentStreak: 0,
          averageScore: avgScore,
          topicsCompleted: scores.filter((s: number) => s >= 70).length,
          emotionInsights: { engaged: 40, curious: 30, confused: 20, confident: 10 },
        };
      }
    }
  }

  // Return empty stats
  return {
    totalSessions: 0,
    totalMinutes: 0,
    currentStreak: 0,
    averageScore: 0,
    topicsCompleted: 0,
    emotionInsights: { engaged: 0, curious: 0, confused: 0, confident: 0 },
  };
}

// =============================================
// Main Export Function
// =============================================

export async function getComparativeStats(
  userId: string | undefined,
  period: 'week' | 'month' = 'week'
): Promise<ComparativeStats> {
  const currentRange = getDateRange(period);
  const previousRange = getPreviousDateRange(period);

  const [currentStats, previousStats] = await Promise.all([
    getStatsForPeriod(userId, currentRange.start, currentRange.end),
    getStatsForPeriod(userId, previousRange.start, previousRange.end),
  ]);

  return {
    current: currentStats,
    previous: previousStats,
    trends: {
      sessions: calculateTrend(currentStats.totalSessions, previousStats.totalSessions),
      minutes: calculateTrend(currentStats.totalMinutes, previousStats.totalMinutes),
      streak: calculateTrend(currentStats.currentStreak, previousStats.currentStreak),
      score: calculateTrend(currentStats.averageScore, previousStats.averageScore),
    },
  };
}

// =============================================
// Trend Formatting Helpers
// =============================================

export function formatTrendPercentage(trend: TrendData): string {
  if (trend.trend === 'stable') return '—';
  const sign = trend.change > 0 ? '+' : '';
  return `${sign}${trend.percentage}%`;
}

export function getTrendColor(trend: TrendData, higherIsBetter: boolean = true): string {
  if (trend.trend === 'stable') return 'text-gray-400';
  
  const isPositive = higherIsBetter ? trend.change > 0 : trend.change < 0;
  return isPositive ? 'text-green-400' : 'text-red-400';
}

export function getTrendIcon(trend: TrendData): '↑' | '↓' | '—' {
  if (trend.trend === 'stable') return '—';
  return trend.change > 0 ? '↑' : '↓';
}
