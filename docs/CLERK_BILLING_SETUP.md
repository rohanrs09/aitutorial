# Clerk Billing Integration Setup Guide

## Overview
This guide explains how to set up Clerk Billing for the AI Voice Tutor application with proper credit management, trial mode, and payment prompts.

## Prerequisites
- Clerk account with Billing enabled
- Stripe account (Clerk uses Stripe for payments)
- Environment variables configured

## Step 1: Configure Clerk Billing Plans

### 1.1 Create Plans in Clerk Dashboard

Go to https://dashboard.clerk.com → Billing → Plans

Create 3 plans:

#### Starter Plan (Free Trial)
- **Plan ID**: `plan_starter_monthly`
- **Name**: Starter
- **Price**: $0/month
- **Credits**: 50/month
- **Trial Period**: 14 days
- **Features**:
  - 50 credits per month
  - Basic AI tutor access
  - Quiz generation (2 credits each)
  - Voice interaction

#### Pro Plan
- **Plan ID**: `plan_pro_monthly`
- **Name**: Pro
- **Price**: $9.99/month
- **Credits**: 500/month
- **Features**:
  - 500 credits per month
  - All Starter features
  - Priority support
  - Advanced analytics
  - Custom learning paths

#### Unlimited Plan
- **Plan ID**: `plan_unlimited_monthly`
- **Name**: Unlimited
- **Price**: $19.99/month
- **Credits**: Unlimited
- **Features**:
  - Unlimited credits
  - All Pro features
  - Priority AI processing
  - 1-on-1 tutoring sessions
  - Custom curriculum

### 1.2 Configure Stripe Products

