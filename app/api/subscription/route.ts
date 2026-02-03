// Subscription Management API Route
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
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

    // Check and reset credits if new billing period
    await checkAndResetCreditsIfNeeded(userId);

    // Get subscription and credits (creates if doesn't exist)
    const { subscription, credits } = await getOrCreateSubscription(userId);
    
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
