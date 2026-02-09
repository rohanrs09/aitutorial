// Subscription Management API Route
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  getOrCreateSubscription, 
  getUserCredits,
  getCreditTransactions,
  checkAndResetCreditsIfNeeded,
  getRemainingCredits
} from '@/lib/subscription/credits';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription/types';

// GET - Get user subscription and credits info
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      console.error('[Subscription API] No userId from auth');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`[Subscription API] Fetching subscription for user: ${userId}`);

    let subscription, credits;
    
    try {
      // Check and reset credits if new billing period
      await checkAndResetCreditsIfNeeded(userId);

      // Get subscription and credits (creates if doesn't exist)
      const result = await getOrCreateSubscription(userId);
      subscription = result.subscription;
      credits = result.credits;
    } catch (dbError: any) {
      console.warn('[Subscription API] Database unavailable, using default subscription:', dbError.message);
      
      // Return default starter subscription when DB is unavailable
      const now = new Date();
      subscription = {
        id: 'default',
        userId: userId,
        tier: 'starter' as const,
        status: 'active' as const,
        stripeSubscriptionId: null,
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      };
      
      credits = {
        id: 'default',
        userId: userId,
        totalCredits: 50,
        usedCredits: 0,
        bonusCredits: 0,
        lastResetAt: now,
        createdAt: now,
        updatedAt: now,
      };
    }
    
    console.log(`[Subscription API] Found/Created subscription:`, {
      tier: subscription.tier,
      status: subscription.status,
      creditsTotal: credits.totalCredits,
      creditsUsed: credits.usedCredits,
      creditsRemaining: credits.totalCredits - credits.usedCredits
    });
    
    // Get plan details
    const plan = SUBSCRIPTION_PLANS[subscription.tier];
    
    // Calculate remaining credits
    const remainingCredits = getRemainingCredits(credits, subscription);

    const response = {
      subscription: {
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      credits: {
        total: credits.totalCredits,
        used: credits.usedCredits,
        bonus: credits.bonusCredits,
        remaining: remainingCredits,
        lastResetAt: credits.lastResetAt,
      },
      plan: {
        name: plan.name,
        price: plan.price,
        features: plan.features,
      }
    };

    console.log(`[Subscription API] ✅ Returning subscription data for ${userId}`);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[Subscription API] ❌ Error:', error);
    console.error('[Subscription API] Error details:', {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3)
    });
    return NextResponse.json(
      { error: 'Failed to get subscription info', details: error.message },
      { status: 500 }
    );
  }
}
