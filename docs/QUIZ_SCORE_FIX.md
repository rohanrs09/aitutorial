# Quiz Score Display Fix

## Problem
Quiz scores were not showing in the dashboard after completing quizzes.

## Root Cause
Quiz results were being saved to `quiz_results` and `quiz_sessions` tables, but **NOT** to the `learning_sessions` table which the dashboard reads for average score calculation.

## Solution Implemented

### 1. Updated `lib/quiz-service.ts` - `completeQuizSession()` function

Added critical code to update `learning_sessions` table with quiz score:

```typescript
// **CRITICAL: Update learning_sessions table with quiz score**
// This is what the dashboard reads for average score calculation
const percentageScore = Math.round((session.score / session.total_points) * 100);

console.log('[Quiz] Updating learning_sessions with quiz_score:', percentageScore);

const { error: learningSessionError } = await supabase
  .from('learning_sessions')
  .update({
    quiz_score: percentageScore,
  })
  .eq('clerk_user_id', session.clerk_user_id)
  .eq('topic_name', session.topic)
  .is('quiz_score', null)
  .order('started_at', { ascending: false })
  .limit(1);
```

**What this does:**
- Converts raw score to percentage (0-100)
- Updates the most recent learning session for that topic
- Only updates sessions without existing quiz scores
- Logs success/failure for debugging

### 2. Dashboard Score Calculation (Already Fixed)

In `lib/dashboard-service.ts`, added validation:

```typescript
// Filter valid quiz scores (0-100 range) and calculate average
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

## Testing Steps

### Test Quiz Score Flow

1. **Start a Learning Session:**
   - Go to `/learn`
   - Select a topic (e.g., "Data Structures")
   - Have a conversation with the AI tutor

2. **Take a Quiz:**
   - Go to `/quiz`
   - Select the same topic
   - Complete all questions
   - Note your final score (e.g., 85%)

3. **Check Console Logs:**
   Open browser DevTools → Console, look for:
   ```
   [Quiz] Updating learning_sessions with quiz_score: 85
   [Quiz] Successfully updated learning_sessions with score: 85
   ```

4. **Verify Dashboard:**
   - Go to `/dashboard`
   - Check "Average Score" card
   - Should show your quiz score percentage
   - Console should show:
   ```
   [Dashboard] Score calculation: { 
     totalSessions: 1, 
     scoresFound: 1, 
     scores: [85], 
     averageScore: 85 
   }
   ```

5. **Take Multiple Quizzes:**
   - Take 2-3 more quizzes on different topics
   - Dashboard should show average of all scores
   - Example: Scores [85, 92, 78] → Average: 85%

### Verify Database

Check Supabase directly:

```sql
-- Check learning_sessions has quiz scores
SELECT 
  topic_name, 
  quiz_score, 
  started_at 
FROM learning_sessions 
WHERE clerk_user_id = 'user_xxx' 
  AND quiz_score IS NOT NULL
ORDER BY started_at DESC;

-- Check quiz_results table
SELECT 
  topic, 
  score, 
  total_points, 
  accuracy, 
  completed_at 
FROM quiz_results 
WHERE clerk_user_id = 'user_xxx'
ORDER BY completed_at DESC;
```

## Pricing Section

The pricing section is working correctly:

### Current Behavior
- **Starter Plan:** Redirects to `/sign-up` (free signup)
- **Pro Plan:** Redirects to `/sign-up?plan=plan_pro_monthly`
- **Unlimited Plan:** Redirects to `/sign-up?plan=plan_unlimited_monthly`

### Clerk Integration
Clerk handles the subscription flow:
1. User clicks pricing button
2. Redirects to Clerk sign-up with plan parameter
3. Clerk processes payment
4. Webhook fires to create subscription in Supabase
5. Credits are allocated based on plan

### Required Clerk Setup

**In Clerk Dashboard → Billing:**

1. **Create Subscription Plans:**
   - Plan ID: `plan_pro_monthly`
     - Price: $19/month
     - Features: 500 credits
   
   - Plan ID: `plan_unlimited_monthly`
     - Price: $49/month
     - Features: Unlimited credits

2. **Configure Webhook:**
   - URL: `https://aitutorial-layfirto.vercel.app/api/webhooks/clerk`
   - Events: `subscription.created`, `subscription.updated`, `subscription.deleted`
   - Copy webhook secret to `CLERK_WEBHOOK_SECRET` env var

3. **Test Payment Flow:**
   - Use Clerk test mode
   - Click "Get Pro" button
   - Complete test payment
   - Verify webhook fires
   - Check Supabase for subscription record

## Troubleshooting

### Quiz Score Still Not Showing

**Check 1: Console Logs**
```
[Quiz] Updating learning_sessions with quiz_score: XX
```
If missing → Quiz completion not calling update function

**Check 2: Database**
```sql
SELECT quiz_score FROM learning_sessions 
WHERE clerk_user_id = 'user_xxx' 
ORDER BY started_at DESC LIMIT 5;
```
If all NULL → Update query not working (check RLS policies)

**Check 3: RLS Policies**
Ensure `learning_sessions` table has UPDATE policy:
```sql
CREATE POLICY "Users can update own sessions"
ON learning_sessions FOR UPDATE
USING (clerk_user_id = auth.uid());
```

### Pricing Not Working

**Check 1: Clerk Configuration**
- Verify plan IDs match exactly: `plan_pro_monthly`, `plan_unlimited_monthly`
- Check billing is enabled in Clerk Dashboard

**Check 2: Webhook**
- Verify webhook URL is correct
- Check webhook logs in Clerk Dashboard
- Ensure `CLERK_WEBHOOK_SECRET` is set in Vercel

**Check 3: Environment Variables**
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

## Success Criteria

✅ Quiz completion logs show score update
✅ Dashboard displays correct average score
✅ Multiple quizzes calculate average correctly
✅ Database has quiz_score values in learning_sessions
✅ Pricing buttons redirect to Clerk signup
✅ Webhook creates subscriptions after payment

## Next Steps

1. Test the complete flow end-to-end
2. Verify with real Clerk payment (test mode)
3. Check dashboard updates after quiz
4. Monitor console logs for any errors
