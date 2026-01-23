'use client';

/**
 * QUIZ COMPLETION COMPONENT
 * 
 * Success screen displayed immediately after quiz completion
 * - Celebration animation with confetti
 * - Score summary with animated counters
 * - Quick performance metrics
 * - Action buttons for next steps
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Award, Trophy, Target, TrendingUp, Clock, CheckCircle,
  BarChart3, RefreshCw, BookOpen, Home, Sparkles, Zap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { QuizResult } from '@/lib/quiz-types';
import Confetti from 'react-confetti';

interface QuizCompletionProps {
  result: QuizResult;
  onViewReport: () => void;
  onRetakeQuiz: () => void;
  onNewTopic: () => void;
  onBackToDashboard: () => void;
}

export default function QuizCompletion({
  result,
  onViewReport,
  onRetakeQuiz,
  onNewTopic,
  onBackToDashboard,
}: QuizCompletionProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedAccuracy, setAnimatedAccuracy] = useState(0);

  const targetScore = result.questionsAttempted > 0 
    ? Math.round((result.score / result.totalPoints) * 100)
    : 0;

  // Stop confetti after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Animate score counter
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = targetScore / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetScore) {
        setAnimatedScore(targetScore);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [targetScore]);

  // Animate accuracy counter
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = result.accuracy / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= result.accuracy) {
        setAnimatedAccuracy(Math.round(result.accuracy));
        clearInterval(timer);
      } else {
        setAnimatedAccuracy(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [result.accuracy]);

  const getPerformanceLevel = () => {
    if (result.accuracy >= 90) return { level: 'Excellent', color: 'text-green-400', icon: Trophy };
    if (result.accuracy >= 75) return { level: 'Great', color: 'text-blue-400', icon: Award };
    if (result.accuracy >= 60) return { level: 'Good', color: 'text-yellow-400', icon: Target };
    return { level: 'Keep Practicing', color: 'text-orange-400', icon: Zap };
  };

  const performance = getPerformanceLevel();
  const PerformanceIcon = performance.icon;

  const getMotivationalMessage = () => {
    if (result.accuracy >= 90) return "Outstanding work! You've mastered this topic! 🎉";
    if (result.accuracy >= 75) return "Great job! You're making excellent progress! 🚀";
    if (result.accuracy >= 60) return "Good effort! Keep practicing to improve! 💪";
    return "Don't give up! Every attempt makes you stronger! 🌟";
  };

  return (
    <div className="min-h-screen bg-atmospheric flex items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <Confetti
          width={typeof window !== 'undefined' ? window.innerWidth : 300}
          height={typeof window !== 'undefined' ? window.innerHeight : 300}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}

      {/* Background Glow Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-3xl w-full relative z-10"
      >
        <Card className="bg-gray-900/90 backdrop-blur-xl border-orange-500/30 shadow-2xl">
          <CardContent className="p-8 sm:p-12">
            {/* Header Section */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-24 h-24 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/50"
              >
                <PerformanceIcon className="w-12 h-12 text-white" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl sm:text-4xl font-bold text-white mb-3"
              >
                Quiz Completed!
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className={`text-lg sm:text-xl font-semibold ${performance.color} mb-2`}
              >
                {performance.level} Performance
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-400 text-sm sm:text-base"
              >
                {getMotivationalMessage()}
              </motion.p>
            </div>

            {/* Score Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 gap-6 mb-8"
            >
              {/* Overall Score */}
              <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-2xl p-6 border border-orange-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-orange-400" />
                  <span className="text-sm text-gray-400 font-medium">Overall Score</span>
                </div>
                <div className="text-5xl font-bold text-white mb-1">
                  {animatedScore}%
                </div>
                <p className="text-sm text-gray-400">
                  {result.score} / {result.totalPoints} points
                </p>
              </div>

              {/* Accuracy */}
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-6 border border-green-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-400 font-medium">Accuracy</span>
                </div>
                <div className="text-5xl font-bold text-white mb-1">
                  {animatedAccuracy}%
                </div>
                <p className="text-sm text-gray-400">
                  {result.questionsAttempted} / {result.totalQuestions} correct
                </p>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-3 gap-4 mb-8"
            >
              {/* Time Spent */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-400">Time</span>
                </div>
                <p className="text-lg font-bold text-white">
                  {Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}
                </p>
              </div>

              {/* Questions */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-400">Questions</span>
                </div>
                <p className="text-lg font-bold text-white">
                  {result.totalQuestions}
                </p>
              </div>

              {/* Topic */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-gray-400">Topic</span>
                </div>
                <p className="text-sm font-bold text-white truncate">
                  {result.topic}
                </p>
              </div>
            </motion.div>

            {/* Performance Badges */}
            {(result.strengths.length > 0 || result.weaknesses.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mb-8 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-gray-300">Quick Insights</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.strengths.slice(0, 3).map((strength, idx) => (
                    <Badge key={idx} className="bg-green-500/20 text-green-400 border-green-500/30">
                      ✓ {strength}
                    </Badge>
                  ))}
                  {result.weaknesses.slice(0, 2).map((weakness, idx) => (
                    <Badge key={idx} className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                      ⚠ {weakness}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="space-y-3"
            >
              {/* Primary Action */}
              <button
                onClick={onViewReport}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-gray-900 font-bold rounded-xl hover:from-orange-400 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 text-lg"
              >
                <BarChart3 size={20} />
                View Detailed Report
              </button>

              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onRetakeQuiz}
                  className="py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all border border-gray-700 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  Retake Quiz
                </button>
                <button
                  onClick={onNewTopic}
                  className="py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all border border-gray-700 flex items-center justify-center gap-2"
                >
                  <BookOpen size={18} />
                  New Topic
                </button>
              </div>

              {/* Tertiary Action */}
              <button
                onClick={onBackToDashboard}
                className="w-full py-3 bg-transparent hover:bg-gray-800/50 text-gray-400 hover:text-white font-medium rounded-xl transition-all border border-gray-700/50 flex items-center justify-center gap-2"
              >
                <Home size={18} />
                Back to Dashboard
              </button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
