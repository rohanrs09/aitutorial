'use client';

/**
 * RECENT ACTIVITY COMPONENT
 * 
 * Purpose: Display recent learning sessions
 * - List of last 5 sessions
 * - Shows topic, duration, score, emotion
 * - Click to view session details
 * 
 * WHY: Users want to quickly access their recent work
 */

import Link from 'next/link';
import { BookOpen, Clock, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { RecentSession } from '@/lib/dashboard-service';

interface RecentActivityProps {
  sessions: RecentSession[];
  isLoading?: boolean;
}

export function RecentActivity({ sessions, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card variant="elevated" padding="md">
        <CardContent>
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3 p-3 bg-surface rounded-xl">
                  <div className="w-10 h-10 bg-surface-lighter rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-surface-lighter rounded mb-2" />
                    <div className="h-3 bg-surface-lighter rounded w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card variant="elevated" padding="md">
        <CardContent>
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="text-center py-8">
            <BookOpen size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">No sessions yet</p>
            <p className="text-sm text-gray-500">Start learning to see your activity here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getEmotionColor = (emotion: string | null): 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline' => {
    if (!emotion) return 'default';
    const emotionLower = emotion.toLowerCase();
    if (emotionLower === 'engaged' || emotionLower === 'confident') return 'success';
    if (emotionLower === 'curious') return 'primary';
    if (emotionLower === 'confused') return 'warning';
    return 'default';
  };

  return (
    <Card variant="elevated" padding="md">
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          <Link href="/courses" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
            View All
          </Link>
        </div>
        
        <div className="space-y-3">
          {sessions.map((session) => (
            <Link key={session.id} href={`/session/${session.sessionId}`}>
              <div className="flex items-center gap-3 p-3 bg-surface rounded-xl hover:bg-surface-lighter transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                  <BookOpen size={18} className="text-primary-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate group-hover:text-primary-400 transition-colors">
                    {session.topicName}
                  </p>
                  <div className="flex items-center gap-3 text-gray-500 text-xs mt-1">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{new Date(session.startedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{session.duration}min</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {session.emotion && (
                    <Badge variant={getEmotionColor(session.emotion)} size="sm">
                      {session.emotion}
                    </Badge>
                  )}
                  {session.score !== null && (
                    <div className="text-right">
                      <p className={`font-medium text-sm ${getScoreColor(session.score)}`}>
                        {session.score}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
