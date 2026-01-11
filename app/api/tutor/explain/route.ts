/**
 * ==========================================================
 * TUTOR EXPLAIN API - SLM PRIMARY ENDPOINT
 * ==========================================================
 * 
 * CRITICAL: This endpoint is specifically designed for SLM-based explanations
 * 
 * SLM FLOW (PRIMARY):
 * 1. Frontend → /api/tutor/explain
 * 2. SLM generates structured explanation (via HF_API_KEY)
 * 3. Response includes: title, explanation steps, voice text, slides
 * 
 * EMOTION-BASED RE-EXPLANATION:
 * - If emotion = confused/frustrated → SLM called again with simpler prompts
 * - Same concept, easier format
 * - No lecture order changes
 * 
 * RESPONSE FORMAT:
 * {
 *   title: string,
 *   explanation: string,
 *   steps: Array<{stepNumber, title, content, example}>,
 *   voiceText: string,  // For TTS (ElevenLabs)
 *   slides: Array<SlideContent>,
 *   needsSimplification: boolean
 * }
 * 
 * ==========================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiAdapter, type AIMessage } from '@/lib/ai-adapter';
import { EmotionType } from '@/lib/utils';

interface ExplainRequest {
  concept: string;
  lectureContext?: {
    lectureTitle: string;
    lectureDescription?: string;
    sectionTitle?: string;
    courseTitle?: string;
  };
  emotion?: EmotionType;
  emotionConfidence?: number;
  previousExplanation?: string; // For re-explanation
  simplificationLevel?: 'basic' | 'intermediate' | 'advanced';
}

interface ExplanationStep {
  stepNumber: number;
  title: string;
  content: string;
  example?: string;
}

interface SlideContent {
  id: string;
  title: string;
  type: 'concept' | 'example' | 'tip' | 'practice' | 'summary';
  content: string;
  keyPoints?: string[];
  example?: string;
  spokenContent?: string;
}

interface ExplainResponse {
  title: string;
  explanation: string;
  steps: ExplanationStep[];
  voiceText: string;
  slides: SlideContent[];
  needsSimplification: boolean;
  simplificationLevel: 'basic' | 'intermediate' | 'advanced';
  success: boolean;
}

// Check if SLM is configured (HF_API_KEY is PRIMARY)
const isSLMConfigured = () => {
  return !!process.env.HF_API_KEY;
};

// Check if any AI is configured (SLM, OpenAI, or Gemini)
const isAIConfigured = () => {
  return !!(process.env.HF_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY);
};

export async function POST(request: NextRequest) {
  try {
    // Validate AI configuration
    if (!isAIConfigured()) {
      return NextResponse.json(
        { 
          error: 'AI service not configured. Please set HF_API_KEY (primary), OPENAI_API_KEY, or GEMINI_API_KEY.',
          code: 'API_KEY_MISSING'
        },
        { status: 503 }
      );
    }

    const body: ExplainRequest = await request.json();
    const { 
      concept, 
      lectureContext, 
      emotion = 'neutral',
      emotionConfidence = 0.5,
      previousExplanation,
      simplificationLevel = 'intermediate'
    } = body;

    if (!concept || concept.trim().length === 0) {
      return NextResponse.json(
        { error: 'No concept provided to explain' },
        { status: 400 }
      );
    }

    // Determine if we need simplified explanation
    const needsSimplification = (emotion === 'confused' || emotion === 'frustrated') && emotionConfidence > 0.6;
    const isReExplanation = !!previousExplanation;

    // Build SLM prompt for structured explanation
    const systemPrompt = buildSLMExplanationPrompt(
      concept,
      lectureContext,
      emotion,
      emotionConfidence,
      needsSimplification,
      isReExplanation
    );

    // Build messages for SLM
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: isReExplanation 
          ? `I'm still confused about "${concept}". Can you explain it in a simpler way?`
          : `Please explain: ${concept}`
      }
    ];

    // Adjust temperature based on emotion
    const temperature = needsSimplification ? 0.5 : 0.7;
    const maxTokens = needsSimplification ? 800 : 1200;

    // Call SLM (PRIMARY) or fallback AI
    const aiResponse = await aiAdapter.generateCompletion({
      messages,
      temperature,
      maxTokens,
    });

    const responseText = aiResponse.content || '';

    // Parse SLM response into structured format
    const explanation = parseExplanationResponse(responseText, concept, needsSimplification);

    // Generate slides from explanation
    const slides = generateSlidesFromExplanation(explanation, concept);

    // Build voice text (for TTS - ElevenLabs)
    const voiceText = buildVoiceText(explanation);

    return NextResponse.json({
      title: explanation.title,
      explanation: explanation.fullText,
      steps: explanation.steps,
      voiceText: voiceText,
      slides: slides,
      needsSimplification: needsSimplification && !isReExplanation,
      simplificationLevel: needsSimplification ? 'basic' : simplificationLevel,
      success: true,
    } as ExplainResponse);

  } catch (error: any) {
    console.error('[/api/tutor/explain] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate explanation',
        success: false
      },
      { status: 500 }
    );
  }
}

/**
 * Build SLM-optimized prompt for structured explanations
 * EMOTION-AWARE: Adjusts complexity based on user emotion
 */
