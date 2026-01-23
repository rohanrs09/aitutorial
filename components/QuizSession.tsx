'use client';

/**
 * QUIZ SESSION COMPONENT
 * 
 * Interactive quiz interface for users to test their knowledge
 * - Displays questions one at a time
 * - Tracks time spent per question
 * - Provides immediate feedback
 * - Shows progress and score
 * - Displays detailed results at the end
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, XCircle, Clock, Award, TrendingUp, 
  ChevronRight, ChevronLeft, Target, Zap, Brain,
  BarChart3, AlertCircle, Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/Badge';
import type { QuizQuestion, QuizSession as QuizSessionType, QuizResult } from '@/lib/quiz-types';
import { submitAnswer, completeQuizSession } from '@/lib/quiz-service';

interface QuizSessionProps {
  session: QuizSessionType;
  onComplete: (result: QuizResult) => void;
  onExit: () => void;
}

export default function QuizSession({ session, onComplete, onExit }: QuizSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [userAnswers, setUserAnswers] = useState<Map<string, { answer: string | number; correct: boolean }>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = session.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / session.questions.length) * 100;
  const answeredCount = userAnswers.size;
  const correctCount = Array.from(userAnswers.values()).filter(a => a.correct).length;

  // Timer for current question
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - questionStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [questionStartTime]);

  const handleAnswerSelect = (answer: string | number) => {
    if (!showFeedback) {
      setSelectedAnswer(answer);
    }
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) return;

    setIsSubmitting(true);
    const questionTime = Math.floor((Date.now() - questionStartTime) / 1000);

    const result = await submitAnswer(
      session.id,
      currentQuestion.id,
      selectedAnswer,
      questionTime
    );

    setIsCorrect(result.isCorrect);
    setExplanation(result.explanation);
    setShowFeedback(true);
    setIsSubmitting(false);

    // Store answer
    userAnswers.set(currentQuestion.id, {
      answer: selectedAnswer,
      correct: result.isCorrect,
    });
    setUserAnswers(new Map(userAnswers));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setTimeSpent(0);
      setQuestionStartTime(Date.now());
    } else {
      handleFinishQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setTimeSpent(0);
      setQuestionStartTime(Date.now());
    }
  };

  const handleFinishQuiz = async () => {
    const result = await completeQuizSession(session.id);
    if (result) {
      onComplete(result);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'hard': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-atmospheric p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{session.topic} Quiz</h1>
              {session.questions[0]?.id?.startsWith('arrays-') || session.questions[0]?.id?.startsWith('strings-') ? (
                <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs rounded-md">
                  Practice Mode
                </span>
              ) : (
                <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded-md flex items-center gap-1">
                  <Sparkles size={12} />
                  AI Generated
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Question {currentQuestionIndex + 1} of {session.questions.length}
            </p>
          </div>
          <button
            onClick={onExit}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all text-sm"
          >
            Exit Quiz
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <Progress value={progress} className="h-2" />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{answeredCount} answered</span>
          <span>{correctCount} correct</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="bg-gray-900/80 border-orange-500/20">
              <CardContent className="p-6 sm:p-8">
                {/* Question Header */}
                <div className="flex items-center gap-3 mb-6">
                  <Badge className={`${getDifficultyColor(currentQuestion.difficulty)} border`}>
                    {currentQuestion.difficulty}
                  </Badge>
                  {currentQuestion.subtopic && (
                    <Badge variant="outline" className="bg-gray-800/50">
                      {currentQuestion.subtopic}
                    </Badge>
                  )}
                  <div className="ml-auto flex items-center gap-2 text-gray-400">
                    <Clock size={16} />
                    <span className="text-sm">{timeSpent}s</span>
                  </div>
                </div>

                {/* Question Text */}
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-6">
                  {currentQuestion.question}
                </h2>

                {/* Code Snippet if present */}
                {currentQuestion.codeSnippet && (
                  <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
                    <pre className="text-sm text-gray-300 overflow-x-auto">
                      <code>{currentQuestion.codeSnippet}</code>
                    </pre>
                  </div>
                )}

                {/* Answer Options */}
                {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
                  <div className="space-y-3 mb-6">
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={showFeedback}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          selectedAnswer === index
                            ? showFeedback
                              ? isCorrect
                                ? 'bg-green-500/20 border-green-500 text-white'
                                : 'bg-red-500/20 border-red-500 text-white'
                              : 'bg-orange-500/20 border-orange-500 text-white'
                            : showFeedback && index === currentQuestion.correctAnswer
                            ? 'bg-green-500/20 border-green-500 text-white'
                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-orange-500/50 hover:bg-gray-800'
                        } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            selectedAnswer === index
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-700 text-gray-400'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span>{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Feedback */}
                {/* Enhanced Feedback Section */}
                {showFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-6 rounded-xl border-2 overflow-hidden ${
                      isCorrect
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    {/* Feedback Header */}
                    <div className={`p-4 ${isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      <div className="flex items-center gap-3">
                        {isCorrect ? (
                          <div className="w-10 h-10 bg-green-500/30 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-red-500/30 rounded-full flex items-center justify-center">
                            <XCircle className="w-6 h-6 text-red-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className={`font-bold text-lg ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {isCorrect ? '✅ Excellent!' : '❌ Not Quite'}
                          </h3>
                          <p className="text-sm text-gray-300">
                            {isCorrect 
                              ? `+${currentQuestion.points} points • ${timeSpent}s` 
                              : `Correct answer: ${currentQuestion.options?.[typeof currentQuestion.correctAnswer === 'number' ? currentQuestion.correctAnswer : 0]}`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Explanation */}
                    <div className="p-4">
                      <div className="flex items-start gap-2 mb-3">
                        <Brain className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-2">Explanation</h4>
                          <p className="text-sm text-gray-300 leading-relaxed">{explanation}</p>
                        </div>
                      </div>
                      
                      {/* Time feedback */}
                      {timeSpent < 10 && (
                        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-400 text-xs">
                            <AlertCircle size={14} />
                            <span>Quick answer! Make sure to read questions carefully.</span>
                          </div>
                        </div>
                      )}
                      {timeSpent > 120 && (
                        <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <div className="flex items-center gap-2 text-yellow-400 text-xs">
                            <Clock size={14} />
                            <span>Try to improve your speed while maintaining accuracy.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  {!showFeedback ? (
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={selectedAnswer === null || isSubmitting}
                      className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-gray-900 font-bold rounded-xl hover:from-orange-400 hover:to-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-gray-900 font-bold rounded-xl hover:from-orange-400 hover:to-amber-400 transition-all flex items-center justify-center gap-2"
                    >
                      {currentQuestionIndex === session.questions.length - 1 ? (
                        <>
                          <Award size={18} />
                          Finish Quiz
                        </>
                      ) : (
                        <>
                          Next Question
                          <ChevronRight size={18} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
