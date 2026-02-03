import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { 
  getUserSubscription, 
  createUserSubscription, 
  updateSubscription,
  resetUserCredits,
  logCreditTransaction
} from '@/lib/subscription/credits';

// Webhook handler for Clerk subscription events
export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('CLERK_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Get the raw body
    const payload = await request.text();
    const headerList = await headers();
    
    // Get Svix headers for verification
    const svixId = headerList.get('svix-id');
    const svixTimestamp = headerList.get('svix-timestamp');
    const svixSignature = headerList.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('Missing svix headers');
      return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 });
    }

    // Verify webhook signature
    const wh = new Webhook(webhookSecret);
    let evt: any;
    
    try {
      evt = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const { type, data } = evt;
    console.log(`Clerk webhook received: ${type}`);

    // Handle different webhook events
    switch (type) {
      case 'user.created':
        await handleUserCreated(data);
        break;

      case 'subscription.created':
        await handleSubscriptionCreated(data);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(data);
        break;

      case 'subscription.deleted':
      case 'subscription.canceled':
        await handleSubscriptionCanceled(data);
        break;

      default:
        console.log(`Unhandled webhook event: ${type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create starter subscription for new users
async function handleUserCreated(data: any) {
  const userId = data.id;
  
  if (!userId) {
    console.error('Missing user ID in user.created event');
    return;
  }

  console.log(`[Webhook] Processing user.created for: ${userId}`);
  console.log(`[Webhook] User data:`, {
    id: data.id,
    email: data.email_addresses?.[0]?.email_address,
    firstName: data.first_name,
    lastName: data.last_name,
  });

  try {
    // Check if subscription already exists
    const existing = await getUserSubscription(userId);
    if (existing) {
      console.log(`[Webhook] User ${userId} already has subscription`);
      return;
    }

    // Create starter subscription with credits
    console.log(`[Webhook] Creating starter subscription for user: ${userId}`);
    await createUserSubscription(userId, 'starter');
    
    // Log credit initialization
    await logCreditTransaction(
      userId, 
      100, 
      'subscription_reset', 
      'Initial credits for new user'
    );
    
    console.log(`[Webhook] ✅ Successfully created starter subscription and initialized 100 credits for user: ${userId}`);

  } catch (error) {
    console.error('[Webhook] ❌ Error handling user creation:', error);
    throw error; // Re-throw to ensure webhook retry
  }
}

// Map Clerk plan ID to our tier
function mapPlanToTier(planId: string): 'starter' | 'pro' | 'unlimited' {
  if (planId?.includes('pro')) return 'pro';
  if (planId?.includes('unlimited')) return 'unlimited';
  return 'starter';
}

async function handleSubscriptionCreated(data: any) {
  const userId = data.user_id || data.userId;
  const planId = data.plan_id || data.planId || data.product_id;
  
  if (!userId) {
    console.error('Missing user_id in subscription.created');
    return;
  }

  const tier = mapPlanToTier(planId);

  try {
    const existingSub = await getUserSubscription(userId);
    
    if (existingSub) {
      await updateSubscription(userId, {
        tier,
        status: 'active',
        clerkSubscriptionId: data.id,
      });
    } else {
      await createUserSubscription(userId, tier);
      await updateSubscription(userId, {
        clerkSubscriptionId: data.id,
      });
    }

    await resetUserCredits(userId, tier);
    await logCreditTransaction(userId, 0, 'subscription_reset', `Subscription created: ${tier} plan`);

    console.log(`Subscription created for user ${userId}: ${tier} plan`);

  } catch (error) {
    console.error('Error handling subscription creation:', error);
  }
}

async function handleSubscriptionUpdated(data: any) {
  const userId = data.user_id || data.userId;
  const planId = data.plan_id || data.planId || data.product_id;
  const status = data.status || 'active';
  
  if (!userId) {
    console.error('Missing user_id in subscription.updated');
    return;
  }

  const tier = mapPlanToTier(planId);

  try {
    await updateSubscription(userId, {
      tier,
      status,
      clerkSubscriptionId: data.id,
    });

    if (tier !== 'starter') {
      await resetUserCredits(userId, tier);
    }

    console.log(`Subscription updated for user ${userId}: ${tier} plan`);

  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionCanceled(data: any) {
  const userId = data.user_id || data.userId;
  
  if (!userId) {
    console.error('Missing user_id in subscription canceled');
    return;
  }

  try {
    await updateSubscription(userId, {
      status: 'canceled',
      cancelAtPeriodEnd: true,
    });

    console.log(`Subscription canceled for user ${userId}`);

  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}
