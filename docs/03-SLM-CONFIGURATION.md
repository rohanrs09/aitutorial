# SLM (Small Language Model) Configuration Guide

> **Single source of truth for AI model configuration and SLM integration**

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Configuration](#configuration)
4. [Voice Services](#voice-services)
5. [API Endpoints](#api-endpoints)
6. [Emotion-Based Adaptation](#emotion-based-adaptation)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Overview

### Philosophy

- **SLM-First**: Your own model is PRIMARY
- **OpenAI as Fallback**: Only used when SLM unavailable
- **Model Agnostic**: Switch models by changing config only
- **No Vendor Lock-in**: Own your AI infrastructure

### Provider Priority

```
1. HF_API_KEY (SLM via Hugging Face) - PRIMARY
   ↓
2. OPENAI_API_KEY - Fallback
   ↓
3. GEMINI_API_KEY - Fallback if OpenAI rate limited
```

---

## Architecture

### Data Flow

```
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
    └─→ Emotion Detection → OpenAI Vision (always)
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/ai-adapter.ts` | Model-agnostic AI interface |
| `lib/tutor-service.ts` | Learning logic (model-independent) |
| `lib/services/api-service.ts` | Service factory for TTS/STT/AI |
| `app/api/tutor/route.ts` | Main tutoring endpoint |
| `app/api/tutor/explain/route.ts` | Structured explanations |

---

## Configuration

### SLM Mode (Production)

```bash
# .env.local

# Primary AI - Your SLM
HF_API_KEY=hf_your_hugging_face_api_key
SLM_MODEL_NAME=meta-llama/Llama-3.2-3B-Instruct

# Voice Services (REQUIRED with SLM)
ELEVENLABS_API_KEY=your_elevenlabs_key
DEEPGRAM_API_KEY=your_deepgram_key

# Fallback (optional)
OPENAI_API_KEY=sk-your-openai-key  # For emotion detection
GEMINI_API_KEY=your-gemini-key     # For rate limit fallback
```

### OpenAI Mode (Development)

```bash
# .env.local

# All-in-one for development
OPENAI_API_KEY=sk-your-openai-key

# Optional fallback
GEMINI_API_KEY=your-gemini-key
```

### Custom SLM Endpoint

```bash
# For self-hosted models (Ollama, vLLM, etc.)
AI_PROVIDER=slm
SLM_BASE_URL=http://localhost:8080/v1
SLM_API_KEY=your-key
SLM_MODEL_NAME=llama3
```

---

## Voice Services

### Why Needed with SLM

SLM models don't have built-in TTS/STT, so you need external services:

### Text-to-Speech (TTS)

| Service | Priority | When Used |
|---------|----------|-----------|
| ElevenLabs | 1 | When `ELEVENLABS_API_KEY` set |
| OpenAI TTS | 2 | Fallback when ElevenLabs unavailable |

```bash
ELEVENLABS_API_KEY=your-key  # Recommended
# OR
OPENAI_API_KEY=sk-xxx        # Fallback
```

### Speech-to-Text (STT)

| Service | Priority | When Used |
|---------|----------|-----------|
| Deepgram | 1 | When `DEEPGRAM_API_KEY` set |
| OpenAI Whisper | 2 | Fallback when Deepgram unavailable |

```bash
DEEPGRAM_API_KEY=your-key  # Recommended (faster, better rate limits)
# OR
OPENAI_API_KEY=sk-xxx      # Fallback
```

### Emotion Detection

Always uses OpenAI Vision (GPT-4o-mini):
```bash
OPENAI_API_KEY=sk-xxx  # Required for emotion detection
```

---

## API Endpoints

### `/api/tutor` - General Tutoring

```typescript
// Request
POST /api/tutor
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

// Response
{
  "response": "Let me explain async/await...",
  "slides": [...],
  "voiceText": "..."
}
```

### `/api/tutor/explain` - Structured Explanations

```typescript
// Request
POST /api/tutor/explain
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

// Response
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
  "slides": [...],
  "needsSimplification": true,
  "simplificationLevel": "basic"
}
```

---

## Emotion-Based Adaptation

### How It Works

**CRITICAL: Emotion changes HOW content is explained, NOT lecture order**

```
User is confused (high confidence)
    ↓
System detects via camera
    ↓
SLM called AGAIN with simpler prompts
    ↓
Same concept, but:
- Simpler words
- Shorter sentences
- Basic examples
- More encouragement
    ↓
Lecture order unchanged
```

### Example

**Original (neutral):**
```
"Implement a RESTful API endpoint using Express middleware 
with proper error handling and authentication..."
```

**Simplified (confused):**
```
"Let's make a simple web address that responds when visited. 
Think of it like a doorbell - when someone presses it, 
your code answers. Here's the simplest version..."
```

### Emotion Categories

| Emotion | Confidence Threshold | Action |
|---------|---------------------|--------|
| confused | > 0.6 | Simplify explanation |
| frustrated | > 0.6 | Simplify + encourage |
| bored | > 0.7 | Speed up, add examples |
| engaged | > 0.5 | Continue normally |
| tired | > 0.6 | Suggest break |
| stressed | > 0.6 | Calm tone, simplify |

---

## Troubleshooting

### "AI service not configured"

```bash
# Check HF_API_KEY or OPENAI_API_KEY is set
cat .env.local | grep -E "HF_API_KEY|OPENAI_API_KEY"

# Restart server
npm run dev
```

### "TTS unavailable"

When using SLM, you MUST have:
- `ELEVENLABS_API_KEY`, OR
- `OPENAI_API_KEY`

### "STT failed"

When using SLM, you MUST have:
- `DEEPGRAM_API_KEY`, OR
- `OPENAI_API_KEY`

### Slides show random content

Check server logs for:
```
[Tutor API] ✓ Generated X slides from SLM response
```

If not showing, SLM response format may be incorrect.

### Verify SLM is Active

Look for in server logs:
```
[AIAdapter] ✓ Using SLM as PRIMARY provider (Hugging Face)
[AIAdapter] Model: meta-llama/Llama-3.2-3B-Instruct
```

If you see this instead, SLM is NOT active:
```
[AIAdapter] ⚠️ HF_API_KEY not found - falling back to OpenAI/Gemini
```

---

## Best Practices

### SLM Response Format

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

### Model Selection

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| Phi-3-mini | 3.8B | ⚡⚡⚡ | ⭐⭐⭐ | Fast responses |
| LLaMA-3 8B | 8B | ⚡⚡ | ⭐⭐⭐⭐ | Balanced |
| Mistral 7B | 7B | ⚡⚡ | ⭐⭐⭐⭐ | Good reasoning |
| LLaMA-3 70B | 70B | ⚡ | ⭐⭐⭐⭐⭐ | Best quality |

### Voice Integration

- Voice text should be natural, spoken language
- Avoid code in voice (say "see the code example")
- Keep voice segments under 30 seconds
- Pause between concepts

### Local SLM Options

**Ollama:**
```bash
ollama pull llama3
ollama serve

# Configure:
SLM_BASE_URL=http://localhost:11434/v1
SLM_MODEL_NAME=llama3
```

**vLLM:**
```bash
python -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Llama-3-8b-chat-hf \
  --port 8080

# Configure:
SLM_BASE_URL=http://localhost:8080/v1
SLM_MODEL_NAME=meta-llama/Llama-3-8b-chat-hf
```

**LM Studio:**
1. Download from https://lmstudio.ai
2. Download a model
3. Start local server
4. Configure endpoint

---

## Comparison: OpenAI vs SLM

| Aspect | OpenAI | Your SLM |
|--------|--------|----------|
| **Cost** | Pay per token | One-time setup |
| **Privacy** | Data sent to OpenAI | All data stays with you |
| **Latency** | ~500-2000ms | ~100-500ms (local) |
| **Control** | None | Full control |
| **Customization** | Limited | Unlimited |
| **Dependency** | External service | Self-hosted |

---

## Summary

✅ **SLM is PRIMARY** - Set `HF_API_KEY`  
✅ **Voice services** - Set `ELEVENLABS_API_KEY` + `DEEPGRAM_API_KEY`  
✅ **Emotion adaptation** - Changes HOW content is explained  
✅ **Slides from SLM** - Parsed from response, not generated separately  
✅ **No random content** - Everything comes from SLM  

**Your SLM is the teacher. Voice services are just input/output. OpenAI/Gemini are emergency fallbacks only.**
