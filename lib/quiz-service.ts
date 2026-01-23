'use client';

import { supabase, isSupabaseConfigured } from './supabase';
import type {
  QuizQuestion,
  QuizSession,
  QuizResult,
  QuizAttempt,
  TopicQuizConfig,
  QuizAnalytics,
  DifficultyLevel,
} from './quiz-types';

// In-memory session cache to avoid database lookup issues
const sessionCache = new Map<string, QuizSession>();

// Enhanced question bank with more questions
const QUESTION_BANK: Record<string, QuizQuestion[]> = {
  'Arrays & Strings': [
    {
      id: 'arr-1',
      topic: 'Arrays & Strings',
      subtopic: 'Array Basics',
      question: 'What is the time complexity of accessing an element in an array by index?',
      type: 'multiple-choice',
      difficulty: 'easy',
      options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
      correctAnswer: 0,
      explanation: 'Array access by index is O(1) because arrays store elements in contiguous memory locations.',
      points: 5,
    },
    {
      id: 'arr-2',
      topic: 'Arrays & Strings',
      subtopic: 'Two Pointers',
      question: 'Which approach is most efficient for reversing an array in-place?',
      type: 'multiple-choice',
      difficulty: 'medium',
      options: ['Create new array', 'Two pointers from both ends', 'Recursion', 'Stack'],
      correctAnswer: 1,
      explanation: 'Two pointers approach is O(n) time and O(1) space, making it most efficient for in-place reversal.',
      points: 10,
    },
    {
      id: 'arr-3',
      topic: 'Arrays & Strings',
      subtopic: 'String Manipulation',
      question: 'What is the time complexity of string concatenation in most languages?',
      type: 'multiple-choice',
      difficulty: 'medium',
      options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
      correctAnswer: 1,
      explanation: 'String concatenation typically requires creating a new string and copying all characters, resulting in O(n) complexity.',
      points: 10,
    },
  ],
  'Linked Lists': [
    {
      id: 'll-1',
      topic: 'Linked Lists',
      subtopic: 'Basics',
      question: 'What is the main advantage of a linked list over an array?',
      type: 'multiple-choice',
      difficulty: 'easy',
      options: ['Faster access', 'Dynamic size', 'Less memory', 'Better cache locality'],
      correctAnswer: 1,
      explanation: 'Linked lists can grow/shrink dynamically without reallocation, unlike fixed-size arrays.',
      points: 5,
    },
    {
      id: 'll-2',
      topic: 'Linked Lists',
      subtopic: 'Cycle Detection',
      question: 'To detect a cycle in a linked list, which algorithm is most commonly used?',
      type: 'multiple-choice',
      difficulty: 'medium',
      options: ['Binary Search', 'Floyd\'s Cycle Detection (Tortoise and Hare)', 'DFS', 'BFS'],
      correctAnswer: 1,
      explanation: 'Floyd\'s algorithm uses two pointers moving at different speeds to detect cycles efficiently.',
      points: 10,
    },
  ],
  'Stacks & Queues': [
    {
      id: 'sq-1',
      topic: 'Stacks & Queues',
      subtopic: 'Stack Basics',
      question: 'Which data structure follows LIFO (Last In First Out) principle?',
      type: 'multiple-choice',
      difficulty: 'easy',
      options: ['Queue', 'Stack', 'Array', 'Tree'],
      correctAnswer: 1,
      explanation: 'Stack follows LIFO - the last element added is the first one to be removed.',
      points: 5,
    },
    {
      id: 'sq-2',
      topic: 'Stacks & Queues',
      subtopic: 'Applications',
      question: 'What is the time complexity of push and pop operations in a stack?',
      type: 'multiple-choice',
      difficulty: 'easy',
      options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
      correctAnswer: 0,
      explanation: 'Both push and pop are O(1) operations as they only modify the top of the stack.',
      points: 5,
    },
  ],
  'Binary Search': [
    {
      id: 'bs-1',
      topic: 'Binary Search',
      subtopic: 'Basics',
      question: 'What is the time complexity of binary search?',
      type: 'multiple-choice',
      difficulty: 'easy',
      options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
      correctAnswer: 2,
      explanation: 'Binary search divides the search space in half each iteration, resulting in O(log n) complexity.',
      points: 5,
    },
    {
      id: 'bs-2',
      topic: 'Binary Search',
      subtopic: 'Prerequisites',
      question: 'Binary search requires the array to be:',
      type: 'multiple-choice',
      difficulty: 'easy',
      options: ['Sorted', 'Unsorted', 'Circular', 'Empty'],
      correctAnswer: 0,
      explanation: 'Binary search only works on sorted arrays to efficiently eliminate half the search space.',
      points: 5,
    },
  ],
  'Recursion': [
    {
      id: 'rec-1',
      topic: 'Recursion',
      subtopic: 'Basics',
      question: 'What is the base case in recursion?',
      type: 'multiple-choice',
      difficulty: 'easy',
      options: ['The first recursive call', 'The condition that stops recursion', 'The largest input', 'The return statement'],
      correctAnswer: 1,
      explanation: 'Base case is the condition that stops recursion to prevent infinite loops.',
      points: 5,
    },
    {
      id: 'rec-2',
      topic: 'Recursion',
      subtopic: 'Stack',
      question: 'What happens if a recursive function has no base case?',
      type: 'multiple-choice',
      difficulty: 'medium',
      options: ['It runs once', 'Stack overflow error', 'Compilation error', 'Nothing'],
      correctAnswer: 1,
      explanation: 'Without a base case, recursion continues indefinitely until the call stack overflows.',
      points: 10,
    },
  ],
};

