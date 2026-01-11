/**
 * ==========================================================
 * AI TUTOR PANEL - COURSE-FIRST DESIGN WITH SLIDES
 * ==========================================================
 * 
 * DESIGN PRINCIPLES:
 * 1. SIDE TUTOR - Never the main instructor
 * 2. CLOSED BY DEFAULT - Opens only when user requests help
 * 3. NEVER INTERRUPTS - No auto-triggers or forced prompts
 * 4. CONTEXT-AWARE - Focuses on current lecture topic
 * 5. RICH EXPLANATIONS - Shows slides, examples, step-by-step
 * 6. MODEL-AGNOSTIC - Uses AI adapter for all AI calls
 * 
 * USER INTERACTION:
 * - Opens when user clicks "Need Help?" button
 * - Asks "Which part don't you understand?"
 * - Shows interactive slides with explanations
 * - Voice playback for explanations
 * - Closes cleanly, resuming course at same position
 * 
 * ==========================================================
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Loader2, Sparkles, Volume2, VolumeX, RefreshCw, 
  Lightbulb, HelpCircle, ChevronLeft, ChevronRight, BookOpen,
  Play, Pause
} from 'lucide-react';
import type { Lecture, CourseSection } from '@/lib/course-data';
import MermaidDiagram from './MermaidDiagram';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface LearningSlide {
  id: string;
  title: string;
  type: 'concept' | 'example' | 'tip' | 'practice' | 'diagram' | 'summary';
  content: string;
  keyPoints?: string[];
  visualAid?: {
    type: 'mermaid' | 'illustration';
    data: string;
  };
}

interface AITutorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  lecture: Lecture | null;
  section: CourseSection | null;
  courseTopic?: string;
}

export default function AITutorPanel({
  isOpen,
  onClose,
  lecture,
  section,
  courseTopic = 'DSA',
}: AITutorPanelProps) {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Slides state (rich learning content)
  const [slides, setSlides] = useState<LearningSlide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showSlides, setShowSlides] = useState(false);
  
  // Audio state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset chat when lecture changes
  useEffect(() => {
    if (lecture) {
      setMessages([]);
      setSlides([]);
      setShowSlides(false);
    }
  }, [lecture?.id]);

  /**
   * Initial welcome message when panel opens
   * Shows greeting and quick action buttons
   */
  useEffect(() => {
    if (isOpen && lecture && messages.length === 0) {
      // Set welcome message
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `👋 Hi! I'm here to help you understand **"${lecture.title}"**.\n\nClick one of the quick questions below, or type your own question about this topic.`
      }]);
    }
  }, [isOpen, lecture, messages.length]);

  // Stop audio when panel closes
  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  /**
   * Send message to AI tutor
   * Uses the /api/tutor endpoint (which uses AI adapter internally)
   */
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Check if lecture is available
    if (!lecture) {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Please select a lecture first to get help with it.',
      }]);
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build lecture context
      const lectureContext = `
Current Lecture: ${lecture.title}
Section: ${section?.title || 'Unknown'}
Course Topic: ${courseTopic}
${lecture.description ? `Description: ${lecture.description}` : ''}
      `.trim();

      console.log('[AITutor] Sending request for:', lecture.title);

      // Call AI tutor API (model-agnostic through adapter)
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          topic: lecture.title,
          topicDescription: lectureContext,
          topicCategory: courseTopic,
          isCustomTopic: false,
          learningGoals: [],
          difficulty: 'intermediate',
          emotion: 'curious',
          emotionConfidence: 0.5,
          history: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content
          })),
        }),
      });

      const data = await response.json();
      console.log('[AITutor] API Response:', response.status, data);

      if (!response.ok) {
        // Handle specific error cases
        if (data.code === 'API_KEY_MISSING') {
          throw new Error('AI service is not configured. Please add your OpenAI API key to use the tutor.');
        }
        throw new Error(data.error || 'Failed to get tutor response');
      }

      if (!data.success) {
        throw new Error(data.error || 'Tutor request failed');
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message || 'I apologize, but I couldn\'t generate a response. Please try again.',
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show slides if available
      if (data.slides && data.slides.length > 0) {
        setSlides(data.slides);
        setCurrentSlideIndex(0);
        setShowSlides(true);
      }

      // Play audio if enabled
      if (audioEnabled && data.message) {
        playAudioResponse(data.message);
      }

    } catch (error: any) {
      console.error('[AITutor] Error:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Sorry, I encountered an error. Please try again.';
      
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorMessage.includes('API key') 
          ? `⚠️ ${errorMessage}\n\nTo fix this:\n1. Get an OpenAI API key from platform.openai.com\n2. Add OPENAI_API_KEY to your .env.local file\n3. Restart the development server`
          : `Sorry, I couldn't help right now. ${errorMessage}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generate and play TTS audio
   * Uses the /api/tts endpoint (model-agnostic)
   */
  const playAudioResponse = async (text: string) => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'alloy' }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.pause();
        }
        
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onplay = () => setIsSpeaking(true);
        audioRef.current.onended = () => setIsSpeaking(false);
        audioRef.current.onerror = () => setIsSpeaking(false);
        audioRef.current.play();
      }
    } catch (error) {
      console.error('TTS error:', error);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  /**
   * Quick questions based on current lecture
   * Helps user start the conversation
   */
  const getQuickQuestions = (): string[] => {
    if (!lecture) return [];
    
    return [
      `Explain ${lecture.title} in simple terms`,
      `What are the key points?`,
      `Give me a real-world example`,
      `What mistakes should I avoid?`,
    ];
  };

  // Clear chat and restart
  const clearChat = () => {
    setMessages([]);
    if (lecture) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `I'm here to help you understand "${lecture.title}".\n\nWhat part would you like me to explain?`
      }]);
    }
  };

  /**
   * Handle close - clean exit back to course
   * Video continues from where it was (no restart)
   */
  const handleClose = () => {
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
            onClick={handleClose}
          />

          {/* Panel - Side tutor (never blocks main content) */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] lg:w-[440px] bg-[#1a1a1f] border-l border-white/5 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between bg-[#16161a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">AI Learning Assistant</h3>
                  <p className="text-xs text-gray-500">Here to help you understand</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Audio toggle */}
                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`p-2 rounded-lg transition-colors ${
                    audioEnabled 
                      ? 'bg-violet-500/15 text-violet-400' 
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                  title={audioEnabled ? 'Disable voice' : 'Enable voice'}
                >
                  {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>

                {/* Clear chat */}
                <button
                  onClick={clearChat}
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  title="Start over"
                >
                  <RefreshCw size={16} />
                </button>

                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Context Banner */}
            {lecture && (
              <div className="px-4 py-2.5 bg-violet-500/5 border-b border-violet-500/10">
                <p className="text-xs text-violet-300 flex items-center gap-2">
                  <BookOpen size={12} />
                  <span className="truncate">{lecture.title}</span>
                </p>
              </div>
            )}

            {/* Content Area - Messages or Slides */}
            <div className="flex-1 overflow-y-auto">
              {showSlides && slides.length > 0 ? (
                /* Slide View */
                <div className="h-full flex flex-col">
                  {/* Slide Content */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    <motion.div
                      key={currentSlideIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      {/* Slide Header */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                          <BookOpen size={16} className="text-primary-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{slides[currentSlideIndex]?.title}</h3>
                          <p className="text-xs text-gray-500">
                            Slide {currentSlideIndex + 1} of {slides.length}
                          </p>
                        </div>
                      </div>

                      {/* Slide Content */}
                      <div className="bg-surface-light rounded-xl p-4 space-y-3">
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {slides[currentSlideIndex]?.content}
                        </p>

                        {/* Key Points */}
                        {slides[currentSlideIndex]?.keyPoints && slides[currentSlideIndex].keyPoints!.length > 0 && (
                          <div className="space-y-2 mt-4">
                            <p className="text-xs font-medium text-gray-400 uppercase">Key Points:</p>
                            <ul className="space-y-2">
                              {slides[currentSlideIndex].keyPoints!.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                  <span className="text-primary-400 mt-1">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Visual Aid / Diagram */}
                        {slides[currentSlideIndex]?.visualAid && (
                          <div className="mt-4 p-3 bg-surface rounded-lg">
                            <MermaidDiagram code={slides[currentSlideIndex].visualAid!.data} />
                          </div>
                        )}
                      </div>

                      {/* Back to Chat Button */}
                      <button
                        onClick={() => setShowSlides(false)}
                        className="w-full py-2 px-4 bg-surface-light hover:bg-surface-lighter text-gray-400 hover:text-white rounded-lg text-sm transition-all"
                      >
                        Back to Chat
                      </button>
                    </motion.div>
                  </div>

                  {/* Slide Navigation */}
                  <div className="p-4 border-t border-white/10 flex items-center justify-between bg-surface-light">
                    <button
                      onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                      disabled={currentSlideIndex === 0}
                      className="p-2 rounded-lg bg-surface hover:bg-surface-lighter text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <div className="flex items-center gap-2">
                      {slides.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlideIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === currentSlideIndex
                              ? 'bg-primary-500 w-6'
                              : 'bg-gray-600 hover:bg-gray-500'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                      disabled={currentSlideIndex === slides.length - 1}
                      className="p-2 rounded-lg bg-surface hover:bg-surface-lighter text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                /* Chat View */
                <div className="p-4 space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[88%] p-3.5 ${
                          message.role === 'user'
                            ? 'bg-violet-600 text-white rounded-2xl rounded-br-md'
                            : 'bg-white/5 text-gray-200 rounded-2xl rounded-bl-md border border-white/5'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {/* Simple markdown-like bold handling */}
                          {message.content.split(/(\*\*.*?\*\*)/).map((part, i) => 
                            part.startsWith('**') && part.endsWith('**') ? (
                              <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
                            ) : part
                          )}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white/5 p-4 rounded-2xl rounded-bl-md border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-2 h-2 bg-violet-400 rounded-full"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-400">Thinking...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Quick Actions Bar */}
            <div className="px-4 py-3 border-t border-white/5 bg-surface/50">
              {messages.length <= 1 && !isLoading ? (
                /* Quick Questions - More prominent */
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Lightbulb size={12} className="text-yellow-500" />
                    Tap a question to get started:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {getQuickQuestions().map((question, index) => (
                      <button
                        key={index}
                        onClick={() => sendMessage(question)}
                        disabled={isLoading}
                        className="text-left text-sm px-4 py-2.5 bg-white/5 hover:bg-primary-500/20 text-gray-300 hover:text-white rounded-xl transition-all border border-white/5 hover:border-primary-500/30 disabled:opacity-50"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : slides.length > 0 && !showSlides ? (
                /* View Slides Button */
                <button
                  onClick={() => setShowSlides(true)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-primary-500/20 to-purple-500/20 hover:from-primary-500/30 hover:to-purple-500/30 text-primary-400 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 border border-primary-500/20"
                >
                  <BookOpen size={16} />
                  View Learning Slides ({slides.length})
                </button>
              ) : null}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-[#16161a]">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your question..."
                  disabled={isLoading || !lecture}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all disabled:opacity-50 text-sm"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim() || !lecture}
                  className="px-4 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>

            {/* Speaking indicator */}
            {isSpeaking && (
              <div className="absolute bottom-24 left-4 right-4">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-violet-500/15 border border-violet-500/20 rounded-xl p-3 flex items-center justify-center gap-3"
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 h-4 bg-violet-400 rounded-full"
                        animate={{ scaleY: [1, 1.8, 1] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-violet-300 font-medium">Speaking...</span>
                </motion.div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
