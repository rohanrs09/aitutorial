import { auth } from './auth';
import { getUserSubscription, getUserCredits, hasEnoughCredits } from './subscription/credits';

/**
 * Credit check middleware for API routes
 * Returns user info and credit status, throws error if insufficient credits
 */
export async function checkCredits(requiredCredits: number) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const [subscription, credits] = await Promise.all([
    getUserSubscription(userId),
    getUserCredits(userId)
  ]);

  if (!subscription || !credits) {
    throw new Error('No subscription found');
  }

  // Unlimited plan always passes
  if (subscription.tier === 'unlimited' && subscription.status === 'active') {
    return {
      userId,
      subscription,
      credits,
      hasEnough: true,
      remaining: 'unlimited' as const
    };
  }

  // Check if user has enough credits
  const hasEnough = hasEnoughCredits(credits, subscription, requiredCredits);
  const remaining = credits.totalCredits - credits.usedCredits + credits.bonusCredits;

  if (!hasEnough) {
    const error: any = new Error(`Insufficient credits. Need ${requiredCredits}, have ${remaining}`);
    error.code = 'INSUFFICIENT_CREDITS';
    error.requiredCredits = requiredCredits;
    error.remainingCredits = remaining;
    throw error;
  }

  return {
    userId,
    subscription,
    credits,
    hasEnough: true,
    remaining
  };
}

/**
 * Format credit error response for API routes
 */
export function formatCreditError(error: any) {
  if (error.code === 'INSUFFICIENT_CREDITS') {
    return {
      error: error.message,
      code: 'INSUFFICIENT_CREDITS',
      requiredCredits: error.requiredCredits,
      remainingCredits: error.remainingCredits
    };
  }
  
  return {
    error: error.message || 'Credit check failed'
  };
}
