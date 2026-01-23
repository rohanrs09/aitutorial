/**
 * GEMINI QUIZ GENERATOR
 * 
 * Dedicated service for generating high-quality quiz questions using Google Gemini API
 * Features:
 * - Topic-based question generation from course content
 * - Proper answer validation and explanation
 * - Difficulty-aware generation
 * - Structured JSON output
 * - Answer analysis and feedback
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { QuizQuestion, DifficultyLevel } from './quiz-types';
import { getCourseContentForTopic } from './quiz-generator';

interface GeminiQuizConfig {
  topic: string;
  questionCount: number;
  difficulty: DifficultyLevel | 'mixed';
  subtopics?: string[];
  userContext?: {
    weakAreas?: string[];
    masteryLevel?: number;
  };
}

interface QuestionGenerationResult {
  questions: QuizQuestion[];
  metadata: {
    topic: string;
    generatedCount: number;
    difficultyDistribution: Record<string, number>;
    subtopicsCovered: string[];
  };
}

/**
 * Initialize Gemini client with API key validation
 */
function initializeGemini(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('GEMINI_API_KEY is not configured. Please add it to your .env.local file.');
  }
  
  if (apiKey.length < 20) {
    throw new Error('GEMINI_API_KEY appears to be invalid (too short). Please verify your API key.');
  }
  
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Build a comprehensive prompt for Gemini to generate quiz questions
 */
function buildGeminiQuizPrompt(config: GeminiQuizConfig, courseContent: any): string {
  const { topic, questionCount, difficulty, subtopics, userContext } = config;
  
  // Calculate difficulty distribution
  let difficultyBreakdown = '';
  if (difficulty === 'mixed') {
    const easy = Math.ceil(questionCount * 0.3);
    const medium = Math.ceil(questionCount * 0.5);
    const hard = questionCount - easy - medium;
    difficultyBreakdown = `Generate ${easy} easy, ${medium} medium, and ${hard} hard questions.`;
  } else {
    difficultyBreakdown = `Generate all ${questionCount} questions at ${difficulty} difficulty level.`;
  }
  
  // Build subtopic guidance
  let subtopicGuidance = '';
  if (subtopics && subtopics.length > 0) {
    subtopicGuidance = `\n\nFocus on these subtopics: ${subtopics.join(', ')}`;
  }
  
  // Build user context guidance
  let contextGuidance = '';
  if (userContext?.weakAreas && userContext.weakAreas.length > 0) {
    contextGuidance = `\n\nUser's weak areas: ${userContext.weakAreas.join(', ')}. Include questions that help strengthen these areas.`;
  }
  
  // Course content context
  let contentContext = '';
  if (courseContent) {
    contentContext = `\n\nCourse Content for Reference:\n${JSON.stringify(courseContent, null, 2)}`;
  }
  
  return `You are an expert educational quiz generator specializing in Data Structures and Algorithms.

Generate ${questionCount} high-quality multiple-choice quiz questions about "${topic}".

${difficultyBreakdown}${subtopicGuidance}${contextGuidance}

Requirements:
1. Each question must be clear, unambiguous, and test understanding (not just memorization)
2. Provide exactly 4 options for each question
3. Mark the correct answer index (0-3)
4. Include a detailed explanation for why the answer is correct
5. Ensure questions cover different aspects of the topic
6. Use real-world examples where applicable
7. For code-related questions, use proper syntax
8. Difficulty levels:
   - Easy: Basic concepts, definitions, simple applications
   - Medium: Problem-solving, analysis, comparing approaches
   - Hard: Complex scenarios, optimization, edge cases

${contentContext}

Return ONLY a valid JSON array with this exact structure (no additional text):

[
  {
    "id": "unique-id-1",
    "topic": "${topic}",
    "subtopic": "specific subtopic name",
    "question": "Clear question text",
    "type": "multiple-choice",
    "difficulty": "easy|medium|hard",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation of why this answer is correct and why others are wrong",
    "points": 10
  }
]

IMPORTANT: 
- Return ONLY the JSON array, no markdown, no code blocks, no extra text
- Ensure all JSON is properly formatted and valid
- correctAnswer must be an integer (0-3) matching the index in options array
- Each question must have all required fields
- Make explanations educational and helpful for learning`;
}

