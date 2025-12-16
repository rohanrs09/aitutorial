import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Check if OpenAI API key is configured
const isOpenAIConfigured = () => {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-here';
};

export async function POST(request: NextRequest) {
  try {
    // If API key not configured, return neutral emotion fallback
    if (!isOpenAIConfigured()) {
      return NextResponse.json({
        success: true,
        emotion: 'neutral',
        confidence: 0.5,
        fallback: true,
        message: 'Emotion detection unavailable - API key not configured'
      });
    }

    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    // Use OpenAI Vision to analyze facial expressions
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an emotion detection assistant. Analyze the person's facial expression in the image and determine their emotional state. 
          
          Return ONLY a JSON object with this exact format:
          {"emotion": "one_word_emotion", "confidence": 0.0-1.0}
          
          Valid emotions: neutral, confused, frustrated, happy, concentrating, engaged, bored, curious, excited
          
          Base your analysis on:
          - Eyebrow position (raised, furrowed, relaxed)
          - Eye expression (wide, squinting, relaxed)
          - Mouth position (smiling, frowning, neutral)
          - Overall facial tension
          
          If you cannot clearly see a face or determine the emotion, return neutral with lower confidence.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this person\'s facial expression and determine their emotional state for a learning context.'
            },
            {
              type: 'image_url',
              image_url: {
                url: image,
                detail: 'low'
              }
            }
          ]
        }
      ],
      max_tokens: 100,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Parse the JSON response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          success: true,
          emotion: parsed.emotion || 'neutral',
          confidence: parsed.confidence || 0.7,
        });
      }
    } catch (parseError) {
      console.error('Failed to parse emotion response:', content);
    }

    // Fallback if parsing fails
    return NextResponse.json({
      success: true,
      emotion: 'neutral',
      confidence: 0.5,
    });

  } catch (error: any) {
    console.error('Emotion Vision API Error:', error);
    
    // Return fallback response instead of error to keep UI working
    return NextResponse.json({
      success: true,
      emotion: 'neutral',
      confidence: 0.5,
      fallback: true
    });
  }
}