function buildSLMExplanationPrompt(
  concept: string,
  lectureContext: ExplainRequest['lectureContext'] | undefined,
  emotion: EmotionType,
  emotionConfidence: number,
  needsSimplification: boolean,
  isReExplanation: boolean
): string {
  let basePrompt = `You are a helpful AI tutor explaining "${concept}".`;

  // Add lecture context if available (PRIORITY)
  if (lectureContext?.lectureTitle) {
    basePrompt += `\n\nCONTEXT:
- Lecture: ${lectureContext.lectureTitle}
${lectureContext.lectureDescription ? `- Description: ${lectureContext.lectureDescription}` : ''}
${lectureContext.sectionTitle ? `- Section: ${lectureContext.sectionTitle}` : ''}
${lectureContext.courseTitle ? `- Course: ${lectureContext.courseTitle}` : ''}

Your explanation MUST be directly related to this lecture content.`;
  }

  // EMOTION-BASED ADAPTATION
  if (needsSimplification) {
    if (emotion === 'confused') {
      basePrompt += `\n\n⚠️ CRITICAL: The student is CONFUSED (confidence: ${Math.round(emotionConfidence * 100)}%).

SIMPLIFY IMMEDIATELY:
1. Use the SIMPLEST words possible (explain like to a complete beginner)
2. Break into TINY steps (no more than 3-4 steps)
3. Use ONE clear, everyday analogy
4. Give ONE simple, working code example (if applicable)
5. Avoid ALL technical jargon
6. Keep sentences SHORT (max 15 words each)
7. Be ENCOURAGING and patient`;
    } else if (emotion === 'frustrated') {
      basePrompt += `\n\n⚠️ CRITICAL: The student is FRUSTRATED (confidence: ${Math.round(emotionConfidence * 100)}%).

CHANGE YOUR APPROACH:
1. Start with: "I understand this is frustrating. Let's try a different way."
2. Use the ABSOLUTE SIMPLEST explanation
3. Focus on ONE working example they can try immediately
4. Show EXACTLY what to do, step by step
5. Use encouraging, supportive language
6. Avoid repeating what didn't work before`;
    }
  }

  // Re-explanation guidance
  if (isReExplanation) {
    basePrompt += `\n\nIMPORTANT: This is a RE-EXPLANATION. The student didn't understand the first time.
- Use a COMPLETELY DIFFERENT approach
- Try a different analogy
- Use simpler language
- Focus on the most basic fundamentals`;
  }

  // Required output format
  basePrompt += `\n\nRESPONSE FORMAT (REQUIRED):

**Title:** [Clear, simple title for the concept]

**Short Explanation:**
[2-3 sentences explaining the concept in simple terms]

**Step-by-Step Breakdown:**
1. [First step - simple and clear]
2. [Second step - builds on first]
3. [Third step - completes understanding]
${!needsSimplification ? '4. [Fourth step - optional, for deeper understanding]' : ''}

**Real-World Analogy:**
[One clear analogy that relates to everyday life]

**Example:**
[A simple, practical example or code snippet if applicable]

**Key Takeaway:**
[One sentence summary - the most important thing to remember]`;

  return basePrompt;
}

/**
 * Parse SLM response into structured explanation format
 */
