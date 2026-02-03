# Dashboard & Quiz Generation Fix Guide

## Issues Fixed

### 1. Dashboard Quiz Average Score & Credits Not Working After Login
### 2. Quiz Generation Using Fixed Sets Instead of Gemini AI

---

## Issue 1: Dashboard Data & Credits Not Showing Properly

### Root Causes Identified

1. **User Data Not Stored:** Clerk webhook creates subscription but may not log enough details
2. **Credits Not Initialized:** Credits may not be properly created on first login
3. **Quiz Scores Not Saved:** Quiz completion wasn't updating `learning_sessions` table

### Solutions Implemented

#### A. Enhanced Clerk Webhook (`app/api/webhooks/clerk/route.ts`)

**Added comprehensive logging and explicit credit initialization:**

```typescript
async function handleUserCreated(data: any) {
  const userId = data.id;
  
  console.log(`[Webhook] Processing user.created for: ${userId}`);
  console.log(`[Webhook] User data:`, {
    id: data.id,
    email: data.email_addresses?.[0]?.email_address,
    firstName: data.first_name,
    lastName: data.last_name,
  });

  // Create starter subscription with credits
  await createUserSubscription(userId, 'starter');
  
  // Log credit initialization
  await logCreditTransaction(
    userId, 
    100, 
    'subscription_reset', 
    'Initial credits for new user'
  );
  
  console.log(`[Webhook] ✅ Successfully created starter subscription and initialized 100 credits`);
}
```

**What this fixes:**
- Logs user creation details for debugging
- Explicitly confirms credit initialization
- Throws errors to trigger webhook retry if fails

#### B. Enhanced Subscription API (`app/api/subscription/route.ts`)

**Added detailed logging to track credit fetching:**

```typescript
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  
  console.log(`[Subscription API] Fetching subscription for user: ${userId}`);
  
  // Get subscription and credits (creates if doesn't exist)
  const { subscription, credits } = await getOrCreateSubscription(userId);
  
  console.log(`[Subscription API] Found/Created subscription:`, {
    tier: subscription.tier,
    creditsTotal: credits.totalCredits,
    creditsUsed: credits.usedCredits,
    creditsRemaining: credits.totalCredits - credits.usedCredits
  });
  
  // Returns subscription data...
}
```

**What this fixes:**
- Tracks when credits are fetched
- Auto-creates subscription if missing
- Logs credit amounts for debugging

#### C. Enhanced Dashboard Service (`lib/dashboard-service.ts`)

**Added logging to track quiz score fetching:**

```typescript
async function fetchUserStats(userId: string, userIdColumn: string) {
  console.log(`[Dashboard] Fetching stats for user: ${userId} (column: ${userIdColumn})`);
  
  const { data: sessions } = await supabase
    .from('learning_sessions')
    .select('duration_minutes, quiz_score, started_at')
    .eq(userIdColumn, userId)
    .not('ended_at', 'is', null);

  console.log(`[Dashboard] Fetched ${sessions?.length || 0} completed sessions`);
  
  // Filter valid quiz scores
  const scores = sessions?.filter(s => 
    s.quiz_score !== null && 
    s.quiz_score >= 0 && 
    s.quiz_score <= 100
  ).map(s => s.quiz_score!) || [];
  
  console.log('[Dashboard] Score calculation:', { 
    totalSessions, 
    scoresFound: scores.length, 
    scores: scores.slice(0, 5),
    averageScore 
  });
}
```

**What this fixes:**
- Tracks which user ID column is used (clerk_user_id vs user_id)
- Shows how many sessions have quiz scores
- Displays actual scores for verification

#### D. Quiz Score Saving (`lib/quiz-service.ts`)

**Already fixed - updates learning_sessions table:**

```typescript
export async function completeQuizSession(sessionId: string) {
  // ... calculate results ...
  
  // **CRITICAL: Update learning_sessions table with quiz score**
  const percentageScore = Math.round((session.score / session.total_points) * 100);
  
  await supabase
    .from('learning_sessions')
    .update({ quiz_score: percentageScore })
    .eq('clerk_user_id', session.clerk_user_id)
    .eq('topic_name', session.topic)
    .is('quiz_score', null)
    .order('started_at', { ascending: false })
    .limit(1);
}
```

---

## Issue 2: Quiz Generation Using Gemini AI

### Current Status

**Quiz generation IS already using Gemini AI!** The system is properly configured:

1. **API Route:** `/api/quiz/generate` calls `generateQuizWithGemini()`
2. **Gemini Integration:** Uses `@google/generative-ai` SDK
3. **Fallback System:** Falls back to static questions if Gemini fails

