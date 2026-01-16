import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Check if Gemini API key is configured
const isGeminiConfigured = () => {
  return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here';
};

// Initialize Gemini client
const getGeminiClient = () => {
  if (!isGeminiConfigured()) return null;
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
};

export async function POST(request: NextRequest) {
  try {
    console.log('[Emotion Vision] Request received');
    
    // If Gemini API key not configured, return neutral emotion fallback
    if (!isGeminiConfigured()) {
      console.warn('[Emotion Vision] Gemini API key not configured - using fallback');
      return NextResponse.json({
        success: true,
        emotion: 'neutral',
        confidence: 0.5,
        fallback: true,
        message: 'Emotion detection unavailable - Gemini API key not configured'
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
    
    console.log('[Emotion Vision] Analyzing image with Gemini Vision...');

    const genAI = getGeminiClient();
    if (!genAI) {
      return NextResponse.json({
        success: true,
        emotion: 'neutral',
        confidence: 0.5,
        fallback: true,
      });
    }

    // Use Gemini Vision to analyze facial expressions
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Extract base64 data from data URL
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    
    const prompt = `You are an advanced emotion detection assistant specialized in learning contexts. Analyze this person's facial expression.

Return ONLY a JSON object: {"emotion": "one_word_emotion", "confidence": 0.0-1.0, "indicators": ["cue1", "cue2"]}

Valid emotions: neutral, confused, frustrated, happy, concentrating, engaged, bored, curious, excited, tired, stressed

DETAILED ANALYSIS CRITERIA:
- Confused: Furrowed brow, squinting eyes, tilted head, pursed lips
- Frustrated: Tight jaw, furrowed brow, tense face, downturned mouth
- Engaged: Slight forward lean, focused eyes, relaxed but attentive face
- Bored: Drooping eyelids, slack jaw, unfocused gaze, head resting on hand
- Tired: Heavy eyelids, yawning, rubbing eyes, slouched posture
- Stressed: Tense facial muscles, rapid blinking, tight lips
- Concentrating: Narrowed eyes, slight frown, focused gaze
- Curious: Raised eyebrows, wide eyes, slight smile, head tilt
- Excited: Wide eyes, big smile, raised eyebrows

CONFIDENCE GUIDELINES:
- 0.9-1.0: Very clear, multiple strong indicators
- 0.7-0.9: Clear emotion with 2-3 indicators
- 0.5-0.7: Moderate indicators, some ambiguity
- 0.3-0.5: Weak indicators, high uncertainty
- 0.0-0.3: Very unclear, default to neutral

If face unclear or emotion ambiguous, return neutral with appropriate confidence.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data,
        },
      },
    ]);

    const response = await result.response;

    const content = response.text() || '';
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
