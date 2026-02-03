// Credits API Route - Fetch and Initialize User Credits
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ensureUserSubscription, getUserSubscription, getUserCredits } from '@/lib/subscription/credits';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription/types';

/**
 * GET /api/credits
 * Fetches user's current credits and subscription status from database
 * Initializes subscription and credits if they don't exist
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Credits API] Fetching credits for user:', userId);

    // Ensure user has subscription and credits (creates if not exists)
    const result = await ensureUserSubscription(userId);
    
    if (!result.success) {
      console.error('[Credits API] Failed to ensure subscription:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to fetch credits' },
        { status: 500 }
      );
    }

    const { subscription, credits } = result;

    // Calculate remaining credits
    let remainingCredits: number | 'unlimited' = 0;
    if (subscription?.tier === 'unlimited') {
      remainingCredits = 'unlimited';
    } else if (credits) {
      remainingCredits = credits.totalCredits - credits.usedCredits + credits.bonusCredits;
    }

    // Get plan details
    const plan = subscription ? SUBSCRIPTION_PLANS[subscription.tier] : SUBSCRIPTION_PLANS.starter;

    console.log('[Credits API] ✅ Credits fetched:', {
      tier: subscription?.tier,
      total: credits?.totalCredits,
      used: credits?.usedCredits,
      remaining: remainingCredits
    });

    return NextResponse.json({
      success: true,
      subscription: subscription ? {
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
      } : null,
      credits: credits ? {
        total: credits.totalCredits,
        used: credits.usedCredits,
        bonus: credits.bonusCredits,
        remaining: remainingCredits,
        lastResetAt: credits.lastResetAt
      } : null,
      plan: {
        name: plan.name,
        features: plan.features,
        monthlyCredits: plan.credits
      }
    });
  } catch (error) {
    console.error('[Credits API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}
