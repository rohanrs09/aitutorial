import { NextRequest, NextResponse } from 'next/server';
import { APIServiceFactory } from '@/lib/services/api-service';
import { shouldRateLimit, trackRequestStart, trackRequestComplete, generateRequestKey } from '@/lib/api-rate-limiter';

const isSTTConfigured = () => {
  return !!(process.env.DEEPGRAM_API_KEY || process.env.OPENAI_API_KEY);
};

export async function POST(request: NextRequest) {
  let requestKey: string | null = null;
  
  try {
    if (!isSTTConfigured()) {
      return NextResponse.json(
        { error: 'STT unavailable', code: 'STT_NOT_CONFIGURED' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
    }

    const provider = process.env.DEEPGRAM_API_KEY ? 'deepgram' : 'openai';
    requestKey = generateRequestKey(provider, audioFile.size.toString());
    
    const rateLimitCheck = shouldRateLimit(provider, requestKey);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: rateLimitCheck.reason, retryAfterMs: rateLimitCheck.retryAfterMs },
        { status: 429 }
      );
    }

    trackRequestStart(provider, requestKey);

    const sttService = APIServiceFactory.createSTTService();
    if (!sttService) {
      return NextResponse.json({ error: 'STT service unavailable' }, { status: 503 });
    }

    const transcription = await sttService.transcribeAudio(audioFile);

    if (!transcription || transcription.trim().length === 0) {
      return NextResponse.json({ text: '', error: 'No speech detected' }, { status: 200 });
    }

    return NextResponse.json({ text: transcription, success: true });
  } catch (error: any) {
    console.error('[STT] Error:', error.message);
    return NextResponse.json({ error: 'Transcription failed', text: '' }, { status: 500 });
  } finally {
    if (requestKey) {
      trackRequestComplete(requestKey);
    }
  }
}