/**
 * Validate and normalize questions from Gemini response
 */
function validateGeminiQuestions(questions: any[], topic: string): QuizQuestion[] {
  const validated: QuizQuestion[] = [];
  
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    
    try {
      // Validate required fields
      if (!q.question || typeof q.question !== 'string') {
        console.warn(`[GeminiQuiz] Question ${i} missing valid question text`);
        continue;
      }
      
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        console.warn(`[GeminiQuiz] Question ${i} must have exactly 4 options`);
        continue;
      }
      
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
        console.warn(`[GeminiQuiz] Question ${i} has invalid correctAnswer index`);
        continue;
      }
      
      if (!q.explanation || typeof q.explanation !== 'string') {
        console.warn(`[GeminiQuiz] Question ${i} missing explanation`);
        continue;
      }
      
      // Validate difficulty
      const validDifficulties = ['easy', 'medium', 'hard'];
      const difficulty = validDifficulties.includes(q.difficulty) ? q.difficulty : 'medium';
      
      // Create validated question
      const validatedQuestion: QuizQuestion = {
        id: q.id || `${topic.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${i}`,
        topic: topic,
        subtopic: q.subtopic || topic,
        question: q.question.trim(),
        type: 'multiple-choice',
        difficulty: difficulty as DifficultyLevel,
        options: q.options.map((opt: any) => String(opt).trim()),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation.trim(),
        points: q.points || (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20),
      };
      
      validated.push(validatedQuestion);
    } catch (error) {
      console.error(`[GeminiQuiz] Error validating question ${i}:`, error);
      continue;
    }
  }
  
  return validated;
}

/**
 * Parse Gemini response and extract JSON
 */
function parseGeminiResponse(content: string): any[] {
  let cleanContent = content.trim();
  
  // Remove markdown code blocks
  cleanContent = cleanContent.replace(/```json\s*/gi, '');
  cleanContent = cleanContent.replace(/```\s*/g, '');
  
  // Find JSON array
  const arrayMatch = cleanContent.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    cleanContent = arrayMatch[0];
  } else {
    // Try to find the start of an array
    const startIndex = cleanContent.indexOf('[');
    if (startIndex !== -1) {
      const endIndex = cleanContent.lastIndexOf(']');
      if (endIndex !== -1) {
        cleanContent = cleanContent.substring(startIndex, endIndex + 1);
      }
    }
  }
  
  try {
    const parsed = JSON.parse(cleanContent);
    
    // Handle wrapper objects
    if (!Array.isArray(parsed)) {
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return parsed.questions;
      }
      throw new Error('Response is not an array and has no questions property');
    }
    
    return parsed;
  } catch (error: any) {
    console.error('[GeminiQuiz] JSON parse error:', error.message);
    console.error('[GeminiQuiz] Content preview:', cleanContent.substring(0, 500));
    throw new Error(`Failed to parse Gemini response as JSON: ${error.message}`);
  }
}

/**
 * Generate quiz questions using Gemini API
 */
