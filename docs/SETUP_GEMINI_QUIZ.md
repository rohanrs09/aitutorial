# 🎯 Gemini Quiz Generation Setup Guide

## ⚠️ CRITICAL: Fix the API Version Mismatch

Your quiz generation is failing because you're using the **v1beta API** which is not available in your region.

### The Problem

```
❌ models/gemini-pro is not found for API version v1beta
❌ or is not supported for generateContent
```

This happens when `GEMINI_MODEL_NAME` is set to:
- `gemini-pro` (uses v1beta)
- `gemini-1.5-flash` (uses v1beta)
- `gemini-1.5-pro` (uses v1beta)

### The Solution

Use the **v1 stable API** with `models/gemini-1.0-pro`:

```env
GEMINI_MODEL_NAME=models/gemini-1.0-pro
```

---

## 📝 Step-by-Step Fix

### 1. Update Your `.env.local` File

Open `/Users/paremeshwarshelke/Documents/Rohan/Projects/ai-voice-tutor/.env.local`

**Find this line:**
```env
GEMINI_MODEL_NAME=gemini-pro
```

**Change it to:**
```env
GEMINI_MODEL_NAME=models/gemini-1.0-pro
```

**Your complete Gemini configuration should look like:**
```env
# Gemini API Configuration
GEMINI_API_KEY=AIzaSy...your-actual-key-here
GEMINI_MODEL_NAME=models/gemini-1.0-pro
```

### 2. Save the File

Press `Cmd + S` (Mac) or `Ctrl + S` (Windows/Linux)

### 3. Restart the Development Server

```bash
# Stop the current server
# Press Ctrl + C in your terminal

# Start it again
npm run dev
```

### 4. Verify the Configuration

When you restart, you should see in the console:

```
[GeminiQuiz] Gemini API Key: AIzaSyB...
[GeminiQuiz] Using model: models/gemini-1.0-pro
```

**NOT:**
```
[GeminiQuiz] Using model: gemini-pro  ❌ WRONG
```

---

## 🧪 Test Quiz Generation

1. Go to `http://localhost:3000/quiz`
2. Select a topic (e.g., "Arrays & Strings")
3. Click "Start Quiz"
4. Check the browser console and terminal logs

### Expected Success Output:

```
[Quiz API] ═══════════════════════════════════════
[Quiz API] 🔑 Gemini API Key: Present (AIzaSyB...)
[Quiz API] 🤖 Gemini Model: models/gemini-1.0-pro
[Quiz API] 📚 Topic: Arrays & Strings
[Quiz API] 📊 Difficulty: mixed
[Quiz API] 🔢 Question Count: 5
[Quiz API] ═══════════════════════════════════════
[GeminiQuiz] Starting generation: { topic: 'Arrays & Strings', count: 5, difficulty: 'mixed' }
[GeminiQuiz] Gemini API Key: AIzaSyB...
[GeminiQuiz] Using model: models/gemini-1.0-pro
[GeminiQuiz] ✅ Extracted 5 questions
[Quiz API] Successfully generated 5 questions
```

### Expected Failure Output (if .env.local not updated):

```
[Quiz API] 🤖 Gemini Model: gemini-pro  ⚠️ WRONG!
[Quiz API] ⚠️ WARNING: Using non-standard model: gemini-pro
[Quiz API] ⚠️ Recommended: models/gemini-1.0-pro (v1 stable API)
[GeminiQuiz] Generation failed: models/gemini-pro is not found for API version v1beta
[Quiz API] ❌ Gemini generation FAILED
[Quiz API] ⚠️ Using 5 FALLBACK questions (not dynamic)
```

---

## 🔍 Why This Happens

| Model Name | API Version | Your Region Support |
|------------|-------------|---------------------|
| `gemini-pro` | v1beta | ❌ Not available |
| `gemini-1.5-flash` | v1beta | ❌ Not available |
| `gemini-1.5-pro` | v1beta | ❌ Not available |
| `models/gemini-1.0-pro` | v1 (stable) | ✅ Available everywhere |

Google kept the 1.0 models on the stable v1 API for production use, while 1.5 models are experimental and only available in certain regions via v1beta.

---

## 🎯 Current Pipeline After Fix

```
User clicks "Start Quiz"
    ↓
Quiz API receives request
    ↓
Calls Gemini with models/gemini-1.0-pro (v1 stable)
    ↓
Gemini generates 5 topic-specific questions
    ↓
Questions saved to database
    ↓
User sees dynamic AI-generated quiz
    ↓
Dashboard shows real quiz analytics
```

---

## ✅ Verification Checklist

- [ ] `.env.local` has `GEMINI_MODEL_NAME=models/gemini-1.0-pro`
- [ ] `.env.local` has valid `GEMINI_API_KEY`
- [ ] Server restarted after changes
- [ ] Console shows "Using model: models/gemini-1.0-pro"
- [ ] Quiz generation succeeds (no fallback warning)
- [ ] Questions are topic-specific and dynamic

---

## 🆘 Troubleshooting

### Still seeing "gemini-pro" in logs?

**Cause:** Server is using cached environment variables

**Fix:**
1. Completely stop the server (Ctrl + C)
2. Close the terminal
3. Open a new terminal
4. Run `npm run dev` again

### Still getting 404 errors?

**Cause:** API key might be invalid or expired

**Fix:**
1. Go to https://aistudio.google.com/app/apikey
2. Generate a new API key
3. Update `GEMINI_API_KEY` in `.env.local`
4. Restart server

### Questions are still fallback?

**Check the logs for:**
```
[Quiz API] 🤖 Gemini Model: models/gemini-1.0-pro  ✅
```

If you see `gemini-pro` instead, your `.env.local` wasn't updated correctly.

---

## 📚 Additional Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Available Models List](https://ai.google.dev/models/gemini)
- [API Key Management](https://aistudio.google.com/app/apikey)

---

**Last Updated:** Jan 24, 2026
**Status:** ✅ Code updated, awaiting user .env.local update
