'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Brain, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Star,
  Zap,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ConceptMastery {
  id: string;
  name: string;
  masteryLevel: number; // 0-100
  timesReviewed: number;
  lastReviewed: Date;
  status: 'new' | 'learning' | 'reviewing' | 'mastered';
}

interface SessionStats {
  questionsAsked: number;
  correctAnswers: number;
  slidesViewed: number;
  timeSpent: number; // in seconds
  emotionHistory: { emotion: string; timestamp: Date }[];
  conceptsCovered: string[];
}

interface LearningProgressTrackerProps {
  concepts: ConceptMastery[];
  sessionStats: SessionStats;
  currentTopic: string;
  onConceptClick?: (conceptId: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const masteryColors = {
  new: 'bg-gray-100 text-gray-600',
  learning: 'bg-orange-100 text-orange-600',
  reviewing: 'bg-yellow-100 text-yellow-600',
  mastered: 'bg-green-100 text-green-600'
};

const masteryIcons = {
  new: Brain,
  learning: Target,
  reviewing: TrendingUp,
  mastered: Trophy
};

export default function LearningProgressTracker({
  concepts,
  sessionStats,
  currentTopic,
  onConceptClick,
  isExpanded = false,
  onToggleExpand
}: LearningProgressTrackerProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    questionsAsked: 0,
    correctAnswers: 0,
    slidesViewed: 0
  });

  // Animate stats when they change
  useEffect(() => {
    const duration = 500;
    const steps = 20;
    const interval = duration / steps;

    const startValues = { ...animatedStats };
    const targetValues = {
      questionsAsked: sessionStats.questionsAsked,
      correctAnswers: sessionStats.correctAnswers,
      slidesViewed: sessionStats.slidesViewed
    };

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      
      setAnimatedStats({
        questionsAsked: Math.round(startValues.questionsAsked + (targetValues.questionsAsked - startValues.questionsAsked) * progress),
        correctAnswers: Math.round(startValues.correctAnswers + (targetValues.correctAnswers - startValues.correctAnswers) * progress),
        slidesViewed: Math.round(startValues.slidesViewed + (targetValues.slidesViewed - startValues.slidesViewed) * progress)
      });

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [sessionStats.questionsAsked, sessionStats.correctAnswers, sessionStats.slidesViewed]);

  // Calculate overall progress
  const overallMastery = concepts.length > 0
    ? Math.round(concepts.reduce((acc, c) => acc + c.masteryLevel, 0) / concepts.length)
    : 0;

  const masteredCount = concepts.filter(c => c.status === 'mastered').length;
  const learningCount = concepts.filter(c => c.status === 'learning').length;
  const accuracy = sessionStats.questionsAsked > 0
    ? Math.round((sessionStats.correctAnswers / sessionStats.questionsAsked) * 100)
    : 0;

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current streak
  const getStreak = () => {
    let streak = 0;
    const emotions = sessionStats.emotionHistory.slice().reverse();
    for (const e of emotions) {
      if (e.emotion === 'engaged' || e.emotion === 'happy' || e.emotion === 'confident') {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = getStreak();

  return (
    <div className="bg-[#2a2a2a] rounded-xl overflow-hidden">
      {/* Header with toggle */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <Trophy size={20} className="text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-white font-semibold">Learning Progress</h3>
            <p className="text-xs text-gray-400">{currentTopic}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-2xl font-bold text-white">{overallMastery}%</span>
            <p className="text-xs text-gray-400">Mastery</p>
          </div>
          {isExpanded ? (
            <ChevronUp size={20} className="text-gray-400" />
          ) : (
            <ChevronDown size={20} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4">
              {/* Quick stats row */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-[#3a3a3a] rounded-lg p-3 text-center">
                  <Target size={18} className="mx-auto text-purple-400 mb-1" />
                  <p className="text-lg font-bold text-white">{animatedStats.questionsAsked}</p>
                  <p className="text-xs text-gray-400">Questions</p>
                </div>
                <div className="bg-[#3a3a3a] rounded-lg p-3 text-center">
                  <CheckCircle size={18} className="mx-auto text-green-400 mb-1" />
                  <p className="text-lg font-bold text-white">{accuracy}%</p>
                  <p className="text-xs text-gray-400">Accuracy</p>
                </div>
                <div className="bg-[#3a3a3a] rounded-lg p-3 text-center">
                  <Clock size={18} className="mx-auto text-orange-400 mb-1" />
                  <p className="text-lg font-bold text-white">{formatTime(sessionStats.timeSpent)}</p>
                  <p className="text-xs text-gray-400">Time</p>
                </div>
                <div className="bg-[#3a3a3a] rounded-lg p-3 text-center">
                  <Zap size={18} className="mx-auto text-yellow-400 mb-1" />
                  <p className="text-lg font-bold text-white">{streak}</p>
                  <p className="text-xs text-gray-400">Streak</p>
                </div>
              </div>

              {/* Overall progress bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Overall Mastery</span>
                  <span className="text-white font-medium">{overallMastery}%</span>
                </div>
                <div className="h-3 bg-[#3a3a3a] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${overallMastery}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
              </div>

              {/* Concept mastery breakdown */}
              {concepts.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-2"
                  >
                    <Brain size={16} />
                    Concepts ({masteredCount}/{concepts.length} mastered)
                    {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-2 overflow-hidden"
                      >
                        {concepts.map((concept) => {
                          const Icon = masteryIcons[concept.status];
                          return (
                            <button
                              key={concept.id}
                              onClick={() => onConceptClick?.(concept.id)}
                              className="w-full flex items-center gap-3 p-2 rounded-lg bg-[#3a3a3a] hover:bg-[#4a4a4a] transition-colors"
                            >
                              <div className={`p-1.5 rounded-lg ${masteryColors[concept.status]}`}>
                                <Icon size={14} />
                              </div>
                              <div className="flex-1 text-left">
                                <p className="text-sm text-white">{concept.name}</p>
                                <div className="h-1.5 bg-[#2a2a2a] rounded-full mt-1 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      concept.status === 'mastered' ? 'bg-green-500' :
                                      concept.status === 'reviewing' ? 'bg-yellow-500' :
                                      concept.status === 'learning' ? 'bg-orange-500' : 'bg-gray-500'
                                    }`}
                                    style={{ width: `${concept.masteryLevel}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-xs text-gray-400">{concept.masteryLevel}%</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Achievement badges */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                {streak >= 3 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-full"
                  >
                    <Star size={12} className="text-yellow-400" />
                    <span className="text-xs text-yellow-400">Hot Streak!</span>
                  </motion.div>
                )}
                {accuracy >= 80 && sessionStats.questionsAsked >= 3 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full"
                  >
                    <Award size={12} className="text-green-400" />
                    <span className="text-xs text-green-400">High Accuracy</span>
                  </motion.div>
                )}
                {masteredCount >= 1 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded-full"
                  >
                    <Trophy size={12} className="text-purple-400" />
                    <span className="text-xs text-purple-400">{masteredCount} Mastered</span>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
