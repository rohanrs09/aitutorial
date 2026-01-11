# Gemini API Setup (Rate Limit Fallback)

## Quick Setup

Add to `.env.local`:
```bash
GEMINI_API_KEY=your-gemini-api-key-here
```

## How It Works

1. **Primary**: Uses OpenAI API
2. **Fallback**: When OpenAI returns 429 (rate limited), automatically switches to Gemini
3. **TTS**: Falls back to ElevenLabs if OpenAI rate limited

## Get Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Add to `.env.local`

## Benefits

- ✅ No more rate limit errors
- ✅ Automatic failover
- ✅ Seamless user experience
