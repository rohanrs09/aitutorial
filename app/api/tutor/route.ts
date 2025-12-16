import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Check if OpenAI API key is configured
const isOpenAIConfigured = () => {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-here';
};

export async function POST(request: NextRequest) {
  try {
    // Validate API key configuration
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.',
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
      history = [] 
    } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'No message provided' },
        { status: 400 }
      );
    }

    // Analyze emotion and determine if simplification is needed
    const adaptiveResponse = analyzeEmotionAndAdapt(
      emotion as EmotionType,
      emotionConfidence,
      message
    );

    // Get base system prompt
    let systemPrompt = getTutorSystemPrompt(emotion as EmotionType, topic);
    
    // Enhance prompt for custom topics
    if (isCustomTopic && topicDescription) {
      systemPrompt += `\n\n=== CUSTOM TOPIC CONTEXT ===
Topic: ${topic}
Category: ${topicCategory}
Description: ${topicDescription}
Difficulty Level: ${difficulty}
${learningGoals.length > 0 ? `Learning Goals:\n${learningGoals.map((g: string, i: number) => `${i + 1}. ${g}`).join('\n')}` : ''}

IMPORTANT: This is a custom learning topic. Focus your teaching on the description and learning goals provided. Adapt your explanations to the specified difficulty level (${difficulty}).`;
    }
    
    // Enhance prompt based on emotion and confidence
    if (adaptiveResponse.additionalPrompt) {
      systemPrompt = enhancePromptForEmotion(systemPrompt, emotion as EmotionType, emotionConfidence);
    }

    // Build conversation history
    const messages: any[] = [
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

    // Call OpenAI GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      temperature: temperature,
      max_tokens: adaptiveResponse.simplificationLevel === 'basic' ? 800 : 1000,
    });

    const responseMessage = completion.choices[0].message.content || '';

    // Extract notes (key points) from response
    const notes = extractKeyPoints(responseMessage);

    // Check if response suggests a quiz or diagram
    const needsQuiz = responseMessage.toLowerCase().includes('quiz') || 
                      responseMessage.toLowerCase().includes('practice');
    const needsDiagram = responseMessage.toLowerCase().includes('diagram') || 
                         responseMessage.toLowerCase().includes('visual');

    // Generate learning slides based on the response
    const slides = await generateLearningSlides(
      responseMessage,
      topic,
      adaptiveResponse.simplificationLevel,
      emotion as EmotionType,
      emotionConfidence
    );

    // Check if user might need simplified content
    const needsSimplification = (emotion === 'confused' || emotion === 'frustrated') && emotionConfidence > 0.6;
    
    // Generate guidance message for confused users
    let guidanceMessage = '';
    if (needsSimplification) {
      guidanceMessage = emotion === 'confused'
        ? "I notice you might be finding this tricky. I've prepared simpler explanations in the slides - take a look!"
        : "This can be challenging. Check out the slides for a step-by-step breakdown that might help.";
    }

    return NextResponse.json({
      message: responseMessage,
      notes: notes,
      needsQuiz: needsQuiz,
      needsDiagram: needsDiagram,
      slides: slides,
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
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
      max_tokens: 2500,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content || '{}';
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
