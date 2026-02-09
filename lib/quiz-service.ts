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

// Fallback question bank aligned with striver.json DSA modules
// Primary questions come from lib/quiz-questions.ts via API
const QUESTION_BANK: Record<string, QuizQuestion[]> = {
  'Arrays (1D & 2D)': [
    { id: 'arr-1', topic: 'Arrays (1D & 2D)', subtopic: 'Array Basics', question: 'What is the time complexity of accessing an array element by index?', type: 'multiple-choice', difficulty: 'easy', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], correctAnswer: 0, explanation: 'Array access by index is O(1) due to contiguous memory.', points: 5 },
    { id: 'arr-2', topic: 'Arrays (1D & 2D)', subtopic: 'Two Pointers', question: 'What technique optimizes Subarray Sum Equals K to O(n)?', type: 'multiple-choice', difficulty: 'medium', options: ['Sorting', 'Prefix sum with hashing', 'Binary search', 'Two pointers'], correctAnswer: 1, explanation: 'Prefix sum + hash map gives O(n) solution.', points: 10 },
  ],
  'Strings': [
    { id: 'str-1', topic: 'Strings', subtopic: 'Palindrome', question: 'What is a palindrome?', type: 'multiple-choice', difficulty: 'easy', options: ['Sorted string', 'Reads same forward and backward', 'Unique chars', 'Empty string'], correctAnswer: 1, explanation: 'A palindrome reads the same forward and backward.', points: 5 },
  ],
  'Binary Search': [
    { id: 'bs-1', topic: 'Binary Search', subtopic: 'Basics', question: 'What is the time complexity of binary search?', type: 'multiple-choice', difficulty: 'easy', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'], correctAnswer: 2, explanation: 'Binary search halves search space each step: O(log n).', points: 5 },
  ],
  'Recursion & Backtracking': [
    { id: 'rec-1', topic: 'Recursion & Backtracking', subtopic: 'Basics', question: 'What is the base case in recursion?', type: 'multiple-choice', difficulty: 'easy', options: ['First call', 'Condition that stops recursion', 'Largest input', 'Return type'], correctAnswer: 1, explanation: 'Base case terminates recursion to prevent stack overflow.', points: 5 },
  ],
  'Stack': [
    { id: 'stk-1', topic: 'Stack', subtopic: 'Basics', question: 'Which principle does a Stack follow?', type: 'multiple-choice', difficulty: 'easy', options: ['FIFO', 'LIFO', 'Random', 'Priority'], correctAnswer: 1, explanation: 'Stack follows LIFO (Last In First Out).', points: 5 },
  ],
  'Queue': [
    { id: 'que-1', topic: 'Queue', subtopic: 'Basics', question: 'Which principle does a Queue follow?', type: 'multiple-choice', difficulty: 'easy', options: ['LIFO', 'FIFO', 'Random', 'Priority'], correctAnswer: 1, explanation: 'Queue follows FIFO (First In First Out).', points: 5 },
  ],
  'Linked List': [
    { id: 'll-1', topic: 'Linked List', subtopic: 'Basics', question: 'Main advantage of linked list over array?', type: 'multiple-choice', difficulty: 'easy', options: ['Faster access', 'Dynamic size and O(1) insertion at head', 'Less memory', 'Cache locality'], correctAnswer: 1, explanation: 'Linked lists grow/shrink dynamically.', points: 5 },
  ],
  'Trees (Binary Tree)': [
    { id: 'tree-1', topic: 'Trees (Binary Tree)', subtopic: 'Traversal', question: 'What is Inorder traversal order?', type: 'multiple-choice', difficulty: 'easy', options: ['Root→Left→Right', 'Left→Root→Right', 'Left→Right→Root', 'Right→Root→Left'], correctAnswer: 1, explanation: 'Inorder: Left, Root, Right.', points: 5 },
  ],
  'Binary Search Tree (BST)': [
    { id: 'bst-1', topic: 'Binary Search Tree (BST)', subtopic: 'Property', question: 'Key property of a BST?', type: 'multiple-choice', difficulty: 'easy', options: ['All equal', 'Left < Root < Right', 'Right < Root < Left', 'Parent > All'], correctAnswer: 1, explanation: 'In BST, left < root < right.', points: 5 },
  ],
  'Graphs': [
    { id: 'graph-1', topic: 'Graphs', subtopic: 'BFS', question: 'Which data structure does BFS use?', type: 'multiple-choice', difficulty: 'easy', options: ['Stack', 'Queue', 'Heap', 'List'], correctAnswer: 1, explanation: 'BFS uses queue for level-by-level traversal.', points: 5 },
  ],
  'Dynamic Programming (DP)': [
    { id: 'dp-1', topic: 'Dynamic Programming (DP)', subtopic: 'Basics', question: 'Two key properties for DP?', type: 'multiple-choice', difficulty: 'easy', options: ['Sorting+searching', 'Optimal substructure + overlapping subproblems', 'Greedy+sorting', 'Divide and conquer'], correctAnswer: 1, explanation: 'DP needs optimal substructure and overlapping subproblems.', points: 5 },
  ],
  'Sorting Algorithms': [
    { id: 'sort-1', topic: 'Sorting Algorithms', subtopic: 'Merge Sort', question: 'Time complexity of Merge Sort?', type: 'multiple-choice', difficulty: 'easy', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correctAnswer: 1, explanation: 'Merge Sort always O(n log n).', points: 5 },
  ],
};

