'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Lightbulb, 
  Target, 
  CheckCircle, 
  RefreshCw,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import MermaidDiagram from './MermaidDiagram';

export interface LearningSlide {
  id: string;
  title: string;
  type: 'concept' | 'example' | 'tip' | 'practice' | 'diagram' | 'summary';
  content: string;
  keyPoints?: string[];
  example?: string;
  visualAid?: {
    type: 'mermaid' | 'illustration' | 'flowchart';
    data: string;
  };
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  };
  isSimplified?: boolean;
  simplificationLevel?: 'basic' | 'intermediate' | 'advanced';
  // Audio sync timing
  audioStartTime?: number;
  audioDuration?: number;
  spokenContent?: string;
}

interface LearningSlidePanelProps {
  slides: LearningSlide[];
  currentSlideIndex: number;
  onSlideChange: (index: number) => void;
  onRequestSimplification?: () => void;
  emotion?: string;
  emotionConfidence?: number;
  isLoading?: boolean;
  tutorMessage?: string;
  // Audio sync props
  audioCurrentTime?: number;
  isAudioPlaying?: boolean;
  autoAdvance?: boolean;
}

const slideTypeIcons = {
  concept: BookOpen,
  example: Target,
  tip: Lightbulb,
  practice: CheckCircle,
  diagram: Sparkles,
  summary: BookOpen,
};