function parseExplanationResponse(
  responseText: string,
  concept: string,
  isSimplified: boolean
): {
  title: string;
  fullText: string;
  steps: ExplanationStep[];
  analogy?: string;
  example?: string;
  keyTakeaway?: string;
} {
  // Extract title
  const titleMatch = responseText.match(/\*\*Title:\*\*\s*(.+?)(?:\n|$)/i) || 
                     responseText.match(/^#+\s*(.+?)$/m);
  const title = titleMatch ? titleMatch[1].trim() : concept;

  // Extract short explanation
  const explanationMatch = responseText.match(/\*\*Short Explanation:\*\*\s*([\s\S]+?)(?=\n\*\*|$)/i);
  const shortExplanation = explanationMatch ? explanationMatch[1].trim() : '';

  // Extract steps
  const steps: ExplanationStep[] = [];
  const stepMatches = responseText.matchAll(/^(\d+)\.\s+(.+?)$/gm);
  let stepNum = 1;
  for (const match of stepMatches) {
    steps.push({
      stepNumber: stepNum++,
      title: `Step ${match[1]}`,
      content: match[2].trim()
    });
  }

  // Extract analogy
  const analogyMatch = responseText.match(/\*\*Real-World Analogy:\*\*\s*([\s\S]+?)(?=\n\*\*|$)/i);
  const analogy = analogyMatch ? analogyMatch[1].trim() : undefined;

  // Extract example
  const exampleMatch = responseText.match(/\*\*Example:\*\*\s*([\s\S]+?)(?=\n\*\*|$)/i);
  const example = exampleMatch ? exampleMatch[1].trim() : undefined;

  // Extract key takeaway
  const takeawayMatch = responseText.match(/\*\*Key Takeaway:\*\*\s*([\s\S]+?)(?=\n\*\*|$)/i);
  const keyTakeaway = takeawayMatch ? takeawayMatch[1].trim() : undefined;

  return {
    title,
    fullText: responseText,
    steps,
    analogy,
    example,
    keyTakeaway
  };
}

/**
 * Generate slides from parsed explanation
 * ONE CONCEPT PER SLIDE
 */
function generateSlidesFromExplanation(
  explanation: ReturnType<typeof parseExplanationResponse>,
  concept: string
): SlideContent[] {
  const slides: SlideContent[] = [];

  // Slide 1: Title + Short Explanation
  slides.push({
    id: `slide-1-${Date.now()}`,
    title: explanation.title,
    type: 'concept',
    content: explanation.fullText.substring(0, 200),
    keyPoints: explanation.steps.slice(0, 3).map(s => s.content),
    spokenContent: explanation.fullText.substring(0, 200)
  });

  // Slide 2: Steps (if available)
  if (explanation.steps.length > 0) {
    slides.push({
      id: `slide-2-${Date.now()}`,
      title: 'Step-by-Step Breakdown',
      type: 'concept',
      content: 'Let me break this down into simple steps:',
      keyPoints: explanation.steps.map(s => s.content),
      spokenContent: explanation.steps.map(s => s.content).join('. ')
    });
  }

  // Slide 3: Analogy (if available)
  if (explanation.analogy) {
    slides.push({
      id: `slide-3-${Date.now()}`,
      title: 'Think of it Like This',
      type: 'example',
      content: explanation.analogy,
      spokenContent: explanation.analogy
    });
  }

  // Slide 4: Example (if available)
  if (explanation.example) {
    slides.push({
      id: `slide-4-${Date.now()}`,
      title: 'Practical Example',
      type: 'example',
      content: 'Here\'s a practical example:',
      example: explanation.example,
      spokenContent: explanation.example
    });
  }

  // Slide 5: Key Takeaway
  if (explanation.keyTakeaway) {
    slides.push({
      id: `slide-5-${Date.now()}`,
      title: 'Key Takeaway',
      type: 'summary',
      content: explanation.keyTakeaway,
      spokenContent: explanation.keyTakeaway
    });
  }

  return slides;
}

/**
 * Build voice text for TTS (ElevenLabs)
 * Combines all spoken content in natural flow
 */
function buildVoiceText(explanation: ReturnType<typeof parseExplanationResponse>): string {
  let voiceText = `Let me explain ${explanation.title}. `;

  // Add steps
  if (explanation.steps.length > 0) {
    voiceText += explanation.steps.map((s, i) => 
      `${i === 0 ? 'First' : i === 1 ? 'Second' : i === 2 ? 'Third' : `Step ${i + 1}`}, ${s.content}`
    ).join('. ') + '. ';
  }

  // Add analogy
  if (explanation.analogy) {
    voiceText += `Think of it like this: ${explanation.analogy}. `;
  }

  // Add key takeaway
  if (explanation.keyTakeaway) {
    voiceText += `The key thing to remember is: ${explanation.keyTakeaway}`;
  }

  return voiceText;
}
