'use client';

import { supabase, isSupabaseConfigured } from './supabase';

// =============================================
// Achievement Types
// =============================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'sessions' | 'streak' | 'score' | 'time' | 'emotion' | 'special';
  criteriaType: string;
  criteriaThreshold: number;
  points: number;
  isSecret: boolean;
  unlocked?: boolean;
  unlockedAt?: Date;
  progress?: number;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  progress: number;
}

// =============================================
// Local Storage Keys
// =============================================

const STORAGE_KEYS = {
  ACHIEVEMENTS: 'ai_tutor_achievements',
  UNLOCKED_ACHIEVEMENTS: 'ai_tutor_unlocked_achievements',
};

// =============================================
// Default Achievements (Fallback)
// =============================================

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first learning session',
    icon: '🎯',
    category: 'sessions',
    criteriaType: 'total_sessions',
    criteriaThreshold: 1,
    points: 10,
    isSecret: false,
  },
  {
    id: 'getting_started',
    name: 'Getting Started',
    description: 'Complete 5 learning sessions',
    icon: '🚀',
    category: 'sessions',
    criteriaType: 'total_sessions',
    criteriaThreshold: 5,
    points: 20,
    isSecret: false,
  },
  {
    id: 'dedicated_learner',
    name: 'Dedicated Learner',
    description: 'Complete 10 learning sessions',
    icon: '📚',
    category: 'sessions',
    criteriaType: 'total_sessions',
    criteriaThreshold: 10,
    points: 30,
    isSecret: false,
  },
  {
    id: 'learning_master',
    name: 'Learning Master',
    description: 'Complete 25 learning sessions',
    icon: '🏆',
    category: 'sessions',
    criteriaType: 'total_sessions',
    criteriaThreshold: 25,
    points: 50,
    isSecret: false,
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    icon: '🔥',
    category: 'streak',
    criteriaType: 'current_streak',
    criteriaThreshold: 7,
    points: 40,
    isSecret: false,
  },
  {
    id: 'consistency_king',
    name: 'Consistency King',
    description: 'Maintain a 14-day learning streak',
    icon: '👑',
    category: 'streak',
    criteriaType: 'current_streak',
    criteriaThreshold: 14,
    points: 60,
    isSecret: false,
  },
  {
    id: 'perfect_score',
    name: 'Perfect Score',
    description: 'Get 100% on a quiz',
    icon: '💯',
    category: 'score',
    criteriaType: 'quiz_score',
    criteriaThreshold: 100,
    points: 30,
    isSecret: false,
  },
  {
    id: 'high_achiever',
    name: 'High Achiever',
    description: 'Average score above 85%',
    icon: '⭐',
    category: 'score',
    criteriaType: 'average_score',
    criteriaThreshold: 85,
    points: 40,
    isSecret: false,
  },
  {
    id: 'quick_learner',
    name: 'Quick Learner',
    description: 'Complete a session in under 15 minutes',
    icon: '⚡',
    category: 'time',
    criteriaType: 'session_duration',
    criteriaThreshold: 15,
    points: 20,
    isSecret: false,
  },
  {
    id: 'time_invested',
    name: 'Time Invested',
    description: 'Spend 5 hours learning total',
    icon: '⏰',
    category: 'time',
    criteriaType: 'total_minutes',
    criteriaThreshold: 300,
    points: 40,
    isSecret: false,
  },
];

// =============================================
// Achievement Functions
// =============================================

export async function getAllAchievements(): Promise<Achievement[]> {
  // Try Supabase first
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('achievement_definitions')
        .select('*')
        .order('points', { ascending: true });

      if (!error && data) {
        return data.map(a => ({
          id: a.id,
          name: a.name,
          description: a.description,
          icon: a.icon,
          category: a.category,
          criteriaType: a.criteria_type,
          criteriaThreshold: a.criteria_threshold,
          points: a.points,
          isSecret: a.is_secret,
        }));
      }
    } catch (error) {
      console.warn('[Achievements] Error fetching from Supabase:', error);
    }
  }

  // Fallback to default achievements
  return DEFAULT_ACHIEVEMENTS;
}

