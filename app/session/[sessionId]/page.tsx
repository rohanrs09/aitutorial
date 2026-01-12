'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, MessageSquare, Brain, Download, Share2, Calendar } from 'lucide-react';
import Link from 'next/link';
import EmotionTimeline from '@/components/EmotionTimeline';
import { getSessionEmotionHistory } from '@/lib/emotion-analytics';

interface SessionDetail {
  id: string;
  topic: string;
  date: string;
  duration: number;
  score: number | null;
  emotion: string;
  messagesCount: number;
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [emotionEvents, setEmotionEvents] = useState<any[]>([]);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = () => {
    if (typeof window === 'undefined') return;

    try {
      // Load from localStorage
      const historyStr = localStorage.getItem('ai_tutor_session_history');
      if (historyStr) {
        const history = JSON.parse(historyStr);
        const sessionData = history.find((s: any) => s.id === sessionId);
        
        if (sessionData) {
          setSession({
            id: sessionData.id,
            topic: sessionData.topicName || sessionData.topic,
            date: sessionData.date,
            duration: sessionData.duration,
            score: sessionData.score,
            emotion: sessionData.emotion,
            messagesCount: sessionData.messagesCount || 0,
          });

          // Load emotion events
          const events = getSessionEmotionHistory(sessionId);
          setEmotionEvents(events);
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!session) return;

    const exportData = {
      session,
      emotionEvents,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Session Not Found</h2>
          <p className="text-gray-400 mb-6">This session doesn't exist or has been deleted.</p>
          <Link href="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <Download size={20} />
              </button>
              <button
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{session.topic}</h1>
              <div className="flex items-center gap-4 text-gray-400 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{new Date(session.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>{session.duration} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} />
                  <span>{session.messagesCount} messages</span>
                </div>
              </div>
            </div>

            {session.score !== null && (
              <div className="text-center">
                <div className={`text-4xl font-bold ${
                  session.score >= 80 ? 'text-green-400' :
                  session.score >= 60 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {session.score}%
                </div>
                <p className="text-gray-400 text-sm">Score</p>
              </div>
            )}
          </div>

          {/* Session Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{emotionEvents.length}</p>
              <p className="text-gray-400 text-sm">Emotion Checks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white capitalize">{session.emotion}</p>
              <p className="text-gray-400 text-sm">Primary Emotion</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {emotionEvents.length > 0 
                  ? Math.round(emotionEvents.reduce((sum, e) => sum + e.confidence, 0) / emotionEvents.length * 100)
                  : 0}%
              </p>
              <p className="text-gray-400 text-sm">Avg Confidence</p>
            </div>
          </div>
        </motion.div>

        {/* Emotion Timeline */}
        {emotionEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Brain size={20} className="text-primary-400" />
              <h2 className="text-xl font-semibold text-white">Emotion Journey</h2>
            </div>
            <EmotionTimeline sessionId={sessionId} />
          </motion.div>
        )}

        {/* Session Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Session Insights</h2>
          
          <div className="space-y-4">
            {/* Engagement Level */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Engagement Level</span>
                <span className="text-white font-medium">
                  {emotionEvents.filter(e => ['engaged', 'curious', 'excited'].includes(e.emotion)).length > emotionEvents.length / 2
                    ? 'High' : 'Moderate'}
                </span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ 
                    width: `${(emotionEvents.filter(e => ['engaged', 'curious', 'excited'].includes(e.emotion)).length / emotionEvents.length) * 100}%` 
                  }}
                />
              </div>
            </div>

            {/* Confusion Moments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Confusion Moments</span>
                <span className="text-white font-medium">
                  {emotionEvents.filter(e => ['confused', 'frustrated'].includes(e.emotion)).length}
                </span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ 
                    width: `${(emotionEvents.filter(e => ['confused', 'frustrated'].includes(e.emotion)).length / emotionEvents.length) * 100}%` 
                  }}
                />
              </div>
            </div>

            {/* Focus Duration */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Focus Duration</span>
                <span className="text-white font-medium">{session.duration} min</span>
              </div>
              <p className="text-sm text-gray-500">
                {session.duration >= 30 
                  ? 'Excellent focus! Long sessions improve retention.' 
                  : 'Good session length. Consider longer sessions for deeper learning.'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card mt-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Recommendations</h2>
          <div className="space-y-3">
            {emotionEvents.filter(e => ['confused', 'frustrated'].includes(e.emotion)).length > emotionEvents.length / 3 && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <h3 className="text-yellow-400 font-semibold mb-1">Review Fundamentals</h3>
                <p className="text-gray-400 text-sm">
                  You showed confusion during this session. Consider reviewing the basics before moving to advanced topics.
                </p>
              </div>
            )}
            
            {session.duration < 15 && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <h3 className="text-blue-400 font-semibold mb-1">Extend Session Time</h3>
                <p className="text-gray-400 text-sm">
                  Longer sessions (20-30 min) help with better retention and deeper understanding.
                </p>
              </div>
            )}

            {emotionEvents.filter(e => ['engaged', 'curious'].includes(e.emotion)).length > emotionEvents.length * 0.7 && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <h3 className="text-green-400 font-semibold mb-1">Great Engagement!</h3>
                <p className="text-gray-400 text-sm">
                  You were highly engaged throughout. Consider tackling more advanced topics!
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
