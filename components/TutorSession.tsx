'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Square, Subtitles, FileText, Settings, ChevronLeft, ChevronRight, Send, MessageSquare, Mic, X, Plus, HelpCircle, RefreshCw, Sparkles, Pause, Play, Download, Video, VideoOff, MoreVertical, ChevronUp } from 'lucide-react';

// Components
import AnimatedTutorOrb from '@/components/AnimatedTutorOrb';
import SpacebarVoiceInput from '@/components/SpacebarVoiceInput';
import LiveTranscript from '@/components/LiveTranscript';
import ScenarioSlide, { ScenarioQuestion } from '@/components/ScenarioSlide';
import EmotionCameraWidget from '@/components/EmotionCameraWidget';
import NotesPanel from '@/components/NotesPanel';
import TopicSelector from '@/components/TopicSelector';
import MermaidDiagram from '@/components/MermaidDiagram';
import CustomTopicBuilder from '@/components/CustomTopicBuilder';
import LearningSlidePanel, { LearningSlide } from '@/components/LearningSlidePanel';
import LearningProgressTracker from '@/components/LearningProgressTracker';

// Utils
import { getTopicById, learningTopics } from '@/lib/tutor-prompts';
import { EmotionType } from '@/lib/utils';

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

interface CustomTopic {
  id: string;
  name: string;
  category: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learningGoals: string[];
}

