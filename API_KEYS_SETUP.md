# API Keys Setup Guide

## Quick Setup (5 minutes)

### Step 1: Get Your API Keys

#### OpenAI API Key (Required)
1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)

#### Gemini API Key (Recommended for Fallback)
1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

#### Deepgram API Key (Optional - STT Fallback)
1. Go to: https://console.deepgram.com/signup
2. Sign up (free tier available)
3. Go to API Keys section
4. Create new API key
5. Copy the key

#### ElevenLabs API Key (Optional - Better Voice Quality)
1. Go to: https://elevenlabs.io/app/settings/api-keys
2. Click "Create API Key"
3. Copy the key

### Step 2: Add Keys to Your Project

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and add your keys:
   ```bash
   # Required - At least one AI provider
   OPENAI_API_KEY=sk-your-openai-key-here
   
# Recommended - Auto-fallback when OpenAI rate limits
GEMINI_API_KEY=your-gemini-key-here

# Optional - STT fallback (faster, better rate limits)
DEEPGRAM_API_KEY=your-deepgram-key-here

# Optional - Better voice quality
ELEVENLABS_API_KEY=your-elevenlabs-key-here
   ```

3. Save the file

4. Restart your dev server:
   ```bash
   npm run dev
   ```

## How It Works

### Automatic Fallback System

1. **AI Responses**: OpenAI → Auto-fallback to Gemini if rate limited
2. **Speech-to-Text (STT)**: OpenAI Whisper → Auto-fallback to Deepgram if rate limited
3. **Text-to-Speech (TTS)**: OpenAI TTS → Auto-fallback to ElevenLabs if rate limited

### Minimum Requirements

- **At least ONE** of: `OPENAI_API_KEY` or `GEMINI_API_KEY`
- **Recommended**: Both for automatic fallback

### Optional Enhancements

- `DEEPGRAM_API_KEY`: Faster STT with better rate limits (auto-fallback)
- `ELEVENLABS_API_KEY`: Better text-to-speech voice quality

## Troubleshooting

### "API key is invalid"
- Check that you copied the full key (no spaces)
- Verify the key is active in your provider dashboard

### "Rate limited" or "Quota exceeded"
- If you have `GEMINI_API_KEY`, it will automatically fallback
- Otherwise, wait a few minutes or upgrade your plan

### "Model not found" (Gemini)
- The app automatically tries multiple models
- If all fail, check your `GEMINI_API_KEY` is valid

## Need Help?

- Check `.env.example` for all available options
- See `QUICK_START.md` for more details
