# Subscription & Credits System Setup Guide

This guide explains how to set up the credit-based subscription system with Clerk payments.

## Overview

The AI Voice Tutor uses a **credit-based SaaS model** where:
- **1 credit** ≈ 1 AI text response
- **5 credits** ≈ 1 full voice tutoring session
- **2 credits/min** ≈ Emotion detection
- **3 credits** ≈ Slide generation
- **2 credits** ≈ Quiz generation

## Subscription Tiers

| Tier | Price | Credits | Features |
|------|-------|---------|----------|
| **Starter** | Free | 50/month | 3 topics, basic tracking |
| **Pro** | $19/mo | 500/month | All topics, emotion detection, analytics |
| **Unlimited** | $49/mo | Unlimited | Everything + API access |

---

## Database Setup

### 1. Run Supabase Migration

The database schema is located in `supabase/migrations/20240128000000_subscription_credits_system.sql`

**Option A: Using Supabase CLI (Recommended)**
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migration
supabase db push
```

**Option B: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `supabase/migrations/20240128000000_subscription_credits_system.sql`
4. Paste and run the SQL

### 2. Verify Tables Created

Check that these tables exist:
- `user_subscriptions` - Stores subscription info
- `user_credits` - Tracks credit balance
- `credit_transactions` - Audit log of credit usage

---

## Clerk Payment Setup

### 1. Enable Clerk Billing

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Billing** in the sidebar
4. Enable billing features

### 2. Create Subscription Plans

Create two subscription products in Clerk:

**Pro Plan:**
- Name: "Pro"
- Plan ID: `plan_pro_monthly`
- Price: $19.00/month
- Recurring: Monthly

**Unlimited Plan:**
- Name: "Unlimited"
- Plan ID: `plan_unlimited_monthly`
- Price: $49.00/month
- Recurring: Monthly

### 3. Configure Webhooks

**IMPORTANT:** Set up webhooks to automatically sync subscriptions with your database.

1. Go to **Webhooks** in Clerk Dashboard
2. Click **"Add Endpoint"**
3. **Endpoint URL:** `https://aitutorial-layfirto.vercel.app/api/webhooks/clerk`
4. **Subscribe to events:**
   - ✅ `user.created` (auto-creates starter subscription for new users)
   - ✅ `subscription.created`
   - ✅ `subscription.updated`
   - ✅ `subscription.deleted`
   - ✅ `subscription.canceled`
5. **Save** and copy the **Webhook Signing Secret**
6. Add to your Vercel environment variables:
   ```bash
   CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

---

## Application Configuration

### 1. Environment Variables

**Production (Vercel):**
```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL
NEXT_PUBLIC_APP_URL=https://aitutorial-layfirto.vercel.app
```

**Local Development:**
```bash
# Same as above but use test keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Update Clerk Plan IDs

If your Clerk plan IDs are different, update them in:
- `lib/subscription/types.ts` (lines 87, 103)

---

## How It Works

### User Flow

1. **Sign Up**: User creates account via Clerk
2. **Free Tier**: Automatically gets Starter plan (50 credits)
3. **Upgrade**: User clicks pricing plan → redirected to Clerk checkout
4. **Payment**: Clerk handles payment securely
5. **Credits**: System automatically allocates credits based on tier
6. **Usage**: Credits deducted when using AI features
7. **Reset**: Credits reset monthly on billing cycle

### Credit Deduction

Credits are automatically deducted when users:
- Ask AI questions (1 credit per response)
- Start voice sessions (5 credits per session)
- Use emotion detection (2 credits per minute)
- Generate slides (3 credits)
- Generate quizzes (2 credits)

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/webhooks/clerk` | POST | Handle Clerk subscription webhooks |
| `/api/subscription` | GET | Get user subscription & credits |
| `/api/subscription/upgrade` | POST | Create upgrade checkout URL |
| `/api/credits/use` | POST | Deduct credits for action |

---

## Testing

### 1. Test Free Tier

```bash
# Start dev server
npm run dev

# Sign up as new user
# Check that you have 50 credits
```

### 2. Test Credit Usage

```javascript
// Example: Use credits for AI response
const response = await fetch('/api/credits/use', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'AI_RESPONSE',
    description: 'Asked a question about DSA'
  })
});

