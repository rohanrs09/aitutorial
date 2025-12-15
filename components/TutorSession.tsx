'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Square, Subtitles, FileText, Settings, ChevronLeft, ChevronRight, Send, MessageSquare, Mic, X, Plus, HelpCircle, RefreshCw, Sparkles } from 'lucide-react';

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
  
  // Learning slides state
  const [learningSlides, setLearningSlides] = useState<LearningSlide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  
  // Guidance and help state
  const [showGuidance, setShowGuidance] = useState(true);
  const [guidanceMessage, setGuidanceMessage] = useState('');
  const [consecutiveNegativeEmotions, setConsecutiveNegativeEmotions] = useState(0);
  const [lastSimplificationTime, setLastSimplificationTime] = useState<number>(0);
  
  // Emotion state
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
  const [emotionConfidence, setEmotionConfidence] = useState(0);
  
  // Notes
  const [notes, setNotes] = useState<Note[]>([]);
  
  // Audio
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

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

  // Handle emotion detection with proactive confusion resolution
  const handleEmotionDetected = useCallback((emotion: string, confidence: number) => {
    setCurrentEmotion(emotion);
    setEmotionConfidence(confidence);

    // Track consecutive negative emotions
    if ((emotion === 'confused' || emotion === 'frustrated') && confidence > 0.5) {
      setConsecutiveNegativeEmotions(prev => prev + 1);
    } else if (emotion === 'happy' || emotion === 'engaged' || emotion === 'confident') {
      setConsecutiveNegativeEmotions(0);
    }

    // Proactive help for negative emotions - auto-trigger simplification
    const timeSinceLastSimplification = Date.now() - lastSimplificationTime;
    const canTriggerSimplification = timeSinceLastSimplification > 30000; // 30 second cooldown

    if ((emotion === 'confused' || emotion === 'frustrated') && confidence > 0.7 && !isProcessing && canTriggerSimplification) {
      // Auto-regenerate simplified content
      handleRequestSimplification();
      setLastSimplificationTime(Date.now());
    } else if ((emotion === 'confused' || emotion === 'frustrated') && confidence > 0.5 && !isProcessing) {
      // Show guidance message
      const helpMessage = emotion === 'confused'
        ? "I can see you might be finding this tricky. Would you like me to explain it differently? Just say 'simplify' or click the simplify button."
        : "This topic can be challenging. I'm here to help - ask me to break it down further or check the slides for a simpler explanation.";
      
      setGuidanceMessage(helpMessage);
      setTimeout(() => setGuidanceMessage(''), 10000);
    }
  }, [isProcessing, lastSimplificationTime]);

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
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        autoPlay
        onPlay={() => setIsSpeaking(true)}
        onEnded={() => {
          setIsSpeaking(false);
          setCurrentTranscript('');
        }}
        onPause={() => setIsSpeaking(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Notes Sidebar - Left */}
        <AnimatePresence>
          {showNotes && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-[#2a2a2a]/80 backdrop-blur-sm border-r border-white/5 overflow-hidden hidden lg:block"
            >
              <NotesPanel
                notes={notes}
                topic={getCurrentTopicInfo().name}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center - Main Teaching Area */}
        <div className="flex-1 flex flex-col">
          {/* Content Card */}
          <div className="flex-1 p-4 md:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              {/* Main Content Card (Cream/Beige like reference) */}
              <div className="bg-[#f5f0e8] rounded-2xl shadow-2xl min-h-[500px] relative p-8">
                {/* Topic Selector Button */}
                <button
                  onClick={() => setShowTopicSelector(!showTopicSelector)}
                  className="absolute top-4 left-4 px-3 py-1.5 bg-[#5c4d9a] text-white text-sm font-medium rounded-lg hover:bg-[#4a3d7a] transition-colors z-10 flex items-center gap-2"
                >
                  <span>{getCurrentTopicInfo().name}</span>
                </button>

                {/* Topic Selector Dropdown */}
                <AnimatePresence>
                  {showTopicSelector && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-14 left-4 z-20 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-h-96 overflow-y-auto"
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

                {/* Tutor Orb - Top Right */}
                <div className="absolute top-6 right-6 w-40 h-28 bg-[#5a5a5a] rounded-xl flex items-center justify-center shadow-lg">
                  <AnimatedTutorOrb
                    isSpeaking={isSpeaking}
                    isListening={isListening}
                    emotion={currentEmotion === 'happy' ? 'happy' : currentEmotion === 'confused' ? 'thinking' : 'neutral'}
                    size="medium"
                  />
                </div>

                {/* View Mode Toggle */}
                <div className="absolute top-4 right-48 flex bg-white/50 rounded-lg p-1 z-10">
                  <button
                    onClick={() => setViewMode('slides')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'slides' ? 'bg-[#5c4d9a] text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <Sparkles size={14} className="inline mr-1" />
                    Slides
                  </button>
                  <button
                    onClick={() => setViewMode('quiz')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'quiz' ? 'bg-[#5c4d9a] text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Quiz
                  </button>
                </div>

                {/* Main Content Area */}
                <div className="mt-16 pr-48 h-[calc(100%-8rem)]">
                  {viewMode === 'slides' ? (
                    // Learning Slides View
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
                      />
                    ) : (
                      // Welcome/Guidance View
                      <div className="h-full flex flex-col items-center justify-center text-gray-700">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center max-w-lg"
                        >
                          <h2 className="text-2xl font-bold mb-4">Welcome to AI Voice Tutor</h2>
                          
                          {showGuidance && (
                            <div className="space-y-4 mb-8">
                              <div className="flex items-center gap-3 text-left bg-purple-50 p-4 rounded-xl">
                                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">1</div>
                                <p>Hold <kbd className="px-2 py-1 bg-gray-200 rounded text-sm font-mono">Space</kbd> to ask a question</p>
                              </div>
                              <div className="flex items-center gap-3 text-left bg-blue-50 p-4 rounded-xl">
                                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">2</div>
                                <p>Learning slides will appear as I explain</p>
                              </div>
                              <div className="flex items-center gap-3 text-left bg-green-50 p-4 rounded-xl">
                                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">3</div>
                                <p>If confused, I&apos;ll automatically simplify!</p>
                              </div>
                            </div>
                          )}

                          <p className="text-gray-500">
                            Select a topic above or just start speaking.
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
                    // Quiz View
                    currentScenario ? (
                      <ScenarioSlide
                        scenario={currentScenario}
                        onAnswer={handleScenarioAnswer}
                        showHint={currentEmotion === 'confused'}
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <HelpCircle size={48} className="mb-4 text-gray-300" />
                        <p>Complete a learning session to unlock practice questions.</p>
                      </div>
                    )
                  )}
                </div>

                {/* Navigation for Quiz mode */}
                {viewMode === 'quiz' && currentScenario && (
                  <div className="absolute bottom-6 left-8 right-8 flex justify-between">
                    <button
                      onClick={prevScenario}
                      disabled={scenarioIndex === 0}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={20} />
                      Previous
                    </button>
                    <span className="text-gray-500">
                      {scenarioIndex + 1} / {sampleScenarios.length}
                    </span>
                    <button
                      onClick={nextScenario}
                      disabled={scenarioIndex === sampleScenarios.length - 1}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight size={20} />
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
                className="mx-4 mb-2 p-3 bg-orange-500 text-white rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle size={20} />
                  <p className="text-sm">{guidanceMessage}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRequestSimplification}
                    className="px-3 py-1 bg-white text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors"
                  >
                    <RefreshCw size={14} className="inline mr-1" />
                    Simplify
                  </button>
                  <button
                    onClick={() => setGuidanceMessage('')}
                    className="p-1 hover:bg-white/20 rounded"
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
        </div>

        {/* Camera Widget & Chat - Right Side */}
        <div className="hidden xl:flex flex-col w-80 bg-[#2a2a2a]/50 p-4 gap-4">
          <EmotionCameraWidget
            onEmotionDetected={handleEmotionDetected}
            isEnabled={cameraEnabled}
            onToggle={() => setCameraEnabled(!cameraEnabled)}
            position="sidebar"
          />
          
          {/* Quick Stats */}
          <div className="bg-[#2a2a2a] rounded-xl p-4">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Session Stats</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Messages</span>
                <span className="text-white">{messages.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Notes</span>
                <span className="text-white">{notes.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Emotion</span>
                <span className="text-white capitalize">{currentEmotion}</span>
              </div>
            </div>
          </div>

          {/* Chat History Toggle */}
          <button
            onClick={() => setShowChatHistory(!showChatHistory)}
            className="flex items-center gap-2 px-4 py-2 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded-lg text-sm text-white transition-colors"
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
                className="flex-1 bg-[#2a2a2a] rounded-xl overflow-hidden"
              >
                <div className="h-48 overflow-y-auto p-3 space-y-2">
                  {messages.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No messages yet. Start a conversation!</p>
                  ) : (
                    messages.slice(-10).map((msg) => (
                      <div
                        key={msg.id}
                        className={`text-xs p-2 rounded-lg ${msg.role === 'user' ? 'bg-purple-500/20 text-purple-200 ml-4' : 'bg-gray-700/50 text-gray-300 mr-4'}`}
                      >
                        <span className="font-medium">{msg.role === 'user' ? 'You: ' : 'Tutor: '}</span>
                        {msg.content.substring(0, 100)}{msg.content.length > 100 ? '...' : ''}
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
              className="flex-1 px-3 py-2 bg-[#3a3a3a] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="p-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Send size={16} className="text-white" />
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="bg-[#1a1a1a] border-t border-white/10 py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSubtitles(!showSubtitles)}
              className={`p-2 rounded-lg transition-colors ${showSubtitles ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
              title="Toggle subtitles"
            >
              <Subtitles size={18} />
            </button>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`p-2 rounded-lg transition-colors hidden lg:block ${showNotes ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
              title="Toggle notes"
            >
              <FileText size={18} />
            </button>
            {/* Input Mode Toggle */}
            <div className="flex items-center bg-[#2a2a2a] rounded-lg p-1 xl:hidden">
              <button
                onClick={() => setInputMode('voice')}
                className={`p-1.5 rounded-md transition-colors ${inputMode === 'voice' ? 'bg-purple-500 text-white' : 'text-gray-400'}`}
              >
                <Mic size={16} />
              </button>
              <button
                onClick={() => setInputMode('text')}
                className={`p-1.5 rounded-md transition-colors ${inputMode === 'text' ? 'bg-purple-500 text-white' : 'text-gray-400'}`}
              >
                <MessageSquare size={16} />
              </button>
            </div>
          </div>

          {/* Center - Input Area */}
          <div className="flex-1 max-w-md">
            {inputMode === 'voice' || window.innerWidth >= 1280 ? (
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
                  className="flex-1 px-4 py-2.5 bg-[#2a2a2a] border border-white/10 rounded-full text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim() || isProcessing}
                  className="p-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full transition-colors"
                >
                  <Send size={18} className="text-white" />
                </button>
              </form>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {isSpeaking && (
              <button
                onClick={interruptTutor}
                className="flex items-center gap-2 px-4 py-2 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white rounded-lg transition-colors"
              >
                <Square size={16} />
                Interrupt tutor
              </button>
            )}
            <button
              className="p-2 rounded-lg text-gray-400 hover:bg-white/10 transition-colors"
              title="Settings"
            >
              <Settings size={20} />
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
