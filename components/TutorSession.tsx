'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Square, Subtitles, FileText, Settings, Send, Mic, X, HelpCircle, RefreshCw, Sparkles, Pause, Play, Download, Video, VideoOff, LogOut, ArrowLeft, BookOpen, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

// Components
import AnimatedTutorOrb from '@/components/AnimatedTutorOrb';
import SpacebarVoiceInput from '@/components/SpacebarVoiceInput';
import LiveTranscript from '@/components/LiveTranscript';
import EmotionCameraWidget from '@/components/EmotionCameraWidget';
import NotesPanel from '@/components/NotesPanel';
import LearningSlidePanel, { LearningSlide } from '@/components/LearningSlidePanel';
import LearningProgressTracker from '@/components/LearningProgressTracker';

// Utils & Data
import { EmotionType } from '@/lib/utils';
import { createSession, endSession, updateSession, generateSessionId, saveMessage, type SessionMessage } from '@/lib/user-data';
import { useProgressTracking } from '@/lib/useProgressTracking';

interface Note {
  id: string;
  type: 'concept' | 'example' | 'tip' | 'summary';
  content: string;
  timestamp: Date;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Removed: CustomTopic interface - not needed for focused learning

export default function TutorSession() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  
  // Progress tracking hook
  const progressTracking = useProgressTracking(user?.id);
  