// Fetch user's learning topics from their session history
export async function getUserLearningTopics(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured) return [];
  
  try {
    const { data, error } = await supabase
      .from('learning_sessions')
      .select('topic_name')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('[Quiz] Error fetching user topics:', error);
      return [];
    }
    
    const topics = [...new Set(data?.map(s => s.topic_name).filter(Boolean) || [])];
    console.log('[Quiz] User learning topics:', topics);
    return topics;
  } catch (error) {
    console.error('[Quiz] Error in getUserLearningTopics:', error);
    return [];
  }
}

// Generate quiz questions dynamically via API with adaptive logic
export async function generateQuiz(config: TopicQuizConfig, userId?: string): Promise<QuizQuestion[]> {
  const { topic, questionCount, difficulty } = config;
  
  // Validation
  if (!topic || topic.trim().length === 0) {
    console.error('[Quiz] Invalid topic provided');
    return [];
  }

  if (questionCount <= 0 || questionCount > 20) {
    console.error('[Quiz] Invalid question count:', questionCount);
    return [];
  }

  console.log(`[Quiz] Generating quiz: topic="${topic}", count=${questionCount}, difficulty="${difficulty}", userId=${userId ? 'provided' : 'none'}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout

    const response = await fetch('/api/quiz/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: topic.trim(),
        difficulty: difficulty || 'mixed',
        count: questionCount,
        userId: userId, // Pass userId for adaptive generation
        adaptiveMode: !!userId, // Enable adaptive mode when userId is available
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `API returned ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid response format from API');
    }

    if (data.questions.length === 0) {
      throw new Error('No questions generated');
    }

    // Log quiz plan metadata if available
    if (data.metadata?.plan) {
      console.log('[Quiz] Quiz plan:', data.metadata.plan);
    }

    console.log(`[Quiz] Successfully generated ${data.questions.length} questions`);
    return data.questions;

  } catch (error: any) {
    console.error('[Quiz] Error generating quiz:', error.message || error);
    
    // Fallback to static bank if API fails
    const topicQuestions = QUESTION_BANK[topic] || [];
    if (topicQuestions.length > 0) {
      console.log('[Quiz] Falling back to static questions');
      let filteredQuestions = topicQuestions;
      if (difficulty && difficulty !== 'mixed') {
        filteredQuestions = topicQuestions.filter(q => q.difficulty === difficulty);
      }
      const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));
      console.log(`[Quiz] Using ${selected.length} static questions as fallback`);
      return selected;
    }
    
    console.error('[Quiz] No fallback questions available for topic:', topic);
    return [];
  }
}

