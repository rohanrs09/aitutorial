# Quick Start Guide

## Environment Setup

Add to `.env.local`:

```bash
# Required - Choose one:
OPENAI_API_KEY=your-openai-key

# OR
GEMINI_API_KEY=your-gemini-key

# Optional - For better TTS quality:
ELEVENLABS_API_KEY=your-elevenlabs-key
```

## How Rate Limiting Works

1. **Primary**: Uses OpenAI
2. **Auto-Fallback**: If OpenAI rate limited (429), automatically uses Gemini
3. **TTS Fallback**: If OpenAI TTS rate limited, uses ElevenLabs

## User Flow

1. Homepage → "Browse Courses" → Courses Section
2. Click Course → Course Player
3. Click "Need Help?" → AI Tutor (with emotion detection)
4. Get Help → End Session → Returns to Course

## Features

✅ Emotion detection (user enables manually)  
✅ Auto-fallback to Gemini on rate limits  
✅ Course-aware AI responses  
✅ Audio generation with fallbacks  
✅ Auto-return to course after help  
