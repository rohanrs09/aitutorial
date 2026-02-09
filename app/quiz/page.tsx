'use client';

/**
 * QUIZ PAGE
 * 
 * Main quiz interface that handles:
 * - Quiz selection and configuration
 * - Active quiz session
 * - Quiz completion with success screen
 * - Detailed quiz report with analytics
 * - Integration with user's learning history
 */

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useUser } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import QuizStarter from '@/components/QuizStarter';
import QuizSession from '@/components/QuizSession';
import QuizCompletion from '@/components/QuizCompletion';
import QuizReport from '@/components/QuizReport';
import QuizAnalytics from '@/components/dashboard/QuizAnalytics';
import { createQuizSession } from '@/lib/quiz-service';
import type { TopicQuizConfig, QuizSession as QuizSessionType, QuizResult } from '@/lib/quiz-types';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Brain } from 'lucide-react';

type ViewMode = 'starter' | 'session' | 'completion' | 'report';

function QuizContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [viewMode, setViewMode] = useState<ViewMode>('starter');
  const [currentSession, setCurrentSession] = useState<QuizSessionType | null>(null);
  const [lastResult, setLastResult] = useState<QuizResult | null>(null);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);

  const userId = user?.id || null;
  const topicParam = searchParams?.get('topic');

  const [isGenerating, setIsGenerating] = useState(false);
  const [lastConfig, setLastConfig] = useState<TopicQuizConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartQuiz = useCallback(async (config: TopicQuizConfig) => {
    if (!userId) return;

    setIsGenerating(true);
    setLastConfig(config);
    setError(null);
    
    try {
      const session = await createQuizSession(userId, config);
      setCurrentSession(session);
      setViewMode('session');
      setIsGenerating(false); // ✅ Reset loading state
    } catch (error: any) {
      console.error('[Quiz] Error creating session:', error);
      setError(error?.message || 'Failed to generate quiz. Please try again.');
      setIsGenerating(false);
    }
  }, [userId]);

  useEffect(() => {
    if (topicParam && userId && !currentSession) {
      handleStartQuiz({
        topic: topicParam,
        questionCount: 5,
        difficulty: 'mixed',
      });
    }
  }, [topicParam, userId, handleStartQuiz, currentSession]);

  const handleQuizComplete = (result: QuizResult) => {
    setLastResult(result);
    setViewMode('completion');
  };

  const handleViewReport = () => {
    setViewMode('report');
  };

  const handleRetakeQuiz = () => {
    if (lastConfig) {
      handleStartQuiz(lastConfig);
    } else if (lastResult) {
      handleStartQuiz({
        topic: lastResult.topic,
        questionCount: lastResult.totalQuestions,
        difficulty: 'mixed',
      });
    }
  };

  const handleNewTopic = () => {
    setCurrentSession(null);
    setLastResult(null);
    setViewMode('starter');
  };

  const handleExitQuiz = () => {
    setCurrentSession(null);
    setLastResult(null);
    setViewMode('starter');
    setIsGenerating(false);
    // Navigate to dashboard to prevent rerender on same page
    router.push('/dashboard');
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-atmospheric flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-atmospheric flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Sign In Required</h2>
          <p className="text-gray-400 mb-6">Please sign in to access quizzes</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-gray-900 font-bold rounded-xl hover:from-orange-400 hover:to-amber-400 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show loading state when generating quiz
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-atmospheric flex items-center justify-center relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-pulse" />
        
        {/* Floating particles effect */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-orange-500/30 rounded-full"
              initial={{ 
                x: Math.random() * window.innerWidth, 
                y: Math.random() * window.innerHeight 
              }}
              animate={{
                y: [null, Math.random() * window.innerHeight],
                x: [null, Math.random() * window.innerWidth],
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <motion.div 
          className="text-center relative z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated icon */}
          <div className="relative mb-8">
            <motion.div
              className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/50"
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <Brain className="w-12 h-12 text-white" />
            </motion.div>
            
            {/* Pulsing rings */}
            <motion.div
              className="absolute inset-0 border-4 border-orange-500/30 rounded-full"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 border-4 border-orange-500/30 rounded-full"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
            />
          </div>

          {/* Text content */}
          <motion.h2 
            className="text-2xl sm:text-3xl font-bold text-white mb-3"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            Generating Your Quiz
          </motion.h2>
          
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Creating personalized questions based on your learning journey...
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-orange-500 rounded-full"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-atmospheric">
      {/* Header - only show when not in active session, completion, or report */}
      {!['session', 'completion', 'report'].includes(viewMode) && (
        <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Quiz Center</h1>
              <div className="w-20" />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {viewMode === 'starter' && (
        <>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto mb-4"
            >
              <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-400 text-xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">Quiz Generation Failed</h3>
                  <p className="text-sm text-gray-300">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          <QuizStarter
            userId={userId!}
            onStartQuiz={handleStartQuiz}
            onCancel={handleBackToDashboard}
            suggestedTopics={suggestedTopics}
          />
        </>
      )}

      {viewMode === 'session' && currentSession && (
        <QuizSession
          session={currentSession}
          onComplete={handleQuizComplete}
          onExit={handleExitQuiz}
        />
      )}

      {viewMode === 'completion' && lastResult && (
        <QuizCompletion
          result={lastResult}
          onViewReport={handleViewReport}
          onRetakeQuiz={handleRetakeQuiz}
          onNewTopic={handleNewTopic}
          onBackToDashboard={handleBackToDashboard}
        />
      )}

      {viewMode === 'report' && lastResult && currentSession && (
        <QuizReport
          result={lastResult}
          session={currentSession}
          onRetakeQuiz={handleRetakeQuiz}
          onBackToDashboard={handleBackToDashboard}
        />
      )}
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-atmospheric flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}
