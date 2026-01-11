# SLM Setup Guide - AI Voice Tutor

## Overview

This application is designed to use **YOUR OWN Small Language Model (SLM)** as the PRIMARY intelligence source for course learning. This guide explains how to properly configure the app to use your SLM deployed on Hugging Face.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI VOICE TUTOR FLOW                      │
└─────────────────────────────────────────────────────────────┘

Frontend (/learn route)
    ↓
    ├─→ Voice Input → /api/stt (Deepgram PRIMARY when using SLM)
    │
    ├─→ User Question → /api/tutor or /api/tutor/explain
    │                      ↓
    │                   SLM (Hugging Face) - PRIMARY
    │                      ↓
    │                   Structured Response:
    │                   - Title
    │                   - Explanation steps
    │                   - Examples
    │                   - Voice text
    │                      ↓
    │                   Slides generated from SLM response
    │
    ├─→ Voice Output → /api/tts (ElevenLabs PRIMARY when using SLM)
    │
    └─→ Emotion Detection → Triggers re-explanation with simpler prompts
                            (Same concept, easier format)
```

---

## Required Configuration

### 1. SLM (PRIMARY) - Your Own Model

**Required Environment Variables:**

```bash
# Your Hugging Face API Key (PRIMARY)
HF_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Your specific model (default: meta-llama/Llama-3.2-3B-Instruct)
SLM_MODEL_NAME=your-model-name-here
# OR
HF_MODEL_NAME=your-model-name-here
```

**How to get HF_API_KEY:**
1. Go to https://huggingface.co/settings/tokens
2. Create a new token with "Read" access
3. Copy the token (starts with `hf_`)
4. Add to `.env.local`

---

### 2. Voice Services (REQUIRED when using SLM)

Since SLM doesn't have built-in TTS/STT, you need:

#### Text-to-Speech (TTS) - Choose ONE:

**Option A: ElevenLabs (Recommended)**
```bash
ELEVENLABS_API_KEY=your-elevenlabs-api-key
```
- Get from: https://elevenlabs.io/app/settings/api-keys
- Better voice quality
- Works perfectly with SLM

**Option B: OpenAI TTS (Fallback)**
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
```
- Uses OpenAI TTS only (not for main AI)
- SLM remains PRIMARY for course content

#### Speech-to-Text (STT) - Choose ONE:

**Option A: Deepgram (Recommended)**
```bash
DEEPGRAM_API_KEY=your-deepgram-api-key
```
- Get from: https://console.deepgram.com/signup
- Faster, better rate limits
- Prioritized when using SLM

**Option B: OpenAI Whisper (Fallback)**
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
```
- Uses OpenAI Whisper only (not for main AI)
- SLM remains PRIMARY for course content

---

## Complete .env.local Example (SLM Mode)

```bash
# ==========================================================
# SLM CONFIGURATION (PRIMARY)
# ==========================================================
HF_API_KEY=hf_your_actual_hugging_face_api_key_here
SLM_MODEL_NAME=meta-llama/Llama-3.2-3B-Instruct

# ==========================================================
# VOICE SERVICES (REQUIRED FOR SLM)
# ==========================================================
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# ==========================================================
# FALLBACK (OPTIONAL)
# ==========================================================
# Only used if SLM fails or for TTS/STT if above not set
OPENAI_API_KEY=sk-your-openai-key-here
GEMINI_API_KEY=your-gemini-key-here

# ==========================================================
# AUTHENTICATION & DATABASE (OPTIONAL)
# ==========================================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

---

## How It Works

### 1. SLM as PRIMARY Intelligence

When `HF_API_KEY` is set:
- ✅ SLM handles ALL course explanations
- ✅ SLM generates structured learning content
- ✅ GPT/Gemini are FALLBACK ONLY (not used unless SLM fails)

### 2. Course Learning Flow

```
User clicks "Need Help" on lecture
    ↓
Frontend sends to /api/tutor/explain
    ↓
SLM receives:
    - Lecture title
    - Lecture description
    - User's question
    - Emotion state (if confused/frustrated)
    ↓
SLM returns structured response:
    - Title
    - Step-by-step explanation
    - Real-world analogy
    - Code example
    - Key takeaway
    ↓
Backend parses into slides (NO additional SLM call)
    ↓
Frontend displays ONE concept per slide
    ↓
Voice reads explanation (ElevenLabs/OpenAI TTS)
```

### 3. Emotion-Based Adaptation

**CRITICAL: Emotion changes HOW content is explained, NOT lecture order**

When user is **confused** or **frustrated**:
1. System detects emotion via camera
2. SLM is called AGAIN with simpler prompts
3. Same concept, but:
   - Simpler words
   - Shorter sentences
   - Basic examples
   - More encouragement
4. Lecture order remains unchanged

**Example:**
```
Original: "Implement a RESTful API endpoint using Express middleware..."
Confused: "Let's make a simple web address that responds when visited. 
           Think of it like a doorbell - when someone presses it, 
           your code answers. Here's the simplest version..."
```

---

## API Endpoints

### `/api/tutor/explain` (NEW - Recommended)

**Purpose:** Structured explanations from SLM

