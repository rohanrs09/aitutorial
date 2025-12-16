import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { EmotionType } from '@/lib/utils';

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
          error: 'OpenAI API key not configured. Slide generation unavailable.',
          code: 'API_KEY_MISSING'
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { 
      topicName, 
      description, 
      learningGoals = [], 
      emotion = 'neutral',
      emotionConfidence = 0.5 
    } = body;

    if (!topicName || !description) {
      return NextResponse.json(
        { error: 'Topic name and description are required' },
        { status: 400 }
      );
    }

    // Determine simplification level based on emotion
    const simplificationLevel = (emotion === 'confused' || emotion === 'frustrated') && emotionConfidence > 0.6
      ? 'basic'
      : emotionConfidence > 0.4 && (emotion === 'confused' || emotion === 'frustrated')
      ? 'intermediate'
      : 'advanced';

    // Generate slide content based on emotion
    const systemPrompt = getSlideGenerationPrompt(emotion, emotionConfidence, simplificationLevel);

    const userPrompt = `Generate educational slide content for this custom topic:

Topic: ${topicName}
Description: ${description}
Learning Goals: ${learningGoals.join(', ')}

Create 5 slides with the following structure:
1. Introduction Slide - Overview of the concept
2. Explanation Slide - Detailed explanation with key points
3. Example Slide - Real-world example
4. Tips Slide - Best practices and helpful tips
5. Practice Slide - Quiz question with 4 options

For each slide, provide:
- title: Clear, concise title
- type: one of [concept, example, tip, practice, diagram]
- content: Main explanation (2-3 sentences for ${simplificationLevel} level)
- keyPoints: Array of 3-4 bullet points (keep simple for ${simplificationLevel} level)
- example: For example slides only
- visualAid: Suggest a diagram type and provide mermaid code if applicable
- quiz: For practice slide only (question, 4 options, correct answer index, explanation)

Return ONLY valid JSON array format.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0].message.content || '{}';
    let slides;
    
    try {
      const parsed = JSON.parse(responseContent);
      slides = parsed.slides || [];
    } catch (parseError) {
      console.error('Failed to parse GPT response:', parseError);
      // Fallback to basic slides
      slides = generateFallbackSlides(topicName, description, learningGoals, simplificationLevel);
    }

    return NextResponse.json({
      success: true,
      slides: slides,
      simplificationLevel: simplificationLevel
    });

  } catch (error: any) {
    console.error('Slide generation error:', error);
    
    // Provide helpful error messages
    if (error?.code === 'insufficient_quota') {
      return NextResponse.json(
        { 
          error: 'OpenAI API quota exceeded. Please check your API key and billing.',
          code: 'QUOTA_EXCEEDED'
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { 
        error: error?.message || 'Failed to generate slides',
        code: 'GENERATION_ERROR'
      },
      { status: 500 }
    );
  }
}

function getSlideGenerationPrompt(emotion: EmotionType, confidence: number, level: string): string {
  const basePrompt = `You are an expert educational content creator. Generate pedagogically effective slide content.`;

  if ((emotion === 'confused' || emotion === 'frustrated') && confidence > 0.6) {
    return `${basePrompt}

CRITICAL: The student is ${emotion.toUpperCase()} (confidence: ${Math.round(confidence * 100)}%)

Generate EXTREMELY SIMPLIFIED content:
- Use language a 10-year-old can understand
- Break concepts into the SMALLEST possible steps
- Use MULTIPLE everyday analogies (cooking, sports, family, pets)
- Keep sentences SHORT (max 10-12 words)
- Avoid ALL technical jargon
- Provide lots of encouragement
- Use concrete, visual descriptions
- Repeat key ideas in different ways

Each slide should build confidence first, comprehension second.
Focus on "Can you understand THIS simple part?" not "Here's the whole concept."`;
  }

  if (level === 'intermediate') {
    return `${basePrompt}

Generate content with:
- Clear, simple language
- Step-by-step explanations
- Relatable examples
- Helpful analogies
- Supportive tone`;
  }

  return `${basePrompt}

Generate content with:
- Comprehensive explanations
- Technical accuracy
- Advanced concepts
- Challenging questions`;
}

function generateFallbackSlides(
  topicName: string, 
  description: string, 
  goals: string[], 
  level: string
): any[] {
  const isSimplified = level === 'basic';
  
  return [
    {
      title: isSimplified ? `What is ${topicName}?` : `Understanding ${topicName}`,
      type: 'concept',
      content: isSimplified 
        ? `Let's learn about ${topicName} in a simple way. ${description}`
        : `${description}`,
      keyPoints: goals.slice(0, 3),
      visualAid: {
        type: 'illustration',
        data: '📚'
      }
    },
    {
      title: isSimplified ? 'How It Works' : 'Key Concepts',
      type: 'diagram',
      content: isSimplified
        ? 'Here\'s a simple way to think about it:'
        : 'Let\'s break down the main concepts:',
      keyPoints: [
        isSimplified ? 'Step 1: Start simple' : 'Core principles',
        isSimplified ? 'Step 2: Practice' : 'Important details',
        isSimplified ? 'Step 3: Master it' : 'Advanced applications'
      ],
      visualAid: {
        type: 'flowchart',
        data: `graph TD
    A[Start] --> B[Learn ${topicName}]
    B --> C[Practice]
    C --> D[Master It]`
      }
    },
    {
      title: 'Real Example',
      type: 'example',
      content: isSimplified
        ? 'Think about something you do every day.'
        : 'Here\'s how this applies in real situations:',
      example: isSimplified
        ? `Imagine you're ${topicName.includes('algorithm') ? 'finding a toy in your room' : 'learning to ride a bike'}. That's similar to ${topicName}!`
        : `Consider practical applications of ${topicName} in your daily life or work.`,
      keyPoints: [
        'Easy to understand',
        'Relates to real life',
        'Helps remember the concept'
      ]
    },
    {
      title: isSimplified ? 'Helpful Tips' : 'Best Practices',
      type: 'tip',
      content: isSimplified
        ? 'Here are some easy tips to remember:'
        : 'Follow these guidelines for success:',
      keyPoints: [
        isSimplified ? 'Practice a little each day' : 'Practice regularly',
        isSimplified ? 'Ask questions when confused' : 'Seek clarification when needed',
        isSimplified ? 'Teach someone else' : 'Apply to real problems'
      ]
    },
    {
      title: isSimplified ? 'Quick Check' : 'Test Your Knowledge',
      type: 'practice',
      content: isSimplified
        ? 'Let\'s see if you got it!'
        : 'Assess your understanding:',
      quiz: {
        question: isSimplified
          ? `What did we learn about ${topicName}?`
          : `What is the main purpose of ${topicName}?`,
        options: [
          isSimplified ? 'It helps solve problems' : 'To solve complex problems efficiently',
          isSimplified ? 'It\'s too hard' : 'To make tasks more complicated',
          isSimplified ? 'It\'s just for fun' : 'Only for academic purposes',
          isSimplified ? 'I don\'t know yet' : 'No practical application'
        ],
        correctAnswer: 0,
        explanation: isSimplified
          ? 'Yes! We use it to solve problems. Great job!'
          : `${topicName} is designed to help solve problems more effectively.`
      }
    }
  ];
}