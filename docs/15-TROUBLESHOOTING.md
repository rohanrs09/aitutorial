# Troubleshooting Guide

> **Common issues, fixes, and debugging steps collected during development**

## Table of Contents
1. [Supabase CORS Fix](#supabase-cors-fix)
2. [Dashboard & Quiz Data Fix](#dashboard--quiz-data-fix)
3. [Quiz Score Display Fix](#quiz-score-display-fix)
4. [Gemini Quiz Generation Setup](#gemini-quiz-generation-setup)
5. [General Debugging Tips](#general-debugging-tips)

---

## Supabase CORS Fix

### Problem
```
Access to fetch at 'https://[your-project].supabase.co/rest/v1/quiz_sessions' 
from origin 'http://localhost:3000' has been blocked by CORS policy: 
Method PATCH is not allowed by Access-Control-Allow-Methods in preflight response.
```

**What's Happening:**
- Quiz is working correctly ✅
- Answers are being validated ✅
- Scores are being calculated ✅
- **BUT** Supabase is blocking PATCH requests from localhost ❌

**Impact:**
- Quiz functions normally (uses local cache)
- Session updates don't persist to database during quiz
- Results are calculated but may not save permanently

### Solution 1: Fix Supabase CORS Settings (Recommended)

1. Visit: https://app.supabase.com → Select your project → **Settings** → **API**
2. Look for **CORS Configuration** section
3. Add localhost to allowed origins:
   ```
   http://localhost:3000
   http://localhost:3001
   https://your-domain.com
   ```
4. Ensure these HTTP methods are allowed:
   - ✅ GET, POST, PATCH, PUT, DELETE, OPTIONS

### Solution 2: Use Server-Side API Route

Create `app/api/quiz/update-session/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { sessionId, updates } = await req.json();
    const { error } = await supabase
      .from('quiz_sessions')
      .update(updates)
      .eq('id', sessionId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Solution 3: Current Implementation (Graceful Degradation)

Already implemented - quiz works even if Supabase updates fail:
1. **Local Cache:** Session stored in memory
2. **Answer Validation:** Works from cache
3. **Score Calculation:** Works from cache
4. **Supabase Update:** Attempted but non-blocking
5. **Final Save:** Completion saves to Supabase

### Verify the Fix

```bash
# Test CORS headers
curl -I -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: PATCH" \
  https://your-project.supabase.co/rest/v1/quiz_sessions
```

**For Production:** CORS works automatically because production domain is in allowed origins.

---

## Dashboard & Quiz Data Fix

### Issue 1: Dashboard Quiz Average Score & Credits Not Working After Login

**Root Causes:**
1. User data not stored properly on signup
2. Credits not initialized on first login
3. Quiz scores not saved to `learning_sessions` table

**Solutions Implemented:**

#### A. Enhanced Subscription API (`app/api/subscription/route.ts`)
- Added detailed logging to track credit fetching
- Auto-creates subscription if missing via `getOrCreateSubscription`
- Logs credit amounts for debugging

#### B. Enhanced Dashboard Service (`lib/dashboard-service.ts`)
- Added logging to track quiz score fetching
- Filters valid quiz scores (0-100 range)
- Shows how many sessions have quiz scores

#### C. Quiz Score Saving (`lib/quiz-service.ts`)
- Updates `learning_sessions` table with quiz score on completion
- Converts raw score to percentage (0-100)
- Updates the most recent learning session for that topic

### Issue 2: Quiz Generation Using Fixed Sets Instead of Gemini AI

**Quiz generation IS using Gemini AI.** If it seems like fixed sets:

1. **Missing API Key:** `GEMINI_API_KEY` not set in `.env.local`
2. **API Failures:** Gemini API errors causing fallback to static questions
3. **Wrong Model:** Using unsupported model name

**Verification Steps:**
1. Check `.env.local` has `GEMINI_API_KEY` and `GEMINI_MODEL_NAME=gemini-1.5-flash`
2. Check console for `[GeminiQuiz] Generation successful` vs `[Quiz API] ❌ Gemini generation FAILED`
3. Test Gemini API directly with curl

### Testing Complete Flow

**Test 1: New User Signup & Credits**
1. Sign up → Check webhook logs → Dashboard should show credits

**Test 2: Quiz Score Display**
1. Take quiz → Check console for score update → Dashboard should show average

**Test 3: Gemini Quiz Generation**
1. Start quiz → Console should show Gemini API key present → Questions should be unique

---

## Quiz Score Display Fix

### Problem
Quiz scores were not showing in the dashboard after completing quizzes.

### Root Cause
Quiz results were being saved to `quiz_results` table, but **NOT** to the `learning_sessions` table which the dashboard reads for average score calculation.

### Solution
Updated `completeQuizSession()` to also update `learning_sessions`:

```typescript
const percentageScore = Math.round((session.score / session.total_points) * 100);

await supabase
  .from('learning_sessions')
  .update({ quiz_score: percentageScore })
  .eq('user_id', session.user_id)
  .eq('topic_name', session.topic)
  .is('quiz_score', null)
  .order('started_at', { ascending: false })
  .limit(1);
```

### Dashboard Score Calculation
```typescript
const scores = sessions?.filter(s => 
  s.quiz_score !== null && 
  typeof s.quiz_score === 'number' && 
  s.quiz_score >= 0 && 
  s.quiz_score <= 100
).map(s => s.quiz_score!) || [];

const averageScore = scores.length > 0 
  ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
  : 0;
```

### Verify Database
```sql
-- Check learning_sessions has quiz scores
SELECT topic_name, quiz_score, started_at 
FROM learning_sessions 
WHERE user_id = 'your-user-id' 
  AND quiz_score IS NOT NULL
ORDER BY started_at DESC;

-- Check quiz_results table
SELECT topic, score, total_points, accuracy, completed_at 
FROM quiz_results 
WHERE user_id = 'your-user-id'
ORDER BY completed_at DESC;
```

---

## Gemini Quiz Generation Setup

### Problem
```
❌ models/gemini-pro is not found for API version v1beta
❌ or is not supported for generateContent
```

### Root Cause
Using v1beta API models which may not be available in all regions.

### Solution
Use the stable API with correct model name:

```env
GEMINI_API_KEY=AIzaSy...your-actual-key-here
GEMINI_MODEL_NAME=gemini-1.5-flash
```

### Model Compatibility

| Model Name | API Version | Availability |
|------------|-------------|--------------|
| `gemini-pro` | v1beta | ❌ Limited regions |
| `gemini-1.5-flash` | v1 | ✅ Available everywhere |
| `gemini-1.5-pro` | v1 | ✅ Available everywhere |

### Verification

After updating `.env.local` and restarting:
```
[Quiz API] 🔑 Gemini API Key: Present (AIzaSy...)
[Quiz API] 🤖 Gemini Model: gemini-1.5-flash
[GeminiQuiz] Starting generation...
[GeminiQuiz] ✅ Extracted 5 questions
```

### Troubleshooting

**Still seeing old model in logs?**
- Completely stop server (Ctrl + C), close terminal, reopen, run `npm run dev`

**Still getting 404 errors?**
- Go to https://aistudio.google.com/app/apikey → Generate new key

**Questions are still fallback?**
- Check logs for `[Quiz API] 🤖 Gemini Model:` - should show correct model

---

## General Debugging Tips

### Console Log Patterns

All major systems log with prefixes:
- `[Dashboard]` - Dashboard data fetching
- `[Quiz]` / `[Quiz API]` - Quiz operations
- `[GeminiQuiz]` - Gemini AI generation
- `[Subscription API]` - Credit/subscription fetching
- `[Progress]` - Progress tracking
- `[Webhook]` - Webhook processing

### Common Issues

**Credits Not Showing:**
1. Check Supabase has `user_subscriptions` and `user_credits` records
2. Verify RLS policies allow SELECT for authenticated users
3. Check `/api/subscription` response in Network tab

**Quiz Scores Not Showing:**
1. Check `learning_sessions` table has `quiz_score` values
2. Verify score is in 0-100 range
3. Check dashboard console logs for score calculation

**AI Not Responding:**
1. Check API keys in `.env.local`
2. Verify fallback chain: SLM → OpenAI → Gemini
3. Check console for provider-specific errors

**RLS Permission Errors:**
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'your_table_name';
```

### Environment Variables Checklist
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI Services
HF_API_KEY=hf_...
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL_NAME=gemini-1.5-flash

# Optional
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
DEEPGRAM_API_KEY=...

# Payments
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Database Verification Queries
```sql
-- Check user has all required records
SELECT 'profiles' as table_name, COUNT(*) FROM user_profiles WHERE id = 'USER_ID'
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM user_subscriptions WHERE id = 'USER_ID'
UNION ALL
SELECT 'credits', COUNT(*) FROM user_credits WHERE id = 'USER_ID';

-- Check recent sessions
SELECT id, topic_name, status, quiz_score, started_at 
FROM learning_sessions 
WHERE user_id = 'USER_ID' 
ORDER BY started_at DESC LIMIT 10;
```

---

**Status:** All fixes documented and implemented
**Priority:** Reference guide for debugging