**Request:**
```json
{
  "concept": "What is async/await?",
  "lectureContext": {
    "lectureTitle": "Asynchronous JavaScript",
    "lectureDescription": "Learn async programming",
    "sectionTitle": "Advanced JavaScript"
  },
  "emotion": "confused",
  "emotionConfidence": 0.8
}
```

**Response:**
```json
{
  "title": "Understanding Async/Await",
  "explanation": "Full text explanation...",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step 1",
      "content": "First, understand that async/await...",
      "example": "async function getData() { ... }"
    }
  ],
  "voiceText": "Let me explain async/await. First...",
  "slides": [
    {
      "id": "slide-1",
      "title": "Understanding Async/Await",
      "type": "concept",
      "content": "...",
      "spokenContent": "..."
    }
  ],
  "needsSimplification": true,
  "simplificationLevel": "basic"
}
```

### `/api/tutor` (Existing - Still Works)

**Purpose:** General tutoring with conversation history

**Request:**
```json
{
  "message": "Explain async/await",
  "topic": "JavaScript",
  "emotion": "neutral",
  "emotionConfidence": 0.5,
  "courseContext": {
    "lectureTitle": "Asynchronous JavaScript",
    "lectureDescription": "..."
  }
}
```

---

## Verification Steps

### 1. Check SLM is Active

Start your dev server and look for:
```
[AIAdapter] ✓ Using SLM as PRIMARY provider (Hugging Face)
[AIAdapter] Model: meta-llama/Llama-3.2-3B-Instruct
```

If you see:
```
[AIAdapter] ⚠️ HF_API_KEY not found - falling back to OpenAI/Gemini
```
→ Your SLM is NOT active. Check `.env.local`

### 2. Check Voice Services

**For TTS:**
```
[TTS] Using SLM - trying ElevenLabs for TTS...
```

**For STT:**
```
[STT] Using SLM - prioritizing Deepgram for STT
[STT] ✓ Successfully transcribed using Deepgram (SLM mode)
```

### 3. Test the Flow

1. Navigate to `/learn`
2. Ask a question (voice or text)
3. Check browser console for:
   ```
   [Tutor API] ✓ Generated 4 slides from SLM response
   ```
4. Verify slides show SLM content (not random/static)

---

## Troubleshooting

### Issue: "AI service not configured"

**Solution:**
```bash
# Check .env.local exists
ls -la .env.local

# Verify HF_API_KEY is set
cat .env.local | grep HF_API_KEY

# Restart server
npm run dev
```

### Issue: "TTS unavailable"

**Solution:**
When using SLM, you MUST have either:
- `ELEVENLABS_API_KEY` (recommended), OR
- `OPENAI_API_KEY` (for TTS only)

### Issue: "STT failed"

**Solution:**
When using SLM, you MUST have either:
- `DEEPGRAM_API_KEY` (recommended), OR
- `OPENAI_API_KEY` (for Whisper only)

### Issue: Slides show random content

**Problem:** Slides not coming from SLM response

**Solution:**
- Check `[Tutor API] ✓ Generated X slides from SLM response` in logs
- Slides are parsed from SLM response, not generated separately
- If issue persists, check SLM response format

### Issue: Emotion detection not working

**Solution:**
1. Grant camera permissions
2. Ensure good lighting
3. Face should be visible
4. Check emotion confidence > 0.6 for re-explanation

---

## Best Practices

### 1. SLM Response Format

Your SLM should return structured responses:

```
**Title:** Understanding Async/Await

**Short Explanation:**
Async/await makes asynchronous code look synchronous...

**Step-by-Step Breakdown:**
1. Use async keyword before function
2. Use await keyword before promises
3. Handle errors with try/catch

**Real-World Analogy:**
Think of it like ordering food...

**Example:**
```javascript
async function fetchData() {
  const response = await fetch('/api/data');
  return response.json();
}
```

**Key Takeaway:**
Async/await simplifies promise handling.
```

### 2. Emotion-Based Simplification

When emotion is confused/frustrated:
- Use SIMPLEST words
- Break into TINY steps
- ONE clear example
- Encouraging tone
- Avoid jargon

### 3. Voice Integration

- Voice text should be natural, spoken language
- Avoid code in voice (say "see the code example")
- Keep voice segments under 30 seconds
- Pause between concepts

---

## Environment Variable Priority

```
1. HF_API_KEY (PRIMARY - Your SLM)
   ↓
2. ELEVENLABS_API_KEY + DEEPGRAM_API_KEY (Voice services)
   ↓
3. OPENAI_API_KEY (Fallback for everything)
   ↓
4. GEMINI_API_KEY (Fallback if OpenAI rate limited)
```

---

## Support

If you encounter issues:

1. Check server logs for `[AIAdapter]`, `[TTS]`, `[STT]` messages
2. Verify all required API keys are set
3. Restart server after changing `.env.local`
4. Test with simple questions first
5. Check browser console for errors

---

## Summary

✅ **SLM is PRIMARY** - Set `HF_API_KEY`  
✅ **Voice services** - Set `ELEVENLABS_API_KEY` + `DEEPGRAM_API_KEY`  
✅ **Emotion adaptation** - Changes HOW content is explained  
✅ **Slides from SLM** - Parsed from response, not generated separately  
✅ **No random content** - Everything comes from SLM  

Your SLM is the teacher. Voice services are just input/output. GPT/Gemini are emergency fallbacks only.