// Create a new quiz session
export async function createQuizSession(
  userId: string,
  config: TopicQuizConfig
): Promise<QuizSession> {
  // Validate inputs
  if (!userId || userId.trim().length === 0) {
    throw new Error('Valid user ID is required to create a quiz session');
  }

  if (!config.topic || config.topic.trim().length === 0) {
    throw new Error('Valid topic is required to create a quiz session');
  }

  if (!config.questionCount || config.questionCount <= 0) {
    throw new Error('Valid question count is required');
  }

  console.log(`[Quiz] Creating session for user ${userId}, topic: ${config.topic}`);

  const questions = await generateQuiz(config, userId);
  
  if (questions.length === 0) {
    throw new Error(`No questions available for topic "${config.topic}". Please try a different topic or check your connection.`);
  }
  
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 10), 0);
  
  const session: QuizSession = {
    id: sessionId,
    clerk_user_id: userId,
    topic: config.topic.trim(),
    questions,
    attempts: [],
    started_at: now,
    completed_at: null,
    score: 0,
    total_points: totalPoints,
    accuracy: 0,
    average_time_per_question: 0,
    status: 'in-progress',
  };
  
  // Store in cache
  sessionCache.set(sessionId, session);
  console.log(`[Quiz] Created session ${sessionId} with ${questions.length} questions, ${totalPoints} total points`);
  
  // Store in Supabase
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('quiz_sessions')
        .insert({
          id: session.id,
          clerk_user_id: session.clerk_user_id,
          topic: session.topic,
          questions: session.questions,
          attempts: session.attempts,
          started_at: session.started_at,
          completed_at: session.completed_at,
          score: session.score,
          total_points: session.total_points,
          accuracy: session.accuracy,
          average_time_per_question: session.average_time_per_question,
          status: session.status,
        });
      
      if (error) {
        console.error('[Quiz] Error storing session in Supabase:', error);
      } else {
        console.log('[Quiz] Session stored in Supabase');
      }
    } catch (error) {
      console.error('[Quiz] Failed to store quiz session:', error);
    }
  }
  
  return session;
}

