# 🤖 SLM-First AI Configuration Guide

## Overview

This AI learning platform is designed with an **SLM-FIRST** approach. OpenAI is used **ONLY** for development and testing. The entire system is built to seamlessly switch to your own Small Language Model (SLM) with **ZERO code changes**.

---

## 🎯 Core Philosophy

- **Course-First Learning**: Video courses are the main learning source
- **AI as Side Tutor**: AI helps only when user asks (never auto-interrupts)
- **Model Agnostic**: Switch between OpenAI ↔ SLM by changing config only
- **No Vendor Lock-in**: Own your AI infrastructure

---

## 🚀 Quick Start (Development with OpenAI)

For immediate testing and development:

```bash
# 1. Copy environment template
cp .env.local.example .env.local

# 2. Add OpenAI key
AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key-here
AI_MODEL_NAME=gpt-4o

# 3. Start development
npm run dev
```

---

## 🔄 Switching to Your SLM

### Prerequisites

Your SLM endpoint must support OpenAI-compatible API format:
- `POST /v1/chat/completions` - Text generation
- `POST /v1/audio/speech` - Text-to-speech (optional)
- `POST /v1/audio/transcriptions` - Speech-to-text (optional)

### Step 1: Deploy Your SLM

Choose your model (examples):
- **LLaMA 3** (8B, 70B)
- **Mistral** (7B, 8x7B)
- **Phi-3** (mini, small, medium)
- **Qwen** (7B, 14B)
- Any OpenAI-compatible model

Deploy options:
- **Local**: Using Ollama, LM Studio, or vLLM
- **Cloud**: AWS, GCP, Azure
- **On-Premise**: Your own servers

### Step 2: Update Environment Variables

**Change ONLY these 4 lines:**

```bash
AI_PROVIDER=slm
SLM_BASE_URL=http://your-slm-endpoint/v1
SLM_API_KEY=your-slm-api-key
SLM_MODEL_NAME=llama-3-8b
```

### Step 3: Restart Application

```bash
npm run dev
```

**That's it!** No code changes needed. Everything now uses your SLM.

---

## 📝 Environment Variables Reference

### AI Provider Selection

```bash
# Choose your AI provider
AI_PROVIDER=openai  # or "slm" or "custom"
```

### OpenAI Configuration (Temporary - Development Only)

```bash
OPENAI_API_KEY=sk-...
AI_MODEL_NAME=gpt-4o
```

### SLM Configuration (Production)

```bash
SLM_BASE_URL=http://localhost:8080/v1
SLM_API_KEY=your-key-here
SLM_MODEL_NAME=llama-3-8b
```

### Custom Provider (Optional)

```bash
AI_BASE_URL=https://your-endpoint/v1
AI_API_KEY=your-key
AI_MODEL_NAME=your-model
```

---

## 🧪 Testing Your SLM

### 1. Test Text Generation

1. Go to any course page: `http://localhost:3000/course/striver-dsa-course`
2. Click **"Need Help?"** button
3. Ask a question: "Explain binary search"
4. Verify AI Tutor responds using your SLM

### 2. Test TTS (Text-to-Speech)

1. Enable audio in AI Tutor panel
2. AI should speak responses using your SLM's TTS endpoint

### 3. Test STT (Speech-to-Text)

1. Use voice input in AI Tutor
2. Speak your question
3. Verify transcription works

---

## 🏗️ How It Works

### AI Adapter Architecture

```
User Request
    ↓
UI Component (CoursePlayer, AITutorPanel)
    ↓
API Route (/api/tutor, /api/tts, /api/stt)
    ↓
AI Adapter (lib/ai-adapter.ts)
    ↓
    ├─→ OpenAI API (if AI_PROVIDER=openai)
    └─→ SLM API (if AI_PROVIDER=slm)
```

### Key Files

- **`lib/ai-adapter.ts`** - Model-agnostic AI interface
- **`lib/tutor-service.ts`** - Learning logic (model-independent)
- **`app/api/tutor/route.ts`** - AI tutor endpoint (uses adapter)
- **`app/api/tts/route.ts`** - Text-to-speech (uses adapter)
- **`app/api/stt/route.ts`** - Speech-to-text (uses adapter)

---

## 🔍 Recommended SLM Setup

### Option 1: Local Development (Ollama)

```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3

# Run Ollama server (OpenAI-compatible)
ollama serve
```

**Configure:**
```bash
AI_PROVIDER=slm
SLM_BASE_URL=http://localhost:11434/v1
SLM_MODEL_NAME=llama3
```

