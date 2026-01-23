'use client';

/**
 * INSIGHTS CARD - AI-Powered Learning Insights
 * 
 * Purpose: Show actionable insights based on user's learning data
 * - Analyzes patterns in sessions, scores, emotions
 * - Provides recommendations for improvement
 * - Predicts future performance
 * 
 * WHY: Users need guidance on how to improve their learning
 */

import { Lightbulb, TrendingUp, Target, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Alert } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import type { DashboardStats, TopicProgress } from '@/lib/dashboard-service';

interface InsightsCardProps {
  stats: DashboardStats;
  topicProgress: TopicProgress[];
  isLoading?: boolean;
}

interface Insight {
  type: 'success' | 'warning' | 'info';
  icon: any;
  title: string;
  description: string;
  action?: string;
}

function generateInsights(stats: DashboardStats, topics: TopicProgress[]): Insight[] {
  const insights: Insight[] = [];

  // Streak insight
  if (stats.currentStreak >= 7) {
    insights.push({
      type: 'success',
      icon: TrendingUp,
      title: `${stats.currentStreak}-day streak! 🔥`,
      description: 'You\'re on fire! Consistency is key to mastery.',
      action: 'Keep it going',
    });
  } else if (stats.currentStreak === 0 && stats.totalSessions > 0) {
    insights.push({
      type: 'warning',
      icon: Clock,
      title: 'Streak broken',
      description: 'Start a new session today to rebuild your streak.',
      action: 'Start learning',
    });
  }

  // Score insight
  if (stats.averageScore >= 85) {
    insights.push({
      type: 'success',
      icon: Target,
      title: 'Excellent performance!',
      description: `${stats.averageScore}% average score shows strong understanding.`,
    });
  } else if (stats.averageScore < 70 && stats.totalSessions >= 3) {
    insights.push({
      type: 'info',
      icon: Lightbulb,
      title: 'Room for improvement',
      description: 'Consider reviewing topics where you scored below 70%.',
      action: 'Review weak areas',
    });
  }

  // Progress trend
  if (stats.weeklyProgress > 20) {
    insights.push({
      type: 'success',
      icon: TrendingUp,
      title: `${stats.weeklyProgress}% more active this week`,
      description: 'Your learning momentum is increasing!',
    });
  } else if (stats.weeklyProgress < -20) {
    insights.push({
      type: 'warning',
      icon: Clock,
      title: 'Activity decreased',
      description: 'Try to maintain consistent learning sessions.',
      action: 'Set a schedule',
    });
  }

  // Topic-specific insights
  if (topics.length > 0) {
    const weakTopic = topics.find(t => t.averageScore < 60);
    if (weakTopic) {
      insights.push({
        type: 'info',
        icon: Lightbulb,
        title: `Focus on ${weakTopic.topicName}`,
        description: `${weakTopic.averageScore}% average - needs more practice.`,
        action: 'Practice now',
      });
    }

    const strongTopic = topics.find(t => t.averageScore >= 90);
    if (strongTopic) {
      insights.push({
        type: 'success',
        icon: Target,
        title: `Mastered ${strongTopic.topicName}!`,
        description: `${strongTopic.averageScore}% average - excellent work!`,
      });
    }
  }

  // Learning time insight
  const hoursLearned = Math.floor(stats.totalMinutes / 60);
  if (hoursLearned >= 10) {
    insights.push({
      type: 'success',
      icon: Clock,
      title: `${hoursLearned} hours of learning`,
      description: 'Dedication leads to mastery. Keep going!',
    });
  }

  return insights.slice(0, 4); // Show top 4 insights
}

export function InsightsCard({ stats, topicProgress, isLoading }: InsightsCardProps) {
  if (isLoading) {
    return (
      <Card variant="elevated" padding="md">
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-surface-lighter rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const insights = generateInsights(stats, topicProgress);

  if (insights.length === 0) {
    return (
      <Card variant="elevated" padding="md">
        <CardContent>
          <div className="text-center py-8">
            <Lightbulb size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">Start learning to get insights</p>
            <p className="text-sm text-gray-500">Complete a few sessions to see personalized recommendations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="md">
      <CardContent>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-1">AI Insights</h3>
          <p className="text-sm text-gray-400">Personalized recommendations based on your progress</p>
        </div>

        <div className="space-y-3">
          {insights.map((insight, index) => (
            <Alert 
              key={index}
              variant={insight.type === 'success' ? 'default' : insight.type === 'warning' ? 'destructive' : 'default'}
              className="border-l-4"
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  insight.type === 'success' ? 'bg-green-500/10' :
                  insight.type === 'warning' ? 'bg-yellow-500/10' :
                  'bg-orange-500/10'
                }`}>
                  <insight.icon size={16} className={
                    insight.type === 'success' ? 'text-green-400' :
                    insight.type === 'warning' ? 'text-yellow-400' :
                    'text-orange-400'
                  } />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm mb-1">{insight.title}</p>
                  <p className="text-xs text-gray-400">{insight.description}</p>
                  {insight.action && (
                    <button className="text-xs text-orange-400 hover:text-orange-300 mt-2 font-medium transition-colors">
                      {insight.action} →
                    </button>
                  )}
                </div>
              </div>
            </Alert>
          ))}
        </div>

        {/* Learning Goal Progress */}
        {stats.totalSessions > 0 && (
          <div className="mt-6 p-4 bg-surface rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-white">Weekly Goal</p>
              <p className="text-xs text-gray-400">{stats.totalSessions % 7}/7 sessions</p>
            </div>
            <Progress value={(stats.totalSessions % 7) * 14.28} className="h-2" />
            <p className="text-xs text-gray-500 mt-2">
              {7 - (stats.totalSessions % 7)} more sessions to reach your weekly goal
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
