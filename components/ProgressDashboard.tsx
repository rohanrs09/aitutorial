'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, TrendingUp, Clock, CheckCircle2, 
  AlertCircle, Loader, Calendar, Target 
} from 'lucide-react';
import { useUser } from '@/contexts/AuthContext';
import { getProgressSummary, getUserLearningHistory } from '@/lib/progress-tracking';

interface ProgressSummary {
  totalSessions: number;
  completedSessions: number;
  totalLearningTime: number;
  completedTopics: string[];
  lastSessionDate?: string | null;
  averageProgress?: number;
  streakDays?: number;
}

interface LearningSession {
  session_id: string;
  topic_name: string;
  progress_percentage: number;
  status: string;
  created_at: string;
  last_accessed_at: string;
  timeSpent?: number;
}

export default function ProgressDashboard() {
  const { user } = useUser();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const loadProgress = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Load summary
        const summaryData = await getProgressSummary(user.id);
        setSummary(summaryData);

        // Load session history
        const historyData = await getUserLearningHistory(user.id);
        setSessions((historyData.data || []).slice(0, 5));
      } catch (err) {
        console.error('[ProgressDashboard] Error loading progress:', err);
        setError('Failed to load progress data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [user?.id]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    trend, 
    color 
  }: { 
    icon: any; 
    label: string; 
    value: string | number; 
    trend?: string;
    color: string;
  }) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`p-4 rounded-lg border ${color} backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {trend && <p className="text-xs text-green-400 mt-1">↑ {trend}</p>}
        </div>
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-primary-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-400">{error}</p>
          <p className="text-sm text-red-300/80">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="Total Sessions"
          value={summary?.totalSessions || 0}
          trend={summary && summary.totalSessions > 0 ? 'Active' : undefined}
          color="border-blue-500/20 bg-blue-500/5"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={summary?.completedSessions || 0}
          trend={summary && summary.completedSessions > 0 ? 'In Progress' : undefined}
          color="border-green-500/20 bg-green-500/5"
        />
        <StatCard
          icon={Clock}
          label="Learning Time"
          value={summary?.totalLearningTime ? formatTime(summary.totalLearningTime) : '0h'}
          color="border-purple-500/20 bg-purple-500/5"
        />
        <StatCard
          icon={TrendingUp}
          label="Topics Mastered"
          value={summary?.completedTopics?.length || 0}
          trend={summary?.completedTopics?.length ? 'Growing' : undefined}
          color="border-pink-500/20 bg-pink-500/5"
        />
      </div>

      {/* Progress Bar */}
      {summary && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-lg border border-white/10 bg-white/5"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-white">Overall Progress</p>
            <p className="text-sm text-gray-400">
              {summary.completedSessions > 0 
                ? Math.round((summary.completedSessions / summary.totalSessions) * 100)
                : 0}%
            </p>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${summary.completedSessions > 0 ? Math.round((summary.completedSessions / summary.totalSessions) * 100) : 0}%` }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="h-full bg-gradient-to-r from-primary-500 to-pink-500"
            />
          </div>
        </motion.div>
      )}

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Recent Learning Sessions</h3>
          <div className="space-y-2">
            {sessions.map((session, index) => (
              <motion.div
                key={session.session_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-white">{session.topic_name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${session.progress_percentage}%` }}
                        className="h-full bg-primary-500"
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-300 min-w-[2.5rem]">
                      {Math.round(session.progress_percentage)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!summary || summary.totalSessions === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-8 rounded-lg border border-dashed border-white/10 text-center"
        >
          <Target className="w-12 h-12 mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 mb-2">No learning sessions yet</p>
          <p className="text-sm text-gray-500">Start your first session to track your progress</p>
        </motion.div>
      )}
    </div>
  );
}