const slideTypeColors = {
  concept: 'bg-blue-100 text-blue-700 border-blue-200',
  example: 'bg-green-100 text-green-700 border-green-200',
  tip: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  practice: 'bg-purple-100 text-purple-700 border-purple-200',
  diagram: 'bg-pink-100 text-pink-700 border-pink-200',
  summary: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function LearningSlidePanel({
  slides,
  currentSlideIndex,
  onSlideChange,
  onRequestSimplification,
  emotion = 'neutral',
  emotionConfidence = 0,
  isLoading = false,
  tutorMessage = '',
  audioCurrentTime = 0,
  isAudioPlaying = false,
  autoAdvance = true
}: LearningSlidePanelProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [showSimplifyHint, setShowSimplifyHint] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const currentSlide = slides[currentSlideIndex];

  // Auto-advance slides based on audio timing
  useEffect(() => {
    if (!autoAdvance || !isAudioPlaying || slides.length === 0) return;

    // Find which slide should be shown based on audio time
    const targetSlideIndex = slides.findIndex((slide, index) => {
      const startTime = slide.audioStartTime || 0;
      const duration = slide.audioDuration || 10;
      const endTime = startTime + duration;
      
      // Check if current audio time falls within this slide's range
      return audioCurrentTime >= startTime && audioCurrentTime < endTime;
    });

    if (targetSlideIndex !== -1 && targetSlideIndex !== currentSlideIndex) {
      onSlideChange(targetSlideIndex);
    }

    // Calculate progress within current slide
    if (currentSlide) {
      const startTime = currentSlide.audioStartTime || 0;
      const duration = currentSlide.audioDuration || 10;
      const progress = Math.min(((audioCurrentTime - startTime) / duration) * 100, 100);
      setAudioProgress(Math.max(0, progress));
    }
  }, [audioCurrentTime, isAudioPlaying, slides, currentSlideIndex, autoAdvance, onSlideChange, currentSlide]);

  // Show simplify hint when user is confused
  useEffect(() => {
    if ((emotion === 'confused' || emotion === 'frustrated') && emotionConfidence > 0.5) {
      setShowSimplifyHint(true);
      const timer = setTimeout(() => setShowSimplifyHint(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [emotion, emotionConfidence]);

  // Reset quiz state when slide changes
  useEffect(() => {
    setSelectedAnswer(null);
    setShowQuizResult(false);
  }, [currentSlideIndex]);

  // SYNCHRONIZATION FIX: Stop audio when manually changing slides
  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      onSlideChange(currentSlideIndex - 1);
      // Audio will be stopped in parent component (TutorSession)
    }
  };

  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      onSlideChange(currentSlideIndex + 1);
      // Audio will be stopped in parent component (TutorSession)
    }
  };

  const handleQuizAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowQuizResult(true);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col sm:flex-row items-center justify-center bg-gradient-to-br from-[#f5f0e8] to-[#e8e0d8] rounded-xl sm:rounded-2xl p-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 sm:w-12 sm:h-12 border-3 sm:border-4 border-purple-500 border-t-transparent rounded-full"
        />
        <p className="mt-3 sm:mt-0 sm:ml-4 text-sm sm:text-base text-gray-600">Generating learning content...</p>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#f5f0e8] to-[#e8e0d8] rounded-xl sm:rounded-2xl p-4 sm:p-8 text-center">
        <BookOpen size={36} className="text-purple-400 mb-3 sm:mb-4 sm:w-12 sm:h-12" />
        <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Ready to Learn!</h3>
        <p className="text-sm sm:text-base text-gray-500 max-w-md px-2">
          Ask a question or select a topic to generate interactive learning slides. 
          The slides will be tailored to your current understanding level.
        </p>
        {tutorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/80 rounded-lg sm:rounded-xl max-w-lg"
          >
            <p className="text-sm sm:text-base text-gray-700 italic">&ldquo;{tutorMessage}&rdquo;</p>
          </motion.div>
        )}
      </div>
    );
  }

  const SlideIcon = slideTypeIcons[currentSlide?.type || 'concept'];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#f5f0e8] to-[#e8e0d8] rounded-xl sm:rounded-2xl overflow-hidden">
      {/* Header with slide type and navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 border-b border-gray-200/50">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 border ${slideTypeColors[currentSlide?.type || 'concept']}`}>
            <SlideIcon size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">{currentSlide?.type?.charAt(0).toUpperCase() + currentSlide?.type?.slice(1)}</span>
          </span>
          {currentSlide?.isSimplified && (
            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-orange-100 text-orange-600 text-[10px] sm:text-xs font-medium rounded-full">
              Simplified
            </span>
          )}
          {isAudioPlaying && (
            <span className="hidden sm:flex px-2 py-1 bg-green-100 text-green-600 text-xs font-medium rounded-full items-center gap-1">
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 bg-green-500 rounded-full"
              />
              Synced
            </span>
          )}
        </div>
        
        {/* Simplify button when confused */}
        <AnimatePresence>
          {showSimplifyHint && onRequestSimplification && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={onRequestSimplification}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 min-h-touch bg-orange-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors"
            >
              <RefreshCw size={12} className="sm:w-[14px] sm:h-[14px]" />
              <span className="hidden xs:inline">Simplify for me</span>
              <span className="xs:hidden">Simplify</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Slide content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide?.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Title */}
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
              {currentSlide?.title}
            </h2>

            {/* Main content */}
            <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6">
              {currentSlide?.content}
            </p>

            {/* Key points */}
            {currentSlide?.keyPoints && currentSlide.keyPoints.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h4 className="font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <Target size={16} className="text-purple-500 sm:w-[18px] sm:h-[18px]" />
                  Key Points
                </h4>
                <ul className="space-y-1.5 sm:space-y-2">
                  {currentSlide.keyPoints.map((point, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-2 text-xs sm:text-sm md:text-base text-gray-600"
                    >
                      <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0 sm:w-4 sm:h-4" />
                      {point}
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {/* Example */}
            {currentSlide?.example && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg sm:rounded-xl">
                <h4 className="font-semibold text-green-700 mb-1.5 sm:mb-2 flex items-center gap-2 text-sm sm:text-base">
                  <Lightbulb size={16} className="sm:w-[18px] sm:h-[18px]" />
                  Example
                </h4>
                <p className="text-xs sm:text-sm md:text-base text-green-800">{currentSlide.example}</p>
              </div>
            )}

            {/* Visual Aid / Diagram */}
            {currentSlide?.visualAid && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-x-auto">
                {currentSlide.visualAid.type === 'mermaid' || currentSlide.visualAid.type === 'flowchart' ? (
                  <MermaidDiagram code={currentSlide.visualAid.data} />
                ) : (
                  <div className="text-center text-4xl sm:text-6xl">
                    {currentSlide.visualAid.data}
                  </div>
                )}
              </div>
            )}

            {/* Quiz */}
            {currentSlide?.quiz && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-purple-50 border border-purple-200 rounded-lg sm:rounded-xl">
                <h4 className="font-semibold text-purple-700 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                  Quick Check
                </h4>
                <p className="text-xs sm:text-sm md:text-base text-gray-700 mb-3 sm:mb-4">{currentSlide.quiz.question}</p>
                
                <div className="space-y-2">
                  {currentSlide.quiz.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuizAnswer(index)}
                      disabled={showQuizResult}
                      className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 min-h-touch rounded-lg transition-all flex items-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base
                        ${selectedAnswer === index
                          ? showQuizResult
                            ? index === currentSlide.quiz!.correctAnswer
                              ? 'bg-green-100 border-2 border-green-500'
                              : 'bg-red-100 border-2 border-red-500'
                            : 'bg-purple-100 border-2 border-purple-500'
                          : showQuizResult && index === currentSlide.quiz!.correctAnswer
                            ? 'bg-green-100 border-2 border-green-500'
                            : 'bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100'
                        }
                        ${showQuizResult ? 'cursor-default' : 'cursor-pointer'}
                      `}
                    >
                      <span className="font-semibold text-gray-500">{index + 1}.</span>
                      <span className="flex-1">{option}</span>
                      {showQuizResult && index === currentSlide.quiz!.correctAnswer && (
                        <CheckCircle className="text-green-500" size={16} />
                      )}
                    </button>
                  ))}
                </div>

                {/* Quiz explanation */}
                <AnimatePresence>
                  {showQuizResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-lg ${
                        selectedAnswer === currentSlide.quiz!.correctAnswer
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      <p className="text-xs sm:text-sm">{currentSlide.quiz!.explanation}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer with navigation and audio progress */}
      <div className="flex flex-col border-t border-gray-200/50 bg-white/30">
        {/* Audio sync progress bar */}
        {isAudioPlaying && currentSlide?.audioDuration && (
          <div className="h-1 bg-gray-200">
            <motion.div
              className="h-full bg-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${audioProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
        
        <div className="flex items-center justify-between p-2 sm:p-3 md:p-4">
          <button
            onClick={handlePrevSlide}
            disabled={currentSlideIndex === 0}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 min-h-touch text-xs sm:text-sm text-gray-600 hover:text-gray-900 active:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
            <span className="hidden xs:inline">Previous</span>
          </button>
          
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-[40%] sm:max-w-none">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => onSlideChange(index)}
                className={`flex-shrink-0 w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full transition-all touch-target ${
                  index === currentSlideIndex
                    ? 'w-4 sm:w-6 bg-purple-500'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={handleNextSlide}
            disabled={currentSlideIndex === slides.length - 1}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 min-h-touch text-xs sm:text-sm text-gray-600 hover:text-gray-900 active:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span className="hidden xs:inline">Next</span>
            <ChevronRight size={16} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Confusion assistance popup */}
      <AnimatePresence>
        {(emotion === 'confused' || emotion === 'frustrated') && emotionConfidence > 0.7 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-16 sm:bottom-20 left-2 sm:left-4 right-2 sm:right-4 p-3 sm:p-4 bg-orange-500 text-white rounded-lg sm:rounded-xl shadow-lg"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <AlertCircle size={20} className="flex-shrink-0 sm:w-6 sm:h-6" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">Need help understanding?</p>
                <p className="text-xs sm:text-sm opacity-90 truncate">I can explain this in a simpler way.</p>
              </div>
              {onRequestSimplification && (
                <button
                  onClick={onRequestSimplification}
                  className="flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 min-h-touch bg-white text-orange-600 rounded-lg font-medium text-xs sm:text-sm hover:bg-orange-50 active:bg-orange-100 transition-colors"
                >
                  Simplify
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
