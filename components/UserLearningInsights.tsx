'use client';

/**
 * USER LEARNING INSIGHTS COMPONENT
 * 
 * Provides personalized learning insights based on user's:
 * - Learning history and patterns
 * - Topic performance
 * - Time spent learning
 * - Quiz scores
 * - Emotion patterns during learning
 * 
 * Premium Feature: Advanced analytics and personalized recommendations
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, TrendingUp, Target, Clock, Zap, Award, 
  BookOpen, BarChart3, Lightbulb, ChevronRight,
  Lock, Sparkles, CheckCircle, AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/progress';

interface LearningInsight {
  id: string;
  type: 'strength' | 'improvement' | 'recommendation' | 'achievement';
  title: string;
  description: string;
  metric?: string;
  action?: string;
  isPremium?: boolean;
}

interface TopicPerformance {
  topic: string;
  score: number;
  sessionsCount: number;
  trend: 'up' | 'down' | 'stable';
  lastPracticed: string;
}

interface UserLearningInsightsProps {
  userId: string | null;
  stats?: {
    totalSessions: number;
    totalMinutes: number;
    averageScore: number;
    currentStreak: number;
  };
  topicProgress?: TopicPerformance[];
  isPremium?: boolean;
  onUpgrade?: () => void;
}

export default function UserLearningInsights({
  userId,
  stats,
  topicProgress = [],
  isPremium = false,
  onUpgrade
}: UserLearningInsightsProps) {
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [activeTab, setActiveTab] = useState<'insights' | 'topics' | 'quiz'>('insights');
  const [showQuiz, setShowQuiz] = useState(false);

  // Generate personalized insights based on user data
  useEffect(() => {
    if (!stats) return;

    const generatedInsights: LearningInsight[] = [];

    // Streak insight
    if (stats.currentStreak >= 7) {
      generatedInsights.push({
        id: 'streak-master',
        type: 'achievement',
        title: `🔥 ${stats.currentStreak}-Day Streak!`,
        description: 'Your consistency is paying off. Keep the momentum going!',
        metric: `${stats.currentStreak} days`,
      });
    } else if (stats.currentStreak >= 3) {
      generatedInsights.push({
        id: 'streak-building',
        type: 'strength',
        title: 'Building Momentum',
        description: `${stats.currentStreak} days in a row! Just ${7 - stats.currentStreak} more for a weekly streak.`,
        metric: `${stats.currentStreak}/7 days`,
      });
    }

    // Performance insight
    if (stats.averageScore >= 85) {
      generatedInsights.push({
        id: 'high-performer',
        type: 'strength',
        title: 'Excellent Performance',
        description: 'Your quiz scores show strong understanding of the material.',
        metric: `${stats.averageScore}% avg`,
      });
    } else if (stats.averageScore < 60 && stats.totalSessions >= 3) {
      generatedInsights.push({
        id: 'needs-practice',
        type: 'improvement',
        title: 'Room for Growth',
        description: 'Consider revisiting topics with lower scores for better retention.',
        metric: `${stats.averageScore}% avg`,
        action: 'Review weak topics',
      });
    }

    // Learning time insight
    const hoursLearned = Math.floor(stats.totalMinutes / 60);
    if (hoursLearned >= 10) {
      generatedInsights.push({
        id: 'dedicated-learner',
        type: 'achievement',
        title: `${hoursLearned}+ Hours Invested`,
        description: 'Your dedication to learning is impressive!',
        metric: `${hoursLearned}h ${stats.totalMinutes % 60}m`,
      });
    }

    // Topic-specific insights
    if (topicProgress.length > 0) {
      const weakTopic = topicProgress.find(t => t.score < 60);
      if (weakTopic) {
        generatedInsights.push({
          id: 'weak-topic',
          type: 'improvement',
          title: `Focus on ${weakTopic.topic}`,
          description: `Your score in this topic is ${weakTopic.score}%. More practice will help.`,
          metric: `${weakTopic.score}%`,
          action: 'Practice now',
        });
      }

      const strongTopic = topicProgress.find(t => t.score >= 90);
      if (strongTopic) {
        generatedInsights.push({
          id: 'strong-topic',
          type: 'strength',
          title: `Mastered ${strongTopic.topic}`,
          description: 'Excellent work! Consider moving to advanced topics.',
          metric: `${strongTopic.score}%`,
        });
      }
    }

    // Recommendation
    generatedInsights.push({
      id: 'daily-goal',
      type: 'recommendation',
      title: 'Daily Learning Goal',
      description: 'Complete at least 1 session per day to maintain your streak.',
      action: 'Start a session',
    });

    // Premium insight teaser
    if (!isPremium) {
      generatedInsights.push({
        id: 'premium-analytics',
        type: 'recommendation',
        title: 'Advanced Analytics',
        description: 'Get detailed learning patterns, emotion insights, and personalized study plans.',
        isPremium: true,
        action: 'Upgrade to Pro',
      });
    }

    setInsights(generatedInsights);
  }, [stats, topicProgress, isPremium]);

  const getInsightIcon = (type: LearningInsight['type']) => {
    switch (type) {
      case 'strength': return <TrendingUp className="text-green-400" size={18} />;
      case 'improvement': return <Target className="text-yellow-400" size={18} />;
      case 'recommendation': return <Lightbulb className="text-orange-400" size={18} />;
      case 'achievement': return <Award className="text-amber-400" size={18} />;
    }
  };

  const getInsightBg = (type: LearningInsight['type']) => {
    switch (type) {
      case 'strength': return 'bg-green-500/10 border-green-500/20';
      case 'improvement': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'recommendation': return 'bg-orange-500/10 border-orange-500/20';
      case 'achievement': return 'bg-amber-500/10 border-amber-500/20';
    }
  };

  if (!userId) {
    return (
      <Card className="bg-gray-900/80 border-orange-500/20">
        <CardContent className="p-6 text-center">
          <Brain className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Sign in to see your personalized learning insights</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/80 border-orange-500/20 overflow-hidden">
      <CardContent className="p-0">
        {/* Header with tabs */}
        <div className="flex items-center border-b border-gray-800">
          {[
            { id: 'insights', label: 'Insights', icon: Brain },
            { id: 'topics', label: 'Topics', icon: BookOpen },
            { id: 'quiz', label: 'Quick Quiz', icon: Zap },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'text-orange-400 border-b-2 border-orange-500 bg-orange-500/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          <AnimatePresence mode="wait">
            {activeTab === 'insights' && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {insights.length === 0 ? (
                  <div className="text-center py-8">
                    <Sparkles className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Complete some sessions to see insights</p>
                  </div>
                ) : (
                  insights.map((insight, index) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 rounded-xl border ${getInsightBg(insight.type)} ${
                        insight.isPremium ? 'relative overflow-hidden' : ''
                      }`}
                    >
                      {insight.isPremium && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                      )}
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white text-sm">{insight.title}</p>
                            {insight.metric && (
                              <Badge variant="outline" className="text-xs bg-gray-800/50">
                                {insight.metric}
                              </Badge>
                            )}
                            {insight.isPremium && (
                              <Lock size={12} className="text-amber-400" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{insight.description}</p>
                          {insight.action && (
                            <button
                              onClick={insight.isPremium ? onUpgrade : undefined}
                              className="text-xs text-orange-400 hover:text-orange-300 mt-2 font-medium flex items-center gap-1"
                            >
                              {insight.action}
                              <ChevronRight size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'topics' && (
              <motion.div
                key="topics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {topicProgress.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Start learning to track topic progress</p>
                  </div>
                ) : (
                  topicProgress.map((topic, index) => (
                    <motion.div
                      key={topic.topic}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white text-sm">{topic.topic}</span>
                        <div className="flex items-center gap-2">
                          {topic.trend === 'up' && <TrendingUp size={14} className="text-green-400" />}
                          {topic.trend === 'down' && <TrendingUp size={14} className="text-red-400 rotate-180" />}
                          <span className={`text-sm font-bold ${
                            topic.score >= 80 ? 'text-green-400' :
                            topic.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {topic.score}%
                          </span>
                        </div>
                      </div>
                      <Progress value={topic.score} className="h-1.5" />
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>{topic.sessionsCount} sessions</span>
                        <span>Last: {topic.lastPracticed}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'quiz' && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center py-6"
              >
                <Zap className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Quick Knowledge Check</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Test your understanding with a quick 5-question quiz based on your recent learning.
                </p>
                <a
                  href={topicProgress.some(t => t.score < 60) 
                    ? `/quiz?topic=${encodeURIComponent(topicProgress.find(t => t.score < 60)?.topic || '')}` 
                    : '/quiz'}
                  className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-gray-900 font-bold rounded-xl hover:from-orange-400 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/30"
                >
                  {topicProgress.some(t => t.score < 60) ? 'Practice Weak Topic' : 'Start Quick Quiz'}
                </a>
                <p className="text-xs text-gray-500 mt-3">
                  Quizzes are generated dynamically based on your learning history
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