### Why It Might Seem Like Fixed Sets

**Possible reasons:**

1. **Missing API Key:** `GEMINI_API_KEY` not set in `.env.local`
2. **API Failures:** Gemini API errors causing fallback to static questions
3. **Wrong Model:** Using unsupported model name

### Verification Steps

#### Step 1: Check Environment Variables

Ensure `.env.local` has:

```bash
# Gemini API Key (required)
GEMINI_API_KEY=your-actual-gemini-api-key-here

# Model Name (must be this exact value)
GEMINI_MODEL_NAME=models/gemini-1.0-pro
```

**Get API Key:**
1. Go to https://aistudio.google.com/app/apikey
2. Create new API key
3. Copy to `.env.local`

#### Step 2: Check Console Logs

When taking a quiz, check browser DevTools → Console for:

```
[Quiz API] ═══════════════════════════════════════
[Quiz API] 🔑 Gemini API Key: Present (AIzaSyB...)
[Quiz API] 🤖 Gemini Model: models/gemini-1.0-pro
[Quiz API] 📚 Topic: Data Structures
[Quiz API] 📊 Difficulty: mixed
[Quiz API] ═══════════════════════════════════════
[GeminiQuiz] Starting generation...
[GeminiQuiz] Generation successful: { generated: 5 }
[Quiz API] Successfully generated 5 questions
```

**If you see fallback:**
```
[Quiz API] ❌ Gemini generation FAILED
[Quiz API] ⚠️ Using 5 FALLBACK questions (not dynamic)
```

This means Gemini API is not working.

#### Step 3: Test Gemini API Directly

Create test file to verify API key:

```bash
# Test Gemini API
curl -X POST \
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Say hello"
      }]
    }]
  }'
```

Should return JSON with generated text.

### How Quiz Generation Works

```
User clicks "Start Quiz"
    ↓
Frontend: /quiz page
    ↓
Calls: generateQuiz() in quiz-service.ts
    ↓
Fetches: /api/quiz/generate (POST)
    ↓
Backend: Calls generateQuizWithGemini()
    ↓
Gemini API: Generates questions based on topic
    ↓
Returns: Dynamic questions OR fallback if fails
    ↓
Frontend: Displays quiz questions
```

### Gemini Quiz Generation Features

**What Gemini generates:**
- Topic-specific questions from course content
- Proper difficulty distribution (easy/medium/hard)
- Detailed explanations for each answer
- Subtopic coverage
- Adaptive difficulty based on user performance

**Example prompt sent to Gemini:**

```
Generate 5 quiz questions about "Data Structures - Arrays"

Requirements:
- Difficulty: mixed (2 easy, 2 medium, 1 hard)
- Focus on: array operations, time complexity, common patterns
- Include: code snippets where relevant
- Format: Multiple choice with 4 options
- Provide: Detailed explanations

Course content: [actual course material about arrays]
```

---

## Testing Complete Flow

### Test 1: New User Signup & Credits

1. **Sign Up:**
   - Go to `/sign-up`
   - Create new account
   - Complete signup

2. **Check Webhook Logs (Vercel):**
   ```
   [Webhook] Processing user.created for: user_xxx
   [Webhook] User data: { id, email, firstName, lastName }
   [Webhook] Creating starter subscription for user: user_xxx
   [Webhook] ✅ Successfully created starter subscription and initialized 100 credits
   ```

3. **Check Dashboard:**
   - Go to `/dashboard`
   - Should see "100 credits remaining"
   - Should see "Starter" tier

4. **Check Console:**
   ```
   [Subscription API] Fetching subscription for user: user_xxx
   [Subscription API] Found/Created subscription: { tier: 'starter', creditsTotal: 100, creditsUsed: 0 }
   [Dashboard] Fetching stats for user: user_xxx (column: clerk_user_id)
   [Dashboard] Fetched 0 completed sessions
   [Dashboard] Score calculation: { totalSessions: 0, scoresFound: 0, averageScore: 0 }
   ```

### Test 2: Quiz Score Display

1. **Take a Quiz:**
   - Go to `/quiz`
   - Select topic (e.g., "Arrays")
   - Complete all questions
   - Note your score (e.g., 80%)

2. **Check Console During Quiz:**
   ```
   [Quiz API] 🔑 Gemini API Key: Present (AIzaSy...)
   [GeminiQuiz] Starting generation: { topic: 'Arrays', count: 5 }
   [GeminiQuiz] Generation successful: { generated: 5 }
   ```