In Stripe Dashboard (https://dashboard.stripe.com):

1. Create products matching your Clerk plans
2. Set up recurring billing intervals
3. Configure trial periods
4. Add metadata: `clerk_plan_id: plan_pro_monthly`

## Step 2: Environment Variables

Add to `.env.local`:

```bash
# Clerk Billing
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Stripe (if using direct Stripe integration)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Step 3: Configure Webhooks

### 3.1 Clerk Webhooks

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/clerk`
3. Subscribe to events:
   - `user.created` - Initialize starter subscription
   - `subscription.created` - Handle new subscriptions
   - `subscription.updated` - Handle plan changes
   - `subscription.deleted` - Handle cancellations

### 3.2 Test Webhooks Locally

```bash
# Install Clerk CLI
npm install -g @clerk/cli

# Forward webhooks to localhost
clerk webhooks forward --url http://localhost:3000/api/webhooks/clerk
```

## Step 4: Credit System Configuration

### Credit Costs (configured in `lib/subscription/types.ts`)

```typescript
export const CREDIT_COSTS = {
  QUIZ_GENERATION: 2,      // Generate quiz questions
  VOICE_MESSAGE: 1,        // AI voice response
  EMOTION_ANALYSIS: 1,     // Emotion detection
  CONVERSATION_TURN: 1,    // Each conversation message
  ACHIEVEMENT_UNLOCK: 0,   // Free
};
```

### Credit Reset Logic

Credits reset automatically at the start of each billing period:
- Starter: 50 credits → resets monthly
- Pro: 500 credits → resets monthly
- Unlimited: ∞ credits → never depletes

## Step 5: Trial Mode Implementation

### How Trial Works

1. **New User Signs Up**:
   - Webhook: `user.created` fires
   - System: Creates starter subscription (14-day trial)
   - Credits: 50 credits initialized
   - Status: `trialing`

2. **During Trial**:
   - User has full access to Starter features
   - Credits deduct normally
   - No payment required

3. **Trial Ends**:
   - If no payment method: Status → `inactive`
   - If payment method added: Status → `active`
   - Credits continue to work if active

### Trial Configuration

In `lib/subscription/credits.ts`:

```typescript
export async function createUserSubscription(
  clerkUserId: string,
  tier: 'starter' | 'pro' | 'unlimited' = 'starter'
): Promise<UserSubscription> {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 14); // 14-day trial

  return await supabase
    .from('user_subscriptions')
    .insert({
      clerk_user_id: clerkUserId,
      tier,
      status: 'trialing', // Start in trial mode
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    });
}
```

## Step 6: Payment Prompts

### When to Show Payment Prompt

1. **Low Credits** (< 10 remaining)
2. **Out of Credits** (0 remaining)
3. **Trial Ending** (< 3 days left)
4. **Trial Ended** (status: inactive)

### Implementation

Use `CreditWarningModal` component:

```tsx
import CreditWarningModal from '@/components/CreditWarningModal';

function QuizPage() {
  const { credits, subscription } = useCredits();
  const [showWarning, setShowWarning] = useState(false);

  const handleGenerateQuiz = async () => {
    // Check credits before action
    if (credits.remaining < CREDIT_COSTS.QUIZ_GENERATION) {
      setShowWarning(true);
      return;
    }

    // Proceed with quiz generation
    await generateQuiz();
  };

  return (
    <>
      <button onClick={handleGenerateQuiz}>Generate Quiz</button>
      
      <CreditWarningModal
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
        remainingCredits={credits.remaining}
        requiredCredits={CREDIT_COSTS.QUIZ_GENERATION}
        currentTier={subscription.tier}
      />
    </>
  );
}
```

## Step 7: Upgrade Flow

### User Clicks "Upgrade"

1. Redirect to pricing page: `/#pricing`
2. User selects plan (Pro or Unlimited)
3. Clerk handles payment collection
4. Webhook fires: `subscription.created`
5. System updates database:
   - Update tier
   - Reset credits to new plan amount
   - Update status to `active`

### Downgrade Flow

1. User cancels subscription
2. Webhook fires: `subscription.deleted`
3. System updates:
   - Set `cancel_at_period_end: true`
   - Keep access until period ends
   - After period: Downgrade to Starter

## Step 8: Testing

### Test Credit Deduction

```bash
# Generate quiz (costs 2 credits)
curl -X POST http://localhost:3000/api/quiz/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "Arrays", "difficulty": "medium", "count": 5}'

# Check remaining credits
curl http://localhost:3000/api/credits
```

### Test Trial Mode

1. Create new test user in Clerk
2. Verify starter subscription created
3. Check trial end date (14 days from now)
4. Verify 50 credits initialized

### Test Payment Prompt

1. Use up credits (generate 25 quizzes)
2. Verify warning modal appears
3. Click "Upgrade Now"
4. Verify redirect to pricing page

## Step 9: Production Deployment

### Checklist

- [ ] Clerk production keys configured
- [ ] Stripe production mode enabled
- [ ] Webhook endpoints verified
- [ ] SSL certificate active
- [ ] Database migration run
- [ ] Credit costs finalized
- [ ] Trial period configured
- [ ] Payment flow tested
- [ ] Refund policy documented
- [ ] Terms of service updated

### Monitoring

Monitor these metrics:
- Trial conversion rate
- Credit usage per user
- Upgrade/downgrade rates
- Payment failures
- Webhook delivery success

## Troubleshooting

### Credits Not Deducting

Check:
1. User has active subscription
2. Subscription status is `active` or `trialing`
3. Credit deduction function is called
4. Database has `user_credits` record

### Webhook Not Firing

Check:
1. Webhook URL is correct
2. Webhook secret matches
3. Events are subscribed
4. Firewall allows Clerk IPs

### Payment Failing

Check:
1. Stripe is in production mode
2. Payment method is valid
3. Customer has sufficient funds
4. No fraud flags

## Support

For issues:
- Clerk Support: https://clerk.com/support
- Stripe Support: https://support.stripe.com
- Documentation: https://clerk.com/docs/billing

---

**Last Updated**: February 2026
**Version**: 1.0.0
