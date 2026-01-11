/**
 * ==========================================================
 * STT API ROUTE - WITH DEEPGRAM FALLBACK
 * ==========================================================
 * 
 * Speech-to-Text with automatic fallback:
 * - Primary: OpenAI Whisper (via AI Adapter)
 * - Fallback: Deepgram (if OpenAI rate limited/fails)
 * 
 * TO ADD DEEPGRAM FALLBACK:
 * 1. Get API key from: https://console.deepgram.com/signup
 * 2. Add DEEPGRAM_API_KEY to .env.local
 * 3. Automatic fallback will work on rate limits
 * 
 * ==========================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiAdapter } from '@/lib/ai-adapter';

// Optional: Deepgram for STT fallback (better rate limits, faster transcription)
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// Helper function to transcribe using Deepgram
async function transcribeWithDeepgram(audioBlob: Blob): Promise<string> {
  if (!DEEPGRAM_API_KEY) {
    throw new Error('Deepgram API key not configured');
  }

  // Convert Blob to Buffer for Deepgram
  const buffer = Buffer.from(await audioBlob.arrayBuffer());
  
  const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=en&punctuate=true', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${DEEPGRAM_API_KEY}`,
      'Content-Type': audioBlob.type || 'audio/webm',
    },
    body: buffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Deepgram API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
}

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
  
  // Check for Deepgram (can work standalone for STT)
  if (DEEPGRAM_API_KEY) {
    return true;
  }
  
  return false;
};

export async function POST(request: NextRequest) {
  try {
    // Validate AI configuration
    if (!isAIConfigured()) {
      const provider = process.env.AI_PROVIDER || 'openai';
      return NextResponse.json(
        { 
          error: `AI service not configured. Speech-to-text is unavailable.`,
          code: 'API_KEY_MISSING'
        },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert File to Blob for AI Adapter
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const audioBlob = new Blob([buffer], { type: audioFile.type });

    // PRIORITY: Use Deepgram when using SLM (HF_API_KEY) since SLM doesn't have STT
    const isUsingSLM = !!process.env.HF_API_KEY;
    let transcriptionText: string;
    let usedProvider = 'openai';

    // Priority 1: If using SLM and Deepgram available, use Deepgram first
    if (isUsingSLM && DEEPGRAM_API_KEY) {
      console.log('[STT] Using SLM - prioritizing Deepgram for STT');
      try {
        transcriptionText = await transcribeWithDeepgram(audioBlob);
        usedProvider = 'deepgram';
        console.log('[STT] ✓ Successfully transcribed using Deepgram (SLM mode)');
        
        return NextResponse.json({
          text: transcriptionText,
          success: true,
        });
      } catch (deepgramError: any) {
        console.error('[STT] Deepgram failed, trying OpenAI fallback:', deepgramError);
        // Fall through to try OpenAI
      }
    }

    // Priority 2: Try OpenAI Whisper (via AI Adapter)
    // Priority 3: Fallback to Deepgram if OpenAI fails/rate limited
    try {
      transcriptionText = await aiAdapter.transcribeAudio({
        audio: audioBlob,
        language: 'en',
      });
      usedProvider = 'openai';
    } catch (error: any) {
      // If OpenAI rate limited (429) or fails, try Deepgram fallback
      const isRateLimited = error.message?.includes('429') || 
                           error.message?.includes('rate limit') ||
                           error.message?.includes('quota');

      if (isRateLimited && DEEPGRAM_API_KEY) {
        console.log('[STT] OpenAI rate limited, falling back to Deepgram...');
        try {
          transcriptionText = await transcribeWithDeepgram(audioBlob);
          usedProvider = 'deepgram';
        } catch (deepgramError: any) {
          console.error('[STT] Deepgram fallback also failed:', deepgramError);
          return NextResponse.json(
            { 
              error: 'Speech-to-text service unavailable. Please wait a moment and try again.',
              code: 'SERVICE_UNAVAILABLE'
            },
            { status: 503 }
          );
        }
      } else if (!isRateLimited) {
        // For non-rate-limit errors, try Deepgram if available
        if (DEEPGRAM_API_KEY) {
          console.log('[STT] OpenAI failed, trying Deepgram fallback...');
          try {
            transcriptionText = await transcribeWithDeepgram(audioBlob);
            usedProvider = 'deepgram';
          } catch (deepgramError: any) {
            // If both fail, throw original error
            throw error;
          }
        } else {
          // No fallback available, throw original error
          throw error;
        }
      } else {
        // Rate limited but no Deepgram fallback
        return NextResponse.json(
          { 
            error: 'Rate limited. Please wait a moment and try again, or add DEEPGRAM_API_KEY for fallback.',
            code: 'RATE_LIMITED'
          },
          { status: 429 }
        );
      }
    }
    
    // Log which provider was used (for debugging)
    if (usedProvider === 'deepgram') {
      console.log('[STT] Successfully transcribed using Deepgram');
    }

    return NextResponse.json({
      text: transcriptionText,
      success: true,
    });
  } catch (error: any) {
    console.error('STT Error:', error);
    return NextResponse.json(
      { error: error.message || 'Speech to text conversion failed' },
      { status: 500 }
    );
  }
}
