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
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
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

// Generate learning slides based on tutor response
async function generateLearningSlides(
  tutorResponse: string,
  topic: string,
  simplificationLevel: 'basic' | 'intermediate' | 'advanced',
  emotion: EmotionType,
  emotionConfidence: number
): Promise<GeneratedSlide[]> {
  const isSimplified = simplificationLevel === 'basic';
  const needsSimplification = (emotion === 'confused' || emotion === 'frustrated') && emotionConfidence > 0.5;

  try {
    const slidePrompt = needsSimplification
      ? `Generate EXTREMELY SIMPLIFIED learning slides. The student is ${emotion}.
         Use: super simple language, everyday analogies, short sentences, encouraging tone.
         Each key point should be ONE simple sentence max.`
      : `Generate clear, educational learning slides for the topic.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an educational slide generator. ${slidePrompt}
          
Create 3 slides based on this tutor response. Return ONLY a JSON object with a "slides" array.
Each slide should have:
- id: unique string
- title: clear title
- type: one of [concept, example, tip, summary]
- content: ${isSimplified ? '1-2 simple sentences' : '2-3 sentences'}
- keyPoints: array of ${isSimplified ? '2-3 very simple points' : '3-4 key points'}
${isSimplified ? '- Use everyday analogies and simple words' : ''}`
        },
        {
          role: 'user',
          content: `Topic: ${topic}

Tutor Response:
${tutorResponse}

Generate slides now.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);
    const slides = parsed.slides || [];

    // Add simplification metadata
    return slides.map((slide: any, index: number) => ({
      ...slide,
      id: slide.id || `slide-${Date.now()}-${index}`,
      isSimplified: isSimplified,
      simplificationLevel: simplificationLevel
    }));

  } catch (error) {
    console.error('Slide generation error:', error);
    // Return fallback slides
    return generateFallbackSlides(tutorResponse, topic, isSimplified);
  }
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
