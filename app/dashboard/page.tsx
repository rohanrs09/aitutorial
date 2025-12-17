'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Mic, Brain, Clock, Target, BookOpen, TrendingUp, 
  Play, Calendar, BarChart3, Settings, ChevronRight,
  Flame, Award, Zap, MessageSquare, User, RefreshCw
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

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
    if (typeof window !== 'undefined' && (window as Window & { Clerk?: { user?: { id: string; firstName?: string } } }).Clerk?.user) {
      const user = (window as Window & { Clerk?: { user?: { id: string; firstName?: string } } }).Clerk?.user;
      return {
        id: user?.id,
        firstName: user?.firstName || undefined,
      };
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

const mockAchievements = [
  { icon: Flame, label: '7-Day Streak', unlocked: true },
  { icon: Award, label: 'First Quiz Ace', unlocked: true },
  { icon: Brain, label: 'Deep Thinker', unlocked: true },
  { icon: Zap, label: 'Speed Learner', unlocked: false },
];

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

  // Load user from Clerk or demo mode
  useEffect(() => {
    const loadUser = async () => {
      if (isClerkConfigured) {
        // Try to get user from Clerk
        const clerkUser = await getClerkUserData();
        if (clerkUser) {
          setUser(clerkUser);
          // Cache user for other pages
          localStorage.setItem('clerk_user_cache', JSON.stringify(clerkUser));
        } else {
          // Try localStorage cache
          const cachedUser = localStorage.getItem('clerk_user_cache');
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
          } else {
            setUser({ firstName: 'Learner' });
          }
        }
      } else {
        setUser({ firstName: 'Learner' });
      }
      setIsLoaded(true);
    };
    loadUser();
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Load user data - works with or without Clerk
  const loadUserData = useCallback(async () => {
    try {
      const [userStats, sessions] = await Promise.all([
        getUserStats(), // Works from localStorage if no Supabase
        getRecentSessions(undefined, 5)
      ]);
      setStats(userStats);
      setRecentSessions(sessions);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoadingData(false);
      setRefreshing(false);
    }
  }, []);

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
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
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
              <Link 
                href="/settings"
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Settings size={20} />
              </Link>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`p-2 text-gray-400 hover:text-white transition-colors ${refreshing ? 'animate-spin' : ''}`}
                title="Refresh data"
              >
                <RefreshCw size={20} />
              </button>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {greeting}, {user?.firstName || 'Learner'}!
          </h1>
          <p className="text-gray-400">Ready to continue your learning journey?</p>
        </motion.div>

        {/* Quick Action - Start Learning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Link href="/learn">
            <div className="card bg-gradient-to-br from-primary-500/20 to-pink-500/20 border-primary-500/30 hover:border-primary-500/50 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/30 transition-colors">
                    <Play size={28} className="text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Start Learning Session</h3>
                    <p className="text-gray-400 text-sm">Pick up where you left off or explore new topics</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-primary-400 transition-colors" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <MessageSquare size={20} className="text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
            <p className="text-gray-500 text-sm">Total Sessions</p>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Clock size={20} className="text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m</p>
            <p className="text-gray-500 text-sm">Time Learned</p>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Flame size={20} className="text-orange-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stats.currentStreak}</p>
            <p className="text-gray-500 text-sm">Day Streak</p>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Target size={20} className="text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stats.averageScore}%</p>
            <p className="text-gray-500 text-sm">Avg. Score</p>
          </div>
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
                  <Link href="/learn" className="text-primary-400 hover:text-primary-300 text-sm">
                    New Session
                  </Link>
                )}
              </div>
              <div className="space-y-3">
                {isLoadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                  </div>
                ) : recentSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No learning sessions yet</p>
                    <Link 
                      href="/learn" 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
                    >
                      <Play size={16} />
                      Start Your First Session
                    </Link>
                  </div>
                ) : (
                  recentSessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-surface rounded-xl hover:bg-surface-lighter transition-colors cursor-pointer"
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
                  ))
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
              <div className="flex items-center gap-2 mb-4">
                <Brain size={18} className="text-primary-400" />
                <h2 className="text-lg font-semibold text-white">Learning Insights</h2>
              </div>
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
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card"
            >
              <div className="flex items-center gap-2 mb-4">
                <Award size={18} className="text-yellow-400" />
                <h2 className="text-lg font-semibold text-white">Achievements</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {mockAchievements.map((achievement, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-xl text-center ${
                      achievement.unlocked 
                        ? 'bg-surface' 
                        : 'bg-surface opacity-50'
                    }`}
                  >
                    <achievement.icon 
                      size={24} 
                      className={`mx-auto mb-1 ${
                        achievement.unlocked ? 'text-yellow-400' : 'text-gray-600'
                      }`} 
                    />
                    <p className={`text-xs ${
                      achievement.unlocked ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {achievement.label}
                    </p>
                  </div>
                ))}
              </div>
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
