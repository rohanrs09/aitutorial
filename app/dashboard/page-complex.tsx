'use client';

/**
 * IMPROVED Dashboard Page
 * 
 * UI/UX Improvements:
 * - Uses PageHeader for consistent navigation
 * - Uses StatCard for all statistics
 * - Better responsive grid (mobile-first)
 * - Cleaner card layouts with shadcn components
 * - Improved loading states
 * - Better spacing and visual hierarchy
 * - No layout shifts
 */

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Mic, Brain, Clock, Target, BookOpen, TrendingUp, 
  Play, Calendar, Settings, ChevronRight,
  Flame, Award, Zap, MessageSquare, User, RefreshCw
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Layout Components
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer, PageSection } from '@/components/layout/PageContainer';
import { StatCard } from '@/components/layout/StatCard';

// UI Components
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonStats, SkeletonSessionList } from '@/components/ui/Skeleton';
import { NoSessionsEmpty } from '@/components/ui/EmptyState';
import { Tooltip } from '@/components/ui/Tooltip';
import AchievementNotification from '@/components/AchievementNotification';

// Data & Logic (NO CHANGES)
import { getUserStats, getRecentSessions, type UserStats } from '@/lib/user-data';
import { analyzeEmotionPatterns, generateEmotionInsights, getSessionEmotionHistory } from '@/lib/emotion-analytics';
import { getUserAchievements, checkAchievements, type Achievement } from '@/lib/achievements';
import { getComparativeStats, formatTrendPercentage, getTrendColor, getTrendIcon, type ComparativeStats } from '@/lib/analytics';

// Clerk Configuration
const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function FallbackUserButton() {
  return (
    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
      <User size={16} className="text-primary-400" />
    </div>
  );
}

const ClerkUserButton = dynamic(
  () => import('@clerk/nextjs').then(mod => mod.UserButton).catch(() => FallbackUserButton),
  { ssr: false, loading: () => <FallbackUserButton /> }
);

async function getClerkUserData(): Promise<{ id?: string; firstName?: string } | null> {
  if (!isClerkConfigured) return null;
  
  try {
    if (typeof window !== 'undefined') {
      const clerk = (window as Window & { Clerk?: { user?: unknown; loaded?: boolean } }).Clerk;
      if (clerk?.loaded && clerk.user) {
        const user = clerk.user as { id: string; firstName?: string };
        return { id: user?.id, firstName: user?.firstName || undefined };
      }
    }
    return null;
  } catch {
    return null;
  }
}

function UserButton(props: { afterSignOutUrl?: string }) {
  return isClerkConfigured ? <ClerkUserButton {...props} /> : <FallbackUserButton />;
}

const defaultStats: UserStats = {
  totalSessions: 0,
  totalMinutes: 0,
  currentStreak: 0,
  averageScore: 0,
  topicsCompleted: 0,
  emotionInsights: { engaged: 40, curious: 30, confused: 20, confident: 10 }
};

const getAchievementIcon = (icon: string) => {
  const iconMap: Record<string, any> = {
    '🎯': Target, '🚀': Zap, '📚': BookOpen, '🏆': Award,
    '🔥': Flame, '👑': Award, '⚡': Zap, '💯': Target,
    '⭐': Award, '⏰': Clock,
  };
  return iconMap[icon] || Award;
};

