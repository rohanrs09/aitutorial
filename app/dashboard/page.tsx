'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer, PageSection } from '@/components/layout/PageContainer';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { EmotionChart } from '@/components/dashboard/EmotionChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { TopicProgress } from '@/components/dashboard/TopicProgress';
import { InsightsCard } from '@/components/dashboard/InsightsCard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { fetchDashboardData, subscribeToDashboardUpdates, type DashboardData } from '@/lib/dashboard-service';

const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function FallbackUserButton() {
  return <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center"><span className="text-primary-400 text-sm">👤</span></div>;
}

const ClerkUserButton = dynamic(() => import('@clerk/nextjs').then(mod => mod.UserButton).catch(() => FallbackUserButton), { ssr: false, loading: () => <FallbackUserButton /> });

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

function UserButton() {
  return isClerkConfigured ? <ClerkUserButton afterSignOutUrl="/" /> : <FallbackUserButton />;
}

export default function ProductionDashboard() {
  const [user, setUser] = useState<{ firstName?: string; id?: string } | null>(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: { totalSessions: 0, totalMinutes: 0, currentStreak: 0, averageScore: 0, weeklyProgress: 0, monthlyProgress: 0 },
    activityChart: [], emotionDistribution: [], recentSessions: [], topicProgress: [], isLoading: true, error: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;
    const loadUser = async () => {
      if (!isClerkConfigured) { setUser({ firstName: 'Learner' }); setIsUserLoaded(true); return; }
      checkInterval = setInterval(async () => {
        const clerkUser = await getClerkUserData();
        if (clerkUser) { setUser(clerkUser); setIsUserLoaded(true); clearInterval(checkInterval); clearTimeout(timeoutId); }
      }, 200);
      timeoutId = setTimeout(() => { clearInterval(checkInterval); if (!isUserLoaded) { setUser({ firstName: 'Learner' }); setIsUserLoaded(true); } }, 3000);
    };
    loadUser();
    return () => { clearInterval(checkInterval); clearTimeout(timeoutId); };
  }, [isUserLoaded]);

  useEffect(() => {
    if (!isUserLoaded) return;
    const loadDashboardData = async () => {
      setDashboardData(prev => ({ ...prev, isLoading: true }));
      const data = await fetchDashboardData(user?.id || null);
      setDashboardData(data);
    };
    loadDashboardData();
    if (user?.id) {
      const unsubscribe = subscribeToDashboardUpdates(user.id, (updatedData) => { setDashboardData(prev => ({ ...prev, ...updatedData })); });
      return () => { unsubscribe(); };
    }
  }, [isUserLoaded, user?.id]);

  const handleRefresh = async () => { setIsRefreshing(true); const data = await fetchDashboardData(user?.id || null); setDashboardData(data); setIsRefreshing(false); };
  const getGreeting = () => { const hour = new Date().getHours(); if (hour < 12) return 'Good morning'; if (hour < 17) return 'Good afternoon'; return 'Good evening'; };

  if (!isUserLoaded) {
    return (
      <div className="min-h-screen bg-atmospheric flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-20 left-10 w-[400px] h-[400px] bg-teal-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-[300px] h-[300px] bg-orange-500/15 rounded-full blur-[80px]" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 relative z-10">
          <div className="w-12 h-12 border-3 border-teal-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-teal-500/30" />
          <p className="text-gray-400 text-sm font-medium">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-atmospheric relative overflow-hidden">
      <DashboardHeader userName={user?.firstName || 'Learner'} greeting={getGreeting()} onRefresh={handleRefresh} isRefreshing={isRefreshing} userButton={<UserButton />} />
      <PageContainer maxWidth="2xl">
        {dashboardData.error && <PageSection><Card variant="elevated" padding="md"><CardContent><div className="flex items-center gap-3 text-yellow-400"><AlertCircle size={20} /><div><p className="font-medium">Unable to load dashboard data</p><p className="text-sm text-gray-400 mt-1">{dashboardData.error}</p></div></div></CardContent></Card></PageSection>}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8"><StatsCards stats={dashboardData.stats} isLoading={dashboardData.isLoading} /></motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8"><QuickActions /></motion.div>
        <div className="mb-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
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
                  <InsightsCard stats={dashboardData.stats} topicProgress={dashboardData.topicProgress} isLoading={dashboardData.isLoading} />
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
