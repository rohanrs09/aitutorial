# AI Voice Tutor - Getting Started Guide

> **Single source of truth for initial setup and configuration**

## Table of Contents
1. [Quick Start (5 minutes)](#quick-start)
2. [Environment Variables](#environment-variables)
3. [API Keys Setup](#api-keys-setup)
4. [Verification](#verification)
5. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn
- Modern browser (Chrome, Firefox, Safari, Edge)
- Microphone (for voice interaction)
- Camera (optional, for emotion detection)

### Installation

```bash
# 1. Clone and install
git clone <repository-url>
cd ai-voice-tutor
npm install

# 2. Configure environment
cp .env.example .env.local

# 3. Add your API keys (see below)

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

Create `.env.local` in project root:

```bash
# ============================================================
# REQUIRED - At least ONE AI provider
# ============================================================

# Option A: SLM (Your own model - RECOMMENDED for production)
HF_API_KEY=hf_your_hugging_face_api_key
SLM_MODEL_NAME=meta-llama/Llama-3.2-3B-Instruct

# Option B: OpenAI (Development/Testing)
OPENAI_API_KEY=sk-your-openai-api-key

# Option C: Gemini (Fallback)
GEMINI_API_KEY=your-gemini-api-key

# ============================================================
# VOICE SERVICES (Required when using SLM)
# ============================================================

# Text-to-Speech (choose one)
ELEVENLABS_API_KEY=your-elevenlabs-key  # Recommended

# Speech-to-Text (choose one)
DEEPGRAM_API_KEY=your-deepgram-key      # Recommended

# ============================================================
# DATABASE (Optional but recommended)
# ============================================================
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ============================================================
# AUTHENTICATION (Optional)
# ============================================================
# Auth is handled by Supabase (no separate auth keys needed)
```

---

## API Keys Setup

### Priority Order

```
1. HF_API_KEY (SLM - Primary for production)
   ↓
2. ELEVENLABS_API_KEY + DEEPGRAM_API_KEY (Voice services)
   ↓
3. OPENAI_API_KEY (Fallback for everything)
   ↓
4. GEMINI_API_KEY (Fallback if OpenAI rate limited)
```

### Getting API Keys

| Service | URL | Purpose |
|---------|-----|---------|
| **Hugging Face** | https://huggingface.co/settings/tokens | SLM (Primary AI) |
| **OpenAI** | https://platform.openai.com/api-keys | AI + Emotion Detection |
| **Gemini** | https://aistudio.google.com/app/apikey | AI Fallback |
| **ElevenLabs** | https://elevenlabs.io/app/settings/api-keys | Text-to-Speech |
| **Deepgram** | https://console.deepgram.com/signup | Speech-to-Text |
| **Supabase** | https://supabase.com/dashboard | Database |
| **Supabase** | https://supabase.com/dashboard | Auth & Database |

### Minimum Requirements

**For Development:**
- `OPENAI_API_KEY` (covers AI, TTS, STT, emotion detection)

**For Production (SLM):**
- `HF_API_KEY` (your SLM)
- `ELEVENLABS_API_KEY` or `OPENAI_API_KEY` (TTS)
- `DEEPGRAM_API_KEY` or `OPENAI_API_KEY` (STT)
- `OPENAI_API_KEY` (emotion detection only)

---

## Verification

### Step 1: Check Server Logs

```bash
npm run dev
```

**Look for:**
```
[AIAdapter] ✓ Using SLM as PRIMARY provider (Hugging Face)
# OR
[AIAdapter] Using OpenAI as fallback provider
```

### Step 2: Check Browser Console (F12)

**Success indicators:**
```
[Supabase] Configuration Status: { isConfigured: true }
[Supabase] ✅ Connection validated - tables exist
```

### Step 3: Test Features

| Feature | How to Test | Expected Result |
|---------|-------------|-----------------|
| AI Chat | Ask a question | Get response |
| Voice Input | Hold spacebar, speak | Text appears |
| Voice Output | AI responds | Audio plays |
| Emotion | Enable camera | Emotion detected |
| Database | Complete session | Data saved |

---

## Troubleshooting

### "API key not working"

```bash
# 1. Check file exists
ls -la .env.local

# 2. Check format (no quotes, no spaces)
# ✅ CORRECT: OPENAI_API_KEY=sk-abc123
# ❌ WRONG:  OPENAI_API_KEY="sk-abc123"

# 3. Restart server after changes
npm run dev
```

### "Rate limited" (429)

- Add `GEMINI_API_KEY` for automatic fallback
- Wait a few minutes
- Check billing at provider dashboard

### "Supabase not configured"

```bash
# Check variables are set
cat .env.local | grep SUPABASE

# If missing, add from Supabase Dashboard → Settings → API
```

### "Emotion detection shows neutral"

- Verify `OPENAI_API_KEY` is set and valid
- Check camera permissions in browser
- Ensure good lighting on face

### "TTS/STT not working with SLM"

When using SLM (`HF_API_KEY`), you MUST have:
- `ELEVENLABS_API_KEY` or `OPENAI_API_KEY` for TTS
- `DEEPGRAM_API_KEY` or `OPENAI_API_KEY` for STT

---

## Next Steps

1. **Database Setup** → See `docs/02-SUPABASE.md`
2. **SLM Configuration** → See `docs/03-SLM-CONFIGURATION.md`
3. **Architecture** → See `docs/04-ARCHITECTURE.md`

---

## Quick Reference

```bash
# Start development
npm run dev

# Check environment
cat .env.local

# Test API keys
node -e "require('dotenv').config({path:'.env.local'}); console.log('OpenAI:', !!process.env.OPENAI_API_KEY)"
```
