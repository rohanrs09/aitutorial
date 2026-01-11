/**
 * ==========================================================
 * TTS API ROUTE - SLM-FIRST DESIGN
 * ==========================================================
 * 
 * Text-to-Speech using AI Adapter.
 * Currently using OpenAI TTS for development.
 * 
 * TO SWITCH TO SLM TTS:
 * 1. Update AI_PROVIDER=slm in environment
 * 2. Ensure SLM endpoint supports /audio/speech
 * 3. NO CODE CHANGES NEEDED
 * 
 * ==========================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiAdapter } from '@/lib/ai-adapter';

// Check if AI is configured (supports HF_API_KEY for SLM)
const isAIConfigured = () => {
  // Check for Hugging Face (SLM) first
  const hfApiKey = process.env.HF_API_KEY;
  if (hfApiKey) {
    return true; // SLM via Hugging Face is configured
  }
  
  // Check for OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey !== 'sk-your-openai-api-key-here') {
    return true;
  }
  
  // Check for ElevenLabs (can work standalone for TTS)
  if (process.env.ELEVENLABS_API_KEY) {
    return true;
  }
  
  return false;
};

// Optional: ElevenLabs for better voice quality
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Default voice

export async function POST(request: NextRequest) {
  try {
    // Validate AI configuration
    if (!isAIConfigured()) {
      const provider = process.env.AI_PROVIDER || 'openai';
      console.warn(`TTS: ${provider} not configured`);
      return NextResponse.json(
        { 
          error: `AI service not configured. Text-to-speech is unavailable.`,
          code: 'API_KEY_MISSING'
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { text, voice = 'alloy', useElevenLabs = false } = body;
    
    // PRIORITY: Use ElevenLabs when using SLM (HF_API_KEY) since SLM doesn't have TTS
    const isUsingSLM = !!process.env.HF_API_KEY;
    const shouldUseElevenLabs = useElevenLabs || 
                                (!!ELEVENLABS_API_KEY && isUsingSLM) || 
                                (!!ELEVENLABS_API_KEY && !process.env.OPENAI_API_KEY);
    
    if (isUsingSLM && !ELEVENLABS_API_KEY && !process.env.OPENAI_API_KEY) {
      console.error('[TTS] Using SLM but no TTS provider configured');
      return NextResponse.json(
        { 
          error: 'TTS unavailable. When using SLM (HF_API_KEY), you must set either ELEVENLABS_API_KEY or OPENAI_API_KEY for voice output.',
          code: 'TTS_UNAVAILABLE'
        },
        { status: 503 }
      );
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // Priority 1: Use ElevenLabs if enabled and API key available
    if (shouldUseElevenLabs && ELEVENLABS_API_KEY) {
      const elevenLabsResult = await generateElevenLabsTTS(text);
      if (elevenLabsResult) {
        return elevenLabsResult; // Success
      }
      // If null, fall through to OpenAI (graceful failure)
      console.log('[TTS] ElevenLabs unavailable, trying OpenAI fallback...');
    }

    // Priority 2: Use OpenAI TTS if available
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (openaiApiKey && openaiApiKey !== 'sk-your-openai-api-key-here') {
      try {
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: 'alloy', // Options: alloy, echo, fable, onyx, nova, shimmer
            speed: 1.0,
          }),
        });

        if (!response.ok) {
          let errorText = '';
          let errorData: any = {};
          try {
            errorText = await response.text();
            try {
              errorData = JSON.parse(errorText);
            } catch (e) {
              // Not JSON
            }
          } catch (e) {
            errorText = 'Unable to read error response';
          }
          
          console.error('OpenAI TTS Error:', response.status, errorText);
          
          // GRACEFUL FAILURE: Handle quota exceeded without blocking UI
          const isQuotaExceeded = response.status === 429 || 
                                   errorData?.error?.code === 'insufficient_quota' ||
                                   errorText?.includes('insufficient_quota');
          
          if (isQuotaExceeded) {
            console.error('[TTS] OpenAI quota exceeded - voice temporarily unavailable');
            // Return graceful failure response (don't throw error)
            return NextResponse.json(
              { 
                error: 'Voice temporarily unavailable (quota exceeded)',
                voiceUnavailable: true,
                success: false
              },
              { status: 200 } // Return 200 to prevent frontend errors
            );
          }
          
          // For other errors, log and return graceful failure
          console.error('[TTS] OpenAI TTS error:', response.status, errorText.substring(0, 100));
          return NextResponse.json(
            { 
              error: 'Voice temporarily unavailable',
              voiceUnavailable: true,
              success: false
            },
            { status: 200 }
          );
        }

        const audioBuffer = Buffer.from(await response.arrayBuffer());

        if (!audioBuffer || audioBuffer.length === 0) {
          throw new Error('Empty audio buffer from OpenAI');
        }

        return new NextResponse(audioBuffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length.toString(),
            'Cache-Control': 'public, max-age=3600',
          },
        });
      } catch (openaiError: any) {
        // GRACEFUL FAILURE: Log error, don't retry endlessly
        console.error('[TTS] OpenAI TTS Error:', openaiError.message);
        
        // Return graceful failure (don't throw, don't retry)
        return NextResponse.json(
          { 
            error: 'Voice temporarily unavailable',
            voiceUnavailable: true,
            success: false
          },
          { status: 200 }
        );
      }
    }

    // Priority 3: If using SLM (HF_API_KEY) without OpenAI, try ElevenLabs
    if (process.env.HF_API_KEY && !openaiApiKey) {
      if (ELEVENLABS_API_KEY) {
        console.log('[TTS] Using SLM - trying ElevenLabs for TTS...');
        try {
          return await generateElevenLabsTTS(text);
        } catch (elevenLabsError) {
          console.error('[TTS] ElevenLabs failed:', elevenLabsError);
          return NextResponse.json(
            { 
              error: 'TTS unavailable. When using SLM (HF_API_KEY), add ELEVENLABS_API_KEY for voice output, or OPENAI_API_KEY for TTS.',
              code: 'TTS_UNAVAILABLE'
            },
            { status: 503 }
          );
        }
      } else {
        return NextResponse.json(
          { 
            error: 'TTS unavailable. When using SLM (HF_API_KEY), add ELEVENLABS_API_KEY for voice output.',
            code: 'TTS_UNAVAILABLE'
          },
          { status: 503 }
        );
      }
    }

    // Fallback: Try AI Adapter (for custom providers only - SLM doesn't have TTS)
    try {
      const audioBlob = await aiAdapter.generateSpeech({
        text,
        voice: 'alloy',
        speed: 1.0,
      });

      const buffer = Buffer.from(await audioBlob.arrayBuffer());

      if (!buffer || buffer.length === 0) {
        throw new Error('Empty buffer from AI service');
      }

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (ttsError: any) {
      // GRACEFUL FAILURE: All providers failed, return silent failure
      console.error('[TTS] AI Adapter TTS Error:', ttsError.message);
      
      return NextResponse.json(
        { 
          error: 'Voice temporarily unavailable',
          voiceUnavailable: true,
          success: false
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    // GRACEFUL FAILURE: Catch-all error handler
    console.error('[TTS] Handler Error:', error.message);
    return NextResponse.json(
      { 
        error: 'Voice temporarily unavailable',
        voiceUnavailable: true,
        success: false
      },
      { status: 200 } // Return 200 to prevent frontend errors
    );
  }
}

// ElevenLabs TTS implementation
async function generateElevenLabsTTS(text: string, voiceId?: string) {
  try {
    const voice = voiceId || ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY || '',
        },
        body: JSON.stringify({
          text: text.substring(0, 5000), // ElevenLabs has character limits
          model_id: 'eleven_multilingual_v2', // Updated: Use newer model (replaces deprecated eleven_monolingual_v1)
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      let errorText = '';
      let errorData: any = {};
      try {
        errorText = await response.text();
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // Not JSON, use text as is
        }
      } catch (e) {
        errorText = 'Unable to read error response';
      }
      
      console.error('ElevenLabs API Error:', response.status, errorText);
      
      // Check for deprecated model error
      if (errorData?.detail?.status === 'model_deprecated_free_tier' || 
          errorText?.includes('model_deprecated_free_tier') ||
          errorText?.includes('eleven_monolingual_v1') ||
          errorText?.includes('eleven_multilingual_v1')) {
        throw new Error('ElevenLabs model deprecated. The code has been updated to use eleven_multilingual_v2. Please restart your server.');
      }
      
      // GRACEFUL FAILURE: Return empty response instead of throwing
      if (response.status === 401) {
        console.error('[TTS] ElevenLabs auth failed - check API key');
        return null; // Return null to trigger fallback
      }
      if (response.status === 429) {
        console.error('[TTS] ElevenLabs rate limit exceeded');
        return null; // Return null to trigger fallback
      }
      
      console.error('[TTS] ElevenLabs failed:', response.status);
      return null; // Return null for any other failure
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (!buffer || buffer.length === 0) {
      console.error('[TTS] Empty audio buffer from ElevenLabs');
      return null; // Return null instead of throwing
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('ElevenLabs Error:', error);
    return null; // Return null instead of throwing
  }
}
