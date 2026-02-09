'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer, PageSection } from '@/components/layout/PageContainer';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { EmotionChart } from '@/components/dashboard/EmotionChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { TopicProgress } from '@/components/dashboard/TopicProgress';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { QuickActions } from '@/components/dashboard/QuickActions';
import UserLearningInsights from '@/components/UserLearningInsights';
import QuizAnalytics from '@/components/dashboard/QuizAnalytics';
import CreditsDisplay from '@/components/dashboard/CreditsDisplay';
import { fetchDashboardData, subscribeToDashboardUpdates, type DashboardData } from '@/lib/dashboard-service';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/AuthContext';
import { UserButtonWithLogout } from '@/components/LogoutConfirmModal';

export default function ProductionDashboard() {
  // Use Supabase auth hook
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: { totalSessions: 0, totalMinutes: 0, currentStreak: 0, averageScore: 0, weeklyProgress: 0, monthlyProgress: 0 },
    activityChart: [], emotionDistribution: [], recentSessions: [], topicProgress: [], isLoading: true, error: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Derive user info from Supabase auth
  const userId = user?.id || null;
  const userName = user?.firstName || 'Learner';
  const isUserLoaded = isLoaded;

  const handleStartQuiz = (topic?: string) => {
    if (topic) {
      router.push(`/quiz?topic=${encodeURIComponent(topic)}`);
    } else {
      router.push('/quiz');
    }
  };

  // Debug logging for user ID
  useEffect(() => {
    if (isUserLoaded) {
      console.log('[Dashboard] User loaded:', { userId, userName, isSignedIn });
    }
  }, [isUserLoaded, userId, userName, isSignedIn]);

  useEffect(() => {
    if (!isUserLoaded) return;
    const loadDashboardData = async () => {
      console.log('[Dashboard] Loading data for userId:', userId);
      setDashboardData(prev => ({ ...prev, isLoading: true }));
      const data = await fetchDashboardData(userId);
      console.log('[Dashboard] Fetched data:', { sessions: data.recentSessions.length, stats: data.stats });
      setDashboardData(data);
    };
    loadDashboardData();
    if (userId) {
      const unsubscribe = subscribeToDashboardUpdates(userId, (updatedData) => { setDashboardData(prev => ({ ...prev, ...updatedData })); });
      return () => { unsubscribe(); };
    }
  }, [isUserLoaded, userId]);

  const handleRefresh = async () => { setIsRefreshing(true); const data = await fetchDashboardData(userId); setDashboardData(data); setIsRefreshing(false); };
  const getGreeting = () => { const hour = new Date().getHours(); if (hour < 12) return 'Good morning'; if (hour < 17) return 'Good afternoon'; return 'Good evening'; };

  if (!isUserLoaded) {
    return (
      <div className="min-h-screen bg-atmospheric flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-20 left-10 w-[400px] h-[400px] bg-orange-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-[300px] h-[300px] bg-amber-500/15 rounded-full blur-[80px]" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 relative z-10">
          <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-orange-500/30" />
          <p className="text-gray-400 text-sm font-medium">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-atmospheric relative overflow-hidden">
      <DashboardHeader userName={userName} greeting={getGreeting()} onRefresh={handleRefresh} isRefreshing={isRefreshing} userButton={<UserButtonWithLogout />} />
      <PageContainer maxWidth="2xl">
        {dashboardData.error && <PageSection><Card variant="elevated" padding="md"><CardContent><div className="flex items-center gap-3 text-yellow-400"><AlertCircle size={20} /><div><p className="font-medium">Unable to load dashboard data</p><p className="text-sm text-gray-400 mt-1">{dashboardData.error}</p></div></div></CardContent></Card></PageSection>}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="lg:col-span-2 h-full"
          >
            <StatsCards stats={dashboardData.stats} isLoading={dashboardData.isLoading} />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            className="h-full"
          >
            <CreditsDisplay />
          </motion.div>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.15 }} 
          className="mb-8"
        >
          <QuickActions />
        </motion.div>
        <div className="mb-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
              <TabsTrigger value="quiz" className="text-xs sm:text-sm">Quizzes</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs sm:text-sm">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.2 }} 
                  className="lg:col-span-2 order-2 lg:order-1"
                >
                  <ActivityChart data={dashboardData.activityChart} isLoading={dashboardData.isLoading} />
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.3 }} 
                  className="order-1 lg:order-2"
                >
                  <UserLearningInsights 
                    userId={userId}
                    stats={{
                      totalSessions: dashboardData.stats.totalSessions,
                      totalMinutes: dashboardData.stats.totalMinutes,
                      averageScore: dashboardData.stats.averageScore,
                      currentStreak: dashboardData.stats.currentStreak,
                    }}
                    topicProgress={dashboardData.topicProgress.map(topic => ({
                      topic: topic.topicName,
                      score: topic.averageScore,
                      sessionsCount: topic.sessionsCount,
                      trend: topic.averageScore >= 70 ? 'up' : topic.averageScore >= 50 ? 'stable' : 'down',
                      lastPracticed: new Date(topic.lastPracticed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    }))}
                    isPremium={false}
                  />
                </motion.div>
              </div>
            </TabsContent>
            <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.4 }} 
                  className="order-2 lg:order-1"
                >
                  <EmotionChart data={dashboardData.emotionDistribution} isLoading={dashboardData.isLoading} />
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.5 }} 
                  className="order-1 lg:order-2 lg:col-span-2"
                >
                  <TopicProgress topics={dashboardData.topicProgress} isLoading={dashboardData.isLoading} />
                </motion.div>
              </div>
            </TabsContent>
            <TabsContent value="quiz" className="space-y-4 sm:space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.5 }}
              >
                <QuizAnalytics userId={userId} onStartQuiz={handleStartQuiz} />
              </motion.div>
            </TabsContent>
            <TabsContent value="activity" className="space-y-4 sm:space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.6 }}
              >
                <RecentActivity sessions={dashboardData.recentSessions} isLoading={dashboardData.isLoading} />
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </div>
  );
}
