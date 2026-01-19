import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const EMOTION_PROMPT = `You are an advanced emotion detection assistant specialized in learning contexts. Analyze this person's facial expression and body language.

CRITICAL: First check if a face is clearly visible. If NO face or face is unclear, return: {"face_visible": false, "emotion": "neutral", "confidence": 0.3, "indicators": ["no face detected"]}

If face IS visible, return ONLY a JSON object: {"face_visible": true, "emotion": "one_word_emotion", "confidence": 0.0-1.0, "indicators": ["cue1", "cue2", "cue3"]}

Valid emotions: neutral, confused, frustrated, happy, concentrating, engaged, bored, curious, excited, tired, stressed

DETAILED ANALYSIS CRITERIA (look for MULTIPLE indicators):

- **Frustrated**: MOST IMPORTANT - Tight jaw, clenched teeth, furrowed brow, tense face muscles, downturned mouth, narrowed eyes, head shaking, hand on face in distress. This is a STRONG emotion - if you see 2+ of these signs, use confidence 0.8+
  
- **Confused**: Furrowed brow, squinting eyes, tilted head to side, pursed lips, one eyebrow raised, scratching head, looking away then back

- **Concentrating**: Narrowed eyes, slight frown, focused steady gaze, leaning forward, minimal movement, serious expression

- **Engaged**: Alert eyes, slight forward lean, relaxed but attentive face, occasional nodding, open expression

- **Bored**: Drooping eyelids, slack jaw, unfocused gaze, head resting on hand, looking away, yawning

- **Tired**: Heavy eyelids, yawning, rubbing eyes, slouched posture, slow blinks

- **Stressed**: Tense facial muscles, rapid blinking, tight lips, hand on forehead, worried expression

- **Curious**: Raised eyebrows, wide eyes, slight smile, head tilt, leaning in

- **Excited**: Wide eyes, big smile, raised eyebrows, animated expression, mouth open

- **Happy**: Genuine smile (eyes crinkle), relaxed face, bright eyes, upturned mouth corners

- **Neutral**: Relaxed face, no strong indicators, calm expression

CONFIDENCE GUIDELINES:
- 0.9-1.0: Very clear, 3+ strong indicators of same emotion
- 0.7-0.9: Clear emotion with 2-3 indicators
- 0.5-0.7: Moderate indicators, some ambiguity
- 0.3-0.5: Weak indicators, high uncertainty
- 0.0-0.3: Very unclear

IMPORTANT RULES:
1. DO NOT default to neutral/concentrating - look carefully for frustrated, confused, bored emotions
2. If you see signs of struggle (furrowed brow + tense face), it's likely FRUSTRATED or CONFUSED
3. Be BOLD with your detection - if you see clear signs of frustration, use high confidence (0.7-0.9)
4. List at least 2-3 specific indicators you observed
5. Prioritize detecting negative emotions (frustrated, confused, bored) as they trigger help`;

// List of Gemini models to try (in order of preference for vision tasks)
// Based on available models from API: gemini-2.0-flash, gemini-2.5-flash, gemini-2.5-pro
const GEMINI_VISION_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash-001'
];

async function analyzeWithGemini(imageBase64: string) {
  const apiKey = process.env.GEMINI_API_KEY!;
  
  // Try each model until one works
  for (const model of GEMINI_VISION_MODELS) {
    try {
      console.log(`[Emotion Vision] Trying model: ${model}`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const requestBody = {
        contents: [{
          parts: [
            { text: EMOTION_PROMPT },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64
              }
            }
          ]
        }]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log(`[Emotion Vision] ✅ Model ${model} worked!`);
        return text;
      } else {
        const errorText = await response.text();
        console.log(`[Emotion Vision] Model ${model} failed: ${response.status}`);
        // Continue to next model
      }
    } catch (err: any) {
      console.log(`[Emotion Vision] Model ${model} error: ${err.message}`);
      // Continue to next model
    }
  }
  
  throw new Error('All Gemini models failed');
}

function parseEmotionResponse(content: string) {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const validEmotions = ['neutral', 'confused', 'frustrated', 'happy', 'concentrating', 'engaged', 'bored', 'curious', 'excited', 'tired', 'stressed'];
    const emotion = validEmotions.includes(parsed.emotion?.toLowerCase()) 
      ? parsed.emotion.toLowerCase() 
      : 'neutral';
    
    return {
      emotion,
      confidence: parsed.confidence || 0.7,
      indicators: parsed.indicators || [],
      face_visible: parsed.face_visible !== false
    };
  } catch (err) {
    console.error('[Emotion Vision] Failed to parse emotion response:', err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Emotion Vision] Request received');

    const body = await request.json();
    const { image } = body;

    if (!image) {
      console.error('[Emotion Vision] No image data provided');
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    // Extract base64 data
    const imageBase64 = image.replace(/^data:image\/\w+;base64,/, '');

    // Use ONLY Gemini
    try {
      console.log('[Emotion Vision] Using Gemini...');
      const geminiResult = await analyzeWithGemini(imageBase64);
      console.log('[Emotion Vision] Gemini response:', geminiResult);
      
      const parsed = parseEmotionResponse(geminiResult);
      if (parsed) {
        console.log('[Emotion Vision] ✅ Gemini detected:', parsed);
        return NextResponse.json({
          success: true,
          ...parsed,
          provider: 'gemini'
        });
      }
    } catch (err: any) {
      console.error('[Emotion Vision] Gemini failed:', err.message);
      
      return NextResponse.json({
        success: false,
        emotion: "neutral",
        confidence: 0.5,
        fallback: true,
        error: err.message
      });
    }

    // If parsing failed but no error thrown
    return NextResponse.json({
      success: false,
      emotion: "neutral",
      confidence: 0.5,
      fallback: true
    });

  } catch (error: any) {
    console.error('[Emotion Vision] Critical error:', error.message || error);
    
    return NextResponse.json({
      success: false,
      error: "Critical error",
      emotion: "neutral",
      confidence: 0.5,
      fallback: true
    });
  }
}

/* 
// ============================================
// OPENAI FALLBACK (COMMENTED OUT FOR NOW)
// Uncomment when needed
// ============================================

async function analyzeWithOpenAI(imageUrl: string) {
  const { OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: EMOTION_PROMPT },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ],
    max_tokens: 300,
    temperature: 0.3
  });

  return response.choices[0]?.message?.content || '';
}

// Add this to POST function after Gemini fails:
// Only now try OpenAI if Gemini failed with non-quota error
if (process.env.OPENAI_API_KEY) {
  try {
    console.log('[Emotion Vision] Analyzing with OpenAI Vision...');
    const openaiResult = await analyzeWithOpenAI(image);
    console.log('[Emotion Vision] OpenAI response:', openaiResult);
    
    const parsed = parseEmotionResponse(openaiResult);
    if (parsed) {
      console.log('[Emotion Vision] ✅ OpenAI detected:', parsed);
      return NextResponse.json({
        success: true,
        ...parsed,
        provider: 'openai'
      });
    }
  } catch (openaiError: any) {
    console.error('[Emotion Vision] OpenAI failed:', openaiError.message);
  }
}
*/
