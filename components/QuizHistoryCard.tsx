'use client';

import { motion } from 'framer-motion';
import { Trophy, Calendar, Target, TrendingUp, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface QuizHistoryItem {
  id: string;
  topic: string;
  score: number;
  totalQuestions: number;
  difficulty: string;
  completedAt: Date;
  timeSpent: number;
}

interface QuizHistoryCardProps {
  quiz: QuizHistoryItem;
  onClick?: () => void;
}

export default function QuizHistoryCard({ quiz, onClick }: QuizHistoryCardProps) {
  const percentage = Math.round((quiz.score / quiz.totalQuestions) * 100);
  const isPerfect = percentage === 100;
  const isGood = percentage >= 70;
  const isAverage = percentage >= 50;

  const getGradeColor = () => {
    if (isPerfect) return 'from-green-500 to-emerald-500';
    if (isGood) return 'from-blue-500 to-cyan-500';
    if (isAverage) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getGradeText = () => {
    if (isPerfect) return 'Perfect!';
    if (isGood) return 'Great!';
    if (isAverage) return 'Good';
    return 'Keep Practicing';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gray-200 dark:border-gray-700"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {quiz.topic}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{formatDistanceToNow(quiz.completedAt, { addSuffix: true })}</span>
          </div>
        </div>

        {/* Score Badge */}
        <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${getGradeColor()} text-white font-bold text-center min-w-[80px]`}>
          <div className="text-2xl">{percentage}%</div>
          <div className="text-xs opacity-90">{getGradeText()}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
            <Target className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {quiz.score}/{quiz.totalQuestions}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Correct</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white capitalize">
            {quiz.difficulty}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Difficulty</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {Math.round(quiz.timeSpent / 60)}m
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Duration</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getGradeColor()} rounded-full`}
        />
      </div>

      {/* Perfect Score Badge */}
      {isPerfect && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mt-4 flex items-center justify-center gap-2 text-green-600 dark:text-green-400"
        >
          <Trophy className="w-5 h-5" />
          <span className="font-semibold text-sm">Perfect Score!</span>
        </motion.div>
      )}
    </motion.div>
  );
}
