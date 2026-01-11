import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Check if OpenAI API key is configured
const isOpenAIConfigured = () => {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-here';
};

// Alternative: Deepgram STT (more accurate for voice)
// For this implementation, we'll use OpenAI Whisper
export async function POST(request: NextRequest) {
  try {
    // Validate API key configuration
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured. Speech-to-text is unavailable.',
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

    // Convert File to Buffer for OpenAI
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    
    // Use FormData for OpenAI API
    const uploadFormData = new FormData();
    uploadFormData.append('file', new Blob([buffer], { type: audioFile.type }), 'audio.webm');
    uploadFormData.append('model', 'whisper-1');
    uploadFormData.append('language', 'en');

    // Transcribe using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: new File([buffer], audioFile.name || 'audio.webm', { type: audioFile.type }),
      model: 'whisper-1',
      language: 'en',
    });

    return NextResponse.json({
      text: transcription.text,
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
