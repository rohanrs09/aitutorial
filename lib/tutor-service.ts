/**
 * ==========================================================
 * TUTOR SERVICE - SLM-FIRST LEARNING ASSISTANT
 * ==========================================================
 * 
 * This service handles all AI tutoring logic in a MODEL-AGNOSTIC way.
 * It uses the AI Adapter for all inference calls.
 * 
 * DESIGN PRINCIPLES:
 * 1. Course is ALWAYS the main learning source
 * 2. AI is a SIDE TUTOR, never the main instructor
 * 3. AI never auto-interrupts or controls course flow
 * 4. Responses are structured for both OpenAI and SLM
 * 
 * OUTPUT FORMAT:
 * All responses follow a structured format that works with
 * both OpenAI and smaller SLM models:
 * - title: Brief topic title
 * - steps[]: Step-by-step explanation
 * - examples[]: Practical examples
 * - summary: One-line summary
 * 
 * ==========================================================
 */

import { aiAdapter, type AIMessage, type TutorResponse } from './ai-adapter';

/**
 * Structured output format for tutor explanations
 * Designed to be slide-friendly and voice-narration compatible
 */
export interface TutorExplanation {
  title: string;
  steps: Array<{
    stepNumber: number;
    title: string;
    content: string;
    example?: string;
  }>;
  examples: string[];
  summary: string;
  followUpQuestion?: string;
  // For slide generation
  slideReady: boolean;
  estimatedReadTime: number; // seconds
}

/**
 * Emotion adaptation config - model agnostic
 */
export interface EmotionContext {
  emotion: 'neutral' | 'confused' | 'confident' | 'frustrated' | 'curious' | 'bored' | 'excited';
  confidence: number; // 0-1
}

/**
 * Lecture context for AI tutoring
 */
export interface LectureContext {
  lectureTitle: string;
  sectionTitle: string;
  courseTopic: string;
  lectureDescription?: string;
}

/**
 * ==========================================================
 * TutorService - Main tutoring logic
 * ==========================================================
 */
export class TutorService {
  