// Submit an answer for a question
export async function submitAnswer(
  sessionId: string,
  questionId: string,
  userAnswer: string | number,
  timeSpent: number
): Promise<{ isCorrect: boolean; explanation: string }> {
  // Validate inputs
  if (!sessionId || sessionId.trim().length === 0) {
    throw new Error('Valid session ID is required');
  }

  if (!questionId || questionId.trim().length === 0) {
    throw new Error('Valid question ID is required');
  }

  if (userAnswer === null || userAnswer === undefined) {
    throw new Error('Answer is required');
  }

  if (typeof timeSpent !== 'number' || timeSpent < 0) {
    console.warn('[Quiz] Invalid time spent, using 0');
    timeSpent = 0;
  }

  console.log(`[Quiz] Submitting answer for session ${sessionId}, question ${questionId}`);
  
  // Try to get from cache first
  let session = sessionCache.get(sessionId);
  
  // If not in cache, try to fetch from Supabase
  if (!session && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (error) {
        console.error('[Quiz] Error fetching session from Supabase:', error);
      } else if (data) {
        session = data as QuizSession;
        sessionCache.set(sessionId, session);
        console.log('[Quiz] Session loaded from Supabase');
      }
    } catch (error) {
      console.error('[Quiz] Error loading session:', error);
    }
  }
  
  if (!session) {
    console.error('[Quiz] Session not found:', sessionId);
    throw new Error('Session not found. Please start a new quiz.');
  }

  if (session.status === 'completed') {
    throw new Error('This quiz session has already been completed');
  }
  
  const question = session.questions.find(q => q.id === questionId);
  if (!question) {
    console.error('[Quiz] Question not found:', questionId);
    throw new Error('Question not found');
  }
  
  // Check if answer is correct with proper type handling
  let isCorrect = false;
  if (question.type === 'multiple-choice') {
    // For multiple choice, compare as numbers
    isCorrect = Number(userAnswer) === Number(question.correctAnswer);
  } else if (question.type === 'code-output') {
    // For code output, normalize and compare strings
    const userAnswerStr = String(userAnswer).toLowerCase().trim().replace(/\s+/g, '');
    const correctAnswerStr = String(question.correctAnswer).toLowerCase().trim().replace(/\s+/g, '');
    isCorrect = userAnswerStr === correctAnswerStr;
  } else {
    // For other types, compare as strings
    isCorrect = String(userAnswer).toLowerCase().trim() === String(question.correctAnswer).toLowerCase().trim();
  }
  
  console.log(`[Quiz] Answer check: ${isCorrect} (user: ${userAnswer}, correct: ${question.correctAnswer})`);
  
  // Create attempt record
  const attempt: QuizAttempt = {
    questionId,
    userAnswer,
    isCorrect,
    timeSpent,
    timestamp: new Date().toISOString(),
  };
  
  // Update session
  session.attempts = [...session.attempts, attempt];
  
  // Recalculate score and accuracy
  const correctCount = session.attempts.filter(a => a.isCorrect).length;
  const totalAttempts = session.attempts.length;
  const earnedPoints = session.questions
    .filter((q: QuizQuestion) => session!.attempts.find(a => a.questionId === q.id && a.isCorrect))
    .reduce((sum: number, q: QuizQuestion) => sum + q.points, 0);
  
  session.score = earnedPoints;
  session.accuracy = (correctCount / totalAttempts) * 100;
  
  const totalTime = session.attempts.reduce((sum, a) => sum + a.timeSpent, 0);
  session.average_time_per_question = totalTime / totalAttempts;
  
  // Update cache
  sessionCache.set(sessionId, session);
  
  // Update in Supabase (non-blocking - quiz works even if this fails)
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('quiz_sessions')
        .update({
          attempts: session.attempts,
          score: session.score,
          accuracy: session.accuracy,
          average_time_per_question: session.average_time_per_question,
        })
        .eq('id', sessionId);
      
      if (error) {
        console.warn('[Quiz] Supabase update failed (CORS or RLS):', error.message);
        console.log('[Quiz] Session cached locally - quiz continues normally');
      } else {
        console.log('[Quiz] Session updated in Supabase');
      }
    } catch (error: any) {
      // CORS errors are expected in some configurations - quiz still works via cache
      console.warn('[Quiz] Supabase update error (quiz continues via cache):', error.message);
    }
  }
  
  return {
    isCorrect,
    explanation: question.explanation,
  };
}

