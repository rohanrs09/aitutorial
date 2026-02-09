'use client';

/**
 * QUIZ ANALYTICS COMPONENT
 * 
 * Displays comprehensive quiz performance analytics
 * - Overall quiz statistics with pie charts
 * - Topic-wise performance
 * - Recent quiz results
 * - Strengths and weaknesses
 * - Performance trends
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Award, TrendingUp, TrendingDown, Target, Clock, 
  Brain, Zap, CheckCircle, XCircle, BarChart3,
  ChevronRight, Sparkles, Trophy, PieChart
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/Badge';
import type { QuizAnalytics as QuizAnalyticsType } from '@/lib/quiz-types';
import { getQuizAnalytics } from '@/lib/quiz-service';

// Custom Pie Chart Component
interface PieChartData {
  label: string;
  value: number;
  color: string;
}

function SimplePieChart({ data, size = 120, showLegend = true }: { data: PieChartData[], size?: number, showLegend?: boolean }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;
  
  let currentAngle = 0;
  const paths = data.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const radius = size / 2 - 5;
    const cx = size / 2;
    const cy = size / 2;
    
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    const pathData = percentage === 1 
      ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius} Z`
      : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    
    return (
      <motion.path
        key={index}
        d={pathData}
        fill={item.color}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1, duration: 0.3 }}
        className="cursor-pointer hover:opacity-80 transition-opacity"
      />
    );
  });

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="drop-shadow-lg">
        {paths}
        <circle cx={size/2} cy={size/2} r={size/4} fill="#1f2937" />
      </svg>
      {showLegend && (
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-gray-400">{item.label}</span>
              <span className="text-white font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Donut Chart for Score Display
function ScoreDonut({ score, label, color }: { score: number, label: string, color: string }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="120" height="120" className="transform -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#374151"
            strokeWidth="10"
          />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">{Math.round(score)}%</span>
        </div>
      </div>
      <span className="text-sm text-gray-400 mt-2">{label}</span>
    </div>
  );
}

interface QuizAnalyticsProps {
  userId: string | null;
  onStartQuiz?: (topic: string) => void;
}

export default function QuizAnalytics({ userId, onStartQuiz }: QuizAnalyticsProps) {
  const [analytics, setAnalytics] = useState<QuizAnalyticsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const loadAnalytics = async () => {
      setIsLoading(true);
      const data = await getQuizAnalytics(userId);
      setAnalytics(data);
      setIsLoading(false);
    };

    loadAnalytics();
  }, [userId]);

  if (!userId) {
    return (
      <Card className="bg-gray-900/80 border-orange-500/20">
        <CardContent className="p-6 text-center">
          <Brain className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Sign in to view your quiz analytics</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-900/80 border-orange-500/20">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-800 rounded-lg" />
            <div className="h-40 bg-gray-800 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics || analytics.totalQuizzesTaken === 0) {
    return (
      <Card className="bg-gray-900/80 border-orange-500/20">
        <CardContent className="p-6 text-center">
          <Sparkles className="w-12 h-12 text-orange-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">Start Your First Quiz!</h3>
          <p className="text-gray-400 mb-4">Test your knowledge and track your progress</p>
          {onStartQuiz && (
            <button
              onClick={() => onStartQuiz('Arrays (1D & 2D)')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-gray-900 font-bold rounded-xl hover:from-orange-400 hover:to-amber-400 transition-all"
            >
              Take a Quiz
            </button>
          )}
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Target className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Calculate performance breakdown for pie chart
  const correctAnswers = Math.round((analytics.averageAccuracy / 100) * analytics.totalQuizzesTaken * 5);
  const incorrectAnswers = Math.round(((100 - analytics.averageAccuracy) / 100) * analytics.totalQuizzesTaken * 5);
  
  const performanceData: PieChartData[] = [
    { label: 'Correct', value: correctAnswers || 1, color: '#22c55e' },
    { label: 'Incorrect', value: incorrectAnswers || 0, color: '#ef4444' },
  ];

  // Topic distribution for pie chart
  const topicData: PieChartData[] = analytics.topicPerformance.slice(0, 5).map((topic, index) => ({
    label: topic.topic.length > 15 ? topic.topic.substring(0, 15) + '...' : topic.topic,
    value: topic.quizzesTaken,
    color: ['#f97316', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'][index] || '#6b7280',
  }));

  // Calculate insights
  const improvementRate = analytics.recentQuizzes.length >= 2 
    ? analytics.recentQuizzes[0].accuracy - analytics.recentQuizzes[analytics.recentQuizzes.length - 1].accuracy
    : 0;
  
  const currentStreak = analytics.recentQuizzes.length;
  
  const getPerformanceBadge = () => {
    if (analytics.averageScore >= 90) return { icon: '🏆', text: 'Master', color: 'from-yellow-500 to-orange-500' };
    if (analytics.averageScore >= 80) return { icon: '⭐', text: 'Expert', color: 'from-blue-500 to-cyan-500' };
    if (analytics.averageScore >= 70) return { icon: '🎯', text: 'Proficient', color: 'from-green-500 to-emerald-500' };
    if (analytics.averageScore >= 60) return { icon: '📚', text: 'Learning', color: 'from-purple-500 to-pink-500' };
    return { icon: '🌱', text: 'Beginner', color: 'from-gray-500 to-gray-600' };
  };
  
  const badge = getPerformanceBadge();

  return (
    <div className="space-y-6">
      {/* Achievement Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={`bg-gradient-to-r ${badge.color} border-0`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{badge.icon}</div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{badge.text} Level</h3>
                  <p className="text-white/80">Keep up the great work!</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{Math.round(analytics.averageScore)}%</div>
                <p className="text-white/80 text-sm">Overall Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Current Streak</p>
                <p className="text-2xl font-bold text-white">{currentStreak} 🔥</p>
              </div>
              <Zap className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Improvement</p>
                <p className={`text-2xl font-bold ${improvementRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {improvementRate >= 0 ? '+' : ''}{Math.round(improvementRate)}%
                </p>
              </div>
              {improvementRate >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-400" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-400" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Topics Mastered</p>
                <p className="text-2xl font-bold text-white">{analytics.strongTopics.length}</p>
              </div>
              <Award className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview with Charts */}
      <Card className="bg-gray-900/80 border-orange-500/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-orange-400" />
            Performance Overview
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Score Donut */}
            <div className="flex justify-center">
              <ScoreDonut score={analytics.averageScore} label="Average Score" color="#f97316" />
            </div>
            
            {/* Accuracy Donut */}
            <div className="flex justify-center">
              <ScoreDonut score={analytics.averageAccuracy} label="Accuracy Rate" color="#22c55e" />
            </div>
            
            {/* Performance Pie Chart */}
            <div className="flex justify-center">
              <SimplePieChart data={performanceData} size={120} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20 hover:border-orange-500/40 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-orange-400" />
                <span className="text-xs text-gray-400">Quizzes Taken</span>
              </div>
              <p className="text-3xl font-bold text-white">{analytics.totalQuizzesTaken}</p>
              <p className="text-xs text-orange-400/70 mt-1">Total attempts</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 hover:border-green-500/40 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-400" />
                <span className="text-xs text-gray-400">Avg Score</span>
              </div>
              <p className="text-3xl font-bold text-white">{Math.round(analytics.averageScore)}%</p>
              <p className="text-xs text-green-400/70 mt-1">{analytics.averageScore >= 70 ? 'Great!' : 'Keep practicing'}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:border-blue-500/40 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-gray-400">Accuracy</span>
              </div>
              <p className="text-3xl font-bold text-white">{Math.round(analytics.averageAccuracy)}%</p>
              <p className="text-xs text-blue-400/70 mt-1">{correctAnswers} correct answers</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-500/40 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-xs text-gray-400">Time Spent</span>
              </div>
              <p className="text-3xl font-bold text-white">{formatTime(analytics.totalTimeSpent)}</p>
              <p className="text-xs text-purple-400/70 mt-1">Learning time</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Topic Distribution Chart */}
      {topicData.length > 0 && (
        <Card className="bg-gray-900/80 border-orange-500/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              Quiz Distribution by Topic
            </h3>
            <div className="flex justify-center">
              <SimplePieChart data={topicData} size={160} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topic Performance */}
      <Card className="bg-gray-900/80 border-orange-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              Topic Performance
            </h3>
          </div>

          <div className="space-y-4">
            {analytics.topicPerformance.map((topic, index) => (
              <motion.div
                key={topic.topic}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{topic.topic}</span>
                    {getTrendIcon(topic.trend)}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-gray-700/50 text-xs">
                      {topic.quizzesTaken} {topic.quizzesTaken === 1 ? 'quiz' : 'quizzes'}
                    </Badge>
                    <span className={`text-lg font-bold ${
                      topic.averageScore >= 80 ? 'text-green-400' :
                      topic.averageScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {Math.round(topic.averageScore)}%
                    </span>
                  </div>
                </div>
                <Progress value={topic.averageScore} className="h-2 mb-2" />
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Best: {Math.round(topic.bestScore)}%</span>
                  <span>Last: {new Date(topic.lastAttempt).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Strong Topics
            </h3>
            {analytics.strongTopics.length > 0 ? (
              <div className="space-y-2">
                {analytics.strongTopics.map((topic, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-300">{topic}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Take more quizzes to identify strengths</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-red-400" />
              Needs Practice
            </h3>
            {analytics.weakTopics.length > 0 ? (
              <div className="space-y-2">
                {analytics.weakTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-gray-300">{topic}</span>
                    </div>
                    {onStartQuiz && (
                      <button
                        onClick={() => onStartQuiz(topic)}
                        className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
                      >
                        Practice
                        <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Great job! No weak areas identified</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Quizzes */}
      <Card className="bg-gray-900/80 border-orange-500/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-orange-400" />
            Recent Quizzes
          </h3>

          <div className="space-y-3">
            {analytics.recentQuizzes.map((quiz, index) => (
              <motion.div
                key={quiz.sessionId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white">{quiz.topic}</span>
                  <span className={`text-lg font-bold ${
                    quiz.accuracy >= 80 ? 'text-green-400' :
                    quiz.accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {Math.round(quiz.accuracy)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{quiz.questionsAttempted}/{quiz.totalQuestions} questions</span>
                  <span>{new Date(quiz.completedAt).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