  /**
   * Generate a tutor explanation for the current lecture topic
   * This is the main method used when user clicks "Need Help"
   */
  async explainTopic(
    userQuestion: string,
    lectureContext: LectureContext,
    emotionContext?: EmotionContext,
    conversationHistory?: AIMessage[]
  ): Promise<TutorExplanation> {
    
    // Build the system prompt - SLM optimized (simple, clear instructions)
    const systemPrompt = this.buildExplanationPrompt(lectureContext, emotionContext);
    
    // Build messages array
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory?.slice(-6) || []), // Keep last 6 messages for context
      { role: 'user', content: userQuestion },
    ];

    // Adjust temperature based on emotion
    const temperature = this.getTemperatureForEmotion(emotionContext?.emotion || 'neutral');

    try {
      const response = await aiAdapter.generateCompletion({
        messages,
        temperature,
        maxTokens: emotionContext?.emotion === 'confused' ? 800 : 1000,
      });

      return this.parseExplanation(response.content, lectureContext.lectureTitle);
    } catch (error) {
      console.error('[TutorService] Error generating explanation:', error);
      return this.getFallbackExplanation(lectureContext.lectureTitle);
    }
  }

  /**
   * Generate simplified explanation for confused users
   * Uses even simpler language and shorter sentences
   */
  async simplifyExplanation(
    originalExplanation: string,
    lectureContext: LectureContext
  ): Promise<TutorExplanation> {
    
    const systemPrompt = `You are a patient tutor helping a confused student.

TASK: Simplify this explanation about "${lectureContext.lectureTitle}":
"${originalExplanation.substring(0, 500)}"

RULES:
- Use VERY simple words
- SHORT sentences only
- Give ONE everyday example
- Be encouraging

FORMAT:
1. Simple explanation (2-3 sentences)
2. Easy example from daily life
3. One key point to remember`;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Please simplify this for me.' },
    ];

    try {
      const response = await aiAdapter.generateCompletion({
        messages,
        temperature: 0.5, // Lower temperature for simpler output
        maxTokens: 600,
      });

      return this.parseExplanation(response.content, lectureContext.lectureTitle);
    } catch (error) {
      console.error('[TutorService] Error simplifying:', error);
      return this.getFallbackExplanation(lectureContext.lectureTitle);
    }
  }

  /**
   * Generate quick answer for simple questions
   * More concise than full explanation
   */
  async quickAnswer(
    question: string,
    lectureContext: LectureContext
  ): Promise<string> {
    
    const systemPrompt = `You are a helpful tutor. Answer briefly about "${lectureContext.lectureTitle}".
Keep your answer to 2-3 sentences maximum. Be clear and direct.`;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ];

    try {
      const response = await aiAdapter.generateCompletion({
        messages,
        temperature: 0.6,
        maxTokens: 200,
      });

      return response.content;
    } catch (error) {
      console.error('[TutorService] Error generating quick answer:', error);
      return 'I apologize, but I couldn\'t process that question. Please try again.';
    }
  }

  /**
   * Check if user has understood the concept
   * Returns a practice question
   */
  async generatePracticeQuestion(
    lectureContext: LectureContext
  ): Promise<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }> {
    
    const systemPrompt = `Generate a simple practice question about "${lectureContext.lectureTitle}".

Return EXACTLY this format:
QUESTION: [your question]
A) [option 1]
B) [option 2]
C) [option 3]
D) [option 4]
CORRECT: [A, B, C, or D]
EXPLANATION: [brief explanation]`;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Generate a practice question.' },
    ];

    try {
      const response = await aiAdapter.generateCompletion({
        messages,
        temperature: 0.7,
        maxTokens: 400,
      });

      return this.parsePracticeQuestion(response.content);
    } catch (error) {
      console.error('[TutorService] Error generating practice question:', error);
      return {
        question: `What is the main concept of ${lectureContext.lectureTitle}?`,
        options: [
          'Understanding the basics',
          'Advanced techniques',
          'History and background',
          'Common mistakes'
        ],
        correctIndex: 0,
        explanation: 'Focus on understanding the fundamental concepts first.',
      };
    }
  }

  // ==========================================================
  // Private helper methods
  // ==========================================================

  /**
   * Build system prompt for explanations
   * SLM-optimized: simple, clear instructions
   */
  private buildExplanationPrompt(
    context: LectureContext,
    emotion?: EmotionContext
  ): string {
    
    let emotionGuidance = '';
    if (emotion?.emotion === 'confused' && emotion.confidence > 0.5) {
      emotionGuidance = `
IMPORTANT: The student is confused. Use:
- Very simple words
- Short sentences
- Basic examples from daily life
- Slower pace`;
    } else if (emotion?.emotion === 'frustrated' && emotion.confidence > 0.5) {
      emotionGuidance = `
IMPORTANT: The student is frustrated. Be:
- Extra patient and encouraging
- Break into smaller steps
- Celebrate small wins`;
    } else if (emotion?.emotion === 'confident' && emotion.confidence > 0.5) {
      emotionGuidance = `
The student is confident. You can:
- Go slightly deeper
- Ask challenging questions
- Introduce related concepts`;
    }

    return `You are a friendly AI tutor helping with "${context.lectureTitle}".

CONTEXT:
- Course: ${context.courseTopic}
- Section: ${context.sectionTitle}
- Topic: ${context.lectureTitle}
${context.lectureDescription ? `- Description: ${context.lectureDescription}` : ''}

${emotionGuidance}

TEACHING RULES:
1. Start with the simplest explanation
2. Use everyday examples
3. Break complex ideas into steps
4. Check understanding with questions

RESPONSE FORMAT:
1. Brief introduction
2. Key points (use bullet points)
3. Example if helpful
4. End with a question to check understanding`;
  }

  /**
   * Get temperature based on emotion
   * Lower temperature = more focused, predictable output
   */
  private getTemperatureForEmotion(emotion: string): number {
    switch (emotion) {
      case 'confused':
      case 'frustrated':
        return 0.5; // More predictable, simpler output
      case 'confident':
      case 'excited':
        return 0.8; // More creative, varied output
      default:
        return 0.7; // Balanced
    }
  }

  /**
   * Parse AI response into structured explanation format
   * Works with both formatted and unformatted responses
   */
  private parseExplanation(content: string, title: string): TutorExplanation {
    // Extract bullet points for steps
    const steps: TutorExplanation['steps'] = [];
    const bulletRegex = /^[•\-*]\s+(.+)$/gm;
    const numberedRegex = /^(\d+)\.\s+(.+)$/gm;
    
    let match;
    let stepNum = 1;
    
    // Try numbered points first
    while ((match = numberedRegex.exec(content)) !== null) {
      steps.push({
        stepNumber: stepNum++,
        title: `Step ${match[1]}`,
        content: match[2].trim(),
      });
    }
    
    // If no numbered points, try bullet points
    if (steps.length === 0) {
      while ((match = bulletRegex.exec(content)) !== null) {
        steps.push({
          stepNumber: stepNum++,
          title: `Point ${stepNum - 1}`,
          content: match[1].trim(),
        });
      }
    }

    // Extract examples (sentences with "example", "for instance", etc.)
    const examples: string[] = [];
    const sentences = content.split(/[.!]+/);
    sentences.forEach(sentence => {
      const lower = sentence.toLowerCase();
      if (lower.includes('example') || lower.includes('for instance') || lower.includes('like')) {
        const trimmed = sentence.trim();
        if (trimmed.length > 20) {
          examples.push(trimmed);
        }
      }
    });

    // Extract follow-up question (last sentence with ?)
    let followUpQuestion: string | undefined;
    const questionMatch = content.match(/[^.!?]*\?[^.!?]*/);
    if (questionMatch) {
      followUpQuestion = questionMatch[0].trim();
    }

    // Calculate estimated read time (avg 150 words per minute)
    const wordCount = content.split(/\s+/).length;
    const estimatedReadTime = Math.ceil((wordCount / 150) * 60);

    return {
      title,
      steps: steps.slice(0, 5), // Max 5 steps
      examples: examples.slice(0, 3), // Max 3 examples
      summary: sentences[0]?.trim() || content.substring(0, 100),
      followUpQuestion,
      slideReady: steps.length >= 2,
      estimatedReadTime,
    };
  }

  /**
   * Parse practice question from AI response
   */
  private parsePracticeQuestion(content: string): {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  } {
    const lines = content.split('\n').filter(l => l.trim());
    
    let question = '';
    const options: string[] = [];
    let correctIndex = 0;
    let explanation = '';

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('QUESTION:')) {
        question = trimmed.replace('QUESTION:', '').trim();
      } else if (/^[A-D]\)/.test(trimmed)) {
        options.push(trimmed.substring(2).trim());
      } else if (trimmed.startsWith('CORRECT:')) {
        const correct = trimmed.replace('CORRECT:', '').trim().toUpperCase();
        correctIndex = ['A', 'B', 'C', 'D'].indexOf(correct);
      } else if (trimmed.startsWith('EXPLANATION:')) {
        explanation = trimmed.replace('EXPLANATION:', '').trim();
      }
    }

    // Fallback if parsing fails
    if (!question || options.length < 2) {
      return {
        question: 'What did you learn from this topic?',
        options: ['The basics', 'Advanced concepts', 'Practical applications', 'All of the above'],
        correctIndex: 3,
        explanation: 'Learning covers all aspects of the topic.',
      };
    }

    return { question, options, correctIndex, explanation };
  }

  /**
   * Get fallback explanation when AI fails
   */
  private getFallbackExplanation(title: string): TutorExplanation {
    return {
      title,
      steps: [
        {
          stepNumber: 1,
          title: 'Understanding the Basics',
          content: `Let's start by understanding what ${title} means and why it's important.`,
        },
        {
          stepNumber: 2,
          title: 'Key Concepts',
          content: 'Focus on the main ideas and how they connect to each other.',
        },
      ],
      examples: ['Think about how this applies to everyday situations.'],
      summary: `${title} is an important concept to understand.`,
      followUpQuestion: 'What part would you like me to explain further?',
      slideReady: true,
      estimatedReadTime: 30,
    };
  }
}

// Export singleton instance
export const tutorService = new TutorService();