export async function getUserAchievements(userId?: string): Promise<Achievement[]> {
  const allAchievements = await getAllAchievements();

  // Try Supabase first
  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at, progress')
        .eq('clerk_user_id', userId);

      if (!error && data) {
        const unlockedIds = new Set(data.map(a => a.achievement_id));
        const unlockedMap = new Map(data.map(a => [a.achievement_id, a]));

        return allAchievements.map(achievement => ({
          ...achievement,
          unlocked: unlockedIds.has(achievement.id),
          unlockedAt: unlockedMap.get(achievement.id)?.unlocked_at 
            ? new Date(unlockedMap.get(achievement.id)!.unlocked_at) 
            : undefined,
          progress: unlockedMap.get(achievement.id)?.progress || 0,
        }));
      }
    } catch (error) {
      console.warn('[Achievements] Error fetching user achievements:', error);
    }
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEYS.UNLOCKED_ACHIEVEMENTS);
    if (stored) {
      const unlockedIds = new Set(JSON.parse(stored));
      return allAchievements.map(achievement => ({
        ...achievement,
        unlocked: unlockedIds.has(achievement.id),
      }));
    }
  }

  return allAchievements.map(a => ({ ...a, unlocked: false }));
}

export async function checkAchievements(
  userId: string,
  stats: {
    totalSessions: number;
    currentStreak: number;
    averageScore: number;
    totalMinutes: number;
    maxQuizScore?: number;
    lastSessionDuration?: number;
  }
): Promise<Achievement[]> {
  const newlyUnlocked: Achievement[] = [];
  const allAchievements = await getAllAchievements();
  const userAchievements = await getUserAchievements(userId);
  const unlockedIds = new Set(userAchievements.filter(a => a.unlocked).map(a => a.id));

  for (const achievement of allAchievements) {
    if (unlockedIds.has(achievement.id)) continue;

    let shouldUnlock = false;

    switch (achievement.criteriaType) {
      case 'total_sessions':
        shouldUnlock = stats.totalSessions >= achievement.criteriaThreshold;
        break;
      case 'current_streak':
        shouldUnlock = stats.currentStreak >= achievement.criteriaThreshold;
        break;
      case 'average_score':
        shouldUnlock = stats.averageScore >= achievement.criteriaThreshold;
        break;
      case 'total_minutes':
        shouldUnlock = stats.totalMinutes >= achievement.criteriaThreshold;
        break;
      case 'quiz_score':
        shouldUnlock = (stats.maxQuizScore || 0) >= achievement.criteriaThreshold;
        break;
      case 'session_duration':
        shouldUnlock = (stats.lastSessionDuration || 0) <= achievement.criteriaThreshold;
        break;
    }

    if (shouldUnlock) {
      await unlockAchievement(userId, achievement.id);
      newlyUnlocked.push({ ...achievement, unlocked: true, unlockedAt: new Date() });
    }
  }

  return newlyUnlocked;
}

export async function unlockAchievement(userId: string, achievementId: string): Promise<void> {
  // Save to Supabase
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('user_achievements')
        .upsert({
          clerk_user_id: userId,
          achievement_id: achievementId,
          progress: 100,
        }, {
          onConflict: 'clerk_user_id,achievement_id',
        });

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        console.warn('[Achievements] Error unlocking in Supabase:', error);
      } else {
        console.log(`[Achievements] ✅ Unlocked: ${achievementId}`);
      }
    } catch (error) {
      console.warn('[Achievements] Error unlocking achievement:', error);
    }
  }

  // Save to localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEYS.UNLOCKED_ACHIEVEMENTS);
    const unlocked = stored ? JSON.parse(stored) : [];
    if (!unlocked.includes(achievementId)) {
      unlocked.push(achievementId);
      localStorage.setItem(STORAGE_KEYS.UNLOCKED_ACHIEVEMENTS, JSON.stringify(unlocked));
    }
  }
}

export function getAchievementProgress(
  achievement: Achievement,
  stats: {
    totalSessions: number;
    currentStreak: number;
    averageScore: number;
    totalMinutes: number;
  }
): number {
  if (achievement.unlocked) return 100;

  let current = 0;
  switch (achievement.criteriaType) {
    case 'total_sessions':
      current = stats.totalSessions;
      break;
    case 'current_streak':
      current = stats.currentStreak;
      break;
    case 'average_score':
      current = stats.averageScore;
      break;
    case 'total_minutes':
      current = stats.totalMinutes;
      break;
  }

  return Math.min(100, Math.round((current / achievement.criteriaThreshold) * 100));
}