export async function generateQuizWithGemini(config: GeminiQuizConfig): Promise<QuestionGenerationResult> {
  console.log('[GeminiQuiz] Starting generation:', {
    topic: config.topic,
    count: config.questionCount,
    difficulty: config.difficulty,
  });
  
  try {
    // Initialize Gemini
    const genAI = initializeGemini();
    
    // Try multiple model names for compatibility with different API versions
    const modelCandidates = [
      process.env.GEMINI_MODEL_NAME,
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
    ].filter(Boolean);
    
    let model;
    let workingModel = '';
    
    for (const modelName of modelCandidates) {
      try {
        console.log(`[GeminiQuiz] Trying model: ${modelName}`);
        model = genAI.getGenerativeModel({ model: modelName as string });
        workingModel = modelName as string;
        console.log(`[GeminiQuiz] ✅ Successfully loaded model: ${modelName}`);
        break;
      } catch (modelError: any) {
        console.log(`[GeminiQuiz] ❌ Model ${modelName} failed: ${modelError.message}`);
      }
    }
    
    if (!model) {
      throw new Error('No compatible Gemini model found. Please check your API key and try: GEMINI_MODEL_NAME=gemini-1.5-flash');
    }
    
    // Get course content for context
    const courseContent = await getCourseContentForTopic(config.topic);
    
    // Build prompt
    const prompt = buildGeminiQuizPrompt(config, courseContent);
    
    // Generate content with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Gemini API timeout after 30 seconds')), 30000)
    );
    
    const generationPromise = model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4000,
        topP: 0.8,
        topK: 40,
      },
    });
    
    const result = await Promise.race([generationPromise, timeoutPromise]) as any;
    
    if (!result || !result.response) {
      throw new Error('No response from Gemini API');
    }
    
    const response = result.response;
    const text = response.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from Gemini API');
    }
    
    console.log('[GeminiQuiz] Received response, length:', text.length);
    
    // Parse and validate questions
    const parsedQuestions = parseGeminiResponse(text);
    const validatedQuestions = validateGeminiQuestions(parsedQuestions, config.topic);
    
    if (validatedQuestions.length === 0) {
      throw new Error('No valid questions generated. Please try again.');
    }
    
    // Calculate metadata
    const difficultyDistribution = {
      easy: validatedQuestions.filter(q => q.difficulty === 'easy').length,
      medium: validatedQuestions.filter(q => q.difficulty === 'medium').length,
      hard: validatedQuestions.filter(q => q.difficulty === 'hard').length,
    };
    
    const subtopicsCovered = [...new Set(validatedQuestions.map(q => q.subtopic).filter((s): s is string => !!s))];
    
    console.log('[GeminiQuiz] Generation successful:', {
      requested: config.questionCount,
      generated: validatedQuestions.length,
      difficultyDistribution,
      subtopicsCovered: subtopicsCovered.length,
    });
    
    return {
      questions: validatedQuestions,
      metadata: {
        topic: config.topic,
        generatedCount: validatedQuestions.length,
        difficultyDistribution,
        subtopicsCovered,
      },
    };
    
  } catch (error: any) {
    console.error('[GeminiQuiz] Generation failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('API_KEY')) {
      throw new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY environment variable.');
    } else if (error.message.includes('404') || error.message.includes('not found') || error.message.includes('not supported')) {
      throw new Error('Gemini model not available. Try GEMINI_MODEL_NAME=gemini-1.5-flash in .env.local and restart server');
    } else if (error.message.includes('timeout')) {
      throw new Error('Gemini API request timed out. Please try again.');
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      throw new Error('Gemini API quota exceeded. Please check your usage limits.');
    } else {
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }
}

/**
 * Generate fallback questions when Gemini API is unavailable
 * Uses a curated question bank based on topic
 */
