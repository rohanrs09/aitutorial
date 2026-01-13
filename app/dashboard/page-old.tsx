'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Mic, Brain, Clock, Target, BookOpen, TrendingUp, 
  Play, Calendar, BarChart3, Settings, ChevronRight,
  Flame, Award, Zap, MessageSquare, User, RefreshCw
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { SkeletonStats, SkeletonSessionList } from '@/components/ui/Skeleton';
import { NoSessionsEmpty } from '@/components/ui/EmptyState';
import { Tooltip } from '@/components/ui/Tooltip';
import AchievementNotification from '@/components/AchievementNotification';

// Check if Clerk is configured
const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Fallback user button component
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

// Helper to get user data from Clerk client-side
async function getClerkUserData(): Promise<{
  id?: string;
  firstName?: string;
} | null> {
  if (!isClerkConfigured) return null;
  
  try {
    // Access clerk from the window object after it's loaded
    if (typeof window !== 'undefined') {
      const clerk = (window as Window & { Clerk?: { user?: unknown; loaded?: boolean } }).Clerk;
      if (clerk?.loaded && clerk.user) {
        const user = clerk.user as {
          id: string;
          firstName?: string;
        };
        return {
          id: user?.id,
          firstName: user?.firstName || undefined,
        };
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

// Import user data service
import { getUserStats, getRecentSessions, type UserStats } from '@/lib/user-data';
import { analyzeEmotionPatterns, generateEmotionInsights, getSessionEmotionHistory } from '@/lib/emotion-analytics';
import { getUserAchievements, checkAchievements, type Achievement } from '@/lib/achievements';
import { getComparativeStats, formatTrendPercentage, getTrendColor, getTrendIcon, type ComparativeStats } from '@/lib/analytics';

// Default stats for new users
const defaultStats: UserStats = {
  totalSessions: 0,
  totalMinutes: 0,
  currentStreak: 0,
  averageScore: 0,
  topicsCompleted: 0,
  emotionInsights: {
    engaged: 40,
    curious: 30,
    confused: 20,
    confident: 10
  }
};

// Icon mapping for achievements
const getAchievementIcon = (icon: string) => {
  const iconMap: Record<string, any> = {
    '🎯': Target,
    '🚀': Zap,
    '📚': BookOpen,
    '🏆': Award,
    '🔥': Flame,
    '👑': Award,
    '⚡': Zap,
    '💯': Target,
    '⭐': Award,
    '⏰': Clock,
  };
  return iconMap[icon] || Award;
};

export default function DashboardPage() {
  // User state
  const [user, setUser] = useState<{ firstName?: string; id?: string } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [greeting, setGreeting] = useState('Hello');
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [recentSessions, setRecentSessions] = useState<Array<{
    id: string;
    topic: string;
    date: string;
    duration: number;
    score: number | null;
    emotion: string;
  }>>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [emotionInsights, setEmotionInsights] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const [comparativeStats, setComparativeStats] = useState<ComparativeStats | null>(null);
  const [learningEffectiveness, setLearningEffectiveness] = useState<number>(0);

  // Load user from Clerk or demo mode with retry logic
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;
    
    const loadUser = async () => {
      if (!isClerkConfigured) {
        setUser({ firstName: 'Learner' });
        setIsLoaded(true);
        return;
      }

      // Poll for Clerk user data with timeout
      checkInterval = setInterval(async () => {
        const clerkUser = await getClerkUserData();
        if (clerkUser) {
          setUser(clerkUser);
          setIsLoaded(true);
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
        }
      }, 200);

      // Fallback after 3 seconds
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

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Load user data - works with or without Clerk
  const loadUserData = useCallback(async () => {
    try {
      const userId = user?.id;
      const [userStats, sessions, userAchievements, compStats] = await Promise.all([
        getUserStats(userId), // Works from localStorage if no Supabase
        getRecentSessions(userId, 5),
        getUserAchievements(userId),
        getComparativeStats(userId, 'week')
      ]);
      setStats(userStats);
      setRecentSessions(sessions);
      setAchievements(userAchievements);
      setComparativeStats(compStats);
      
      // Check for newly unlocked achievements
      if (userId) {
        const newAchievements = await checkAchievements(userId, {
          totalSessions: userStats.totalSessions,
          currentStreak: userStats.currentStreak,
          averageScore: userStats.averageScore,
          totalMinutes: userStats.totalMinutes,
        });
        
        if (newAchievements.length > 0) {
          setNewlyUnlocked(newAchievements);
          console.log('[Achievements] 🎉 Newly unlocked:', newAchievements.map(a => a.name));
        }
      }
      
      // Load emotion insights from recent sessions
      if (sessions.length > 0) {
        const allEvents = sessions.flatMap(s => getSessionEmotionHistory(s.id));
        if (allEvents.length > 0) {
          const patterns = analyzeEmotionPatterns(allEvents, 7);
          const insights = generateEmotionInsights(patterns);
          setEmotionInsights(insights.slice(0, 3)); // Top 3 insights
          
          // Calculate learning effectiveness from emotion patterns
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
      
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center">
                  <Mic size={18} className="text-white" />
                </div>
                <span className="font-bold text-lg text-white hidden sm:block">AI Voice Tutor</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Tooltip content="Settings" position="bottom">
                <Link 
                  href="/settings"
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <Settings size={20} />
                </Link>
              </Tooltip>
              <Tooltip content="Refresh data" position="bottom">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 ${refreshing ? 'animate-spin' : ''}`}
                >
                  <RefreshCw size={20} />
                </button>
              </Tooltip>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {greeting}, {user?.firstName || 'Learner'}!
              </h1>
              <p className="text-gray-400 text-lg">Ready to continue your learning journey?</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Action - Start Learning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Link href="/courses">
            <div className="card bg-gradient-to-br from-primary-500/20 via-pink-500/10 to-purple-500/20 border-primary-500/30 hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-500/20 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Play size={28} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">Start Learning Session</h3>
                    <p className="text-gray-400 text-sm">Choose a course and start learning with AI guidance</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" size={24} />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          {isLoadingData ? (
            <SkeletonStats count={4} />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div 
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="card hover:border-blue-500/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <MessageSquare size={20} className="text-blue-400" />
                  </div>
                  {comparativeStats && comparativeStats.trends.sessions.trend !== 'stable' && (
                    <span className={`text-xs font-semibold ${getTrendColor(comparativeStats.trends.sessions)}`}>
                      {getTrendIcon(comparativeStats.trends.sessions)} {formatTrendPercentage(comparativeStats.trends.sessions)}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
                <p className="text-gray-500 text-sm">Total Sessions</p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="card hover:border-green-500/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Clock size={20} className="text-green-400" />
                  </div>
                  {comparativeStats && comparativeStats.trends.minutes.trend !== 'stable' && (
                    <span className={`text-xs font-semibold ${getTrendColor(comparativeStats.trends.minutes)}`}>
                      {getTrendIcon(comparativeStats.trends.minutes)} {formatTrendPercentage(comparativeStats.trends.minutes)}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-white">{Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m</p>
                <p className="text-gray-500 text-sm">Time Learned</p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="card hover:border-orange-500/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Flame size={20} className="text-orange-400" />
                  </div>
                  {comparativeStats && comparativeStats.trends.streak.trend !== 'stable' && (
                    <span className={`text-xs font-semibold ${getTrendColor(comparativeStats.trends.streak)}`}>
                      {getTrendIcon(comparativeStats.trends.streak)} {formatTrendPercentage(comparativeStats.trends.streak)}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-white">{stats.currentStreak}</p>
                <p className="text-gray-500 text-sm">Day Streak</p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="card hover:border-purple-500/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Target size={20} className="text-purple-400" />
                  </div>
                  {comparativeStats && comparativeStats.trends.score.trend !== 'stable' && (
                    <span className={`text-xs font-semibold ${getTrendColor(comparativeStats.trends.score)}`}>
                      {getTrendIcon(comparativeStats.trends.score)} {formatTrendPercentage(comparativeStats.trends.score)}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-white">{stats.averageScore}%</p>
                <p className="text-gray-500 text-sm">Avg. Score</p>
              </motion.div>
            </div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Recent Sessions</h2>
                {recentSessions.length > 0 && (
                  <Link href="/courses" className="text-primary-400 hover:text-primary-300 text-sm">
                    New Session
                  </Link>
                )}
              </div>
              <div className="space-y-3">
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
                          whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className="flex items-center justify-between p-3 bg-surface rounded-xl hover:bg-surface-lighter transition-all duration-200 cursor-pointer"
                        >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                            <BookOpen size={18} className="text-primary-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{session.topic}</p>
                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                              <Calendar size={12} />
                              <span>{new Date(session.date).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{session.duration} min</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
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
            </div>
          </motion.div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Emotion Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain size={18} className="text-primary-400" />
                  <h2 className="text-lg font-semibold text-white">Learning Insights</h2>
                </div>
                {emotionInsights.length > 0 && (
                  <button
                    onClick={() => setShowInsights(!showInsights)}
                    className="text-xs text-primary-400 hover:text-primary-300"
                  >
                    {showInsights ? 'Show Stats' : 'Show Insights'}
                  </button>
                )}
              </div>
              {!showInsights ? (
                <div className="space-y-3">
                  {Object.entries(stats.emotionInsights).map(([emotion, percentage]) => (
                    <div key={emotion}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-400 capitalize">{emotion}</span>
                        <span className="text-white">{percentage as number}%</span>
                      </div>
                      <div className="h-2 bg-surface rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage as number}%` }}
                          transition={{ delay: 0.5, duration: 0.5 }}
                          className={`h-full rounded-full ${
                            emotion === 'engaged' ? 'bg-green-500' :
                            emotion === 'curious' ? 'bg-blue-500' :
                            emotion === 'confused' ? 'bg-yellow-500' : 'bg-purple-500'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {emotionInsights.length === 0 ? (
                    <p className="text-gray-400 text-sm">Complete more sessions to see personalized insights</p>
                  ) : (
                    emotionInsights.map((insight, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${
                        insight.type === 'warning' ? 'border-yellow-500/30 bg-yellow-500/10' :
                        insight.type === 'success' ? 'border-green-500/30 bg-green-500/10' :
                        'border-blue-500/30 bg-blue-500/10'
                      }`}>
                        <h4 className={`text-sm font-semibold mb-1 ${
                          insight.type === 'warning' ? 'text-yellow-400' :
                          insight.type === 'success' ? 'text-green-400' : 'text-blue-400'
                        }`}>
                          {insight.title}
                        </h4>
                        <p className="text-xs text-gray-400">{insight.description}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>

            {/* Learning Effectiveness */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="card"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-green-400" />
                <h2 className="text-lg font-semibold text-white">Learning Effectiveness</h2>
              </div>
              {isLoadingData ? (
                <div className="h-32 bg-surface/50 rounded-xl animate-pulse" />
              ) : learningEffectiveness > 0 ? (
                <div>
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative w-32 h-32">
                      <svg className="transform -rotate-90 w-32 h-32">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-surface"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - learningEffectiveness / 100)}`}
                          className={`${
                            learningEffectiveness >= 75 ? 'text-green-500' :
                            learningEffectiveness >= 50 ? 'text-yellow-500' :
                            'text-red-500'
                          } transition-all duration-1000`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">{learningEffectiveness}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Engagement</span>
                      <span className="text-white font-medium">{Math.min(100, learningEffectiveness + 5)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Focus</span>
                      <span className="text-white font-medium">{Math.max(0, learningEffectiveness - 5)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Retention</span>
                      <span className="text-white font-medium">{learningEffectiveness}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">Complete sessions to see your effectiveness score</p>
                </div>
              )}
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-yellow-400" />
                  <h2 className="text-lg font-semibold text-white">Achievements</h2>
                </div>
                <span className="text-xs text-gray-400">
                  {achievements.filter(a => a.unlocked).length}/{achievements.length}
                </span>
              </div>
              {isLoadingData ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 bg-surface/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : achievements.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Complete sessions to unlock achievements!</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {achievements.slice(0, 6).map((achievement) => {
                    const IconComponent = getAchievementIcon(achievement.icon);
                    const progress = achievement.progress || 0;
                    
                    return (
                      <Tooltip key={achievement.id} content={achievement.description}>
                        <div 
                          className={`p-3 rounded-xl text-center relative overflow-hidden ${
                            achievement.unlocked 
                              ? 'bg-surface border border-yellow-500/30' 
                              : 'bg-surface/50 border border-gray-700'
                          }`}
                        >
                          {!achievement.unlocked && progress > 0 && (
                            <div 
                              className="absolute bottom-0 left-0 h-1 bg-primary-500/30"
                              style={{ width: `${progress}%` }}
                            />
                          )}
                          <div className="text-2xl mb-1">{achievement.icon}</div>
                          <p className={`text-xs font-medium ${
                            achievement.unlocked ? 'text-gray-200' : 'text-gray-500'
                          }`}>
                            {achievement.name}
                          </p>
                          {achievement.unlocked && achievement.unlockedAt && (
                            <p className="text-[10px] text-gray-600 mt-1">
                              {new Date(achievement.unlockedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Progress Chart Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="card"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-green-400" />
                <h2 className="text-lg font-semibold text-white">Weekly Progress</h2>
              </div>
              <div className="flex items-end justify-between h-24 gap-2">
                {[40, 60, 45, 80, 70, 90, 85].map((height, index) => (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.7 + index * 0.05, duration: 0.3 }}
                    className="flex-1 bg-gradient-to-t from-primary-500/50 to-primary-500 rounded-t"
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