  // Session management
  const [sessionId, setSessionId] = useState<string>('');
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  
  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  // Topic and content state - SIMPLIFIED
  // UI state - MINIMAL (only essential) - Course-based only, no topic selection
  const [showNotes, setShowNotes] = useState(false); // Hidden by default, user can enable
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false); // User enables manually
  const [textInput, setTextInput] = useState('');
  const [showQuickPrompts, setShowQuickPrompts] = useState(true); // Show quick learning prompts
  const inputMode = 'voice'; // Always voice, text as fallback
  
  // Learning slides state
  const [learningSlides, setLearningSlides] = useState<LearningSlide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  
  // Guidance and help state
  const [guidanceMessage, setGuidanceMessage] = useState('');
  const [lastSimplificationTime, setLastSimplificationTime] = useState<number>(0);
  
  // Audio sync state
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [sessionStartTime] = useState<number>(Date.now());
  const [showProgressTracker, setShowProgressTracker] = useState(true);
  const [isSessionPaused, setIsSessionPaused] = useState(false);
  
  // Emotion smoothing state
  const [emotionHistory, setEmotionHistory] = useState<{emotion: string; confidence: number; time: number}[]>([]);
  const lastConfusionActionRef = useRef<number>(0);
  
  // Session stats for progress tracking
  const [sessionStats, setSessionStats] = useState({
    questionsAsked: 0,
    correctAnswers: 0,
    slidesViewed: 0,
    timeSpent: 0,
    emotionHistory: [] as { emotion: string; timestamp: Date }[],
    conceptsCovered: [] as string[]
  });
  
  // Concept mastery tracking
  const [conceptMastery, setConceptMastery] = useState<Array<{
    id: string;
    name: string;
    masteryLevel: number;
    timesReviewed: number;
    lastReviewed: Date;
    status: 'new' | 'learning' | 'reviewing' | 'mastered';
  }>>([]);
  
  // Emotion state
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
  const [emotionConfidence, setEmotionConfidence] = useState(0);
  
  // Notes
  const [notes, setNotes] = useState<Note[]>([]);
  
  // Audio
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  
  // TTS CACHE: Prevent duplicate API calls for same text
  const ttsCache = useRef<Map<string, string>>(new Map()); // text hash -> audio URL
  const currentTTSRequest = useRef<string | null>(null); // Track in-flight request

  // Update session time
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionStats(prev => ({
        ...prev,
        timeSpent: Math.floor((Date.now() - sessionStartTime) / 1000)
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionStartTime]);

  // Cleanup cached audio URLs on unmount
  useEffect(() => {
    return () => {
      // Revoke all cached audio URLs to prevent memory leaks
      ttsCache.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      ttsCache.current.clear();
      console.log('[TTS] Cleaned up cached audio URLs');
    };
  }, []);

  // CRITICAL: Stop audio when slide changes (SYNCHRONIZATION FIX)
  useEffect(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
      console.log('[Audio Sync] Stopped audio on slide change');
    }
  }, [currentSlideIndex]);

  // Course context state - stores lecture data from course page
  const [courseContext, setCourseContext] = useState<{
    courseId: string;
    courseTitle?: string;
    lectureId: string;
    lectureTitle: string;
    lectureDescription: string;
    sectionTitle?: string;
    returnPath?: string;
  } | null>(null);

  // State to trigger welcome message speaking
  const [welcomeMessageToSpeak, setWelcomeMessageToSpeak] = useState<string | null>(null);

  // Check for help context from course page - EXTRACT FULL LECTURE DATA
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const helpContextStr = sessionStorage.getItem('helpContext');
      const returnPath = sessionStorage.getItem('returnPath');
      
      if (helpContextStr) {
        try {
          const context = JSON.parse(helpContextStr);
          if (context.source === 'course' && context.lectureTitle) {
            // Store full course context
            setCourseContext({
              courseId: context.courseId,
              courseTitle: context.courseTitle,
              lectureId: context.lectureId,
              lectureTitle: context.lectureTitle,
              lectureDescription: context.lectureDescription || '',
              sectionTitle: context.sectionTitle,
              returnPath: returnPath || `/course/${context.courseId}?lecture=${context.lectureId}`
            });
            
            // Course context is set - no need for topic selection
            
            // Store welcome message to speak later (after speakText is defined)
            const welcomeMsg = `I'm here to help you learn "${context.lectureTitle}"${context.sectionTitle ? ` from ${context.sectionTitle}` : ''}. ${context.lectureDescription ? `This lecture covers: ${context.lectureDescription.substring(0, 100)}. ` : ''}You can ask me to explain it simply, show examples, break it down step-by-step, or ask any question about this topic. What would you like to learn?`;
            setCurrentTranscript(welcomeMsg);
            setWelcomeMessageToSpeak(welcomeMsg);
            setShowQuickPrompts(true); // Show quick prompts for easy learning
            
            // Clear context from storage (but keep in state)
            sessionStorage.removeItem('helpContext');
          }
        } catch (e) {
          console.error('Failed to parse help context:', e);
        }
      }
    }
  }, []); // No dependencies - runs once on mount

  // Initialize session on mount - course-based only
  useEffect(() => {
    if (!isLoaded) return;
    if (sessionId) return;
    const initSession = async () => {
      // Use course context if available, otherwise generic
      const sessionName = courseContext 
        ? `${courseContext.lectureTitle} - ${courseContext.courseTitle || 'Course Help'}`
        : 'AI Learning Session';
      const newSessionId = await createSession(sessionName, user?.id);
      setSessionId(newSessionId);
    };
    initSession();
  }, [isLoaded, courseContext, user?.id, sessionId]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    if (!user?.id || !progressTracking.currentSession || messages.length === 0) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        const progress = Math.min(100, (currentSlideIndex / Math.max(1, learningSlides.length)) * 100);
        await progressTracking.saveCurrentProgress({
          progress_percentage: progress,
          questionsAsked: sessionStats.questionsAsked,
          correctAnswers: sessionStats.correctAnswers,
          slidesViewed: sessionStats.slidesViewed,
          timeSpent: sessionStats.timeSpent,
          conceptsCovered: sessionStats.conceptsCovered,
          lastSlideIndex: currentSlideIndex,
          totalSlides: learningSlides.length,
        });

        // Update content position
        if (learningSlides.length > 0) {
          await progressTracking.updatePosition(currentSlideIndex, learningSlides.length);
        }
      } catch (error) {
        console.error('[TutorSession] Auto-save failed:', error);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [user?.id, progressTracking.currentSession, messages.length, currentSlideIndex, learningSlides.length, sessionStats, progressTracking]);

  // Handle end session - AUTO REDIRECT back to course if came from course
  const handleEndSession = async () => {
    setIsEndingSession(true);
    try {
      // Save final progress
      if (user?.id && progressTracking.currentSession) {
        await progressTracking.saveCurrentProgress({
          progress_percentage: Math.min(100, (currentSlideIndex / Math.max(1, learningSlides.length)) * 100),
          questionsAsked: sessionStats.questionsAsked,
          correctAnswers: sessionStats.correctAnswers,
          slidesViewed: sessionStats.slidesViewed,
          timeSpent: sessionStats.timeSpent,
          conceptsCovered: sessionStats.conceptsCovered,
        });

        // Mark session as completed
        await progressTracking.completeCurrentSession();
      }

      // End session in database with user ID
      if (sessionId) {
        await endSession(sessionId, user?.id);
      }
      
      // AUTO REDIRECT: If came from course, go back to course (PRIORITY)
      if (courseContext?.returnPath) {
        const returnPath = courseContext.returnPath;
        // Clear course context
        setCourseContext(null);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('returnPath');
          sessionStorage.removeItem('helpContext');
        }
        // Redirect to course
        router.push(returnPath);
        return; // Exit early to prevent further execution
      }
      
      // If not from course, go to dashboard or home
      if (user?.id) {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error ending session:', error);
      // Always try to redirect to course if available
      if (courseContext?.returnPath) {
        const returnPath = courseContext.returnPath;
        setCourseContext(null);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('returnPath');
          sessionStorage.removeItem('helpContext');
        }
        router.push(returnPath);
      } else if (user?.id) {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    }
  };

  // Handle go back (with confirmation if session in progress)
  const handleGoBack = () => {
    // PRIORITY: If from course, always show where we're going back to
    const returnDestination = courseContext?.returnPath || '/';
    const isReturningToCourse = !!courseContext;
    
    if (messages.length > 0 || sessionStats.timeSpent > 60) {
      // Show confirmation modal with clear return destination
      setShowEndSessionModal(true);
    } else {
      // Quick return - no confirmation needed
      console.log(`[Navigation] Returning to: ${returnDestination}`);
      router.push(returnDestination);
    }
  };

  // Removed: Screen size tracking - using CSS responsive classes instead

  // Track emotion history
  useEffect(() => {
    if (currentEmotion && currentEmotion !== 'neutral') {
      setSessionStats(prev => ({
        ...prev,
        emotionHistory: [...prev.emotionHistory.slice(-20), { emotion: currentEmotion, timestamp: new Date() }]
      }));
    }
  }, [currentEmotion]);

  // Update concept mastery based on new concepts covered
  const updateConceptMastery = useCallback((newConcepts: string[]) => {
    setConceptMastery(prev => {
      const updated = [...prev];
      
      newConcepts.forEach(conceptName => {
        const existingIndex = updated.findIndex(c => c.name === conceptName);
        
        if (existingIndex >= 0) {
          // Update existing concept
          const concept = updated[existingIndex];
          const newMastery = Math.min(100, concept.masteryLevel + 15);
          const newStatus = newMastery >= 80 ? 'mastered' : 
                           newMastery >= 50 ? 'reviewing' : 'learning';
          
          updated[existingIndex] = {
            ...concept,
            masteryLevel: newMastery,
            timesReviewed: concept.timesReviewed + 1,
            lastReviewed: new Date(),
            status: newStatus
          };
        } else {
          // Add new concept
          updated.push({
            id: `concept-${Date.now()}-${conceptName.replace(/\s+/g, '-').toLowerCase()}`,
            name: conceptName,
            masteryLevel: 25,
            timesReviewed: 1,
            lastReviewed: new Date(),
            status: 'learning'
          });
        }
      });
      
      return updated;
    });
    
    // Also update concepts covered in session stats
    setSessionStats(prev => ({
      ...prev,
      conceptsCovered: [...new Set([...prev.conceptsCovered, ...newConcepts])]
    }));
  }, []);

  // Download notes as text file
  const handleDownloadNotes = useCallback(() => {
    if (notes.length === 0) return;

    const topicName = getCurrentTopicInfo().name;
    const dateStr = new Date().toLocaleDateString();
    
    // Format notes content
    let content = `AI Voice Tutor - Session Notes\n`;
    content += `Topic: ${topicName}\n`;
    content += `Date: ${dateStr}\n`;
    content += `Duration: ${Math.floor(sessionStats.timeSpent / 60)}m ${sessionStats.timeSpent % 60}s\n`;
    content += `\n${'='.repeat(50)}\n\n`;

    // Group notes by type
    const groupedNotes = {
      concept: notes.filter(n => n.type === 'concept'),
      example: notes.filter(n => n.type === 'example'),
      tip: notes.filter(n => n.type === 'tip'),
      summary: notes.filter(n => n.type === 'summary')
    };

    if (groupedNotes.concept.length > 0) {
      content += `KEY CONCEPTS:\n`;
      groupedNotes.concept.forEach((n, i) => {
        content += `  ${i + 1}. ${n.content}\n`;
      });
      content += `\n`;
    }

    if (groupedNotes.example.length > 0) {
      content += `EXAMPLES:\n`;
      groupedNotes.example.forEach((n, i) => {
        content += `  ${i + 1}. ${n.content}\n`;
      });
      content += `\n`;
    }

    if (groupedNotes.tip.length > 0) {
      content += `TIPS & TRICKS:\n`;
      groupedNotes.tip.forEach((n, i) => {
        content += `  ${i + 1}. ${n.content}\n`;
      });
      content += `\n`;
    }

    if (groupedNotes.summary.length > 0) {
      content += `SUMMARIES:\n`;
      groupedNotes.summary.forEach((n, i) => {
        content += `  ${i + 1}. ${n.content}\n`;
      });
      content += `\n`;
    }

    // Add conversation history
    if (messages.length > 0) {
      content += `${'='.repeat(50)}\n`;
      content += `CONVERSATION HISTORY:\n\n`;
      messages.forEach(msg => {
        const role = msg.role === 'user' ? 'You' : 'AI Tutor';
        content += `[${role}]:\n${msg.content}\n\n`;
      });
    }

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${topicName.replace(/\s+/g, '_')}_notes_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [notes, messages, sessionStats.timeSpent]);

  // Email notes handler
  const handleEmailNotes = useCallback(async () => {
    const email = prompt('Enter your email address:');
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      const response = await fetch('/api/email-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          topic: getCurrentTopicInfo().name,
          notes,
          messages
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Notes have been prepared for email. Check server logs for the HTML output.');
      } else {
        alert('Failed to send email: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Email error:', error);
      alert('Failed to send email. Please try downloading instead.');
    }
  }, [notes, messages]);

  // Pause/Resume session controls
  const toggleSessionPause = useCallback(() => {
    if (isSessionPaused) {
      setIsSessionPaused(false);
      if (audioRef.current && audioRef.current.paused && audioUrl) {
        audioRef.current.play();
      }
    } else {
      setIsSessionPaused(true);
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    }
  }, [isSessionPaused, audioUrl]);

  // Request deduplication - prevent duplicate API calls
  const lastRequestRef = useRef<string>('');
  const lastRequestTimeRef = useRef<number>(0);

  // Handle voice transcript
  const handleTranscript = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    
    // OPTIMIZATION: Prevent duplicate requests within 2 seconds
    const now = Date.now();
    if (text === lastRequestRef.current && now - lastRequestTimeRef.current < 2000) {
      console.log('[Optimization] Duplicate request blocked');
      return;
    }
    lastRequestRef.current = text;
    lastRequestTimeRef.current = now;
    
    setIsProcessing(true);
    setIsListening(false);
    setIsGeneratingSlides(true);
    
    // Hide quick prompts after first question
    if (showQuickPrompts) {
      setShowQuickPrompts(false);
    }
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text
    };
    setMessages(prev => [...prev, userMessage]);

    // Save user message to session
    if (sessionId) {
      saveMessage(sessionId, { role: 'user', content: text, emotion: currentEmotion }, user?.id);
    }

    try {
      // COURSE-BASED ONLY: Must have course context
      if (!courseContext) {
        setGuidanceMessage('Please access AI Tutor from a course page. Go to a course and click "Need Help?" to get started.');
        setIsProcessing(false);
        return;
      }
      
      // Use course lecture data - AUTOMATICALLY INJECT LECTURE CONTEXT
      const topicInfo = {
        name: courseContext.lectureTitle,
        description: courseContext.lectureDescription || courseContext.lectureTitle,
        category: courseContext.sectionTitle || courseContext.courseTitle || 'Course Content',
        isCustom: false
      };
      
      // Build rich lecture context for AI
      const lectureContext = `
=== CURRENT LECTURE CONTEXT ===
Course: ${courseContext.courseTitle || 'Current Course'}
Section: ${courseContext.sectionTitle || 'Current Section'}
Lecture Title: ${courseContext.lectureTitle}
${courseContext.lectureDescription ? `Lecture Description: ${courseContext.lectureDescription}` : ''}

IMPORTANT: The student is currently watching/learning from this specific lecture. 
Your responses should be directly related to this lecture content. 
Reference specific concepts from this lecture and help clarify any confusion about this topic.
`;

      // Get tutor response with slides - AUTO-INJECT LECTURE CONTEXT
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          topic: topicInfo.name,
          topicDescription: lectureContext + (topicInfo.description || ''),
          topicCategory: topicInfo.category,
          isCustomTopic: false,
          learningGoals: [],
          difficulty: 'intermediate',
          emotion: currentEmotion,
          emotionConfidence: emotionConfidence,
          history: messages.slice(-5),
          // Pass course context explicitly
          courseContext: courseContext ? {
            courseId: courseContext.courseId,
            lectureTitle: courseContext.lectureTitle,
            lectureDescription: courseContext.lectureDescription
          } : undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message
        };
        setMessages(prev => [...prev, assistantMessage]);
        setCurrentTranscript(data.message);

        // Update learning slides from API response
        if (data.slides && data.slides.length > 0) {
          setLearningSlides(data.slides);
          setCurrentSlideIndex(0);
          
          // Update session stats
          setSessionStats(prev => ({
            ...prev,
            questionsAsked: prev.questionsAsked + 1,
            slidesViewed: prev.slidesViewed + data.slides.length
          }));

          // Extract and track concepts from slides
          const newConcepts = data.slides
            .filter((s: any) => s.type === 'concept' || s.type === 'diagram')
            .map((s: any) => s.title || 'Concept');
          
          if (newConcepts.length > 0) {
            updateConceptMastery(newConcepts);
          }
        }

        // Show guidance message if user needs help
        if (data.guidanceMessage) {
          setGuidanceMessage(data.guidanceMessage);
          setTimeout(() => setGuidanceMessage(''), 8000);
        }

        // Extract and add notes
        if (data.notes && data.notes.length > 0) {
          const newNotes: Note[] = data.notes.map((note: string, i: number) => ({
            id: `note-${Date.now()}-${i}`,
            type: 'concept' as const,
            content: note,
            timestamp: new Date()
          }));
          setNotes(prev => [...prev, ...newNotes]);
        }

        // Diagrams are now included in slides automatically

        // Save assistant message to session
        if (sessionId) {
          saveMessage(sessionId, { role: 'assistant', content: data.message }, user?.id);

          // Update session with message count and emotions
          const updatedMessages = [...messages, userMessage, assistantMessage];
          const emotionsDetected = [
            ...new Set([
              ...(sessionStats.emotionHistory?.map(e => e.emotion) || []),
              currentEmotion,
            ]),
          ];

          updateSession(
            sessionId,
            {
              messages: updatedMessages.map(m => ({
                id: m.id,
                role: m.role,
                content: m.content,
                emotion: m.role === 'user' ? currentEmotion : null,
                timestamp: new Date(),
              })),
              emotionsDetected,
            },
            user?.id
          );
        }

        // Speak the response (auto-detect best TTS provider)
        await speakText(data.message);
      }
      } catch (error: any) {
        console.error('Error processing tutor request:', error);
        
        // Show user-friendly error message
        if (error.message?.includes('rate limit') || error.message?.includes('429')) {
          setGuidanceMessage('Service is busy. Switching to Gemini fallback... Please wait.');
        } else if (error.message?.includes('API key') || error.message?.includes('configured')) {
          setGuidanceMessage('AI service not configured. Please add OPENAI_API_KEY or GEMINI_API_KEY to your environment variables.');
        } else {
          setGuidanceMessage('An error occurred. Please try again.');
        }
        setTimeout(() => setGuidanceMessage(''), 10000);
      } finally {
        // Clear in-flight request tracker
        currentTTSRequest.current = null;
      }
    setIsProcessing(false);
    setIsGeneratingSlides(false);
  };

  // Text-to-speech with auto-play and slide sync
  // CRITICAL: Graceful failure - never block UI if TTS fails
  // CACHE: Only call TTS API once per unique text
  const speakText = async (text: string, useElevenLabs: boolean = false) => {
    // Stop any currently playing audio first (SYNCHRONIZATION FIX)
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Generate cache key (first 100 chars + length for uniqueness)
    const cacheKey = text.substring(0, 100) + text.length;
    
    // GUARD 1: Check if we already have cached audio for this text
    if (ttsCache.current.has(cacheKey)) {
      console.log('[TTS] Using cached audio (no API call)');
      const cachedUrl = ttsCache.current.get(cacheKey)!;
      setAudioUrl(cachedUrl);
      setIsSpeaking(true);
      return;
    }
    
    // GUARD 2: Prevent duplicate in-flight requests
    if (currentTTSRequest.current === cacheKey) {
      console.log('[TTS] Request already in progress, skipping duplicate');
      return;
    }
    
    currentTTSRequest.current = cacheKey;
    console.log('[TTS] Calling API (first time for this text)');
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: text.substring(0, 5000), // Limit text length
          voice: 'alloy',
          useElevenLabs: useElevenLabs
        })
      });

      // GRACEFUL FAILURE: Check for voiceUnavailable flag (from backend)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        
        // Voice is temporarily unavailable (quota/rate limit)
        if (errorData.voiceUnavailable) {
          console.warn('[TTS] Voice temporarily unavailable:', errorData.error);
          setIsSpeaking(false);
          // Show subtle UI message (non-blocking)
          setGuidanceMessage('Voice temporarily unavailable. You can still read the content.');
          setTimeout(() => setGuidanceMessage(''), 5000);
          return; // Continue without audio - slides still render
        }
        
        // Other errors - log but don't block
        console.error('[TTS] Error:', errorData.error);
        setIsSpeaking(false);
        return;
      }

      // Success - we have audio
      const audioBlob = await response.blob();
      
      // Validate audio blob
      if (!audioBlob || audioBlob.size === 0) {
        console.warn('[TTS] Empty audio blob received');
        setIsSpeaking(false);
        return;
      }
      
      // Create object URL from blob
      const url = URL.createObjectURL(audioBlob);
      
      // CACHE: Store audio URL for reuse
      ttsCache.current.set(cacheKey, url);
      console.log('[TTS] Cached audio for reuse');
      
      // Clean up old audio URL (prevent memory leaks)
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      setAudioUrl(url);
      setIsSpeaking(true);

      // Wait for audio element to be ready, then auto-play
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.load();
          
          // Auto-play when ready
          audioRef.current.oncanplaythrough = () => {
            audioRef.current?.play().catch(err => {
              console.log('[TTS] Auto-play prevented (user interaction required):', err);
              // Browser requires user interaction for autoplay - this is normal
              setIsSpeaking(false);
            });
          };
          
          // Handle audio errors gracefully
          audioRef.current.onerror = (e) => {
            console.error('[TTS] Audio playback error:', e);
            setIsSpeaking(false);
            setGuidanceMessage('Audio playback failed. You can still read the response below.');
            setTimeout(() => setGuidanceMessage(''), 8000);
          };
          
          // Reset time tracking when audio starts
          audioRef.current.onplay = () => {
            setAudioCurrentTime(0);
            setIsSpeaking(true);
          };
          
          // Update time tracking during playback
          audioRef.current.ontimeupdate = () => {
            if (audioRef.current) {
              setAudioCurrentTime(audioRef.current.currentTime);
            }
          };
          
          // Clean up when finished
          audioRef.current.onended = () => {
            setIsSpeaking(false);
            setAudioCurrentTime(0);
          };
          
          // Try to play immediately if possible
          audioRef.current.play().catch(() => {
            // Silent fail - browser may require user interaction
          });
        }
      }, 100);
    } catch (error: any) {
      // GRACEFUL FAILURE: Log error silently, don't block UI
      console.error('[TTS] Error:', error.message || error);
      setIsSpeaking(false);
      
      // Show subtle, non-alarming message
      setGuidanceMessage('Voice temporarily unavailable. Content is still available to read.');
      setTimeout(() => setGuidanceMessage(''), 5000);
      
      // Don't throw error - continue without audio
    }
  };

  // Speak welcome message when it's set (AFTER speakText is defined)
  useEffect(() => {
    if (welcomeMessageToSpeak) {
      const msg = welcomeMessageToSpeak;
      setWelcomeMessageToSpeak(null); // Clear after setting
      // Delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        speakText(msg);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [welcomeMessageToSpeak]);

  // Removed: Scenario handling - not needed for focused learning experience

  // Auto-simplify content when confusion is detected - NOW WORKS WITH OR WITHOUT EXISTING SLIDES
  const handleAutoSimplify = useCallback(async (detectedEmotion: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setIsGeneratingSlides(true);
    setGuidanceMessage('');
    const currentTopic = getCurrentTopicInfo();
    
    try {
      // Get context - use last message or current topic
      const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      const contentToExplain = lastAssistantMessage?.content || lastUserMessage?.content || currentTopic.name;

      // Speak acknowledgment
      const ackMessage = detectedEmotion === 'confused'
        ? "I can see you're confused. Let me explain this step by step with visual slides and audio."
        : "I notice you're finding this challenging. Let me break it down in a simpler way with slides.";
      setCurrentTranscript(ackMessage);
      
      // Get topic info - PRIORITY to course context
      let topicInfo;
      let lectureContext = '';
      
      if (courseContext) {
        topicInfo = {
          name: courseContext.lectureTitle,
          description: courseContext.lectureDescription || courseContext.lectureTitle,
          category: courseContext.sectionTitle || 'Course Content',
          isCustom: false
        };
        lectureContext = `
=== CURRENT LECTURE CONTEXT ===
Course: ${courseContext.courseTitle || 'Current Course'}
Lecture: ${courseContext.lectureTitle}
${courseContext.lectureDescription ? `Description: ${courseContext.lectureDescription}` : ''}
The student is confused about THIS SPECIFIC LECTURE. Explain it simply!
`;
      } else {
        // No course context - show error
        setGuidanceMessage('Please access AI Tutor from a course page to use this feature.');
        setIsProcessing(false);
        setIsGeneratingSlides(false);
        return;
      }

      // Generate explanation with slides - AUTO-INJECT LECTURE CONTEXT
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `The student is ${detectedEmotion} and needs a clear, simple explanation with visual slides. Explain: ${contentToExplain.substring(0, 300)}. Make sure to generate detailed slides with diagrams.`,
          topic: topicInfo.name,
          topicDescription: lectureContext + (topicInfo.description || contentToExplain.substring(0, 200)),
          topicCategory: topicInfo.category,
          isCustomTopic: false,
          learningGoals: [],
          difficulty: 'beginner',
          emotion: detectedEmotion,
          emotionConfidence: 0.95,
          history: messages.slice(-3),
          courseContext: courseContext ? {
            courseId: courseContext.courseId,
            lectureTitle: courseContext.lectureTitle,
            lectureDescription: courseContext.lectureDescription
          } : undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message
        };
        setMessages(prev => [...prev, assistantMessage]);
        setCurrentTranscript(data.message);

        // CRITICAL: Set slides and switch to slides view
        if (data.slides && data.slides.length > 0) {
          setLearningSlides(data.slides);
          setCurrentSlideIndex(0);
          // Slides are automatically shown // Switch to slides view
          
          // Update session stats
          setSessionStats(prev => ({
            ...prev,
            slidesViewed: prev.slidesViewed + data.slides.length
          }));
        } else {
          // If no slides returned, create fallback slides
          console.warn('[AutoSimplify] No slides returned, creating fallback');
          const fallbackSlides = [{
            id: `slide-${Date.now()}-0`,
            title: `Understanding ${topicInfo.name}`,
            type: 'concept' as const,
            content: data.message.substring(0, 200) + '...',
            keyPoints: extractKeyPointsFromText(data.message).slice(0, 3),
            isSimplified: true,
            simplificationLevel: 'basic' as const
          }];
          setLearningSlides(fallbackSlides);
          setCurrentSlideIndex(0);
          // Slides are automatically shown
        }

        // Generate and play audio automatically
        await speakText(data.message);
        
        // Auto-play audio when ready
        if (audioRef.current && audioUrl) {
          audioRef.current.play().catch(err => {
            console.error('Auto-play prevented:', err);
          });
        }
      }
    } catch (error) {
      console.error('Auto-simplification error:', error);
      setGuidanceMessage('Sorry, I had trouble generating the explanation. Please try asking a question.');
    } finally {
      setIsProcessing(false);
      setIsGeneratingSlides(false);
    }
  }, [isProcessing, messages, courseContext, speakText, audioUrl]);

  // Helper to extract key points from text
  const extractKeyPointsFromText = useCallback((text: string): string[] => {
    const points: string[] = [];
    const bulletRegex = /^[•\-*]\s+(.+)$/gm;
    const numberedRegex = /^\d+\.\s+(.+)$/gm;
    
    let match;
    while ((match = bulletRegex.exec(text)) !== null) {
      points.push(match[1].trim());
    }
    while ((match = numberedRegex.exec(text)) !== null) {
      points.push(match[1].trim());
    }
    
    if (points.length === 0) {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
      return sentences.slice(0, 3).map(s => s.trim());
    }
    
    return points.slice(0, 5);
  }, []);

  // Handle emotion detection with enhanced smoothing and proactive confusion resolution
  const handleEmotionDetected = useCallback((emotion: string, confidence: number) => {
    const now = Date.now();
    
    // Add to emotion history and calculate smoothed emotion
    setEmotionHistory(prev => {
      const updated = [...prev, { emotion, confidence, time: now }]
        .filter(e => now - e.time < 15000) // Keep last 15 seconds
        .slice(-10); // Keep max 10 entries
      
      // Calculate smoothed emotion from recent history
      const recentEmotions = updated.filter(e => now - e.time < 10000);
      const emotionCounts: Record<string, { count: number; totalConfidence: number }> = {};
      
      recentEmotions.forEach(e => {
        if (!emotionCounts[e.emotion]) {
          emotionCounts[e.emotion] = { count: 0, totalConfidence: 0 };
        }
        emotionCounts[e.emotion].count++;
        emotionCounts[e.emotion].totalConfidence += e.confidence;
      });

      // Find dominant emotion
      let dominantEmotion = emotion;
      let maxScore = 0;
      Object.entries(emotionCounts).forEach(([em, data]) => {
        const score = data.count * (data.totalConfidence / data.count);
        if (score > maxScore) {
          maxScore = score;
          dominantEmotion = em;
        }
      });

      const smoothedConfidence = emotionCounts[dominantEmotion] 
        ? emotionCounts[dominantEmotion].totalConfidence / emotionCounts[dominantEmotion].count 
        : confidence;

      // Update emotion state
      setCurrentEmotion(dominantEmotion);
      setEmotionConfidence(smoothedConfidence);

      // EMOTION-BASED AUTO-HELP: Trigger re-explanation when confused/frustrated
      const timeSinceLastAction = now - lastConfusionActionRef.current;
      const canTakeAction = timeSinceLastAction > 15000; // 15 second cooldown

      console.log('[Emotion] Detection:', {
        emotion: dominantEmotion,
        confidence: smoothedConfidence,
        canTakeAction,
        isProcessing,
        isSessionPaused,
        timeSinceLastAction: Math.floor(timeSinceLastAction / 1000) + 's'
      });

      // High confidence confusion/frustration - AUTO-GENERATE SIMPLIFIED SLIDES
      if ((dominantEmotion === 'confused' || dominantEmotion === 'frustrated') && 
          smoothedConfidence > 0.7 && canTakeAction && !isProcessing && !isSessionPaused) {
        lastConfusionActionRef.current = now;
        const helpMessage = dominantEmotion === 'confused'
          ? "I see you're confused. Generating visual slides with audio explanation..."
          : "This seems challenging. Creating simplified slides with audio...";
        console.log('[Emotion] 🎯 HIGH confidence trigger:', dominantEmotion, smoothedConfidence);
        setGuidanceMessage(helpMessage);
        setTimeout(() => {
          if (!isProcessing && !isSessionPaused) {
            console.log('[Emotion] ✅ Executing auto-simplify for high confidence');
            handleAutoSimplify(dominantEmotion);
          }
        }, 1500);
      } else if ((dominantEmotion === 'confused' || dominantEmotion === 'frustrated') && 
                 smoothedConfidence > 0.5 && canTakeAction && !isProcessing) {
        // Medium confidence - show guidance and auto-generate
        lastConfusionActionRef.current = now;
        console.log('[Emotion] 📊 MEDIUM confidence trigger:', dominantEmotion, smoothedConfidence);
        setGuidanceMessage(
          dominantEmotion === 'confused'
            ? "I can help! Generating visual slides with audio explanation..."
            : "Let me create simplified slides with audio to help you understand."
        );
        setTimeout(() => {
          if (!isProcessing && !isSessionPaused) {
            console.log('[Emotion] ✅ Executing auto-simplify for medium confidence');
            handleAutoSimplify(dominantEmotion);
          }
        }, 3000);
      }

      return updated;
    });
  }, [isProcessing, isSessionPaused, handleAutoSimplify]);

  // Request simplified content
  const handleRequestSimplification = async () => {
    if (isProcessing || learningSlides.length === 0) return;

    setIsGeneratingSlides(true);
    const currentTopic = getCurrentTopicInfo();
    
    try {
      // Get the last message to re-explain
      const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
      const contentToSimplify = lastAssistantMessage?.content || currentTopic.name;

      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Please explain this in a much simpler way. I'm having trouble understanding: ${contentToSimplify.substring(0, 200)}`,
          topic: currentTopic.name,
          emotion: 'confused',
          emotionConfidence: 0.9, // Force high confusion for simplification
          history: messages.slice(-3)
        })
      });

      const data = await response.json();

      if (data.success) {
        // Add simplified message
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message
        };
        setMessages(prev => [...prev, assistantMessage]);
        setCurrentTranscript(data.message);

        // Update with simplified slides
        if (data.slides && data.slides.length > 0) {
          setLearningSlides(data.slides);
          setCurrentSlideIndex(0);
        }

        // Speak simplified response
        await speakText(data.message);
      }
    } catch (error) {
      console.error('Simplification error:', error);
    } finally {
      setIsGeneratingSlides(false);
    }
  };

  // Interrupt tutor
  const interruptTutor = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    setCurrentTranscript('');
  };

  // Removed: Topic change and custom topic handling - simplified for focused learning

  // Handle text input submit
  const handleTextSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    
    handleTranscript(textInput.trim());
    setTextInput('');
  };

  // Get current topic info - SIMPLIFIED
  const getCurrentTopicInfo = () => {
    if (courseContext) {
      return { 
        name: courseContext.lectureTitle, 
        category: courseContext.sectionTitle || courseContext.courseTitle || 'Course' 
      };
    }
    return { name: 'No Course Selected', category: 'Please access from a course page' };
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col safe-area-inset">
      {/* End Session Confirmation Modal */}
      <AnimatePresence>
        {showEndSessionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setShowEndSessionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-surface-light rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-3">End Learning Session?</h3>
              
              {/* Session Stats Summary */}
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{Math.floor(sessionStats.timeSpent / 60)}</p>
                    <p className="text-xs text-gray-400">Minutes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{sessionStats.questionsAsked}</p>
                    <p className="text-xs text-gray-400">Questions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{sessionStats.slidesViewed}</p>
                    <p className="text-xs text-gray-400">Slides Viewed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{sessionStats.conceptsCovered.length}</p>
                    <p className="text-xs text-gray-400">Concepts</p>
                  </div>
                </div>
              </div>

              <p className="text-gray-400 mb-4 text-sm">
                Your progress will be saved automatically.
              </p>
              
              {courseContext && (
                <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-sm text-purple-300">
                    You&apos;ll return to: <strong>{courseContext.lectureTitle}</strong>
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEndSessionModal(false)}
                  className="flex-1 px-4 py-3 bg-surface-lighter text-white rounded-xl hover:bg-surface transition-colors"
                >
                  Continue Learning
                </button>
                <button
                  onClick={handleEndSession}
                  disabled={isEndingSession}
                  className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isEndingSession ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>End Session</>                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Removed: Welcome Modal - not needed for focused learning */}

      {/* Navigation Header - FIXED at top, never shifts */}
      <header className="bg-surface/95 backdrop-blur-lg border-b border-white/5 fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left: Back Button & Logo */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={handleGoBack}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 flex-shrink-0"
                title={courseContext ? 'Back to course' : 'Back to home'}
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Mic size={16} className="text-white" />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-white text-sm sm:text-base">AI Tutor</span>
                  {courseContext && (
                    <p className="text-xs text-purple-400 truncate hidden sm:block">{courseContext.lectureTitle}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Session Stats & Actions */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Timer - Hidden on small screens */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-surface-light rounded-lg">
                <Clock size={14} className="text-gray-400" />
                <span className="text-xs text-gray-400">
                  {Math.floor(sessionStats.timeSpent / 60)}:{String(sessionStats.timeSpent % 60).padStart(2, '0')}
                </span>
              </div>

              {/* Emotion Status - Compact */}
              {currentEmotion && emotionConfidence > 0.3 && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface-light rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    currentEmotion === 'confused' || currentEmotion === 'frustrated' 
                      ? 'bg-orange-400 animate-pulse' 
                      : currentEmotion === 'happy' || currentEmotion === 'engaged'
                      ? 'bg-green-400'
                      : 'bg-blue-400'
                  }`} />
                  <span className="text-xs text-gray-400 capitalize">{currentEmotion}</span>
                </div>
              )}

              {/* End Session Button - Responsive */}
              <button
                onClick={() => setShowEndSessionModal(true)}
                className="px-3 sm:px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all text-xs font-medium border border-red-500/20 hover:border-red-500/30"
                title="End learning session"
              >
                <span className="hidden sm:inline">End Session</span>
                <X size={16} className="sm:hidden" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hidden Audio Element with time tracking */}
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        autoPlay
        onPlay={() => setIsSpeaking(true)}
        onTimeUpdate={(e) => setAudioCurrentTime((e.target as HTMLAudioElement).currentTime)}
        onEnded={() => {
          setIsSpeaking(false);
          setCurrentTranscript('');
          setAudioCurrentTime(0);
        }}
        onPause={() => setIsSpeaking(false)}
        onError={(e) => {
          console.error('[Audio] Playback error:', e);
          setIsSpeaking(false);
          setGuidanceMessage('Audio playback error. Please try again.');
          setTimeout(() => setGuidanceMessage(''), 5000);
        }}
      />

      {/* Main Content Area - Full height below fixed header */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden mt-14 sm:mt-16">
        {/* Notes Sidebar - Hidden on mobile, shown on lg+ */}
        <AnimatePresence>
          {showNotes && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-surface-light/80 backdrop-blur-sm border-r border-white/5 overflow-hidden hidden lg:block flex-shrink-0"
            >
              <NotesPanel
                notes={notes}
                topic={getCurrentTopicInfo().name}
                onDownloadNotes={handleDownloadNotes}
                onEmailNotes={handleEmailNotes}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center - Main Teaching Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Content Card */}
          <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              {/* Main Content Card */}
              <div className="bg-[#f5f0e8] rounded-xl sm:rounded-2xl shadow-2xl min-h-[400px] sm:min-h-[500px] relative p-4 sm:p-6 md:p-8">
                {/* REMOVED: Topic selector and view mode toggle - unnecessary complexity */}

                {/* Tutor Orb - Responsive positioning */}
                <div className="hidden sm:flex absolute top-4 sm:top-6 right-4 sm:right-6 w-28 sm:w-40 h-20 sm:h-28 bg-gray-600 rounded-xl items-center justify-center shadow-lg">
                  <AnimatedTutorOrb
                    isSpeaking={isSpeaking}
                    isListening={isListening}
                    emotion={currentEmotion === 'happy' ? 'happy' : currentEmotion === 'confused' ? 'thinking' : 'neutral'}
                    size="medium"
                  />
                </div>

                {/* Main Content Area - SIMPLIFIED: Only Learning Slides */}
                <div className="mt-4 sm:mt-16 sm:pr-36 md:pr-48 min-h-[300px] sm:min-h-[calc(100%-8rem)]">
                  {learningSlides.length > 0 || isGeneratingSlides ? (
                    <LearningSlidePanel
                      slides={learningSlides}
                      currentSlideIndex={currentSlideIndex}
                      onSlideChange={setCurrentSlideIndex}
                      onRequestSimplification={handleRequestSimplification}
                      emotion={currentEmotion}
                      emotionConfidence={emotionConfidence}
                      isLoading={isGeneratingSlides}
                      tutorMessage={currentTranscript}
                      audioCurrentTime={audioCurrentTime}
                      isAudioPlaying={isSpeaking}
                      autoAdvance={true}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-700 px-4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-lg"
                      >
                        {courseContext ? (
                          <>
                            <h2 className="text-xl sm:text-2xl font-bold mb-4">
                              Learning: {courseContext.lectureTitle}
                            </h2>
                            <p className="text-gray-500 text-sm sm:text-base mb-4">
                              What would you like to learn about this topic? Choose a quick prompt or ask your own question.
                            </p>
                            
                            {/* Quick Learning Prompts */}
                            {showQuickPrompts && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                                {[
                                  { text: "Explain this topic in simple terms", icon: "🎯" },
                                  { text: "Explain with examples", icon: "💡" },
                                  { text: "Show me step-by-step", icon: "📝" },
                                  { text: "What are the key concepts?", icon: "🔑" },
                                  { text: "Give me practice problems", icon: "✏️" },
                                  { text: "Explain like I'm a beginner", icon: "🌱" }
                                ].map((prompt, idx) => (
                                  <motion.button
                                    key={idx}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                      const fullPrompt = `${prompt.text} about ${courseContext.lectureTitle}`;
                                      handleTranscript(fullPrompt);
                                      setShowQuickPrompts(false);
                                    }}
                                    disabled={isProcessing}
                                    className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border border-blue-200 rounded-lg text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{prompt.icon}</span>
                                      <span className="text-sm font-medium text-gray-700">{prompt.text}</span>
                                    </div>
                                  </motion.button>
                                ))}
                              </div>
                            )}
                            
                            {courseContext.lectureDescription && (
                              <div className="p-4 bg-blue-50 rounded-xl mb-4 text-left">
                                <p className="text-sm text-gray-700 font-medium mb-2">About this lecture:</p>
                                <p className="text-sm text-gray-600">{courseContext.lectureDescription}</p>
                              </div>
                            )}
                            
                            {!showQuickPrompts && (
                              <button
                                onClick={() => setShowQuickPrompts(true)}
                                className="text-xs text-blue-600 hover:text-blue-700 underline mb-2"
                              >
                                Show quick learning prompts
                              </button>
                            )}
                            
                            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl">
                              <p className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <Mic size={16} className="text-green-600" />
                                Ready to help you learn!
                              </p>
                              <p className="text-xs text-gray-600">
                                • <strong>Hold Spacebar</strong> or click mic button to speak<br/>
                                • <strong>Type</strong> your question in the input box<br/>
                                • <strong>Click</strong> quick prompts above for instant help
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-red-600">
                              No Course Selected
                            </h2>
                            <p className="text-gray-500 text-sm sm:text-base mb-6">
                              Please access AI Tutor from a course page. Go to a course and click "Need Help?" to get started.
                            </p>
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-left">
                              <p className="text-sm text-gray-700 font-medium mb-2">How to use:</p>
                              <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                                <li>Navigate to a course page</li>
                                <li>Click "Need Help with AI Tutor" button</li>
                                <li>Start asking questions about the lecture</li>
                              </ol>
                            </div>
                          </>
                        )}
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Guidance Message Banner - Enhanced for emotion detection */}
          <AnimatePresence>
            {guidanceMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mx-3 sm:mx-4 mb-2 p-3 sm:p-4 bg-gradient-to-r from-orange-500/90 to-amber-500/90 text-white rounded-xl flex items-center justify-between gap-2 shadow-lg"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                      <HelpCircle size={20} className="text-white" />
                    </motion.div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">{guidanceMessage}</p>
                    {currentEmotion === 'confused' || currentEmotion === 'frustrated' ? (
                      <p className="text-[10px] sm:text-xs text-white/80 mt-1">
                        Detected via camera emotion analysis
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <button
                    onClick={handleRequestSimplification}
                    className="px-2 sm:px-3 py-1.5 bg-white text-orange-600 rounded-lg text-xs sm:text-sm font-medium hover:bg-orange-50 active:scale-95 transition-all min-h-touch flex items-center gap-1"
                  >
                    <RefreshCw size={12} />
                    <span className="hidden sm:inline">Simplify</span>
                  </button>
                  <button
                    onClick={() => setGuidanceMessage('')}
                    className="p-1.5 hover:bg-white/20 rounded min-h-touch min-w-touch flex items-center justify-center"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Emotion-based auto-help notification */}
          {currentEmotion === 'confused' && emotionConfidence > 0.6 && !guidanceMessage && !isProcessing && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mx-3 sm:mx-4 mb-2 p-3 bg-purple-500/20 border border-purple-500/30 text-purple-200 rounded-xl flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <p className="text-xs sm:text-sm flex-1">
                  I noticed you might be confused. I&apos;ll automatically provide a simpler explanation...
                </p>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Live Transcript Banner */}
          {showSubtitles && (
            <LiveTranscript
              text={currentTranscript}
              isActive={isSpeaking}
              wordsPerMinute={150}
            />
          )}

          {/* Mobile Camera Panel - Optional emotion detection */}
          <AnimatePresence>
            {cameraEnabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="xl:hidden px-3 sm:px-4 pb-2"
              >
                <div className="max-w-sm mx-auto card bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-white">Emotion Detection</h4>
                    <button
                      onClick={() => setCameraEnabled(false)}
                      className="p-1.5 rounded-lg bg-gray-700/50 text-gray-500 hover:text-white"
                    >
                      <VideoOff size={14} />
                    </button>
                  </div>
                  <EmotionCameraWidget
                    onEmotionDetected={handleEmotionDetected}
                    isEnabled={cameraEnabled}
                    onToggle={() => setCameraEnabled(false)}
                    position="corner"
                  />
                  {currentEmotion !== 'neutral' && (
                    <div className="mt-2 p-2 bg-surface rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Detected:</p>
                      <p className="text-sm font-medium text-white capitalize">{currentEmotion}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar - Hidden on mobile/tablet */}
        <div className="hidden xl:flex flex-col w-72 2xl:w-80 bg-surface-light/50 p-3 gap-3 flex-shrink-0">
          {/* Emotion Camera Widget - PROMINENT, FIRST THING USER SEES */}
          <div className="card bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h4 className="text-sm font-semibold text-white">Emotion Detection</h4>
              </div>
              <button
                onClick={() => setCameraEnabled(!cameraEnabled)}
                className={`p-1.5 rounded-lg transition-colors ${
                  cameraEnabled 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-700/50 text-gray-500 hover:text-gray-400'
                }`}
                title={cameraEnabled ? 'Disable camera' : 'Enable camera'}
              >
                {cameraEnabled ? <VideoOff size={14} /> : <Video size={14} />}
              </button>
            </div>
            <EmotionCameraWidget
              onEmotionDetected={handleEmotionDetected}
              isEnabled={cameraEnabled}
              onToggle={() => setCameraEnabled(!cameraEnabled)}
              position="sidebar"
            />
            {currentEmotion !== 'neutral' && (
              <div className="mt-2 p-2 bg-surface rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Current Emotion:</p>
                <p className="text-sm font-medium text-white capitalize">{currentEmotion}</p>
                {emotionConfidence > 0 && (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${emotionConfidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{Math.round(emotionConfidence * 100)}%</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Learning Progress Tracker */}
          <LearningProgressTracker
            concepts={conceptMastery}
            sessionStats={sessionStats}
            currentTopic={getCurrentTopicInfo().name}
            isExpanded={showProgressTracker}
            onToggleExpand={() => setShowProgressTracker(!showProgressTracker)}
            onConceptClick={(conceptId) => {
              console.log('Concept clicked:', conceptId);
            }}
          />
          
          {/* Quick Stats */}
          <div className="card">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Session Stats</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Messages</span>
                <span className="text-white font-medium">{messages.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Notes</span>
                <span className="text-white font-medium">{notes.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Emotion</span>
                <span className="text-white capitalize font-medium">{currentEmotion}</span>
              </div>
            </div>
          </div>

          {/* Removed: Text input - voice only for cleaner UX */}
        </div>
      </div>

      {/* Bottom Control Bar - Mobile optimized */}
      <div className="bg-surface border-t border-white/10 py-3 px-3 sm:px-4 md:px-6 safe-area-inset">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setShowSubtitles(!showSubtitles)}
              className={`btn-ghost p-2.5 ${showSubtitles ? 'bg-white/10 text-white' : ''}`}
              title="Toggle subtitles"
            >
              <Subtitles size={18} />
            </button>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`btn-ghost p-2.5 hidden lg:flex ${showNotes ? 'bg-white/10 text-white' : ''}`}
              title="Toggle notes"
            >
              <FileText size={18} />
            </button>
            {/* Camera Toggle - Visible on all screens, MORE PROMINENT */}
            <button
              onClick={() => setCameraEnabled(!cameraEnabled)}
              className={`p-2.5 rounded-lg transition-all xl:hidden ${
                cameraEnabled 
                  ? 'bg-gradient-to-r from-green-600/30 to-emerald-600/30 text-green-400 border border-green-500/30' 
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
              title={cameraEnabled ? 'Disable emotion detection' : 'Enable emotion detection'}
            >
              {cameraEnabled ? (
                <>
                  <VideoOff size={18} />
                  <span className="hidden sm:inline ml-1 text-xs">Emotion ON</span>
                </>
              ) : (
                <>
                  <Video size={18} />
                  <span className="hidden sm:inline ml-1 text-xs">Enable</span>
                </>
              )}
            </button>
          </div>

          {/* Center - Voice Input (Always) */}
          <div className="flex-1 max-w-sm sm:max-w-md">
            <SpacebarVoiceInput
              onTranscript={handleTranscript}
              isProcessing={isProcessing}
              disabled={isSpeaking}
            />
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Emotion Indicator - More prominent */}
            {cameraEnabled && currentEmotion !== 'neutral' && (
              <div className="xl:hidden flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg">
                <div className="relative">
                  <span className={`w-2.5 h-2.5 rounded-full block ${
                    currentEmotion === 'confused' || currentEmotion === 'frustrated' ? 'bg-yellow-500 animate-pulse' :
                    currentEmotion === 'happy' || currentEmotion === 'excited' ? 'bg-green-500' : 'bg-purple-500'
                  }`}></span>
                  <span className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-current animate-ping opacity-75" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-300 font-medium capitalize">{currentEmotion}</span>
                  {emotionConfidence > 0 && (
                    <span className="text-[10px] text-gray-500">{Math.round(emotionConfidence * 100)}% confidence</span>
                  )}
                </div>
              </div>
            )}
            
            {/* Pause/Resume Button */}
            <button
              onClick={toggleSessionPause}
              className={`btn text-xs sm:text-sm px-2 sm:px-3 py-2 ${isSessionPaused ? 'bg-green-600 hover:bg-green-700 text-white' : 'btn-secondary'}`}
              title={isSessionPaused ? 'Resume session' : 'Pause session'}
            >
              {isSessionPaused ? <Play size={16} /> : <Pause size={16} />}
              <span className="hidden sm:inline ml-1">{isSessionPaused ? 'Resume' : 'Pause'}</span>
            </button>

            {/* Download Notes Button */}
            {notes.length > 0 && (
              <button
                onClick={handleDownloadNotes}
                className="btn-secondary text-xs sm:text-sm px-2 sm:px-3 py-2"
                title="Download session notes"
              >
                <Download size={16} />
                <span className="hidden md:inline ml-1">Notes</span>
              </button>
            )}

            {isSpeaking && (
              <button
                onClick={interruptTutor}
                className="btn-secondary text-xs sm:text-sm px-2 sm:px-3 py-2"
              >
                <Square size={16} />
                <span className="hidden sm:inline ml-1">Stop</span>
              </button>
            )}
            <button
              className="btn-ghost p-2.5"
              title="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Removed: Custom Topic Builder - not needed for focused learning */}
    </div>
  );
}
