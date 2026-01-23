/**
 * QUIZ GENERATOR SERVICE
 * 
 * Deterministic quiz generation based on:
 * 1. Course structure (modules, topics, subtopics)
 * 2. User-selected configuration (topic, count, difficulty)
 * 3. Subtopic coverage distribution
 * 4. User performance history (adaptive logic)
 * 5. Difficulty distribution rules
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { QuizQuestion, TopicQuizConfig, DifficultyLevel } from './quiz-types';

// Course structure interface
interface CourseModule {
  module_id: string;
  module_number: number;
  title: string;
  topics: CourseTopic[];
}

interface CourseTopic {
  topic_id: string;
  title: string;
  content: string;
  key_points?: string[];
  prerequisites?: string[];
  difficulty: string;
  code_examples?: { code: string; output: string }[];
}

interface UserPerformance {
  topic: string;
  accuracy: number;
  weakSubtopics: string[];
  strongSubtopics: string[];
  lastAttempt: Date | null;
  quizCount: number;
}

interface QuizGenerationConfig {
  topic: string;
  moduleId?: string;
  questionCount: number;
  difficulty: DifficultyLevel | 'mixed';
  userId?: string;
  focusSubtopics?: string[];
  adaptiveMode?: boolean;
}

interface GeneratedQuizPlan {
  totalQuestions: number;
  difficultyDistribution: { easy: number; medium: number; hard: number };
  subtopicCoverage: Map<string, number>;
  focusAreas: string[];
  adaptiveAdjustments: string[];
}

// Load course data
let courseData: { modules: CourseModule[] } | null = null;

async function loadCourseData(): Promise<{ modules: CourseModule[] }> {
  if (courseData) return courseData;
  
  try {
    // Dynamic import of course JSON
    const data = await import('@/SLM/dsa_course.json');
    courseData = data.default || data;
    return courseData as { modules: CourseModule[] };
  } catch (error) {
    console.error('[QuizGenerator] Failed to load course data:', error);
    return { modules: [] };
  }
}

// Get user's performance history for a topic
async function getUserPerformance(userId: string, topic: string): Promise<UserPerformance | null> {
  if (!isSupabaseConfigured || !userId) return null;
  
  try {
    const { data: analytics, error } = await supabase
      .from('quiz_analytics')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('topic', topic)
      .single();
    
    if (error || !analytics) return null;
    
    // Get recent quiz results for detailed subtopic analysis
    const { data: recentResults } = await supabase
      .from('quiz_results')
      .select('question_results, weaknesses, strengths')
      .eq('clerk_user_id', userId)
      .eq('topic', topic)
      .order('completed_at', { ascending: false })
      .limit(5);
    
    const weakSubtopics = new Set<string>();
    const strongSubtopics = new Set<string>();
    
    recentResults?.forEach(result => {
      result.weaknesses?.forEach((w: string) => weakSubtopics.add(w));
      result.strengths?.forEach((s: string) => strongSubtopics.add(s));
    });
    
    return {
      topic,
      accuracy: analytics.average_accuracy || 0,
      weakSubtopics: Array.from(weakSubtopics),
      strongSubtopics: Array.from(strongSubtopics),
      lastAttempt: analytics.last_attempt_at ? new Date(analytics.last_attempt_at) : null,
      quizCount: analytics.total_quizzes || 0,
    };
  } catch (error) {
    console.error('[QuizGenerator] Error fetching user performance:', error);
    return null;
  }
}

// Calculate difficulty distribution based on user performance
function calculateDifficultyDistribution(
  questionCount: number,
  requestedDifficulty: DifficultyLevel | 'mixed',
  userPerformance: UserPerformance | null
): { easy: number; medium: number; hard: number } {
  if (requestedDifficulty !== 'mixed') {
    // Single difficulty requested
    return {
      easy: requestedDifficulty === 'easy' ? questionCount : 0,
      medium: requestedDifficulty === 'medium' ? questionCount : 0,
      hard: requestedDifficulty === 'hard' ? questionCount : 0,
    };
  }
  
  // Default mixed distribution: 30% easy, 50% medium, 20% hard
  let easyRatio = 0.3;
  let mediumRatio = 0.5;
  let hardRatio = 0.2;
  
  // Adjust based on user performance (adaptive)
  if (userPerformance) {
    const accuracy = userPerformance.accuracy;
    
    if (accuracy >= 85) {
      // High performer: reduce easy, increase hard
      easyRatio = 0.15;
      mediumRatio = 0.45;
      hardRatio = 0.4;
    } else if (accuracy >= 70) {
      // Good performer: balanced
      easyRatio = 0.2;
      mediumRatio = 0.5;
      hardRatio = 0.3;
    } else if (accuracy >= 50) {
      // Average performer: standard
      easyRatio = 0.3;
      mediumRatio = 0.5;
      hardRatio = 0.2;
    } else {
      // Struggling: more easy questions
      easyRatio = 0.5;
      mediumRatio = 0.4;
      hardRatio = 0.1;
    }
  }
  
  // Calculate counts ensuring we reach the total
  const easy = Math.round(questionCount * easyRatio);
  const hard = Math.round(questionCount * hardRatio);
  const medium = questionCount - easy - hard;
  
  return { easy, medium, hard };
}

// Get subtopics from course data for a given topic
function getSubtopicsForTopic(course: { modules: CourseModule[] }, topicName: string): string[] {
  const subtopics: string[] = [];
  
  for (const mod of course.modules) {
    // Check if module title matches
    if (mod.title.toLowerCase().includes(topicName.toLowerCase()) ||
        topicName.toLowerCase().includes(mod.title.toLowerCase())) {
      mod.topics.forEach(t => subtopics.push(t.title));
      break;
    }
    
    // Check individual topics
    for (const topic of mod.topics) {
      if (topic.title.toLowerCase().includes(topicName.toLowerCase()) ||
          topicName.toLowerCase().includes(topic.title.toLowerCase())) {
        subtopics.push(topic.title);
      }
    }
  }
  
  return subtopics;
}

// Plan subtopic coverage for the quiz
function planSubtopicCoverage(
  subtopics: string[],
  questionCount: number,
  userPerformance: UserPerformance | null,
  focusSubtopics?: string[]
): Map<string, number> {
  const coverage = new Map<string, number>();
  
  if (subtopics.length === 0) {
    coverage.set('general', questionCount);
    return coverage;
  }
  
  // Priority subtopics (weak areas or specified focus)
  const prioritySubtopics = new Set<string>([
    ...(focusSubtopics || []),
    ...(userPerformance?.weakSubtopics || []),
  ]);
  
  // Calculate questions per subtopic
  const priorityCount = Math.min(prioritySubtopics.size, Math.ceil(questionCount * 0.4));
  const regularCount = questionCount - priorityCount;
  
  // Distribute among priority subtopics
  let assigned = 0;
  prioritySubtopics.forEach((subtopic, index) => {
    if (assigned < priorityCount) {
      const count = Math.ceil(priorityCount / prioritySubtopics.size);
      coverage.set(subtopic, count);
      assigned += count;
    }
  });
  
  // Distribute remaining among all subtopics
  const remainingSubtopics = subtopics.filter(s => !coverage.has(s));
  if (remainingSubtopics.length > 0) {
    const perSubtopic = Math.ceil(regularCount / remainingSubtopics.length);
    remainingSubtopics.forEach(subtopic => {
      coverage.set(subtopic, Math.min(perSubtopic, regularCount));
    });
  }
  
  return coverage;
}

// Create quiz generation plan
export async function createQuizPlan(config: QuizGenerationConfig): Promise<GeneratedQuizPlan> {
  const course = await loadCourseData();
  const userPerformance = config.userId 
    ? await getUserPerformance(config.userId, config.topic)
    : null;
  
  const subtopics = getSubtopicsForTopic(course, config.topic);
  
  const difficultyDistribution = calculateDifficultyDistribution(
    config.questionCount,
    config.difficulty,
    config.adaptiveMode ? userPerformance : null
  );
  
  const subtopicCoverage = planSubtopicCoverage(
    subtopics,
    config.questionCount,
    userPerformance,
    config.focusSubtopics
  );
  
  const adaptiveAdjustments: string[] = [];
  if (userPerformance && config.adaptiveMode) {
    if (userPerformance.accuracy < 50) {
      adaptiveAdjustments.push('Increased easy questions due to low accuracy');
    } else if (userPerformance.accuracy > 85) {
      adaptiveAdjustments.push('Increased hard questions due to high accuracy');
    }
    if (userPerformance.weakSubtopics.length > 0) {
      adaptiveAdjustments.push(`Focusing on weak areas: ${userPerformance.weakSubtopics.join(', ')}`);
    }
  }
  
  return {
    totalQuestions: config.questionCount,
    difficultyDistribution,
    subtopicCoverage,
    focusAreas: userPerformance?.weakSubtopics || [],
    adaptiveAdjustments,
  };
}

// Build the prompt for AI question generation
export function buildQuizPrompt(
  config: QuizGenerationConfig,
  plan: GeneratedQuizPlan,
  courseContent: string
): string {
  const { difficultyDistribution, subtopicCoverage } = plan;
  
  const subtopicList = Array.from(subtopicCoverage.entries())
    .map(([topic, count]) => `- ${topic}: ${count} question(s)`)
    .join('\n');
  
  return `Generate ${config.questionCount} multiple-choice quiz questions about "${config.topic}".

REQUIREMENTS:
1. Difficulty Distribution:
   - Easy: ${difficultyDistribution.easy} questions (basic recall, definitions)
   - Medium: ${difficultyDistribution.medium} questions (application, understanding)
   - Hard: ${difficultyDistribution.hard} questions (analysis, problem-solving)

2. Subtopic Coverage:
${subtopicList || '- Cover all key concepts of the topic'}

3. Question Quality:
   - Each question must have exactly 4 options
   - Only one correct answer per question
   - Options should be plausible (avoid obviously wrong answers)
   - Include clear explanations for the correct answer

4. Course Context:
${courseContent}

RESPONSE FORMAT (JSON array):
[
  {
    "id": "unique_id",
    "topic": "${config.topic}",
    "subtopic": "specific subtopic name",
    "question": "question text",
    "type": "multiple-choice",
    "difficulty": "easy|medium|hard",
    "options": ["option1", "option2", "option3", "option4"],
    "correctAnswer": 0,
    "explanation": "why this answer is correct",
    "points": 5|10|15
  }
]

Points: easy=5, medium=10, hard=15

Generate EXACTLY ${config.questionCount} questions following this distribution strictly.`;
}

// Get relevant course content for the topic
export async function getCourseContentForTopic(topic: string): Promise<string> {
  const course = await loadCourseData();
  const relevantContent: string[] = [];
  
  for (const mod of course.modules) {
    // Check if module matches
    const moduleMatches = mod.title.toLowerCase().includes(topic.toLowerCase()) ||
                          topic.toLowerCase().includes(mod.title.toLowerCase());
    
    if (moduleMatches) {
      relevantContent.push(`Module: ${mod.title}`);
      
      for (const t of mod.topics) {
        relevantContent.push(`\nTopic: ${t.title}`);
        relevantContent.push(`Content: ${t.content}`);
        if (t.key_points && t.key_points.length > 0) {
          relevantContent.push(`Key Points: ${t.key_points.join('; ')}`);
        }
        if (t.code_examples && t.code_examples.length > 0) {
          relevantContent.push(`Code Example: ${t.code_examples[0].code}`);
        }
      }
      break;
    }
    
    // Check individual topics within module
    for (const t of mod.topics) {
      if (t.title.toLowerCase().includes(topic.toLowerCase()) ||
          topic.toLowerCase().includes(t.title.toLowerCase())) {
        relevantContent.push(`Topic: ${t.title}`);
        relevantContent.push(`Content: ${t.content}`);
        if (t.key_points && t.key_points.length > 0) {
          relevantContent.push(`Key Points: ${t.key_points.join('; ')}`);
        }
      }
    }
  }
  
  return relevantContent.join('\n').slice(0, 3000); // Limit context size
}

// Get all available topics from course
export async function getAvailableTopicsFromCourse(): Promise<{ topic: string; moduleId: string; subtopics: string[] }[]> {
  const course = await loadCourseData();
  const topics: { topic: string; moduleId: string; subtopics: string[] }[] = [];
  
  for (const mod of course.modules) {
    topics.push({
      topic: mod.title,
      moduleId: mod.module_id,
      subtopics: mod.topics.map(t => t.title),
    });
  }
  
  return topics;
}

// Validate generated questions
export function validateQuestions(questions: any[]): QuizQuestion[] {
  const validated: QuizQuestion[] = [];
  
  for (const q of questions) {
    // Skip invalid questions
    if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length !== 4) {
      console.warn('[QuizGenerator] Skipping invalid question:', q);
      continue;
    }
    
    if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
      console.warn('[QuizGenerator] Invalid correctAnswer:', q.correctAnswer);
      continue;
    }
    
    validated.push({
      id: q.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      topic: q.topic || 'General',
      subtopic: q.subtopic || undefined,
      question: q.question,
      type: 'multiple-choice',
      difficulty: (['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium') as DifficultyLevel,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || 'No explanation provided.',
      points: q.points || (q.difficulty === 'easy' ? 5 : q.difficulty === 'hard' ? 15 : 10),
    });
  }
  
  return validated;
}

// Generate quiz recommendations based on user history
export async function generateQuizRecommendations(userId: string): Promise<{
  recommended: { topic: string; reason: string; difficulty: string; priority: number }[];
}> {
  if (!isSupabaseConfigured) {
    return { recommended: [] };
  }
  
  try {
    // Get user's topic mastery
    const { data: mastery } = await supabase
      .from('topic_mastery')
      .select('topic, mastery_level, last_practiced_at, quiz_sessions_count')
      .eq('clerk_user_id', userId)
      .order('mastery_level', { ascending: true });
    
    // Get available topics from course
    const availableTopics = await getAvailableTopicsFromCourse();
    const userTopics = new Set(mastery?.map(m => m.topic) || []);
    
    const recommendations: { topic: string; reason: string; difficulty: string; priority: number }[] = [];
    
    // 1. Topics not attempted
    for (const t of availableTopics) {
      if (!userTopics.has(t.topic)) {
        recommendations.push({
          topic: t.topic,
          reason: 'not_attempted',
          difficulty: 'easy',
          priority: 7,
        });
      }
    }
    
    // 2. Weak areas (low mastery)
    mastery?.filter(m => m.mastery_level < 50).forEach(m => {
      recommendations.push({
        topic: m.topic,
        reason: 'weak_area',
        difficulty: 'medium',
        priority: 9,
      });
    });
    
    // 3. Topics needing review (not practiced recently)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    mastery?.filter(m => {
      const lastPracticed = m.last_practiced_at ? new Date(m.last_practiced_at) : null;
      return lastPracticed && lastPracticed < oneWeekAgo && m.mastery_level < 80;
    }).forEach(m => {
      recommendations.push({
        topic: m.topic,
        reason: 'scheduled_review',
        difficulty: 'mixed',
        priority: 6,
      });
    });
    
    // Sort by priority (highest first) and take top 5
    recommendations.sort((a, b) => b.priority - a.priority);
    
    return { recommended: recommendations.slice(0, 5) };
  } catch (error) {
    console.error('[QuizGenerator] Error generating recommendations:', error);
    return { recommended: [] };
  }
}

export type { QuizGenerationConfig, GeneratedQuizPlan, UserPerformance };
