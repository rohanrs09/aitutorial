'use client';

/**
 * CLEAN DASHBOARD - Designer's Approach
 * 
 * Philosophy: Show only what matters, hide complexity
 * - 3 clear actions: Continue, Browse, Progress
 * - Minimal stats (3 key metrics)
 * - Recent activity (last 3 sessions)
 * - Everything else is secondary
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Play, BookOpen, TrendingUp, Flame, Target, MessageSquare, Calendar, Clock, ChevronRight, User } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getUserStats, getRecentSessions, type UserStats } from '@/lib/user-data';

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

export default function DashboardPage() {
  const [user, setUser] = useState<{ firstName?: string; id?: string } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [greeting, setGreeting] = useState('Hello');
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [recentSessions, setRecentSessions] = useState<Array<{
    id: string; topic: string; date: string; duration: number;
    score: number | null; emotion: string;
  }>>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

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

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      const userId = user?.id;
      const [userStats, sessions] = await Promise.all([
        getUserStats(userId),
        getRecentSessions(userId, 3), // Only 3 recent sessions
      ]);
      
      setStats(userStats);
      setRecentSessions(sessions);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [user?.id]);

  useEffect(() => {
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
          <p className="text-gray-400 text-sm">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Simple Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-surface/80 backdrop-blur-lg border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="font-bold text-white hidden sm:block">AI Tutor</span>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            {greeting}, {user?.firstName || 'Learner'}
          </h1>
          <p className="text-sm text-gray-400">
            What would you like to learn today?
          </p>
        </motion.div>

        {/* Primary Action - Start Learning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Link href="/courses">
            <Card variant="gradient" padding="md" hover className="group">
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shrink-0">
                      <Play size={24} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-0.5">
                        Start Learning
                      </h3>
                      <p className="text-sm text-gray-400 hidden sm:block">
                        Browse courses or continue where you left off
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-400 group-hover:text-primary-400 group-hover:translate-x-1 transition-all shrink-0" size={20} />
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Quick Stats - 3 Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-3 sm:gap-4 mb-8"
        >
          <Card variant="elevated" padding="md">
            <CardContent>
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center mb-2">
                  <MessageSquare size={20} className="text-primary-400" />
                </div>
                <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
                <p className="text-xs text-gray-400">Sessions</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" padding="md">
            <CardContent>
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2">
                  <Flame size={20} className="text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-white">{stats.currentStreak}</p>
                <p className="text-xs text-gray-400">Day Streak</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" padding="md">
            <CardContent>
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-2">
                  <Target size={20} className="text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white">{stats.averageScore}%</p>
                <p className="text-xs text-gray-400">Avg Score</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        {recentSessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="elevated" padding="md">
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                  <Link href="/courses">
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <Link key={session.id} href={`/session/${session.id}`}>
                      <div className="flex items-center justify-between p-3 bg-surface rounded-xl hover:bg-surface-lighter transition-all cursor-pointer group">
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
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Secondary Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid sm:grid-cols-2 gap-4 mt-6"
        >
          <Link href="/courses">
            <Card variant="elevated" padding="md" hover className="group h-full">
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <BookOpen size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white group-hover:text-primary-400 transition-colors">
                      Browse Courses
                    </h3>
                    <p className="text-xs text-gray-400">
                      Explore all available courses
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard">
            <Card variant="elevated" padding="md" hover className="group h-full">
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <TrendingUp size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white group-hover:text-primary-400 transition-colors">
                      View Progress
                    </h3>
                    <p className="text-xs text-gray-400">
                      See detailed analytics
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
