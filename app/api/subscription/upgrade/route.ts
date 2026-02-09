import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserSubscription, updateSubscription } from '@/lib/subscription/credits';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await request.json();
    
    console.log('[Upgrade API] Request:', { userId, planId });
    
    if (!planId || !['plan_pro_monthly', 'plan_unlimited_monthly'].includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Get current subscription
    const currentSub = await getUserSubscription(userId);
    console.log('[Upgrade API] Current subscription:', currentSub?.tier);
    
    // Map plan IDs to tier names
    const tierMap: Record<string, 'starter' | 'pro' | 'unlimited'> = {
      'plan_pro_monthly': 'pro',
      'plan_unlimited_monthly': 'unlimited'
    };
    
    const newTier = tierMap[planId];
    
    // Update the subscription directly in the database
    // In production, this should be triggered by Stripe webhook after payment
    
    console.log('[Upgrade API] Updating subscription to:', newTier);
    
    try {
      await updateSubscription(userId, {
        tier: newTier,
        status: 'active',
        stripeSubscriptionId: `temp_${planId}_${Date.now()}`,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      
      console.log('[Upgrade API] ✅ Subscription updated successfully');
      
      // Return success and redirect to dashboard
      return NextResponse.json({ 
        success: true,
        checkoutUrl: '/dashboard',
        planId,
        newTier,
        currentPlan: currentSub?.tier || 'starter',
        message: 'Subscription upgraded successfully! Credits have been updated.'
      });
    } catch (updateError) {
      console.error('[Upgrade API] Failed to update subscription:', updateError);
      throw updateError;
    }

  } catch (error) {
    console.error('[Upgrade API] Subscription upgrade error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription checkout', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await getUserSubscription(userId);
    
    return NextResponse.json({
      subscription,
      canUpgrade: subscription?.tier !== 'unlimited',
      currentPlan: subscription?.tier || 'starter'
    });

  } catch (error) {
    console.error('Get subscription info error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription info' },
      { status: 500 }
    );
  }
}
