import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Check if OpenAI API key is configured
const isOpenAIConfigured = () => {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-here';
};

// Optional: ElevenLabs for better voice quality
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Default voice

export async function POST(request: NextRequest) {
  try {
    // Validate API key configuration
    if (!isOpenAIConfigured()) {
      console.warn('TTS: OpenAI API key not configured');
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured. Text-to-speech is unavailable.',
          code: 'API_KEY_MISSING'
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { text, useElevenLabs = false } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // Use ElevenLabs if enabled and API key available
    if (useElevenLabs && ELEVENLABS_API_KEY) {
      return await generateElevenLabsTTS(text);
    }

    // Default: Use OpenAI TTS
    try {
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'nova',
        input: text,
        speed: 1.0,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());

      if (!buffer || buffer.length === 0) {
        console.error('TTS: Empty buffer from OpenAI');
        return NextResponse.json(
          { error: 'Failed to generate audio' },
          { status: 500 }
        );
      }

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (openaiError: any) {
      console.error('OpenAI TTS Error:', {
        message: openaiError.message,
        status: openaiError.status,
        error: openaiError.error
      });

      if (openaiError.status === 429) {
        return NextResponse.json(
          { error: 'Rate limited. Please try again later.' },
          { status: 429 }
        );
      }

      if (openaiError.status === 401) {
        return NextResponse.json(
          { error: 'OpenAI API key is invalid' },
          { status: 503 }
        );
      }

      throw openaiError;
    }
  } catch (error: any) {
    console.error('TTS Handler Error:', error);
    return NextResponse.json(
      { error: error.message || 'Text to speech conversion failed' },
      { status: 500 }
    );
  }
}

// ElevenLabs TTS implementation
async function generateElevenLabsTTS(text: string) {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY || '',
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('ElevenLabs API failed');
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('ElevenLabs Error:', error);
    throw error;
  }
}