const result = await response.json();
console.log(result.remainingCredits); // Should be 49
```

### 3. Test Subscription Upgrade

**Production:**
1. Go to `https://aitutorial-layfirto.vercel.app/#pricing`
2. Click "Get Pro" or "Go Unlimited"
3. Should redirect to `/sign-up?plan=plan_pro_monthly`
4. Complete Clerk sign-up with payment
5. Webhook automatically updates database
6. Check credits are updated to 500 or unlimited

**Local:**
1. Go to `http://localhost:3000/#pricing`
2. Follow same steps as production

---

## Monitoring

### Check User Credits

```sql
-- In Supabase SQL Editor
SELECT 
  us.user_id,
  us.tier,
  us.status,
  uc.total_credits,
  uc.used_credits,
  uc.bonus_credits,
  (uc.total_credits - uc.used_credits + uc.bonus_credits) as remaining
FROM user_subscriptions us
JOIN user_credits uc ON us.user_id = uc.user_id
ORDER BY us.created_at DESC
LIMIT 10;
```

### View Credit Transactions

```sql
-- See recent credit usage
SELECT 
  user_id,
  amount,
  type,
  description,
  created_at
FROM credit_transactions
ORDER BY created_at DESC
LIMIT 50;
```

---

## Troubleshooting

### Credits Not Deducting

1. Check user has active subscription:
```javascript
const sub = await getUserSubscription(userId);
console.log(sub.status); // Should be 'active'
```

2. Check credit balance:
```javascript
const credits = await getUserCredits(userId);
console.log(credits.totalCredits - credits.usedCredits);
```

### Subscription Not Created

1. Verify Supabase tables exist
2. Check RLS policies are enabled
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set

### Clerk Payment Issues

1. Verify Clerk billing is enabled
2. Check plan IDs match in code
3. Test with Clerk test mode first

---

## Security Best Practices

✅ **Implemented:**
- Row Level Security (RLS) on all tables
- Service role for API operations only
- User authentication checks on all routes
- Credit validation before actions
- Audit logging of all transactions

⚠️ **Important:**
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client
- Always validate user authentication in API routes
- Check credit balance before allowing actions
- Log all credit transactions for audit trail

---

---

## Quick Setup Checklist

### Step 1: Database (5 minutes)
- [ ] Run migration in Supabase: `supabase/migrations/20240128000000_subscription_credits_system.sql`
- [ ] Verify tables created: `user_subscriptions`, `user_credits`, `credit_transactions`

### Step 2: Clerk Plans (3 minutes)
- [ ] Go to [Clerk Dashboard](https://dashboard.clerk.com) → Billing
- [ ] Create **Pro Plan**: $19/month, ID: `plan_pro_monthly`
- [ ] Create **Unlimited Plan**: $49/month, ID: `plan_unlimited_monthly`

### Step 3: Webhook (2 minutes)
- [ ] In Clerk → Webhooks → Add Endpoint
- [ ] URL: `https://aitutorial-layfirto.vercel.app/api/webhooks/clerk`
- [ ] Subscribe to: `subscription.*` events
- [ ] Copy webhook secret

### Step 4: Environment Variables (1 minute)
- [ ] Add `CLERK_WEBHOOK_SECRET` to Vercel
- [ ] Verify `NEXT_PUBLIC_APP_URL=https://aitutorial-layfirto.vercel.app`

### Step 5: Test (5 minutes)
- [ ] Visit `https://aitutorial-layfirto.vercel.app/#pricing`
- [ ] Click "Get Pro" → Sign up → Complete payment
- [ ] Check Supabase for subscription record
- [ ] Verify credits = 500

---

## Troubleshooting

### Webhook Not Working
1. Check Clerk webhook logs for errors
2. Verify webhook URL is correct: `https://aitutorial-layfirto.vercel.app/api/webhooks/clerk`
3. Ensure `CLERK_WEBHOOK_SECRET` is set in Vercel
4. Check Vercel function logs

### Subscription Not Created
1. Check webhook events are firing in Clerk
2. Verify Supabase tables exist
3. Check `SUPABASE_SERVICE_ROLE_KEY` is set
4. Look at webhook handler logs

### Credits Not Updating
1. Verify webhook processed successfully
2. Check `credit_transactions` table for logs
3. Ensure RLS policies are enabled

---

## Support Resources

- [Clerk Billing Docs](https://clerk.com/docs/billing)
- [Clerk Webhooks Guide](https://clerk.com/docs/webhooks)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

**Your Production URL:** `https://aitutorial-layfirto.vercel.app`