3. **Check Console After Completion:**
   ```
   [Quiz] Updating learning_sessions with quiz_score: 80
   [Quiz] Successfully updated learning_sessions with score: 80
   ```

4. **Check Dashboard:**
   - Go to `/dashboard`
   - "Average Score" should show "80%"
   - Console should show:
   ```
   [Dashboard] Fetched 1 completed sessions
   [Dashboard] Score calculation: { scoresFound: 1, scores: [80], averageScore: 80 }
   ```

### Test 3: Gemini Quiz Generation

1. **Check API Key:**
   ```bash
   # In terminal
   echo $GEMINI_API_KEY
   # Should output your key
   ```

2. **Start Quiz:**
   - Go to `/quiz`
   - Select any topic
   - Open DevTools → Console

3. **Verify Gemini Usage:**
   ```
   [Quiz API] 🔑 Gemini API Key: Present
   [GeminiQuiz] Starting generation
   [GeminiQuiz] Received response, length: 2500
   [GeminiQuiz] Generation successful
   ```

4. **Check Question Quality:**
   - Questions should be unique each time
   - Should be specific to selected topic
   - Should have detailed explanations
   - Should vary in difficulty

---

## Troubleshooting

### Credits Not Showing

**Check 1: Webhook Configured**
- Clerk Dashboard → Webhooks
- URL: `https://your-app.vercel.app/api/webhooks/clerk`
- Events: `user.created`, `subscription.created`, `subscription.updated`
- Secret: Set in `CLERK_WEBHOOK_SECRET`

**Check 2: Database Tables**
```sql
-- Check user_subscriptions
SELECT * FROM user_subscriptions 
WHERE user_id = 'user_xxx';

-- Check user_credits
SELECT * FROM user_credits 
WHERE user_id = 'user_xxx';
```

**Check 3: RLS Policies**
Ensure Supabase RLS allows:
- INSERT on `user_subscriptions` (service role)
- INSERT on `user_credits` (service role)
- SELECT on both tables (authenticated users)

### Quiz Scores Not Showing

**Check 1: Quiz Completion**
```sql
SELECT topic_name, quiz_score, started_at 
FROM learning_sessions 
WHERE clerk_user_id = 'user_xxx' 
ORDER BY started_at DESC;
```

**Check 2: Score Range**
- Scores must be 0-100
- NULL scores are ignored
- Invalid scores filtered out

**Check 3: User ID Column**
Dashboard uses either:
- `clerk_user_id` (for Clerk users)
- `user_id` (for UUID users)

### Gemini Not Generating

**Check 1: API Key**
```bash
# Verify key is set
grep GEMINI_API_KEY .env.local
```

**Check 2: Model Name**
Must be exactly: `models/gemini-1.0-pro`
- NOT `gemini-1.5-flash`
- NOT `gemini-pro`
- NOT `gemini-1.5-pro`

**Check 3: API Quota**
- Check https://aistudio.google.com/app/apikey
- Verify quota not exceeded
- Check billing if using paid tier

**Check 4: Network/CORS**
- Gemini API should work from server-side
- Check Vercel logs for API errors

---

## Environment Variables Checklist

```bash
# Required for Credits & Dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Required for Quiz Generation
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL_NAME=models/gemini-1.0-pro

# Optional (for AI tutor)
HF_API_KEY=hf_...
ELEVENLABS_API_KEY=...
DEEPGRAM_API_KEY=...
```

---

## Success Criteria

✅ **User Signup:**
- Webhook fires and logs user creation
- Subscription created with 100 credits
- Credits visible on dashboard immediately

✅ **Dashboard Display:**
- Credits show correct amount
- Average score shows after taking quiz
- Stats update in real-time

✅ **Quiz Generation:**
- Console shows Gemini API key present
- Questions are unique and topic-specific
- No fallback warnings in console

✅ **Quiz Scores:**
- Score saved to learning_sessions table
- Dashboard average updates immediately
- Multiple quizzes calculate correct average

---

## Next Steps

1. **Verify Environment Variables:**
   - Check `.env.local` has all required keys
   - Restart dev server after changes

2. **Test User Flow:**
   - Create new test account
   - Check credits appear
   - Take quiz and verify score shows

3. **Monitor Console Logs:**
   - Watch for webhook logs
   - Check Gemini API logs
   - Verify score update logs

4. **Check Database:**
   - Verify subscriptions created
   - Confirm credits initialized
   - Check quiz scores saved

5. **Deploy & Test:**
   - Push changes to Vercel
   - Test with production Clerk webhook
   - Verify Gemini works in production
