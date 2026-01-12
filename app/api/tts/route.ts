import { NextRequest, NextResponse } from 'next/server';
import { APIServiceFactory } from '@/lib/services/api-service';
import { shouldRateLimit, trackRequestStart, trackRequestComplete, generateRequestKey } from '@/lib/api-rate-limiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const isTTSConfigured = () => {
  return !!(process.env.ELEVENLABS_API_KEY || process.env.OPENAI_API_KEY);
};

export async function POST(request: NextRequest) {
  let requestKey: string | null = null;
  
  try {
    if (!isTTSConfigured()) {
      return NextResponse.json(
        { error: 'TTS unavailable', code: 'TTS_NOT_CONFIGURED' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { text } = body;
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    if (text.length > 5000) {
      return NextResponse.json({ error: 'Text too long (max 5000 characters)' }, { status: 400 });
    }

    const provider = process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : 'openai';
    requestKey = generateRequestKey(provider, text);
    
    const rateLimitCheck = shouldRateLimit(provider, requestKey);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: rateLimitCheck.reason, retryAfterMs: rateLimitCheck.retryAfterMs },
        { status: 429 }
      );
    }

    trackRequestStart(provider, requestKey);

    const ttsService = APIServiceFactory.createTTSService();
    if (!ttsService) {
      return NextResponse.json({ error: 'TTS service unavailable' }, { status: 503 });
    }

    const audioBlob = await ttsService.textToSpeech(text);
    const audioBuffer = await audioBlob.arrayBuffer();

    trackRequestComplete(requestKey);

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    if (requestKey) {
      trackRequestComplete(requestKey);
    }
    
    console.error('[TTS] Error:', error);
    return NextResponse.json(
      { error: 'TTS generation failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
