/**
 * ==========================================================
 * TUTOR API ROUTE - SLM-FIRST DESIGN (Hugging Face)
 * ==========================================================
 * 
 * PRIORITY: SLM via Hugging Face is PRIMARY when configured
 * - If HF_API_KEY is set → Uses Hugging Face Inference API (SLM)
 * - Otherwise → Falls back to OpenAI/Gemini
 * 
 * SLM Configuration (Primary - Hugging Face):
 * - Set HF_API_KEY in .env (Hugging Face API key)
 * - Optionally set SLM_MODEL_NAME or HF_MODEL_NAME (default: meta-llama/Llama-3.2-3B-Instruct)
 * - SLM will be used automatically via Hugging Face Inference API
 * 
 * Emotion-Based Adaptation:
 * - When emotion is confused/frustrated → SLM called with simplified prompts
 * - System automatically adjusts explanation complexity based on emotion
 * - Same concept, easier format when user is struggling
 * 
 * Fallback Configuration:
 * - OPENAI_API_KEY for GPT fallback
 * - GEMINI_API_KEY for Gemini fallback
 * 
 * Response Structure:
 * - message: Main explanation text (used for voice/TTS)
 * - slides: Array of learning slides with structured content (title, steps, voice text)
 * - notes: Key points extracted from response
 * 
 * ==========================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiAdapter, type AIMessage } from '@/lib/ai-adapter';
import { getTutorSystemPrompt } from '@/lib/tutor-prompts';
import { EmotionType } from '@/lib/utils';
import { analyzeEmotionAndAdapt, enhancePromptForEmotion } from '@/lib/adaptive-response';

interface GeneratedSlide {
  id: string;
  title: string;
  type: 'concept' | 'example' | 'tip' | 'practice' | 'diagram' | 'summary';
  content: string;
  keyPoints?: string[];
  example?: string;
  visualAid?: {
    type: 'mermaid' | 'illustration' | 'flowchart';
    data: string;
  };
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  };
  isSimplified?: boolean;
  simplificationLevel?: 'basic' | 'intermediate' | 'advanced';
  // Audio sync timing
  audioStartTime?: number; // Seconds into audio when this slide should appear
  audioDuration?: number;  // How long this slide content takes to explain
  spokenContent?: string;  // The portion of audio that corresponds to this slide
}

// Check if AI is configured (SLM via Hugging Face is PRIMARY, GPT/Gemini are fallback)
const isAIConfigured = () => {
  // PRIORITY 1: Check if SLM is configured via HF_API_KEY (SLM is PRIMARY)
  const hfApiKey = process.env.HF_API_KEY;
  if (hfApiKey) {
    return true; // SLM via Hugging Face is configured - use it as PRIMARY
  }
  
  // PRIORITY 2: Fallback to OpenAI/Gemini if SLM not configured
  const provider = process.env.AI_PROVIDER || 'openai';
  if (provider === 'openai') {
    return (!!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-here') ||
           !!process.env.GEMINI_API_KEY; // Allow Gemini as fallback
  } else if (provider === 'gemini') {
    return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== '';
  } else if (provider === 'slm') {
    // Explicit SLM provider check (supports HF_API_KEY)
    return !!hfApiKey || (!!process.env.SLM_API_KEY && (!!process.env.SLM_API_URL || !!process.env.SLM_BASE_URL));
  }
  return !!process.env.AI_API_KEY;
};

export async function POST(request: NextRequest) {
  try {
    // Validate AI configuration (works for both OpenAI and SLM)
    if (!isAIConfigured()) {
      const provider = process.env.AI_PROVIDER || 'openai';
      return NextResponse.json(
        { 
          error: `AI service not configured. Please configure ${provider.toUpperCase()} API credentials.`,
          code: 'API_KEY_MISSING'
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { 
      message, 
      topic = 'general', 
      topicDescription = '',
      topicCategory = 'General',
      isCustomTopic = false,
      learningGoals = [],
      difficulty = 'intermediate',
      emotion = 'neutral', 
      emotionConfidence = 0.5, 
      history = [],
      courseContext = undefined // Lecture context from course page
    } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'No message provided' },
        { status: 400 }
      );
    }

    // Analyze emotion and determine if simplification is needed
    // EMOTION-BASED ADAPTATION: When confused/frustrated, SLM is called again with simpler prompts
    // This changes HOW content is explained, NOT the lecture order
    const adaptiveResponse = analyzeEmotionAndAdapt(
      emotion as EmotionType,
      emotionConfidence,
      message
    );

    // Get base system prompt
    let systemPrompt = getTutorSystemPrompt(emotion as EmotionType, topic);
    
    // Log emotion-based adaptation for debugging
    if (adaptiveResponse.shouldRegenerateSimplified) {
      console.log(`[Tutor API] 🔄 Emotion-based re-explanation triggered: ${emotion} (confidence: ${emotionConfidence})`);
      console.log(`[Tutor API] Simplification level: ${adaptiveResponse.simplificationLevel}`);
    }
    
    // PRIORITY: Enhance prompt with COURSE LECTURE CONTEXT if available
    if (courseContext && courseContext.lectureTitle) {
      systemPrompt += `\n\n=== COURSE LECTURE CONTEXT (HIGH PRIORITY) ===
The student is currently learning from a specific course lecture:
- Lecture Title: ${courseContext.lectureTitle}
${courseContext.lectureDescription ? `- Lecture Description: ${courseContext.lectureDescription}` : ''}

CRITICAL INSTRUCTIONS (BACKEND FOCUS):
1. Your responses MUST be directly related to THIS SPECIFIC LECTURE content
2. Focus on backend logic, code examples, and debugging help
3. Provide working code snippets related to this lecture topic
4. Explain WHY the code works, not just WHAT it does
5. Help debug if something fails in their implementation
6. Use the lecture description to understand what backend concepts are being taught
7. Do NOT generate slides, UI, or design content

The student came here for help understanding THIS LECTURE's backend concepts. Act as a backend tutor, not a designer.`;
    }
    
    // Enhance prompt for custom topics (if not from course)
    if (!courseContext && isCustomTopic && topicDescription) {
      systemPrompt += `\n\n=== CUSTOM TOPIC CONTEXT ===
Topic: ${topic}
Category: ${topicCategory}
Description: ${topicDescription}
Difficulty Level: ${difficulty}
${learningGoals.length > 0 ? `Learning Goals:\n${learningGoals.map((g: string, i: number) => `${i + 1}. ${g}`).join('\n')}` : ''}

IMPORTANT: This is a custom learning topic. Focus your teaching on the description and learning goals provided. Adapt your explanations to the specified difficulty level (${difficulty}).`;
    }
    
    // Enhance prompt based on emotion and confidence (EMOTION-BASED ADAPTATION)
    // When emotion is confused/frustrated, SLM will be called again with simpler prompts
    if (adaptiveResponse.additionalPrompt) {
      systemPrompt = enhancePromptForEmotion(systemPrompt, emotion as EmotionType, emotionConfidence, message);
    }

    // Build conversation history (model-agnostic format)
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...history.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ];

    // Adjust temperature based on emotion
    const temperature = emotion === 'confused' || emotion === 'frustrated' ? 0.5 : 0.7;

    // Call AI service through adapter (works with both OpenAI and SLM)
    const aiResponse = await aiAdapter.generateCompletion({
      messages,
      temperature,
      maxTokens: adaptiveResponse.simplificationLevel === 'basic' ? 800 : 1000,
    });

    const responseMessage = aiResponse.content || '';

    // Extract notes (key points) from response
    const notes = extractKeyPoints(responseMessage);

    // ============================================================
    // CRITICAL: Generate slides FROM SLM response (NO additional SLM call)
    // ============================================================
    // The SLM already returned structured content (Title, Explanation, Analogy, Code, etc.)
    // We just parse it into slide format for the UI
    // This ensures slides show ONLY what SLM said, nothing random or static
    const slides = extractSlidesFromSLMResponse(
      responseMessage,
      topic,
      adaptiveResponse.simplificationLevel,
      emotion as EmotionType
    );
    
    console.log(`[Tutor API] ✓ Generated ${slides.length} slides from SLM response`);

    // Check if user might need simplified content
    const needsSimplification = (emotion === 'confused' || emotion === 'frustrated') && emotionConfidence > 0.6;
    
    // Generate guidance message for confused users
    let guidanceMessage = '';
    if (needsSimplification) {
      guidanceMessage = emotion === 'confused'
        ? "I notice you might be finding this tricky. Let me explain this concept in a simpler way with a clearer code example."
        : "This can be challenging. Let me break down the backend logic step by step.";
    }

    return NextResponse.json({
      message: responseMessage, // Full SLM response (used for TTS voice text)
      notes: notes,
      needsQuiz: false,
      needsDiagram: slides.some(s => s.visualAid?.type === 'mermaid'),
      slides: slides, // Slides extracted from SLM response
      needsSimplification: needsSimplification,
      guidanceMessage: guidanceMessage,
      simplificationLevel: adaptiveResponse.simplificationLevel,
      success: true,
    });
  } catch (error: any) {
    console.error('Tutor API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get tutor response' },
      { status: 500 }
    );
  }
}

// Extract slides from SLM structured response (Title, Explanation, Analogy, Code, Common Mistake)
// SLM returns structured format, we parse it into slides WITHOUT calling SLM again
function extractSlidesFromSLMResponse(
  responseText: string,
  topic: string,
  simplificationLevel: 'basic' | 'intermediate' | 'advanced',
  emotion: EmotionType
): GeneratedSlide[] {
  const slides: GeneratedSlide[] = [];
  const isSimplified = simplificationLevel === 'basic';
  
  // Parse structured format from SLM response
  // Look for Title (markdown header or bold)
  const titleMatch = responseText.match(/(?:^|\n)#+\s*(.+?)(?:\n|$)|(?:^|\n)\*\*(.+?)\*\*(?:\n|$)/m);
  const title = titleMatch ? (titleMatch[1] || titleMatch[2] || topic).trim() : topic;
  
  // Slide 1: Title + Short Explanation
  // Match "Short Explanation" or "Explanation" followed by content until next section
  const explanationMatch = responseText.match(/(?:Short Explanation|Explanation)[:]*\s*\n*([\s\S]+?)(?=\n\*\*|\n##|Real-World|Working Code|Common Mistake|$)/i);
  const explanation = explanationMatch ? explanationMatch[1].trim() : responseText.substring(0, 200);
  
  slides.push({
    id: `slide-1-${Date.now()}`,
    title: title,
    type: 'concept',
    content: explanation,
    keyPoints: extractKeyPoints(explanation).slice(0, isSimplified ? 2 : 3),
    isSimplified,
    simplificationLevel,
    spokenContent: explanation
  });
  
  // Slide 2: Real-World Analogy
  const analogyMatch = responseText.match(/(?:Real-World Analogy|Analogy)[:]*\s*\n*([\s\S]+?)(?=\n\*\*|\n##|Working Code|Common Mistake|$)/i);
  if (analogyMatch) {
    const analogy = analogyMatch[1].trim();
    slides.push({
      id: `slide-2-${Date.now()}`,
      title: 'Real-World Analogy',
      type: 'example',
      content: analogy,
      keyPoints: [analogy.substring(0, 100) + '...'],
      isSimplified,
      simplificationLevel,
      spokenContent: analogy
    });
  }
  
  // Slide 3: Working Code Snippet
  const codeMatch = responseText.match(/```(?:javascript|js|typescript|ts|json)?\n([\s\S]+?)```/);
  if (codeMatch) {
    const code = codeMatch[1].trim();
    const codeDescriptionMatch = responseText.match(/(?:Working Code Snippet|Code)[:]*\s*\n*([\s\S]+?)(?=```)/i);
    const codeDescription = codeDescriptionMatch ? codeDescriptionMatch[1].trim() : 'Here\'s a working code example:';
    
    slides.push({
      id: `slide-3-${Date.now()}`,
      title: 'Working Code Example',
      type: 'example',
      content: codeDescription,
      example: code,
      keyPoints: ['Run this code to see it in action', 'Copy and paste to try it yourself'],
      isSimplified,
      simplificationLevel,
      spokenContent: codeDescription
    });
  }
  
  // Slide 4: Common Mistake
  const mistakeMatch = responseText.match(/(?:Common Mistake|Mistake)[:]*\s*\n*([\s\S]+?)(?=\n\*\*|\n##|$)/i);
  if (mistakeMatch) {
    const mistake = mistakeMatch[1].trim();
    slides.push({
      id: `slide-4-${Date.now()}`,
      title: 'Common Mistake to Avoid',
      type: 'tip',
      content: mistake,
      keyPoints: extractKeyPoints(mistake).slice(0, 2),
      isSimplified,
      simplificationLevel,
      spokenContent: mistake
    });
  }
  
  // If no structured format found, create fallback slides from response text
  if (slides.length <= 1) {
    return generateFallbackSlides(responseText, topic, isSimplified);
  }
  
  return slides;
}

// Extract key points/notes from tutor response
function extractKeyPoints(text: string): string[] {
  const notes: string[] = [];
  
  // Look for bullet points
  const bulletRegex = /^[•\-*]\s+(.+)$/gm;
  let match;
  while ((match = bulletRegex.exec(text)) !== null) {
    notes.push(match[1].trim());
  }
  
  // Look for numbered points
  const numberedRegex = /^\d+\.\s+(.+)$/gm;
  while ((match = numberedRegex.exec(text)) !== null) {
    notes.push(match[1].trim());
  }
  
  // If no structured points found, extract sentences with key terms
  if (notes.length === 0) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keyTerms = ['remember', 'important', 'key', 'note', 'concept', 'principle'];
    
    sentences.forEach(sentence => {
      if (keyTerms.some(term => sentence.toLowerCase().includes(term))) {
        notes.push(sentence.trim());
      }
    });
  }
  
  // Limit to 5 key points
  return notes.slice(0, 5);
}

// Generate learning slides based on tutor response with audio sync and diagrams
async function generateLearningSlides(
  tutorResponse: string,
  topic: string,
  simplificationLevel: 'basic' | 'intermediate' | 'advanced',
  emotion: EmotionType,
  emotionConfidence: number
): Promise<GeneratedSlide[]> {
  const isSimplified = simplificationLevel === 'basic';
  const needsSimplification = (emotion === 'confused' || emotion === 'frustrated') && emotionConfidence > 0.5;

  // Calculate approximate word count and timing
  const wordCount = tutorResponse.split(/\s+/).length;
  const wordsPerMinute = 150; // Average TTS speed
  const totalDuration = (wordCount / wordsPerMinute) * 60; // Total seconds
  const slideCount = Math.min(Math.max(Math.ceil(wordCount / 100), 2), 5); // 2-5 slides based on content
  const avgSlideDuration = totalDuration / slideCount;

  try {
    const slidePrompt = needsSimplification
      ? `Generate EXTREMELY SIMPLIFIED learning slides with diagrams. The student is ${emotion}.
         Use: super simple language, everyday analogies, short sentences, encouraging tone.
         Include simple flowchart diagrams using Mermaid syntax.`
      : `Generate clear, educational learning slides with visual diagrams for the topic.`;

    // Use AI Adapter for slide generation (model-agnostic)
    const completion = await aiAdapter.generateCompletion({
      messages: [
        {
          role: 'system',
          content: `You are an educational slide generator that creates synchronized learning content. ${slidePrompt}
          
Create ${slideCount} slides that correspond to different parts of the tutor's explanation.
Return ONLY a JSON object with a "slides" array.

Each slide MUST have:
- id: unique string like "slide-1", "slide-2"
- title: clear, descriptive title
- type: one of [concept, example, tip, diagram, summary]
- content: ${isSimplified ? '1-2 simple sentences' : '2-3 sentences'} matching the audio explanation
- keyPoints: array of ${isSimplified ? '2-3 very simple points' : '3-4 key points'}
- spokenContent: the EXACT portion of the tutor response this slide covers (for audio sync)
- visualAid: { type: "mermaid", data: "<mermaid diagram code>" } - REQUIRED for concept and diagram types

For visualAid diagrams, use simple Mermaid syntax like:
- Flowcharts: graph TD\n  A[Step 1] --> B[Step 2]
- Sequences: sequenceDiagram\n  A->>B: message
- Simple graphs work best. Avoid complex syntax.

IMPORTANT: The "spokenContent" field should contain the actual words from the tutor response that this slide illustrates.`
        },
        {
          role: 'user',
          content: `Topic: ${topic}

Tutor Response to split into synchronized slides:
"${tutorResponse}"

Generate ${slideCount} slides with diagrams and audio sync markers.`
        }
      ],
      temperature: 0.7,
      maxTokens: 2500,
      responseFormat: 'json'
    });

    const content = completion.content || '{}';
    const parsed = JSON.parse(content);
    const slides = parsed.slides || [];

    // Calculate timing for each slide based on spoken content
    let accumulatedTime = 0;
    const processedSlides = slides.map((slide: any, index: number) => {
      const slideWordCount = (slide.spokenContent || slide.content || '').split(/\s+/).length;
      const slideDuration = Math.max((slideWordCount / wordsPerMinute) * 60, avgSlideDuration * 0.5);
      
      const processedSlide = {
        ...slide,
        id: slide.id || `slide-${Date.now()}-${index}`,
        isSimplified: isSimplified,
        simplificationLevel: simplificationLevel,
        audioStartTime: accumulatedTime,
        audioDuration: slideDuration,
        // Ensure visualAid is properly formatted
        visualAid: slide.visualAid || generateDiagramForSlide(slide, topic, isSimplified)
      };
      
      accumulatedTime += slideDuration;
      return processedSlide;
    });

    return processedSlides;

  } catch (error) {
    console.error('Slide generation error:', error);
    return generateFallbackSlides(tutorResponse, topic, isSimplified);
  }
}

// Generate a diagram for a slide based on its content
function generateDiagramForSlide(
  slide: any,
  topic: string,
  isSimplified: boolean
): { type: 'mermaid' | 'illustration'; data: string } | undefined {
  const slideType = slide.type || 'concept';
  const content = slide.content || '';
  const title = slide.title || topic;

  // Only generate diagrams for certain slide types
  if (slideType !== 'concept' && slideType !== 'diagram' && slideType !== 'example') {
    return undefined;
  }

  // Generate simple mermaid diagram based on content
  const keyPoints = slide.keyPoints || [];
  
  if (keyPoints.length >= 2) {
    // Create a simple flowchart from key points
    const nodes = keyPoints.slice(0, 4).map((point: string, i: number) => {
      const shortPoint = point.substring(0, 30).replace(/["'`]/g, '');
      return `    P${i}["${shortPoint}${point.length > 30 ? '...' : ''}"]`;
    });
    
    const connections = nodes.map((_: string, i: number) => 
      i < nodes.length - 1 ? `    P${i} --> P${i + 1}` : ''
    ).filter(Boolean);

    const diagramData = [
      'graph TD',
      `    T["${title.substring(0, 25)}"]`,
      ...nodes,
      '    T --> P0',
      ...connections
    ].join('\n');

    return {
      type: 'mermaid',
      data: diagramData
    };
  }

  // Fallback: simple concept diagram
  return {
    type: 'mermaid',
    data: `graph TD\n    A["${title.substring(0, 25)}"] --> B["Key Concept"]\n    B --> C["Understanding"]`
  };
}

function generateFallbackSlides(
  tutorResponse: string,
  topic: string,
  isSimplified: boolean
): GeneratedSlide[] {
  // Extract first 200 chars for summary
  const shortContent = tutorResponse.substring(0, 200);
  const keyPoints = extractKeyPoints(tutorResponse);

  return [
    {
      id: `slide-${Date.now()}-0`,
      title: isSimplified ? `Let's Learn: ${topic}` : `Understanding ${topic}`,
      type: 'concept',
      content: isSimplified 
        ? `Here's the simple version of what we're learning about ${topic}.`
        : shortContent + '...',
      keyPoints: keyPoints.slice(0, isSimplified ? 2 : 3),
      isSimplified,
      simplificationLevel: isSimplified ? 'basic' : 'intermediate'
    },
    {
      id: `slide-${Date.now()}-1`,
      title: isSimplified ? 'Think of it Like This' : 'Key Takeaways',
      type: 'summary',
      content: isSimplified
        ? 'Here are the most important things to remember:'
        : 'Key points from this explanation:',
      keyPoints: keyPoints.slice(0, isSimplified ? 3 : 4),
      isSimplified,
      simplificationLevel: isSimplified ? 'basic' : 'intermediate'
    }
  ];
}