export function generateFallbackQuestions(
  topic: string,
  count: number,
  difficulty: DifficultyLevel | 'mixed'
): QuizQuestion[] {
  console.log('[GeminiQuiz] Generating fallback questions for:', topic);
  
  // Basic question templates for common topics
  const fallbackBank: Record<string, QuizQuestion[]> = {
    'Arrays & Strings': [
      {
        id: 'arrays-1',
        topic: 'Arrays & Strings',
        subtopic: 'Array Basics',
        question: 'What is the time complexity of accessing an element in an array by index?',
        type: 'multiple-choice',
        difficulty: 'easy',
        options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
        correctAnswer: 2,
        explanation: 'Array access by index is O(1) because arrays store elements in contiguous memory locations, allowing direct access using the index.',
        points: 10,
      },
      {
        id: 'arrays-2',
        topic: 'Arrays & Strings',
        subtopic: 'String Operations',
        question: 'Which operation is most efficient for concatenating multiple strings?',
        type: 'multiple-choice',
        difficulty: 'medium',
        options: ['Using + operator repeatedly', 'Using StringBuilder/StringBuffer', 'Using concat() method', 'Using array join()'],
        correctAnswer: 1,
        explanation: 'StringBuilder/StringBuffer is most efficient for multiple concatenations as it avoids creating intermediate string objects, unlike the + operator which creates a new string object for each concatenation.',
        points: 15,
      },
    ],
    'Strings': [
      {
        id: 'strings-1',
        topic: 'Strings',
        subtopic: 'String Basics',
        question: 'Are strings mutable or immutable in most programming languages like Java and Python?',
        type: 'multiple-choice',
        difficulty: 'easy',
        options: ['Mutable', 'Immutable', 'Depends on declaration', 'Both'],
        correctAnswer: 1,
        explanation: 'Strings are immutable in Java, Python, and many other languages. Once created, their content cannot be changed. Any modification creates a new string object.',
        points: 10,
      },
      {
        id: 'strings-2',
        topic: 'Strings',
        subtopic: 'String Comparison',
        question: 'What is the time complexity of comparing two strings of length n?',
        type: 'multiple-choice',
        difficulty: 'medium',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
        correctAnswer: 2,
        explanation: 'String comparison requires checking each character until a difference is found or the end is reached, making it O(n) where n is the length of the shorter string.',
        points: 15,
      },
    ],
    'Linked Lists': [
      {
        id: 'linkedlist-1',
        topic: 'Linked Lists',
        subtopic: 'Linked List Basics',
        question: 'What is the time complexity of inserting an element at the beginning of a singly linked list?',
        type: 'multiple-choice',
        difficulty: 'easy',
        options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
        correctAnswer: 2,
        explanation: 'Inserting at the beginning of a linked list is O(1) as it only requires updating the head pointer and the new node\'s next pointer.',
        points: 10,
      },
    ],
  };
  
  // Get questions for the topic or use generic ones
  let questions = fallbackBank[topic] || fallbackBank['Arrays & Strings'];
  
  // Filter by difficulty if not mixed
  if (difficulty !== 'mixed') {
    questions = questions.filter(q => q.difficulty === difficulty);
  }
  
  // If not enough questions, duplicate with modified IDs
  while (questions.length < count) {
    const baseQuestion = questions[questions.length % questions.length];
    questions.push({
      ...baseQuestion,
      id: `${baseQuestion.id}-${questions.length}`,
    });
  }
  
  // Return requested count
  return questions.slice(0, count);
}

/**
 * Analyze user's answer and provide detailed feedback
 */
export function analyzeAnswer(
  question: QuizQuestion,
  userAnswer: number,
  timeSpent?: number
): {
  isCorrect: boolean;
  feedback: string;
  detailedAnalysis: string;
  learningPoints: string[];
} {
  const isCorrect = userAnswer === question.correctAnswer;
  
  // Ensure options exist
  if (!question.options || question.options.length < 4) {
    throw new Error('Invalid question: missing or incomplete options');
  }
  
  // Ensure correctAnswer is a number for multiple choice
  const correctAnswerIndex = typeof question.correctAnswer === 'number' 
    ? question.correctAnswer 
    : parseInt(String(question.correctAnswer), 10);
  
  // Generate feedback based on correctness
  let feedback = '';
  if (isCorrect) {
    feedback = '✅ Correct! Well done!';
  } else {
    const correctOption = question.options[correctAnswerIndex];
    const userOption = question.options[userAnswer];
    feedback = `❌ Incorrect. You selected "${userOption}", but the correct answer is "${correctOption}".`;
  }
  
  // Detailed analysis
  let detailedAnalysis = question.explanation || 'No explanation available.';
  
  if (!isCorrect) {
    detailedAnalysis += `\n\nYour answer: ${question.options[userAnswer]}\nCorrect answer: ${question.options[correctAnswerIndex]}`;
  }
  
  // Extract learning points from explanation
  const learningPoints: string[] = [];
  
  // Add time-based feedback
  if (timeSpent !== undefined) {
    if (timeSpent < 10) {
      learningPoints.push('Take more time to read the question carefully');
    } else if (timeSpent > 120) {
      learningPoints.push('Try to improve your speed while maintaining accuracy');
    }
  }
  
  // Add difficulty-based learning points
  if (!isCorrect) {
    if (question.difficulty === 'easy') {
      learningPoints.push('Review the basic concepts of ' + question.subtopic);
    } else if (question.difficulty === 'medium') {
      learningPoints.push('Practice more problems on ' + question.subtopic);
    } else {
      learningPoints.push('Study advanced topics and edge cases in ' + question.subtopic);
    }
  }
  
  return {
    isCorrect,
    feedback,
    detailedAnalysis,
    learningPoints,
  };
}
