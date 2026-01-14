import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function callElevenLabs(text: string, apiKey: string): Promise<ArrayBuffer> {
  const voiceId = '21m00Tcm4TlvDq8ikWAM';
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text: text.substring(0, 5000),
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    if (response.status === 429 || response.status === 402) {
      throw new Error(`QUOTA_EXCEEDED:${response.status}`);
    }
    throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
  }

  return response.arrayBuffer();
}

async function callOpenAI(text: string, apiKey: string): Promise<ArrayBuffer> {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: 'alloy',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    if (response.status === 429 || response.status === 402) {
      throw new Error(`QUOTA_EXCEEDED:${response.status}`);
    }
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  return response.arrayBuffer();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    if (text.length > 5000) {
      return NextResponse.json({ error: 'Text too long (max 5000 characters)' }, { status: 400 });
    }

    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    console.log('[TTS] API Keys available:', {
      elevenLabs: elevenLabsKey ? `${elevenLabsKey.substring(0, 10)}...` : 'NOT SET',
      openai: openaiKey ? `${openaiKey.substring(0, 10)}...` : 'NOT SET'
    });

    if (!elevenLabsKey && !openaiKey) {
      console.error('[TTS] No API keys configured');
      return NextResponse.json(
        { error: 'TTS unavailable - no API keys configured', code: 'TTS_NOT_CONFIGURED' },
        { status: 503 }
      );
    }

    let audioBuffer: ArrayBuffer;

    if (elevenLabsKey) {
      console.log('[TTS] Using ElevenLabs API');
      audioBuffer = await callElevenLabs(text, elevenLabsKey);
    } else if (openaiKey) {
      console.log('[TTS] Using OpenAI API');
      audioBuffer = await callOpenAI(text, openaiKey);
    } else {
      return NextResponse.json({ error: 'No TTS service available' }, { status: 503 });
    }

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[TTS] Error:', errorMessage);
    
    // Check if error is quota/rate limit related
    if (errorMessage.includes('QUOTA_EXCEEDED') || errorMessage.includes('429') || errorMessage.includes('402')) {
      return NextResponse.json(
        { 
          error: 'Voice service quota exceeded or rate limited', 
          voiceUnavailable: true,
          code: 'QUOTA_EXCEEDED'
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'TTS generation failed', details: errorMessage },
      { status: 500 }
    );
  }
}
