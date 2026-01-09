import { NextRequest, NextResponse } from 'next/server';
import { aiAdapter, isAIConfigured } from '@/lib/ai-adapter';

// Speech-to-text using AI adapter (model-agnostic)
export async function POST(request: NextRequest) {
  try {
    // Validate AI configuration
    if (!isAIConfigured()) {
      const providerInfo = aiAdapter.getProviderInfo();
      return NextResponse.json(
        { 
          error: `AI (${providerInfo.provider}) not configured. Speech-to-text is unavailable.`,
          code: 'API_KEY_MISSING',
          provider: providerInfo.provider
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

    // Convert File to Blob for AI adapter
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const audioBlob = new Blob([buffer], { type: audioFile.type });

    // Transcribe using AI adapter (model-agnostic)
    const transcriptionText = await aiAdapter.transcribeAudio({
      audio: audioBlob,
      language: 'en',
    });

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
