/**
 * QUIZ SYSTEM TYPES
 * 
 * Complete type definitions for the quiz system:
 * - Quiz questions and answers
 * - Quiz sessions and attempts
 * - Quiz results and analytics
 * - Topic-based quiz generation
 */

export type QuestionType = 'multiple-choice' | 'true-false' | 'code-output' | 'fill-blank';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface QuizQuestion {
  id: string;
  topic: string;
  subtopic?: string;
  question: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  options?: string[]; // For multiple-choice
  correctAnswer: string | number; // Index for MC, string for others
  explanation: string;
  codeSnippet?: string; // For code-related questions
  points: number;
  timeLimit?: number; // seconds
}

export interface QuizAttempt {
  questionId: string;
  userAnswer: string | number | null;
  isCorrect: boolean;
  timeSpent: number; // seconds
  timestamp: string | Date;
}

export interface QuizSession {
  id: string;
  user_id: string;
  topic: string;
  questions: QuizQuestion[];
  attempts: QuizAttempt[];
  started_at: string;
  completed_at: string | null;
  score: number;
  total_points: number;
  accuracy: number; // percentage
  average_time_per_question: number;
  status: 'in-progress' | 'completed' | 'abandoned';
}

export interface QuizResult {
  sessionId: string;
  userId: string;
  topic: string;
  score: number;
  totalPoints: number;
  accuracy: number;
  questionsAttempted: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt: string | Date;
  strengths: string[]; // Subtopics where user scored well
  weaknesses: string[]; // Subtopics needing improvement
  difficultyBreakdown: {
    easy: { correct: number; total: number };
    medium: { correct: number; total: number };
    hard: { correct: number; total: number };
  };
}

export interface TopicQuizConfig {
  topic: string;
  questionCount: number;
  difficulty: DifficultyLevel | 'mixed';
  timeLimit?: number; // total time in seconds
  includeSubtopics?: string[];
}

export interface QuizAnalytics {
  userId: string;
  totalQuizzesTaken: number;
  averageScore: number;
  averageAccuracy: number;
  totalTimeSpent: number;
  topicPerformance: {
    topic: string;
    quizzesTaken: number;
    averageScore: number;
    bestScore: number;
    lastAttempt: Date;
    trend: 'improving' | 'stable' | 'declining';
  }[];
  recentQuizzes: QuizResult[];
  strongTopics: string[];
  weakTopics: string[];
}

// Database schema interfaces
export interface QuizSessionDB {
  id: string;
  user_id: string;
  topic: string;
  questions: QuizQuestion[];
  attempts: QuizAttempt[];
  started_at: string;
  completed_at?: string;
  score: number;
  total_points: number;
  accuracy: number;
  average_time_per_question: number;
  status: 'in-progress' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
}

export interface QuizResultDB {
  id: string;
  session_id: string;
  user_id: string;
  topic: string;
  score: number;
  total_points: number;
  accuracy: number;
  questions_attempted: number;
  total_questions: number;
  time_spent: number;
  completed_at: string;
  strengths: string[];
  weaknesses: string[];
  difficulty_breakdown: {
    easy: { correct: number; total: number };
    medium: { correct: number; total: number };
    hard: { correct: number; total: number };
  };
  created_at: string;
}
