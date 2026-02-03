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
  Sparkles,
  Copy,
  Check,
  Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ShimmerSlide } from './ui/Shimmer';
// import MermaidDiagram from './MermaidDiagram';

// Code block component with copy functionality
function CodeBlock({ language, children }: { language: string; children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden shadow-lg border border-gray-700">
      {/* Header with language and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs font-medium text-gray-400 uppercase">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code content */}
      <SyntaxHighlighter
        style={oneDark as any}
        language={language}
        PreTag="div"
        className="!text-xs sm:!text-sm !m-0"
        customStyle={{
          padding: '1rem 1.5rem',
          margin: 0,
          fontSize: 'inherit',
          lineHeight: '1.6',
          background: '#1e1e1e'
        }}
        showLineNumbers={true}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}

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
  concept: 'bg-orange-100 text-orange-700 border-orange-200',
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

  // DISABLED: Auto-advance slides - slides should only change manually
  // This prevents slides from moving while voice is still speaking
  // Users must manually click Next/Previous or use navigation dots
  useEffect(() => {
    // Only calculate progress within current slide, do NOT auto-advance
    if (currentSlide && isAudioPlaying) {
      const startTime = currentSlide.audioStartTime || 0;
      const duration = currentSlide.audioDuration || 10;
      const progress = Math.min(((audioCurrentTime - startTime) / duration) * 100, 100);
      setAudioProgress(Math.max(0, progress));
    }
  }, [audioCurrentTime, isAudioPlaying, currentSlide]);

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
  const handlePrevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      console.log('[Slides] Previous button clicked, moving to:', currentSlideIndex - 1);
      onSlideChange(currentSlideIndex - 1);
      setSelectedAnswer(null);
      setShowQuizResult(false);
    }
  }, [currentSlideIndex, onSlideChange]);

  const handleNextSlide = useCallback(() => {
    if (currentSlideIndex < slides.length - 1) {
      console.log('[Slides] Next button clicked, moving to:', currentSlideIndex + 1);
      onSlideChange(currentSlideIndex + 1);
      setSelectedAnswer(null);
      setShowQuizResult(false);
    }
  }, [currentSlideIndex, slides.length, onSlideChange]);

  const handleQuizAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowQuizResult(true);
  };

  if (isLoading) {
    return (
      <div className="h-full bg-gradient-to-br from-[#f5f0e8] to-[#e8e0d8] rounded-xl sm:rounded-2xl p-4 sm:p-6">
        {/* Loading header */}
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-5 h-5 text-orange-500" />
          </motion.div>
          <p className="text-sm font-medium text-gray-600">Generating learning content...</p>
        </div>
        {/* Shimmer loading UI */}
        <ShimmerSlide />
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
            className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/80 rounded-lg sm:rounded-xl prose prose-sm"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {tutorMessage}
            </ReactMarkdown>
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
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide?.id}
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Title with audio progress */}
            <div className="mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2">
                {currentSlide?.title}
              </h2>
              
              {/* Audio progress indicator */}
              {isAudioPlaying && currentSlide?.audioStartTime && currentSlide?.audioDuration && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((audioCurrentTime - (currentSlide.audioStartTime || 0)) / (currentSlide.audioDuration || 1)) * 100))}%`
                      }}
                    />
                  </div>
                  <span className="whitespace-nowrap">
                    {Math.floor(audioCurrentTime - (currentSlide.audioStartTime || 0))}s / {Math.floor(currentSlide.audioDuration || 0)}s
                  </span>
                </div>
              )}
            </div>

            {/* Main content */}
            <div className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6 prose prose-sm sm:prose-base max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code({node, className, children, ...props}: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';
                    const isInline = !className || className.includes('inline');
                    
                    if (!isInline && language) {
                      return (
                        <CodeBlock language={language}>
                          {String(children).replace(/\n$/, '')}
                        </CodeBlock>
                      );
                    }
                    
                    return (
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono text-purple-700" {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {currentSlide?.content || ''}
              </ReactMarkdown>
            </div>

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
                <div className="text-xs sm:text-sm md:text-base text-green-800 prose prose-sm max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({node, className, children, ...props}: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        const isInline = !className || className.includes('inline');
                        
                        if (!isInline && language) {
                          return (
                            <CodeBlock language={language}>
                              {String(children).replace(/\n$/, '')}
                            </CodeBlock>
                          );
                        }
                        
                        return (
                          <code className="bg-green-100 px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono text-green-800" {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {currentSlide.example}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Visual Aid / Diagram */}
            {/* {currentSlide?.visualAid && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-x-auto">
                {currentSlide.visualAid.type === 'mermaid' || currentSlide.visualAid.type === 'flowchart' ? (
                  <MermaidDiagram code={currentSlide.visualAid.data} />
                ) : (
                  <div className="text-center text-4xl sm:text-6xl">
                    {currentSlide.visualAid.data}
                  </div>
                )}
              </div>
            )} */}

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
        {/* Audio progress indicator (visual only, does NOT auto-advance) */}
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