### Option 2: vLLM Server

```bash
# Install vLLM
pip install vllm

# Run OpenAI-compatible server
python -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Llama-3-8b-chat-hf \
  --port 8080
```

**Configure:**
```bash
AI_PROVIDER=slm
SLM_BASE_URL=http://localhost:8080/v1
SLM_MODEL_NAME=meta-llama/Llama-3-8b-chat-hf
```

### Option 3: LM Studio

1. Download LM Studio: https://lmstudio.ai
2. Download a model (LLaMA, Mistral, etc.)
3. Start local server (OpenAI-compatible)
4. Configure endpoint

---

## ⚡ Performance Optimization

### Model Selection

For **course tutoring** (this use case):

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| Phi-3-mini | 3.8B | ⚡⚡⚡ | ⭐⭐⭐ | Fast responses |
| LLaMA-3 8B | 8B | ⚡⚡ | ⭐⭐⭐⭐ | Balanced |
| Mistral 7B | 7B | ⚡⚡ | ⭐⭐⭐⭐ | Good reasoning |
| LLaMA-3 70B | 70B | ⚡ | ⭐⭐⭐⭐⭐ | Best quality |

### Prompting for SLMs

The tutor prompts are already optimized for smaller models:
- Clear, simple instructions
- Structured output format
- No complex multi-step reasoning
- Emotional context for adaptation

---

## 🐛 Troubleshooting

### AI Not Responding

**Check:**
1. `AI_PROVIDER` is set correctly
2. API endpoint is accessible
3. API key is valid
4. Model name matches deployed model

**Debug:**
```bash
# Check server logs
npm run dev

# Check browser console
# Open DevTools → Console tab
```

### SLM Responses Are Low Quality

**Solutions:**
1. Use a larger model (8B+ recommended)
2. Adjust temperature in `lib/ai-adapter.ts`
3. Fine-tune prompts in `lib/tutor-service.ts`
4. Consider fine-tuning your SLM on educational data

### TTS/STT Not Working

**Note:** TTS and STT are optional features.

If your SLM doesn't support audio:
1. Remove audio buttons from UI, or
2. Use separate audio services (ElevenLabs, Deepgram), or
3. Implement fallback to OpenAI audio only

---

## 📊 Comparison: OpenAI vs SLM

| Aspect | OpenAI | Your SLM |
|--------|--------|----------|
| **Cost** | Pay per token | One-time setup |
| **Privacy** | Data sent to OpenAI | All data stays with you |
| **Latency** | ~500-2000ms | ~100-500ms (local) |
| **Control** | None | Full control |
| **Customization** | Limited | Unlimited |
| **Dependency** | External service | Self-hosted |

---

## 🎓 Learning Flow (Course-First Design)

```
User opens course
    ↓
Watches video (YouTube)
    ↓
[OPTIONAL] Clicks "Need Help?"
    ↓
AI Tutor opens (side panel)
    ↓
User asks question
    ↓
AI explains using SLM
    ↓
User understands → Closes tutor
    ↓
Returns to video (same position)
```

**Key Points:**
- AI **NEVER** auto-interrupts
- AI **NEVER** replaces video content
- AI is **ALWAYS** a side helper
- Course is **ALWAYS** the main source

---

## 🔐 Security Best Practices

### API Keys

```bash
# ❌ BAD - Never commit
OPENAI_API_KEY=sk-abc123...

# ✅ GOOD - Use environment variables
OPENAI_API_KEY=${OPENAI_KEY_FROM_VAULT}
```

### SLM Endpoint

```bash
# ✅ Production - Use HTTPS
SLM_BASE_URL=https://slm.yourcompany.com/v1

# ⚠️ Development only
SLM_BASE_URL=http://localhost:8080/v1
```

---

## 📚 Additional Resources

- [AI Adapter Source Code](./lib/ai-adapter.ts)
- [Tutor Service Logic](./lib/tutor-service.ts)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [vLLM Documentation](https://docs.vllm.ai)
- [Ollama Documentation](https://ollama.ai/docs)

---

## 🤝 Contributing

When adding new AI features:

1. **Always use AI Adapter** - Never import OpenAI directly
2. **Keep prompts simple** - Optimize for smaller models
3. **Test with both** - OpenAI and a small SLM (Phi-3)
4. **Document changes** - Update this guide

---

## 📄 License

This configuration approach is part of the AI Learning Platform and follows the same license.

---

**Remember:** OpenAI is just a temporary development tool. The real power comes when you deploy your own SLM! 🚀