// Fetch user's learning topics from their session history
export async function getUserLearningTopics(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured || !userId) {
    console.log('[Quiz] Supabase not configured or no userId, returning empty topics');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('learning_sessions')
      .select('topic')
      .eq('user_id', userId)
      .not('topic', 'is', null);
    
    if (error) {
      // Silently handle error - table might not exist yet
      console.log('[Quiz] Could not fetch user topics (table may not exist), returning empty array');
      return [];
    }
    
    const topics = [...new Set(data?.map(s => s.topic).filter(Boolean) || [])];
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
    user_id: userId,
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
          user_id: session.user_id,
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
        // Silently handle - table might not exist, session is cached in memory
        console.log('[Quiz] Session not stored in Supabase (using memory cache only)');
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
    userId: session.user_id,
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
      // Update quiz session using UPSERT to avoid CORS PATCH errors
      const { error: quizSessionError } = await supabase
        .from('quiz_sessions')
        .upsert({
          id: sessionId,
          user_id: session.user_id,
          topic: session.topic,
          questions: session.questions,
          attempts: session.attempts,
          score: session.score,
          total_points: session.total_points,
          completed_at: completedAt,
          status: 'completed',
          accuracy,
        }, {
          onConflict: 'id',
        });
      
      if (quizSessionError) {
        console.warn('[Quiz] Failed to update quiz_sessions:', quizSessionError);
      }
      
      // **CRITICAL: Update learning_sessions table with quiz score**
      const percentageScore = Math.round((session.score / session.total_points) * 100);
      
      console.log('[Quiz] Updating learning_sessions with quiz_score:', percentageScore);
      console.log('[Quiz] Looking for session with topic:', session.topic);
      
      // Get ALL learning sessions for this user and topic to find the right one
      const { data: allSessions, error: fetchError } = await supabase
        .from('learning_sessions')
        .select('id, session_id, topic_name, quiz_score, started_at')
        .eq('user_id', session.user_id)
        .ilike('topic_name', `%${session.topic}%`)
        .order('started_at', { ascending: false })
        .limit(5);
      
      console.log('[Quiz] Found learning sessions:', allSessions?.length || 0);
      if (allSessions && allSessions.length > 0) {
        console.log('[Quiz] Sessions:', allSessions.map(s => ({ 
          id: s.id, 
          topic: s.topic_name, 
          quiz_score: s.quiz_score,
          started_at: s.started_at
        })));
      }
      
      if (fetchError) {
        console.warn('[Quiz] Failed to fetch learning_sessions:', fetchError);
      } else if (allSessions && allSessions.length > 0) {
        // Find first session without quiz_score or use the most recent one
        const learningSession = allSessions.find(s => s.quiz_score === null) || allSessions[0];
        
        console.log('[Quiz] Updating session:', learningSession.id);
        
        // Use UPSERT to update the learning session with quiz score
        const { error: updateError } = await supabase
          .from('learning_sessions')
          .upsert({
            id: learningSession.id,
            session_id: learningSession.session_id,
            user_id: session.user_id,
            topic_name: learningSession.topic_name,
            quiz_score: percentageScore,
          }, {
            onConflict: 'id',
          });
        
        if (updateError) {
          console.warn('[Quiz] Failed to update learning_sessions:', updateError);
        } else {
          console.log('[Quiz] ✅ Successfully updated learning_sessions with score:', percentageScore);
        }
      } else {
        console.warn('[Quiz] ⚠️ No matching learning_sessions found for topic:', session.topic);
      }
      
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
          user_id: session.user_id,
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
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });
    
    if (error) {
      // Return null if table doesn't exist - graceful degradation
      console.log('[Quiz] Analytics not available (table may not exist)');
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
        userId: r.user_id,
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

// Supported topics aligned with striver.json modules
const SUPPORTED_TOPICS = [
  'Time & Space Complexity',
  'Arrays (1D & 2D)',
  'Strings',
  'Binary Search',
  'Recursion & Backtracking',
  'Stack',
  'Queue',
  'Linked List',
  'Trees (Binary Tree)',
  'Binary Search Tree (BST)',
  'Heap & Priority Queue',
  'Hashing',
  'Graphs',
  'Dynamic Programming (DP)',
  'Greedy Algorithms',
  'Bit Manipulation',
  'Sorting Algorithms',
  'Advanced Graph Algorithms',
  'Trie (Prefix Tree)',
  'Segment Tree & Fenwick Tree',
  'Disjoint Set Union (Union Find)',
  'Interview Patterns',
  'Advanced Dynamic Programming',
  'String Algorithms (Advanced)',
];

export { SUPPORTED_TOPICS };

export function getAvailableTopics(): string[] {
  const staticTopics = Object.keys(QUESTION_BANK);
  return Array.from(new Set([...staticTopics, ...SUPPORTED_TOPICS]));
}
