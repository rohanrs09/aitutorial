'use client';

/**
 * QUIZ REPORT COMPONENT
 * 
 * Comprehensive performance analysis and insights
 * - Performance overview with trends
 * - Topic analysis and mastery level
 * - Difficulty breakdown with charts
 * - Time analysis
 * - Strengths and weaknesses identification
 * - Question-by-question review
 * - Personalized recommendations
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Minus, Target, Clock, Brain,
  CheckCircle, XCircle, Award, AlertCircle, BookOpen,
  ChevronDown, ChevronUp, BarChart3, PieChart, Zap,
  Lightbulb, ArrowRight, Home, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/progress';
import type { QuizResult, QuizSession } from '@/lib/quiz-types';

interface QuizReportProps {
  result: QuizResult;
  session: QuizSession;
  onRetakeQuiz: () => void;
  onBackToDashboard: () => void;
}

export default function QuizReport({ result, session, onRetakeQuiz, onBackToDashboard }: QuizReportProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [filterCorrect, setFilterCorrect] = useState<'all' | 'correct' | 'incorrect'>('all');

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const getMasteryLevel = () => {
    if (result.accuracy >= 90) return { level: 'Expert', color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' };
    if (result.accuracy >= 75) return { level: 'Advanced', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' };
    if (result.accuracy >= 60) return { level: 'Intermediate', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' };
    return { level: 'Beginner', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' };
  };

  const mastery = getMasteryLevel();

  const avgTimePerQuestion = result.timeSpent / result.totalQuestions;
  const optimalTime = 60; // 60 seconds per question is optimal

  const getTimePerformance = () => {
    if (avgTimePerQuestion <= optimalTime) return { status: 'Excellent', color: 'text-green-400', icon: CheckCircle };
    if (avgTimePerQuestion <= optimalTime * 1.5) return { status: 'Good', color: 'text-yellow-400', icon: AlertCircle };
    return { status: 'Needs Improvement', color: 'text-orange-400', icon: AlertCircle };
  };

  const timePerf = getTimePerformance();
  const TimeIcon = timePerf.icon;

  const filteredQuestions = session.questions.filter(q => {
    const attempt = session.attempts.find(a => a.questionId === q.id);
    if (!attempt) return filterCorrect === 'all';
    if (filterCorrect === 'correct') return attempt.isCorrect;
    if (filterCorrect === 'incorrect') return !attempt.isCorrect;
    return true;
  });

  const totalDifficultyQuestions = 
    result.difficultyBreakdown.easy.total +
    result.difficultyBreakdown.medium.total +
    result.difficultyBreakdown.hard.total;

  return (
    <div className="min-h-screen bg-atmospheric p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Quiz Performance Report</h1>
            <button
              onClick={onBackToDashboard}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all flex items-center gap-2"
            >
              <Home size={18} />
              Dashboard
            </button>
          </div>
          <p className="text-gray-400">Detailed analysis of your {result.topic} quiz</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gray-900/80 border-orange-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-orange-400" />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">
                        {Math.round((result.score / result.totalPoints) * 100)}%
                      </div>
                      <div className="text-xs text-gray-400">Overall Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">
                        {Math.round(result.accuracy)}%
                      </div>
                      <div className="text-xs text-gray-400">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">
                        {result.questionsAttempted}/{result.totalQuestions}
                      </div>
                      <div className="text-xs text-gray-400">Correct</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">
                        {Math.floor(avgTimePerQuestion)}s
                      </div>
                      <div className="text-xs text-gray-400">Avg Time</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Difficulty Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gray-900/80 border-orange-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-orange-400" />
                    Difficulty Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Easy */}
                  {result.difficultyBreakdown.easy.total > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Easy
                          </Badge>
                          <span className="text-sm text-gray-400">
                            {result.difficultyBreakdown.easy.correct}/{result.difficultyBreakdown.easy.total}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {Math.round((result.difficultyBreakdown.easy.correct / result.difficultyBreakdown.easy.total) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={(result.difficultyBreakdown.easy.correct / result.difficultyBreakdown.easy.total) * 100} 
                        className="h-2 bg-gray-800"
                      />
                    </div>
                  )}

                  {/* Medium */}
                  {result.difficultyBreakdown.medium.total > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            Medium
                          </Badge>
                          <span className="text-sm text-gray-400">
                            {result.difficultyBreakdown.medium.correct}/{result.difficultyBreakdown.medium.total}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {Math.round((result.difficultyBreakdown.medium.correct / result.difficultyBreakdown.medium.total) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={(result.difficultyBreakdown.medium.correct / result.difficultyBreakdown.medium.total) * 100} 
                        className="h-2 bg-gray-800"
                      />
                    </div>
                  )}

                  {/* Hard */}
                  {result.difficultyBreakdown.hard.total > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            Hard
                          </Badge>
                          <span className="text-sm text-gray-400">
                            {result.difficultyBreakdown.hard.correct}/{result.difficultyBreakdown.hard.total}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {Math.round((result.difficultyBreakdown.hard.correct / result.difficultyBreakdown.hard.total) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={(result.difficultyBreakdown.hard.correct / result.difficultyBreakdown.hard.total) * 100} 
                        className="h-2 bg-gray-800"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Question Review */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gray-900/80 border-orange-500/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-orange-400" />
                      Question Review
                    </CardTitle>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFilterCorrect('all')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          filterCorrect === 'all'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setFilterCorrect('correct')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          filterCorrect === 'correct'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        Correct
                      </button>
                      <button
                        onClick={() => setFilterCorrect('incorrect')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          filterCorrect === 'incorrect'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        Incorrect
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredQuestions.map((question, index) => {
                    const attempt = session.attempts.find(a => a.questionId === question.id);
                    const isExpanded = expandedQuestions.has(question.id);
                    const isCorrect = attempt?.isCorrect || false;

                    return (
                      <div
                        key={question.id}
                        className={`border rounded-lg overflow-hidden transition-all ${
                          isCorrect
                            ? 'border-green-500/30 bg-green-500/5'
                            : 'border-red-500/30 bg-red-500/5'
                        }`}
                      >
                        <button
                          onClick={() => toggleQuestion(question.id)}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-800/30 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            {isCorrect ? (
                              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            )}
                            <div className="text-left">
                              <p className="text-sm font-medium text-white">
                                Question {session.questions.indexOf(question) + 1}
                              </p>
                              <p className="text-xs text-gray-400 line-clamp-1">
                                {question.question}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={`${
                              question.difficulty === 'easy' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                              question.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                              'bg-red-500/20 text-red-400 border-red-500/30'
                            }`}>
                              {question.difficulty}
                            </Badge>
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-gray-700/50"
                            >
                              <div className="p-4 space-y-3">
                                <div>
                                  <p className="text-sm font-semibold text-white mb-2">
                                    {question.question}
                                  </p>
                                  {question.codeSnippet && (
                                    <pre className="bg-gray-800 rounded p-3 text-xs text-gray-300 overflow-x-auto mb-3">
                                      <code>{question.codeSnippet}</code>
                                    </pre>
                                  )}
                                </div>

                                {question.options && (
                                  <div className="space-y-2">
                                    {question.options.map((option, idx) => {
                                      const isUserAnswer = attempt?.userAnswer === idx;
                                      const isCorrectAnswer = question.correctAnswer === idx;

                                      return (
                                        <div
                                          key={idx}
                                          className={`p-2 rounded text-sm ${
                                            isCorrectAnswer
                                              ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                                              : isUserAnswer
                                              ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                                              : 'bg-gray-800/50 text-gray-400'
                                          }`}
                                        >
                                          <span className="font-medium mr-2">
                                            {String.fromCharCode(65 + idx)}.
                                          </span>
                                          {option}
                                          {isCorrectAnswer && <span className="ml-2">✓</span>}
                                          {isUserAnswer && !isCorrectAnswer && <span className="ml-2">✗</span>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                <div className="bg-gray-800/50 rounded p-3">
                                  <p className="text-xs font-semibold text-gray-400 mb-1">Explanation:</p>
                                  <p className="text-sm text-gray-300">{question.explanation}</p>
                                </div>

                                {attempt && (
                                  <div className="flex items-center gap-4 text-xs text-gray-400">
                                    <span>Time: {attempt.timeSpent}s</span>
                                    <span>Points: {question.points}</span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Insights */}
          <div className="space-y-6">
            {/* Mastery Level */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className={`bg-gray-900/80 border-orange-500/20`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-orange-400" />
                    Mastery Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`${mastery.bg} ${mastery.border} border rounded-xl p-4 text-center`}>
                    <div className={`text-3xl font-bold ${mastery.color} mb-2`}>
                      {mastery.level}
                    </div>
                    <p className="text-sm text-gray-400">
                      in {result.topic}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Time Performance */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gray-900/80 border-orange-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-400" />
                    Time Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Avg per question</span>
                    <span className="text-lg font-bold text-white">
                      {Math.floor(avgTimePerQuestion)}s
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Total time</span>
                    <span className="text-lg font-bold text-white">
                      {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 p-3 rounded-lg bg-gray-800/50 ${timePerf.color}`}>
                    <TimeIcon size={18} />
                    <span className="text-sm font-medium">{timePerf.status}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-gray-900/80 border-green-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-green-400" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.strengths.map((strength, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-green-400">
                          <CheckCircle size={16} />
                          <span>{strength}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Weaknesses */}
            {result.weaknesses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-gray-900/80 border-orange-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-400" />
                      Areas to Improve
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.weaknesses.map((weakness, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-orange-400">
                          <Target size={16} />
                          <span>{weakness}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-gray-900/80 border-orange-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-orange-400" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.accuracy < 60 && (
                    <div className="flex items-start gap-2 text-sm text-gray-300">
                      <ArrowRight size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                      <span>Review the basics of {result.topic} before retaking</span>
                    </div>
                  )}
                  {result.weaknesses.length > 0 && (
                    <div className="flex items-start gap-2 text-sm text-gray-300">
                      <ArrowRight size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                      <span>Focus on practicing {result.weaknesses[0]}</span>
                    </div>
                  )}
                  {avgTimePerQuestion > optimalTime * 1.5 && (
                    <div className="flex items-start gap-2 text-sm text-gray-300">
                      <ArrowRight size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                      <span>Practice time management - aim for under 60s per question</span>
                    </div>
                  )}
                  {result.accuracy >= 80 && (
                    <div className="flex items-start gap-2 text-sm text-gray-300">
                      <ArrowRight size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                      <span>Try a harder difficulty level to challenge yourself</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <button
                onClick={onRetakeQuiz}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-gray-900 font-bold rounded-xl hover:from-orange-400 hover:to-amber-400 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Retake Quiz
              </button>
              <button
                onClick={onBackToDashboard}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all border border-gray-700 flex items-center justify-center gap-2"
              >
                <Home size={18} />
                Back to Dashboard
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
