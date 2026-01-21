'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, BookOpen, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { resumeSession, getUserLearningHistory } from '@/lib/progress-tracking';

interface SessionToResume {
  session_id: string;
  topic_name: string;
  progress_percentage: number;
  last_accessed_at: string;
  created_at: string;
  status: string;
}

export default function ResumeSession() {
  const { user } = useUser();
  const [sessionToResume, setSessionToResume] = useState<SessionToResume | null>(null);
  const [recentSessions, setRecentSessions] = useState<SessionToResume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const loadSessions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Get session to resume
        const resumeResult = await resumeSession(user.id);
        if (resumeResult.session && resumeResult.session.status === 'in_progress') {
          setSessionToResume(resumeResult.session as SessionToResume);
        }

        // Get recent sessions
        const historyResult = await getUserLearningHistory(user.id);
        if (historyResult.error) {
          console.warn(`[Progress] Could not load learning history. This is expected if the database migration hasn't been run. Error: ${historyResult.error}`);
          setRecentSessions([]);
          setIsLoading(false);
          return;
        }
        const sessions = (historyResult.data || [])
          .filter((s: any) => s.status !== 'completed')
          .sort((a: any, b: any) => new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime())
          .slice(0, 3);
        setRecentSessions(sessions);
      } catch (err) {
        console.error('[ResumeSession] Error loading sessions:', err);
        // Don't show error to user, just hide the component
        setSessionToResume(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, [user?.id]);

  if (isLoading || !sessionToResume) {
    return null;
  }

  const timeAgo = (dateString: string) => {
    const now = new Date();
    const then = new Date(dateString);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-8"
      >
        {/* Main Resume Card */}
        {sessionToResume && (
          <Link href="/learn">
            <motion.div
              whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-white cursor-pointer shadow-lg shadow-orange-500/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-5 h-5" />
                    <span className="text-sm font-semibold opacity-90">Continue Learning</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{sessionToResume.topic_name}</h3>
                  <div className="flex items-center gap-4 text-sm opacity-90">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{timeAgo(sessionToResume.last_accessed_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${sessionToResume.progress_percentage}%` }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                          className="h-full bg-white/80"
                        />
                      </div>
                      <span className="text-xs font-semibold">{Math.round(sessionToResume.progress_percentage)}%</span>
                    </div>
                  </div>
                </div>
                <motion.div
                  animate={{ x: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="ml-4 flex-shrink-0"
                >
                  <ChevronRight className="w-8 h-8" />
                </motion.div>
              </div>
            </motion.div>
          </Link>
        )}

        {/* Recent Sessions List */}
        {recentSessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 px-2">
              Recent Sessions
            </h4>
            <div className="space-y-2">
              {recentSessions.map((session, index) => (
                <motion.div
                  key={session.session_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href="/learn">
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-400 cursor-pointer transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">{session.topic_name}</span>
                        </div>
                        {session.status === 'completed' && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{timeAgo(session.last_accessed_at)}</span>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${session.progress_percentage}%` }}
                              className="h-full bg-orange-500"
                            />
                          </div>
                          <span className="text-xs font-semibold">{Math.round(session.progress_percentage)}%</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