// Complete a quiz session and generate results
export async function completeQuizSession(sessionId: string): Promise<QuizResult | null> {
  console.log(`[Quiz] Completing session ${sessionId}`);
  
  let session = sessionCache.get(sessionId);
  
  if (!session && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (error) throw error;
      if (data) {
        session = data as QuizSession;
      }
    } catch (error) {
      console.error('[Quiz] Error fetching session for completion:', error);
    }
  }
  
  if (!session) {
    console.error('[Quiz] Session not found for completion');
    return null;
  }
  
  const completedAt = new Date().toISOString();
  const totalQuestions = session.questions.length;
  const questionsAttempted = session.attempts.length;
  const correctAnswers = session.attempts.filter((a: QuizAttempt) => a.isCorrect).length;
  const accuracy = questionsAttempted > 0 ? (correctAnswers / questionsAttempted) * 100 : 0;
  const totalTimeSpent = session.attempts.reduce((sum: number, a: QuizAttempt) => sum + a.timeSpent, 0);
  
  // Analyze strengths and weaknesses
  const subtopicPerformance = new Map<string, { correct: number; total: number }>();
  
  session.attempts.forEach((attempt: QuizAttempt) => {
    const question = session!.questions.find((q: QuizQuestion) => q.id === attempt.questionId);
    if (question && question.subtopic) {
      const current = subtopicPerformance.get(question.subtopic) || { correct: 0, total: 0 };
      current.total++;
      if (attempt.isCorrect) current.correct++;
      subtopicPerformance.set(question.subtopic, current);
    }
  });
  
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  subtopicPerformance.forEach((perf, subtopic) => {
    const score = (perf.correct / perf.total) * 100;
    if (score >= 80) {
      strengths.push(subtopic);
    } else if (score < 60) {
      weaknesses.push(subtopic);
    }
  });
  
  // Difficulty breakdown
  const difficultyBreakdown = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
  };
  
  session.attempts.forEach((attempt: QuizAttempt) => {
    const question = session!.questions.find((q: QuizQuestion) => q.id === attempt.questionId);
    if (question) {
      const difficulty = question.difficulty as DifficultyLevel;
      difficultyBreakdown[difficulty].total++;
      if (attempt.isCorrect) {
        difficultyBreakdown[difficulty].correct++;
      }
    }
  });
  
  // Build question-level results for detailed analysis
  const questionResults = session.attempts.map((attempt: QuizAttempt) => {
    const question = session.questions.find((q: QuizQuestion) => q.id === attempt.questionId);
    return {
      questionId: attempt.questionId,
      correct: attempt.isCorrect,
      timeSpent: attempt.timeSpent,
      difficulty: question?.difficulty || 'medium',
      topic: question?.topic || session.topic,
      subtopic: question?.subtopic || null,
    };
  });

  const result: QuizResult = {
    sessionId,
    userId: session.clerk_user_id,
    topic: session.topic,
    score: session.score,
    totalPoints: session.total_points,
    accuracy,
    questionsAttempted,
    totalQuestions,
    timeSpent: totalTimeSpent,
    completedAt,
    strengths,
    weaknesses,
    difficultyBreakdown,
  };
  
  console.log('[Quiz] Result calculated:', result);
  
  // Update session and store result in Supabase
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('quiz_sessions')
        .update({
          completed_at: completedAt,
          status: 'completed',
          accuracy,
          score: session.score,
        })
        .eq('id', sessionId);
      
      const resultId = `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Determine difficulty from session config or questions
      const sessionDifficulty = session.questions.length > 0 
        ? (session.questions.every(q => q.difficulty === session.questions[0].difficulty) 
            ? session.questions[0].difficulty 
            : 'mixed')
        : 'mixed';
      
      await supabase
        .from('quiz_results')
        .insert({
          id: resultId,
          session_id: sessionId,
          clerk_user_id: session.clerk_user_id,
          topic: result.topic,
          difficulty: sessionDifficulty,
          score: result.score,
          total_points: result.totalPoints,
          accuracy: result.accuracy,
          questions_attempted: result.questionsAttempted,
          total_questions: result.totalQuestions,
          time_spent: result.timeSpent,
          completed_at: result.completedAt,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
          difficulty_breakdown: result.difficultyBreakdown,
          question_results: questionResults,
        });
      
      console.log('[Quiz] Results stored in Supabase with question-level details');
    } catch (error) {
      console.error('[Quiz] Error saving quiz results:', error);
    }
  }
  
  // Clear from cache
  sessionCache.delete(sessionId);
  
  return result;
}

// Get quiz analytics for a user
export async function getQuizAnalytics(userId: string): Promise<QuizAnalytics | null> {
  if (!isSupabaseConfigured) {
    console.warn('[Quiz] Supabase not configured');
    return null;
  }
  
  try {
    const { data: results, error } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('completed_at', { ascending: false });
    
    if (error) {
      console.error('[Quiz] Error fetching analytics:', error);
      return null;
    }
    
    if (!results || results.length === 0) {
      return {
        userId,
        totalQuizzesTaken: 0,
        averageScore: 0,
        averageAccuracy: 0,
        totalTimeSpent: 0,
        topicPerformance: [],
        recentQuizzes: [],
        strongTopics: [],
        weakTopics: [],
      };
    }
    
    // Calculate overall stats
    const totalQuizzesTaken = results.length;
    const averageScore = results.reduce((sum, r) => sum + (r.score / r.total_points) * 100, 0) / totalQuizzesTaken;
    const averageAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / totalQuizzesTaken;
    const totalTimeSpent = results.reduce((sum, r) => sum + r.time_spent, 0);
    
    // Topic performance
    const topicMap = new Map<string, any[]>();
    results.forEach(r => {
      if (!topicMap.has(r.topic)) {
        topicMap.set(r.topic, []);
      }
      topicMap.get(r.topic)!.push(r);
    });
    
    const topicPerformance = Array.from(topicMap.entries()).map(([topic, quizzes]) => {
      const scores = quizzes.map(q => (q.score / q.total_points) * 100);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const bestScore = Math.max(...scores);
      const lastAttempt = new Date(quizzes[0].completed_at);
      
      // Determine trend
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (quizzes.length >= 3) {
        const recent = scores.slice(0, 2).reduce((a, b) => a + b) / 2;
        const older = scores.slice(2, 4).reduce((a, b) => a + b) / Math.min(2, scores.length - 2);
        if (recent > older + 10) trend = 'improving';
        else if (recent < older - 10) trend = 'declining';
      }
      
      return {
        topic,
        quizzesTaken: quizzes.length,
        averageScore: avgScore,
        bestScore,
        lastAttempt,
        trend,
      };
    });
    
    // Strong and weak topics
    const strongTopics = topicPerformance.filter(t => t.averageScore >= 80).map(t => t.topic);
    const weakTopics = topicPerformance.filter(t => t.averageScore < 60).map(t => t.topic);
    
    return {
      userId,
      totalQuizzesTaken,
      averageScore,
      averageAccuracy,
      totalTimeSpent,
      topicPerformance,
      recentQuizzes: results.slice(0, 5).map(r => ({
        sessionId: r.session_id,
        userId: r.clerk_user_id,
        topic: r.topic,
        score: r.score,
        totalPoints: r.total_points,
        accuracy: r.accuracy,
        questionsAttempted: r.questions_attempted,
        totalQuestions: r.total_questions,
        timeSpent: r.time_spent,
        completedAt: new Date(r.completed_at),
        strengths: r.strengths,
        weaknesses: r.weaknesses,
        difficultyBreakdown: r.difficulty_breakdown,
      })),
      strongTopics,
      weakTopics,
    };
  } catch (error) {
    console.error('[Quiz] Error in getQuizAnalytics:', error);
    return null;
  }
}

// List of supported topics for the quiz system
// These align with the modules in dsa_course.json
const SUPPORTED_TOPICS = [
  'Arrays & Strings',
  'Linked Lists', 
  'Stacks & Queues',
  'Binary Search',
  'Recursion',
  'Trees & BST',
  'Graphs',
  'Dynamic Programming',
  'Sorting & Searching',
  'Hash Maps & Sets',
  'Heaps & Priority Queues',
  'Bit Manipulation',
  'Trie',
  'Segment Trees'
];

export function getAvailableTopics(): string[] {
  // Combine static bank keys with supported topics
  const staticTopics = Object.keys(QUESTION_BANK);
  return Array.from(new Set([...staticTopics, ...SUPPORTED_TOPICS]));
}