export default function DashboardPage() {
  // State
  const [user, setUser] = useState<{ firstName?: string; id?: string } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [greeting, setGreeting] = useState('Hello');
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [recentSessions, setRecentSessions] = useState<Array<{
    id: string; topic: string; date: string; duration: number;
    score: number | null; emotion: string;
  }>>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [emotionInsights, setEmotionInsights] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const [comparativeStats, setComparativeStats] = useState<ComparativeStats | null>(null);
  const [learningEffectiveness, setLearningEffectiveness] = useState<number>(0);

  // Load user from Clerk
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;
    
    const loadUser = async () => {
      if (!isClerkConfigured) {
        setUser({ firstName: 'Learner' });
        setIsLoaded(true);
        return;
      }

      checkInterval = setInterval(async () => {
        const clerkUser = await getClerkUserData();
        if (clerkUser) {
          setUser(clerkUser);
          setIsLoaded(true);
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
        }
      }, 200);

      timeoutId = setTimeout(() => {
        clearInterval(checkInterval);
        if (!isLoaded) {
          setUser({ firstName: 'Learner' });
          setIsLoaded(true);
        }
      }, 3000);
    };
    
    loadUser();
    
    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeoutId);
    };
  }, [isLoaded]);

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Load user data (NO LOGIC CHANGES)
  const loadUserData = useCallback(async () => {
    try {
      const userId = user?.id;
      const [userStats, sessions, userAchievements, compStats] = await Promise.all([
        getUserStats(userId),
        getRecentSessions(userId, 5),
        getUserAchievements(userId),
        getComparativeStats(userId, 'week')
      ]);
      
      setStats(userStats);
      setRecentSessions(sessions);
      setAchievements(userAchievements);
      setComparativeStats(compStats);
      
      if (userId) {
        const newAchievements = await checkAchievements(userId, {
          totalSessions: userStats.totalSessions,
          currentStreak: userStats.currentStreak,
          averageScore: userStats.averageScore,
          totalMinutes: userStats.totalMinutes,
        });
        
        if (newAchievements.length > 0) {
          setNewlyUnlocked(newAchievements);
        }
      }
      
      if (sessions.length > 0) {
        const allEvents = sessions.flatMap(s => getSessionEmotionHistory(s.id));
        if (allEvents.length > 0) {
          const patterns = analyzeEmotionPatterns(allEvents, 7);
          const insights = generateEmotionInsights(patterns);
          setEmotionInsights(insights.slice(0, 3));
          
          const { calculateLearningEffectiveness } = await import('@/lib/emotion-analytics');
          const effectiveness = calculateLearningEffectiveness(allEvents);
          setLearningEffectiveness(effectiveness);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoadingData(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserData();
  }, [loadUserData]);

  // Loading State
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Achievement Notification */}
      {newlyUnlocked.length > 0 && (
        <AchievementNotification 
          achievements={newlyUnlocked}
          onClose={() => setNewlyUnlocked([])}
        />
      )}
      
      {/* Header - Using PageHeader Component */}
      <PageHeader
        transparent
        actions={
          <>
            <Tooltip content="Settings" position="bottom">
              <Link href="/settings">
                <Button variant="ghost" size="icon-sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </Tooltip>
            <Tooltip content="Refresh data" position="bottom">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </Tooltip>
            <UserButton afterSignOutUrl="/" />
          </>
        }
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center">
            <Mic size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg text-white hidden sm:block">AI Voice Tutor</span>
        </Link>
      </PageHeader>

      {/* Main Content - Using PageContainer */}
      <PageContainer maxWidth="xl">
        {/* Welcome Section - Simplified */}
        <PageSection>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              {greeting}, {user?.firstName || 'Learner'}
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              What would you like to learn today?
            </p>
          </motion.div>
        </PageSection>

        {/* Quick Actions - 3 Primary Actions */}
        <PageSection>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link href="/courses">
              <Card 
                variant="gradient" 
                padding="md"
                hover
                className="group"
              >
                <CardContent>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shrink-0">
                        <Play size={24} className="text-white sm:w-7 sm:h-7" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-white mb-0.5 truncate">
                          Start Learning Session
                        </h3>
                        <p className="text-gray-400 text-sm hidden sm:block">
                          Choose a course and start learning with AI guidance
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-primary-400 group-hover:translate-x-1 transition-all shrink-0" size={20} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </PageSection>

        {/* Stats - Simplified to 3 key metrics */}
        <PageSection>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {isLoadingData ? (
              <SkeletonStats count={3} />
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <StatCard
                  title="Sessions"
                  value={stats.totalSessions}
                  icon={MessageSquare}
                  iconColor="text-primary-400"
                />
                
                <StatCard
                  title="Streak"
                  value={`${stats.currentStreak} days`}
                  icon={Flame}
                  iconColor="text-orange-400"
                />
                
                <StatCard
                  title="Score"
                  value={`${stats.averageScore}%`}
                  icon={Target}
                  iconColor="text-green-400"
                />
              </div>
            )}
          </motion.div>
        </PageSection>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card variant="elevated" padding="md">
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
                {recentSessions.length > 0 && (
                  <Link href="/courses">
                    <Button variant="ghost" size="sm">
                      New Session
                    </Button>
                  </Link>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  {isLoadingData ? (
                    <SkeletonSessionList count={3} />
                  ) : recentSessions.length === 0 ? (
                    <NoSessionsEmpty onStartSession={() => window.location.href = '/courses'} />
                  ) : (
                    <AnimatePresence>
                      {recentSessions.map((session, index) => (
                        <Link key={session.id} href={`/session/${session.id}`}>
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                            className="flex items-center justify-between p-3 bg-surface rounded-xl hover:bg-surface-lighter transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                                <BookOpen size={18} className="text-primary-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-white font-medium text-sm truncate">
                                  {session.topic}
                                </p>
                                <div className="flex items-center gap-2 text-gray-500 text-xs">
                                  <Calendar size={12} />
                                  <span>{new Date(session.date).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <Clock size={12} />
                                  <span>{session.duration}min</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`font-medium text-sm ${
                                (session.score ?? 0) >= 90 ? 'text-green-400' : 
                                (session.score ?? 0) >= 70 ? 'text-yellow-400' : 'text-red-400'
                              }`}>
                                {session.score !== null ? `${session.score}%` : '-'}
                              </p>
                              <p className="text-gray-500 text-xs capitalize">{session.emotion}</p>
                            </div>
                          </motion.div>
                        </Link>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - Insights & Achievements */}
          <div className="space-y-4 sm:space-y-6">
            {/* Learning Effectiveness */}
            {learningEffectiveness > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <Card variant="elevated" padding="md">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TrendingUp size={18} className="text-green-400" />
                      <CardTitle>Learning Effectiveness</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center mb-4">
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                        <svg className="transform -rotate-90 w-full h-full">
                          <circle
                            cx="50%"
                            cy="50%"
                            r="40%"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-surface"
                          />
                          <circle
                            cx="50%"
                            cy="50%"
                            r="40%"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - learningEffectiveness / 100)}`}
                            className={`${
                              learningEffectiveness >= 75 ? 'text-green-500' :
                              learningEffectiveness >= 50 ? 'text-yellow-500' :
                              'text-red-500'
                            } transition-all duration-1000`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl sm:text-3xl font-bold text-white">
                            {learningEffectiveness}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Engagement</span>
                        <span className="text-white font-medium">
                          {Math.min(100, learningEffectiveness + 5)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Focus</span>
                        <span className="text-white font-medium">
                          {Math.max(0, learningEffectiveness - 5)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Retention</span>
                        <span className="text-white font-medium">
                          {learningEffectiveness}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card variant="elevated" padding="md">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-yellow-400" />
                    <CardTitle>Achievements</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {achievements.slice(0, 4).map((achievement, index) => {
                      const Icon = getAchievementIcon(achievement.icon);
                      return (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.45 + index * 0.05 }}
                          className={`flex items-start gap-3 p-3 rounded-xl ${
                            achievement.unlocked 
                              ? 'bg-primary-500/10 border border-primary-500/20' 
                              : 'bg-surface border border-white/5'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            achievement.unlocked 
                              ? 'bg-primary-500/20' 
                              : 'bg-white/5'
                          }`}>
                            <Icon size={20} className={achievement.unlocked ? 'text-primary-400' : 'text-gray-500'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${achievement.unlocked ? 'text-white' : 'text-gray-400'}`}>
                              {achievement.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {achievement.description}
                            </p>
                            {!achievement.unlocked && achievement.progress !== undefined && (
                              <div className="mt-2">
                                <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                                    style={{ width: `${achievement.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Emotion Insights */}
            {emotionInsights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <Card variant="elevated" padding="md">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Brain size={18} className="text-primary-400" />
                      <CardTitle>Learning Insights</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {emotionInsights.map((insight, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.05 }}
                          className="p-3 bg-surface rounded-xl"
                        >
                          <h4 className="text-sm font-medium text-white mb-1">
                            {insight.title}
                          </h4>
                          <p className="text-xs text-gray-400">
                            {insight.description}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