export default function TutorSession() {
  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  // Topic and content state
  const [selectedTopic, setSelectedTopic] = useState('dsa-binary-search');
  const [currentScenario, setCurrentScenario] = useState<ScenarioQuestion | null>(null);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [currentDiagram, setCurrentDiagram] = useState<string | null>(null);
  const [customTopics, setCustomTopics] = useState<CustomTopic[]>([]);
  const [showCustomTopicBuilder, setShowCustomTopicBuilder] = useState(false);
  
  // UI state
  const [showNotes, setShowNotes] = useState(true);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [textInput, setTextInput] = useState('');
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [viewMode, setViewMode] = useState<'slides' | 'quiz'>('slides');
  const [isLargeScreen, setIsLargeScreen] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Learning slides state
  const [learningSlides, setLearningSlides] = useState<LearningSlide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  
  // Guidance and help state
  const [showGuidance, setShowGuidance] = useState(true);
  const [guidanceMessage, setGuidanceMessage] = useState('');
  const [consecutiveNegativeEmotions, setConsecutiveNegativeEmotions] = useState(0);
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

  // Track screen size for responsive layout
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1280); // xl breakpoint
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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
      // Resume
      setIsSessionPaused(false);
      if (audioRef.current && audioRef.current.paused && audioUrl) {
        audioRef.current.play();
      }
    } else {
      // Pause
      setIsSessionPaused(true);
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    }
  }, [isSessionPaused, audioUrl]);

  // Sample scenarios for demonstration
  const sampleScenarios: ScenarioQuestion[] = [
    {
      id: '1',
      scenarioNumber: 1,
      question: 'Always reticent amongst strangers, she would slowly open up around her friends, eventually becoming _________.',
      options: ['withdrawn', 'conspiratorial', 'chatty', 'loquacious', 'rude', 'taciturn'],
      correctIndex: 3,
      explanation: '"Loquacious" means very talkative, which contrasts with being reticent (reserved). The sentence describes someone who opens up and becomes talkative.',
      hint: 'Look for a word that means the opposite of reticent.'
    },
    {
      id: '2',
      scenarioNumber: 2,
      question: 'What is the time complexity of binary search?',
      options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
      correctIndex: 1,
      explanation: 'Binary search has O(log n) time complexity because it divides the search space in half with each comparison.',
      hint: 'Think about how the algorithm divides the problem space.'
    }
  ];

  // Initialize with first scenario
  useEffect(() => {
    if (!currentScenario && sampleScenarios.length > 0) {
      setCurrentScenario(sampleScenarios[0]);
    }
  }, []);

  // Handle voice transcript
  const handleTranscript = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setIsListening(false);
    setIsGeneratingSlides(true);
    setShowGuidance(false);
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Get topic info (handles both standard and custom topics)
      const customTopic = customTopics.find(t => t.id === selectedTopic);
      const standardTopic = getTopicById(selectedTopic);
      const topicInfo = customTopic 
        ? { 
            name: customTopic.name, 
            description: customTopic.description,
            category: customTopic.category,
            isCustom: true,
            learningGoals: customTopic.learningGoals,
            difficulty: customTopic.difficulty
          }
        : { 
            name: standardTopic?.name || 'general',
            description: standardTopic?.description || '',
            category: standardTopic?.category || 'General',
            isCustom: false
          };

      // Get tutor response with slides
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          topic: topicInfo.name,
          topicDescription: topicInfo.description,
          topicCategory: topicInfo.category,
          isCustomTopic: topicInfo.isCustom,
          learningGoals: topicInfo.isCustom ? (topicInfo as any).learningGoals : [],
          difficulty: topicInfo.isCustom ? (topicInfo as any).difficulty : 'intermediate',
          emotion: currentEmotion,
          emotionConfidence: emotionConfidence,
          history: messages.slice(-5)
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
          setViewMode('slides');
          
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

        // Generate diagram if needed
        if (data.needsDiagram) {
          generateDiagram(data.message);
        }

        // Speak the response
        await speakText(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
      setIsGeneratingSlides(false);
    }
  };

  // Text-to-speech
  const speakText = async (text: string) => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      setIsSpeaking(true);
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
    }
  };

  // Generate diagram
  const generateDiagram = async (context: string) => {
    try {
      const topic = getTopicById(selectedTopic);
      const response = await fetch('/api/diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic?.name || 'Concept',
          description: context,
          type: 'mermaid'
        })
      });

      const data = await response.json();
      if (data.success && data.diagram) {
        setCurrentDiagram(data.diagram);
      }
    } catch (error) {
      console.error('Diagram error:', error);
    }
  };

  // Handle scenario answer
  const handleScenarioAnswer = (selectedIndex: number, isCorrect: boolean) => {
    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0)
    }));

    // Add note about the answer
    const note: Note = {
      id: `note-${Date.now()}`,
      type: isCorrect ? 'concept' : 'tip',
      content: isCorrect 
        ? `Correctly answered: ${currentScenario?.question.substring(0, 50)}...`
        : `Review needed: ${currentScenario?.explanation}`,
      timestamp: new Date()
    };
    setNotes(prev => [...prev, note]);

    // Speak feedback
    const feedback = isCorrect 
      ? "Excellent! That's correct. " + currentScenario?.explanation
      : "Not quite. " + currentScenario?.explanation;
    
    setCurrentTranscript(feedback);
    speakText(feedback);
  };

  // Navigate scenarios
  const nextScenario = () => {
    if (scenarioIndex < sampleScenarios.length - 1) {
      setScenarioIndex(prev => prev + 1);
      setCurrentScenario(sampleScenarios[scenarioIndex + 1]);
    }
  };

  const prevScenario = () => {
    if (scenarioIndex > 0) {
      setScenarioIndex(prev => prev - 1);
      setCurrentScenario(sampleScenarios[scenarioIndex - 1]);
    }
  };

  // Handle emotion detection with enhanced smoothing and proactive confusion resolution
  const handleEmotionDetected = useCallback((emotion: string, confidence: number) => {
    const now = Date.now();
    
    // Add to emotion history for smoothing
    setEmotionHistory(prev => {
      const updated = [...prev, { emotion, confidence, time: now }]
        .filter(e => now - e.time < 15000) // Keep last 15 seconds
        .slice(-10); // Keep max 10 entries
      return updated;
    });

    // Calculate smoothed emotion (weighted average of recent detections)
    const recentEmotions = emotionHistory.filter(e => now - e.time < 10000);
    const emotionCounts: Record<string, { count: number; totalConfidence: number }> = {};
    
    [...recentEmotions, { emotion, confidence, time: now }].forEach(e => {
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

    setCurrentEmotion(dominantEmotion);
    setEmotionConfidence(smoothedConfidence);

    // Track consecutive negative emotions
    if ((dominantEmotion === 'confused' || dominantEmotion === 'frustrated') && smoothedConfidence > 0.5) {
      setConsecutiveNegativeEmotions(prev => prev + 1);
    } else if (dominantEmotion === 'happy' || dominantEmotion === 'engaged' || dominantEmotion === 'confident') {
      setConsecutiveNegativeEmotions(0);
    }

    // PROACTIVE CONFUSION RESOLUTION
    const timeSinceLastAction = now - lastConfusionActionRef.current;
    const canTakeAction = timeSinceLastAction > 20000; // 20 second cooldown

    // Auto-trigger simplification for persistent confusion (3+ detections)
    if (consecutiveNegativeEmotions >= 3 && canTakeAction && !isProcessing && !isSessionPaused) {
      lastConfusionActionRef.current = now;
      setConsecutiveNegativeEmotions(0);
      
      // Auto-simplify without requiring user action
      handleAutoSimplify(dominantEmotion);
      return;
    }

    // High confidence single detection
    if ((dominantEmotion === 'confused' || dominantEmotion === 'frustrated') && 
        smoothedConfidence > 0.75 && canTakeAction && !isProcessing && !isSessionPaused) {
      lastConfusionActionRef.current = now;
      
      // Show proactive offer
      const helpMessage = dominantEmotion === 'confused'
        ? "I noticed you might be finding this tricky. Let me explain it in a simpler way..."
        : "This can be challenging. Let me try a different approach...";
      
      setGuidanceMessage(helpMessage);
      
      // Auto-simplify after brief pause to let user see the message
      setTimeout(() => {
        if (!isProcessing && !isSessionPaused) {
          handleAutoSimplify(dominantEmotion);
        }
      }, 2000);
    } else if ((dominantEmotion === 'confused' || dominantEmotion === 'frustrated') && 
               smoothedConfidence > 0.5 && !isProcessing) {
      // Lower confidence - just show guidance
      setGuidanceMessage(
        dominantEmotion === 'confused'
          ? "Need help? Say 'simplify' or click the simplify button."
          : "Feeling stuck? I can explain this differently."
      );
      setTimeout(() => setGuidanceMessage(''), 8000);
    }
  }, [isProcessing, isSessionPaused, emotionHistory, consecutiveNegativeEmotions]);

  // Auto-simplify content when confusion is detected
  const handleAutoSimplify = async (detectedEmotion: string) => {
    if (isProcessing || learningSlides.length === 0) return;

    setIsGeneratingSlides(true);
    setGuidanceMessage('');
    const currentTopic = getCurrentTopicInfo();
    
    try {
      const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
      const contentToSimplify = lastAssistantMessage?.content || currentTopic.name;

      // Speak acknowledgment
      const ackMessage = detectedEmotion === 'confused'
        ? "I can see this is confusing. Let me break it down more simply."
        : "Let me try explaining this in a different, easier way.";
      setCurrentTranscript(ackMessage);
      await speakText(ackMessage);

      // Get simplified response
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `The student is ${detectedEmotion} and needs a much simpler explanation. Explain this concept as if teaching a complete beginner: ${contentToSimplify.substring(0, 300)}`,
          topic: currentTopic.name,
          emotion: detectedEmotion,
          emotionConfidence: 0.95,
          history: messages.slice(-3)
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

        if (data.slides && data.slides.length > 0) {
          setLearningSlides(data.slides);
          setCurrentSlideIndex(0);
        }

        await speakText(data.message);
      }
    } catch (error) {
      console.error('Auto-simplification error:', error);
    } finally {
      setIsGeneratingSlides(false);
    }
  };

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

  // Generate scenarios for a topic
  const generateScenariosForTopic = async (topicName: string, description: string, learningGoals: string[] = [], difficulty: string = 'intermediate') => {
    try {
      const response = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicName,
          description,
          learningGoals,
          emotion: currentEmotion,
          emotionConfidence: emotionConfidence
        })
      });

      const data = await response.json();
      
      if (data.success && data.slides && data.slides.length > 0) {
        // Convert slides to scenarios
        const scenarios: ScenarioQuestion[] = data.slides
          .filter((slide: any) => slide.type === 'practice' || slide.quiz)
          .map((slide: any, index: number) => ({
            id: `generated-${Date.now()}-${index}`,
            scenarioNumber: index + 1,
            question: slide.quiz?.question || slide.title,
            options: slide.quiz?.options || ['Option A', 'Option B', 'Option C', 'Option D'],
            correctIndex: slide.quiz?.correctAnswer || 0,
            explanation: slide.quiz?.explanation || slide.content,
            hint: 'Think about what you just learned.'
          }));

        // If no practice slides, create a scenario from the first concept slide
        if (scenarios.length === 0) {
          const conceptSlide = data.slides.find((s: any) => s.type === 'concept') || data.slides[0];
          scenarios.push({
            id: `generated-${Date.now()}-0`,
            scenarioNumber: 1,
            question: `What is the main concept of ${topicName}?`,
            options: [
              conceptSlide?.keyPoints?.[0] || 'Understanding the basics',
              'Something unrelated',
              'A different concept',
              'None of the above'
            ],
            correctIndex: 0,
            explanation: conceptSlide?.content || description,
            hint: 'Think about the key points we discussed.'
          });
        }

        setCurrentScenario(scenarios[0]);
        setScenarioIndex(0);
        
        // Store all scenarios for navigation
        return scenarios;
      }
    } catch (error) {
      console.error('Error generating scenarios:', error);
    }
    return null;
  };

  // Handle topic change
  const handleTopicChange = async (topicId: string) => {
    setSelectedTopic(topicId);
    setShowTopicSelector(false);
    
    // Check if it's a custom topic
    const customTopic = customTopics.find(t => t.id === topicId);
    const topic = customTopic || getTopicById(topicId);
    
    // Generate scenarios for custom topics
    if (customTopic) {
      await generateScenariosForTopic(
        customTopic.name,
        customTopic.description,
        customTopic.learningGoals,
        customTopic.difficulty
      );
    } else {
      // Reset to sample scenarios for standard topics
      setCurrentScenario(sampleScenarios[0]);
      setScenarioIndex(0);
    }
    
    const welcomeMessage = `Great choice! Let's learn about ${topic?.name}. ${topic?.description || ''} What would you like to know?`;
    
    setCurrentTranscript(welcomeMessage);
    speakText(welcomeMessage);
  };

  // Handle custom topic creation
  const handleCustomTopicCreated = async (topic: CustomTopic) => {
    const newTopic = { ...topic, examples: [] };
    setCustomTopics(prev => [...prev, newTopic]);
    setSelectedTopic(topic.id);
    setShowCustomTopicBuilder(false);
    
    // Generate scenarios for the new custom topic
    await generateScenariosForTopic(
      topic.name,
      topic.description,
      topic.learningGoals,
      topic.difficulty
    );
    
    const welcomeMessage = `Excellent! I've created a custom learning path for ${topic.name}. ${topic.description} Let's start with your first learning goal: ${topic.learningGoals[0] || 'exploring the basics'}. What would you like to know?`;
    
    setCurrentTranscript(welcomeMessage);
    speakText(welcomeMessage);
  };

  // Handle text input submit
  const handleTextSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    
    handleTranscript(textInput.trim());
    setTextInput('');
  };

  // Get current topic info (handles both standard and custom topics)
  const getCurrentTopicInfo = () => {
    const customTopic = customTopics.find(t => t.id === selectedTopic);
    if (customTopic) return { name: customTopic.name, category: customTopic.category };
    const topic = getTopicById(selectedTopic);
    return { name: topic?.name || 'General', category: topic?.category || 'General' };
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col safe-area-inset">
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
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
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
                {/* Mobile Header Row */}
                <div className="flex items-center justify-between gap-2 mb-4 sm:mb-0">
                  {/* Topic Selector Button */}
                  <button
                    onClick={() => setShowTopicSelector(!showTopicSelector)}
                    className="px-3 py-2 bg-primary-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-primary-700 active:scale-95 transition-all flex items-center gap-1.5 min-h-touch truncate max-w-[200px]"
                  >
                    <span className="truncate">{getCurrentTopicInfo().name}</span>
                  </button>

                  {/* View Mode Toggle - Mobile optimized */}
                  <div className="flex bg-white/50 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('slides')}
                      className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all min-h-touch flex items-center gap-1 ${viewMode === 'slides' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      <Sparkles size={14} />
                      <span className="hidden sm:inline">Slides</span>
                    </button>
                    <button
                      onClick={() => setViewMode('quiz')}
                      className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all min-h-touch ${viewMode === 'quiz' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      <span>Quiz</span>
                    </button>
                  </div>
                </div>

                {/* Topic Selector Dropdown */}
                <AnimatePresence>
                  {showTopicSelector && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-16 sm:top-14 left-3 sm:left-4 z-20 w-[calc(100%-1.5rem)] sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-h-[60vh] overflow-y-auto"
                    >
                      <TopicSelector
                        selectedTopic={selectedTopic}
                        onTopicChange={handleTopicChange}
                        onCreateCustom={() => {
                          setShowTopicSelector(false);
                          setShowCustomTopicBuilder(true);
                        }}
                        customTopics={customTopics.map(t => ({ ...t, examples: [] }))}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tutor Orb - Responsive positioning */}
                <div className="hidden sm:flex absolute top-4 sm:top-6 right-4 sm:right-6 w-28 sm:w-40 h-20 sm:h-28 bg-gray-600 rounded-xl items-center justify-center shadow-lg">
                  <AnimatedTutorOrb
                    isSpeaking={isSpeaking}
                    isListening={isListening}
                    emotion={currentEmotion === 'happy' ? 'happy' : currentEmotion === 'confused' ? 'thinking' : 'neutral'}
                    size="medium"
                  />
                </div>

                {/* Main Content Area */}
                <div className="mt-4 sm:mt-16 sm:pr-36 md:pr-48 min-h-[300px] sm:min-h-[calc(100%-8rem)]">
                  {viewMode === 'slides' ? (
                    learningSlides.length > 0 || isGeneratingSlides ? (
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
                          <h2 className="text-xl sm:text-2xl font-bold mb-4">Welcome to AI Voice Tutor</h2>
                          
                          {showGuidance && (
                            <div className="space-y-3 mb-6">
                              <div className="flex items-center gap-3 text-left bg-purple-50 p-3 sm:p-4 rounded-xl">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm">1</div>
                                <p className="text-sm sm:text-base">Hold <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">Space</kbd> or tap mic to speak</p>
                              </div>
                              <div className="flex items-center gap-3 text-left bg-blue-50 p-3 sm:p-4 rounded-xl">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">2</div>
                                <p className="text-sm sm:text-base">Learning slides appear as I explain</p>
                              </div>
                              <div className="flex items-center gap-3 text-left bg-green-50 p-3 sm:p-4 rounded-xl">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">3</div>
                                <p className="text-sm sm:text-base">If confused, I&apos;ll automatically simplify!</p>
                              </div>
                            </div>
                          )}

                          <p className="text-gray-500 text-sm sm:text-base">
                            Select a topic above or start speaking.
                          </p>

                          {currentDiagram && (
                            <div className="mt-6 p-4 bg-white rounded-xl">
                              <MermaidDiagram code={currentDiagram} />
                            </div>
                          )}
                        </motion.div>
                      </div>
                    )
                  ) : (
                    currentScenario ? (
                      <ScenarioSlide
                        scenario={currentScenario}
                        onAnswer={handleScenarioAnswer}
                        showHint={currentEmotion === 'confused'}
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <HelpCircle size={40} className="mb-4 text-gray-300" />
                        <p className="text-sm sm:text-base text-center px-4">Complete a learning session to unlock practice questions.</p>
                      </div>
                    )
                  )}
                </div>

                {/* Navigation for Quiz mode */}
                {viewMode === 'quiz' && currentScenario && (
                  <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-8 right-4 sm:right-8 flex justify-between items-center">
                    <button
                      onClick={prevScenario}
                      disabled={scenarioIndex === 0}
                      className="flex items-center gap-1 sm:gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed min-h-touch text-sm"
                    >
                      <ChevronLeft size={18} />
                      <span className="hidden sm:inline">Previous</span>
                    </button>
                    <span className="text-gray-500 text-sm">
                      {scenarioIndex + 1} / {sampleScenarios.length}
                    </span>
                    <button
                      onClick={nextScenario}
                      disabled={scenarioIndex === sampleScenarios.length - 1}
                      className="flex items-center gap-1 sm:gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed min-h-touch text-sm"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Guidance Message Banner */}
          <AnimatePresence>
            {guidanceMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mx-3 sm:mx-4 mb-2 p-3 bg-orange-500 text-white rounded-xl flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <HelpCircle size={18} className="flex-shrink-0" />
                  <p className="text-xs sm:text-sm truncate">{guidanceMessage}</p>
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

          {/* Live Transcript Banner */}
          {showSubtitles && (
            <LiveTranscript
              text={currentTranscript}
              isActive={isSpeaking}
              wordsPerMinute={150}
            />
          )}

          {/* Mobile Camera Panel - Shows when camera enabled on mobile/tablet */}
          <AnimatePresence>
            {cameraEnabled && !isLargeScreen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="xl:hidden px-3 sm:px-4 pb-2"
              >
                <div className="max-w-sm mx-auto">
                  <EmotionCameraWidget
                    onEmotionDetected={handleEmotionDetected}
                    isEnabled={cameraEnabled}
                    onToggle={() => setCameraEnabled(!cameraEnabled)}
                    position="corner"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Chat History Panel */}
          <AnimatePresence>
            {showChatHistory && !isLargeScreen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="xl:hidden px-3 sm:px-4 pb-2"
              >
                <div className="bg-surface-light rounded-xl p-3 max-w-lg mx-auto">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-400">Chat History</h4>
                    <button
                      onClick={() => setShowChatHistory(false)}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <X size={14} className="text-gray-500" />
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2 scrollbar-hide">
                    {messages.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4">No messages yet</p>
                    ) : (
                      messages.slice(-8).map((msg) => (
                        <div
                          key={msg.id}
                          className={`text-xs p-2 rounded-lg whitespace-pre-wrap break-words ${msg.role === 'user' ? 'bg-primary-500/20 text-primary-200 ml-4' : 'bg-gray-700/50 text-gray-300 mr-4'}`}
                        >
                          <span className="font-medium">{msg.role === 'user' ? 'You: ' : 'Tutor: '}</span>
                          {msg.content.length > 150 ? msg.content.substring(0, 150) + '...' : msg.content}
                        </div>
                      ))
                    )}
                  </div>
                  {/* Mobile text input */}
                  <form onSubmit={handleTextSubmit} className="flex gap-2 mt-2 pt-2 border-t border-white/10">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Type a message..."
                      disabled={isProcessing}
                      className="flex-1 px-3 py-2 min-h-touch bg-surface-lighter border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                    />
                    <button
                      type="submit"
                      disabled={!textInput.trim() || isProcessing}
                      className="btn-primary px-3 py-2 rounded-lg"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar - Hidden on mobile/tablet */}
        <div className="hidden xl:flex flex-col w-72 2xl:w-80 bg-surface-light/50 p-3 gap-3 flex-shrink-0">
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

          <EmotionCameraWidget
            onEmotionDetected={handleEmotionDetected}
            isEnabled={cameraEnabled}
            onToggle={() => setCameraEnabled(!cameraEnabled)}
            position="sidebar"
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

          {/* Chat History Toggle */}
          <button
            onClick={() => setShowChatHistory(!showChatHistory)}
            className="btn-secondary text-sm"
          >
            <MessageSquare size={16} />
            {showChatHistory ? 'Hide Chat' : 'Show Chat'}
          </button>

          {/* Chat History */}
          <AnimatePresence>
            {showChatHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex-1 card overflow-hidden p-0"
              >
                <div className="h-48 overflow-y-auto p-3 space-y-2 scrollbar-hide">
                  {messages.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No messages yet</p>
                  ) : (
                    messages.slice(-10).map((msg) => (
                      <div
                        key={msg.id}
                        className={`text-xs p-2 rounded-lg whitespace-pre-wrap break-words ${msg.role === 'user' ? 'bg-primary-500/20 text-primary-200 ml-4' : 'bg-gray-700/50 text-gray-300 mr-4'}`}
                      >
                        <span className="font-medium">{msg.role === 'user' ? 'You: ' : 'Tutor: '}</span>
                        {msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Text Input */}
          <form onSubmit={handleTextSubmit} className="flex gap-2">
            <input
              ref={textInputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type a message..."
              disabled={isProcessing}
              className="input text-sm py-2"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="btn-primary px-3"
            >
              <Send size={16} />
            </button>
          </form>
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
            {/* Camera Toggle - Visible on all screens */}
            <button
              onClick={() => setCameraEnabled(!cameraEnabled)}
              className={`btn-ghost p-2.5 xl:hidden ${cameraEnabled ? 'bg-green-600/50 text-green-400' : ''}`}
              title="Toggle camera"
            >
              {cameraEnabled ? <VideoOff size={18} /> : <Video size={18} />}
            </button>
            {/* Chat Toggle - Visible on mobile/tablet */}
            <button
              onClick={() => setShowChatHistory(!showChatHistory)}
              className={`btn-ghost p-2.5 xl:hidden ${showChatHistory ? 'bg-white/10 text-white' : ''}`}
              title="Toggle chat"
            >
              <MessageSquare size={18} />
            </button>
            {/* Input Mode Toggle - Mobile only */}
            <div className="flex items-center bg-surface-light rounded-lg p-1 xl:hidden">
              <button
                onClick={() => setInputMode('voice')}
                className={`p-2 rounded-md transition-all ${inputMode === 'voice' ? 'bg-primary-500 text-white' : 'text-gray-400'}`}
              >
                <Mic size={16} />
              </button>
              <button
                onClick={() => setInputMode('text')}
                className={`p-2 rounded-md transition-all ${inputMode === 'text' ? 'bg-primary-500 text-white' : 'text-gray-400'}`}
              >
                <Send size={16} />
              </button>
            </div>
          </div>

          {/* Center - Input Area */}
          <div className="flex-1 max-w-sm sm:max-w-md">
            {inputMode === 'voice' || isLargeScreen ? (
              <SpacebarVoiceInput
                onTranscript={handleTranscript}
                isProcessing={isProcessing}
                disabled={isSpeaking}
              />
            ) : (
              <form onSubmit={handleTextSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your question..."
                  disabled={isProcessing}
                  className="input rounded-full text-sm py-2.5"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim() || isProcessing}
                  className="btn-primary rounded-full p-2.5"
                >
                  <Send size={18} />
                </button>
              </form>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Emotion Indicator */}
            {cameraEnabled && currentEmotion !== 'neutral' && (
              <div className="xl:hidden flex items-center gap-1 px-2 py-1 bg-surface-light rounded-lg text-xs">
                <span className={`w-2 h-2 rounded-full ${
                  currentEmotion === 'confused' || currentEmotion === 'frustrated' ? 'bg-yellow-500' :
                  currentEmotion === 'happy' || currentEmotion === 'excited' ? 'bg-green-500' : 'bg-purple-500'
                }`}></span>
                <span className="text-gray-400 capitalize hidden xs:inline">{currentEmotion}</span>
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

      {/* Custom Topic Builder Modal */}
      <AnimatePresence>
        {showCustomTopicBuilder && (
          <CustomTopicBuilder
            onTopicCreated={handleCustomTopicCreated}
            onClose={() => setShowCustomTopicBuilder(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
