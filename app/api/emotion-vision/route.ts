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
    console.log('[Emotion Vision] Request received');
    
    // If API key not configured, return neutral emotion fallback
    if (!isOpenAIConfigured()) {
      console.warn('[Emotion Vision] OpenAI API key not configured - using fallback');
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
      console.error('[Emotion Vision] No image data provided');
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }
    
    console.log('[Emotion Vision] Analyzing image with OpenAI Vision...');

    // Use OpenAI Vision to analyze facial expressions
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an advanced emotion detection assistant specialized in learning contexts. Analyze facial expressions with attention to subtle cues.
          
          Return ONLY a JSON object: {"emotion": "one_word_emotion", "confidence": 0.0-1.0, "indicators": ["cue1", "cue2"]}
          
          Valid emotions: neutral, confused, frustrated, happy, concentrating, engaged, bored, curious, excited, tired, stressed
          
          DETAILED ANALYSIS CRITERIA:
          
          **Confused**: Furrowed brow, squinting eyes, tilted head, pursed lips
          **Frustrated**: Tight jaw, furrowed brow, tense face, downturned mouth
          **Engaged**: Slight forward lean, focused eyes, relaxed but attentive face
          **Bored**: Drooping eyelids, slack jaw, unfocused gaze, head resting on hand
          **Tired**: Heavy eyelids, yawning, rubbing eyes, slouched posture
          **Stressed**: Tense facial muscles, rapid blinking, tight lips, shallow breathing
          **Concentrating**: Narrowed eyes, slight frown, focused gaze, minimal movement
          **Curious**: Raised eyebrows, wide eyes, slight smile, head tilt
          **Excited**: Wide eyes, big smile, raised eyebrows, animated expression
          
          CONFIDENCE GUIDELINES:
          - 0.9-1.0: Very clear, multiple strong indicators
          - 0.7-0.9: Clear emotion with 2-3 indicators
          - 0.5-0.7: Moderate indicators, some ambiguity
          - 0.3-0.5: Weak indicators, high uncertainty
          - 0.0-0.3: Very unclear, default to neutral
          
          If face unclear or emotion ambiguous, return neutral with appropriate confidence.`
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
    console.log('[Emotion Vision] Raw response:', content);
    
    // Parse the JSON response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('[Emotion Vision] Parsed result:', parsed);
        return NextResponse.json({
          success: true,
          emotion: parsed.emotion || 'neutral',
          confidence: parsed.confidence || 0.7,
          indicators: parsed.indicators || [],
        });
      }
    } catch (parseError) {
      console.error('[Emotion Vision] Failed to parse emotion response:', content, parseError);
    }

    // Fallback if parsing fails
    console.warn('[Emotion Vision] Using fallback - parsing failed');
    return NextResponse.json({
      success: true,
      emotion: 'neutral',
      confidence: 0.5,
    });

  } catch (error: any) {
    console.error('[Emotion Vision] API Error:', error.message || error);
    
    // Return fallback response instead of error to keep UI working
    return NextResponse.json({
      success: true,
      emotion: 'neutral',
      confidence: 0.5,
      fallback: true,
      error: error.message || 'Unknown error'
    });
  }
}
