# 🚀 Deploy to Vercel - Quick Guide

## 1. Prepare Database (5 minutes)

### Run Migration in Supabase:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor**
4. Run this file: `migrations/005_achievements_and_goals.sql`
5. Click **Run**

✅ Done! Database ready.

---

## 2. Deploy to Vercel (3 minutes)

### Option A: GitHub (Recommended)
```bash
# Push to GitHub
git add .
git commit -m "Production ready"
git push origin main
```

Then:
1. Go to https://vercel.com
2. Click **Import Project**
3. Select your GitHub repo
4. Click **Deploy**

### Option B: Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

---

## 3. Add Environment Variables in Vercel

Go to **Project Settings → Environment Variables** and add:

### Required:
```
# AI Model (SLM - Primary)
HF_API_KEY=hf_your-key
SLM_MODEL_NAME=meta-llama/Llama-3.2-3B-Instruct

# Voice Services (Required with SLM)
ELEVENLABS_API_KEY=your-key
DEEPGRAM_API_KEY=your-key

# Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Emotion Detection
OPENAI_API_KEY=sk-your-key
```

### Optional (Fallback):
```
GEMINI_API_KEY=your-key
```

### Optional (Authentication):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx
```

---

## 4. Redeploy

After adding env variables:
- Click **Deployments** tab
- Click **⋯** on latest deployment
- Click **Redeploy**

---

## ✅ Done!

Your app is live at: `https://your-project.vercel.app`

---

## 🧪 Quick Test

1. Visit your Vercel URL
2. Go to `/dashboard`
3. Click "Start Learning Session"
4. Complete a session
5. Check if achievement unlocks

---

## 🐛 If Something Breaks

### Check Build Logs:
```
Vercel Dashboard → Deployments → Click deployment → View Function Logs
```

### Common Issues:

**Build fails:**
- Check env variables are set
- Run `npm run build` locally first

**Database errors:**
- Verify Supabase migration ran
- Check RLS policies are enabled

**API errors:**
- Verify API keys are valid
- Check rate limits

---

## 📊 Environment Variables Summary

| Variable | Required | Purpose |
|----------|----------|---------|
| `HF_API_KEY` | ✅ Yes | SLM (Primary AI) |
| `SLM_MODEL_NAME` | ✅ Yes | Model name |
| `ELEVENLABS_API_KEY` | ✅ Yes | Text-to-Speech |
| `DEEPGRAM_API_KEY` | ✅ Yes | Speech-to-Text |
| `OPENAI_API_KEY` | ✅ Yes | Emotion Detection |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Database |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Database |
| `GEMINI_API_KEY` | ⚪ Optional | AI Fallback |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ⚪ Optional | Auth |
| `CLERK_SECRET_KEY` | ⚪ Optional | Auth |

---

## 🎉 That's It!

Your AI Voice Tutor is now live in production.
