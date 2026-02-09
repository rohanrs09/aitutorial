// Credits Management System
import { 
  UserCredits, 
  UserSubscription, 
  CreditTransaction, 
  CreditTransactionType,
  CREDIT_COSTS,
  SUBSCRIPTION_PLANS,
  hasEnoughCredits,
  getRemainingCredits
} from './types';
import { createAdminClient } from '@/lib/supabase-auth';

// ============================================
// User Subscription Management
// ============================================

export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  console.log('[Subscription] Fetching subscription for user:', userId);
  
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Subscription] Error fetching subscription:', error);
    return null;
  }

  if (!data) {
    console.warn('[Subscription] No subscription found for user:', userId);
    return null;
  }

  console.log('[Subscription] Found subscription:', {
    tier: data.tier,
    status: data.status
  });

  return {
    id: data.id,
    userId: data.id,
    tier: data.tier,
    status: data.status,
    stripeSubscriptionId: data.stripe_subscription_id,
    currentPeriodStart: new Date(data.current_period_start),
    currentPeriodEnd: new Date(data.current_period_end),
    cancelAtPeriodEnd: data.cancel_at_period_end,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
}

export async function createUserSubscription(
  userId: string,
  tier: 'starter' | 'pro' | 'unlimited' = 'starter'
): Promise<UserSubscription> {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const supabase = createAdminClient();

  // First check if subscription already exists - never overwrite
  const { data: existing } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (existing) {
    console.log('[Credits] Subscription already exists, preserving existing data');
    return {
      id: existing.id,
      userId: existing.id,
      tier: existing.tier,
      status: existing.status,
      stripeSubscriptionId: existing.stripe_subscription_id,
      currentPeriodStart: new Date(existing.current_period_start),
      currentPeriodEnd: new Date(existing.current_period_end),
      cancelAtPeriodEnd: existing.cancel_at_period_end,
      createdAt: new Date(existing.created_at),
      updatedAt: new Date(existing.updated_at)
    };
  }

  // Only insert if no subscription exists
  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert({
      id: userId,
      tier,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false
    })
    .select()
    .single();

  if (error) {
    console.error('[Credits] Failed to create subscription:', error);
    throw new Error(`Failed to create subscription: ${error.message}`);
  }

  return {
    id: data.id,
    userId: data.id,
    tier: data.tier,
    status: data.status,
    stripeSubscriptionId: data.stripe_subscription_id,
    currentPeriodStart: new Date(data.current_period_start),
    currentPeriodEnd: new Date(data.current_period_end),
    cancelAtPeriodEnd: data.cancel_at_period_end,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
}

export async function updateSubscription(
  userId: string,
  updates: Partial<{
    tier: 'starter' | 'pro' | 'unlimited';
    status: string;
    stripeSubscriptionId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  }>
): Promise<UserSubscription> {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  
  if (updates.tier) updateData.tier = updates.tier;
  if (updates.status) updateData.status = updates.status;
  if (updates.stripeSubscriptionId) updateData.stripe_subscription_id = updates.stripeSubscriptionId;
  if (updates.currentPeriodStart) updateData.current_period_start = updates.currentPeriodStart.toISOString();
  if (updates.currentPeriodEnd) updateData.current_period_end = updates.currentPeriodEnd.toISOString();
  if (typeof updates.cancelAtPeriodEnd === 'boolean') updateData.cancel_at_period_end = updates.cancelAtPeriodEnd;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('user_subscriptions')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`);
  }

  // If tier changed, update credits
  if (updates.tier) {
    await resetUserCredits(userId, updates.tier);
  }

  return {
    id: data.id,
    userId: data.user_id,
    tier: data.tier,
    status: data.status,
    stripeSubscriptionId: data.stripe_subscription_id,
    currentPeriodStart: new Date(data.current_period_start),
    currentPeriodEnd: new Date(data.current_period_end),
    cancelAtPeriodEnd: data.cancel_at_period_end,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
}

// ============================================
// Credits Management
// ============================================

export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  console.log('[Credits] Fetching credits for user:', userId);
  
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('id', userId)
    .maybeSingle(); // Use maybeSingle instead of single to avoid 406 errors

  if (error) {
    console.error('[Credits] Error fetching credits:', error);
    return null;
  }

  if (!data) {
    console.warn('[Credits] No credits found for user:', userId);
    return null;
  }

  console.log('[Credits] Found credits:', {
    total: data.total_credits,
    used: data.used_credits,
    bonus: data.bonus_credits
  });

  return {
    id: data.id,
    userId: data.user_id,
    totalCredits: data.total_credits,
    usedCredits: data.used_credits,
    bonusCredits: data.bonus_credits,
    lastResetAt: new Date(data.last_reset_at),
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
}

export async function initializeUserCredits(
  userId: string,
  tier: 'starter' | 'pro' | 'unlimited'
): Promise<UserCredits> {
  const plan = SUBSCRIPTION_PLANS[tier];
  const now = new Date();

  const supabase = createAdminClient();

  // First check if credits already exist - never overwrite existing credits
  const { data: existing } = await supabase
    .from('user_credits')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (existing) {
    console.log('[Credits] Credits already exist for user, preserving existing data');
    return {
      id: existing.id,
      userId: existing.id,
      totalCredits: existing.total_credits,
      usedCredits: existing.used_credits,
      bonusCredits: existing.bonus_credits,
      lastResetAt: new Date(existing.last_reset_at),
      createdAt: new Date(existing.created_at),
      updatedAt: new Date(existing.updated_at)
    };
  }

  // Only insert if no credits exist
  const { data, error } = await supabase
    .from('user_credits')
    .insert({
      id: userId,
      total_credits: plan.credits,
      used_credits: 0,
      bonus_credits: 0,
      last_reset_at: now.toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('[Credits] Failed to initialize credits:', error);
    throw new Error(`Failed to initialize credits: ${error.message}`);
  }

  // Log the transaction (only if this is a new record)
  try {
    await logCreditTransaction(userId, plan.credits, 'subscription_reset', 'Initial credits allocation');
  } catch (logError) {
    console.warn('[Credits] Failed to log transaction:', logError);
    // Don't fail the whole operation if logging fails
  }

  return {
    id: data.id,
    userId: data.user_id,
    totalCredits: data.total_credits,
    usedCredits: data.used_credits,
    bonusCredits: data.bonus_credits,
    lastResetAt: new Date(data.last_reset_at),
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
}

export async function resetUserCredits(
  userId: string,
  tier: 'starter' | 'pro' | 'unlimited'
): Promise<UserCredits> {
  const plan = SUBSCRIPTION_PLANS[tier];
  const now = new Date();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('user_credits')
    .update({
      total_credits: plan.credits,
      used_credits: 0,
      last_reset_at: now.toISOString(),
      updated_at: now.toISOString()
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to reset credits: ${error.message}`);
  }

  // Log the transaction
  await logCreditTransaction(userId, plan.credits, 'subscription_reset', 'Monthly credits reset');

  return {
    id: data.id,
    userId: data.user_id,
    totalCredits: data.total_credits,
    usedCredits: data.used_credits,
    bonusCredits: data.bonus_credits,
    lastResetAt: new Date(data.last_reset_at),
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
}

export async function deductCredits(
  userId: string,
  amount: number,
  description: string
): Promise<{ success: boolean; remainingCredits: number | 'unlimited'; error?: string }> {
  console.log('[Credits] Deducting', amount, 'credits for user:', userId);
  
  // Get user subscription and credits
  const [subscription, credits] = await Promise.all([
    getUserSubscription(userId),
    getUserCredits(userId)
  ]);

  console.log('[Credits] Current state:', {
    hasSubscription: !!subscription,
    hasCredits: !!credits,
    tier: subscription?.tier,
    status: subscription?.status,
    totalCredits: credits?.totalCredits,
    usedCredits: credits?.usedCredits
  });

  if (!subscription || !credits) {
    console.error('[Credits] No subscription or credits found');
    throw new Error('No subscription found. Please contact support.');
  }

  // Check if subscription is active
  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    console.error('[Credits] Subscription not active:', subscription.status);
    throw new Error('Subscription is not active');
  }

  // Unlimited plan doesn't need to check credits
  if (subscription.tier === 'unlimited') {
    console.log('[Credits] Unlimited plan - no deduction needed');
    // Still log the usage for analytics
    await logCreditTransaction(userId, -amount, 'usage', description);
    return { success: true, remainingCredits: 'unlimited' };
  }

  // Check if user has enough credits
  const remaining = getRemainingCredits(credits, subscription);
  console.log('[Credits] Checking if enough credits. Need:', amount, 'Have:', remaining);
  
  if (!hasEnoughCredits(credits, subscription, amount)) {
    console.error('[Credits] Insufficient credits');
    throw new Error(`Insufficient credits. You need ${amount} credits but only have ${remaining}.`);
  }

  // Calculate new used credits
  const newUsedCredits = credits.usedCredits + amount;
  
  const supabase = createAdminClient();
  // Deduct credits
  const { error } = await supabase
    .from('user_credits')
    .update({
      used_credits: newUsedCredits,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error('[Credits] Failed to deduct credits:', error);
    return { success: false, remainingCredits: 0, error: error.message };
  }

  // Log the transaction
  try {
    await logCreditTransaction(userId, -amount, 'usage', description);
  } catch (logError) {
    console.warn('[Credits] Failed to log transaction:', logError);
    // Don't fail the deduction if logging fails
  }

  const newRemaining = credits.totalCredits - newUsedCredits + credits.bonusCredits;
  console.log('[Credits] Deducted', amount, 'credits. Remaining:', newRemaining);
  return { success: true, remainingCredits: Math.max(0, newRemaining) };
}

export async function addBonusCredits(
  userId: string,
  amount: number,
  description: string
): Promise<UserCredits> {
  const credits = await getUserCredits(userId);
  
  if (!credits) {
    throw new Error('User credits not found');
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('user_credits')
    .update({
      bonus_credits: credits.bonusCredits + amount,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add bonus credits: ${error.message}`);
  }

  // Log the transaction
  await logCreditTransaction(userId, amount, 'bonus', description);

  return {
    id: data.id,
    userId: data.user_id,
    totalCredits: data.total_credits,
    usedCredits: data.used_credits,
    bonusCredits: data.bonus_credits,
    lastResetAt: new Date(data.last_reset_at),
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
}

// ============================================
// Credit Transactions Log
// ============================================

export async function logCreditTransaction(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  description: string,
  metadata?: Record<string, unknown>
): Promise<CreditTransaction> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount,
      type,
      description,
      metadata: metadata || {}
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to log credit transaction:', error);
    // Don't throw - logging failure shouldn't block operations
    return {
      id: 'error',
      userId: userId,
      amount,
      type,
      description,
      metadata,
      createdAt: new Date()
    };
  }

  return {
    id: data.id,
    userId: data.user_id,
    amount: data.amount,
    type: data.type,
    description: data.description,
    metadata: data.metadata,
    createdAt: new Date(data.created_at)
  };
}

export async function getCreditTransactions(
  userId: string,
  limit: number = 50
): Promise<CreditTransaction[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map(t => ({
    id: t.id,
    userId: t.user_id,
    amount: t.amount,
    type: t.type,
    description: t.description,
    metadata: t.metadata,
    createdAt: new Date(t.created_at)
  }));
}

// ============================================
// Utility Functions
// ============================================

export async function getOrCreateSubscription(userId: string): Promise<{
  subscription: UserSubscription;
  credits: UserCredits;
}> {
  let subscription = await getUserSubscription(userId);
  let credits = await getUserCredits(userId);

  if (!subscription) {
    subscription = await createUserSubscription(userId, 'starter');
  }

  if (!credits) {
    credits = await initializeUserCredits(userId, subscription.tier);
  }

  return { subscription, credits };
}

export async function checkAndResetCreditsIfNeeded(userId: string): Promise<void> {
  const [subscription, credits] = await Promise.all([
    getUserSubscription(userId),
    getUserCredits(userId)
  ]);

  if (!subscription || !credits) return;

  // Check if credits need to be reset (new billing period)
  const now = new Date();
  if (now >= subscription.currentPeriodEnd) {
    await resetUserCredits(userId, subscription.tier);
  }
}

// ============================================
// Quiz-Specific Credit Functions
// ============================================

/**
 * Ensure user has subscription and credits initialized
 * Creates them if they don't exist (for new users)
 */
export async function ensureUserSubscription(userId: string): Promise<{
  success: boolean;
  subscription: UserSubscription | null;
  credits: UserCredits | null;
  error?: string;
}> {
  try {
    console.log('[Credits] Ensuring subscription for:', userId);
    
    // Try to get existing subscription
    let subscription = await getUserSubscription(userId);
    let credits = await getUserCredits(userId);
    
    // If no subscription exists, create one with starter tier
    if (!subscription) {
      console.log('[Credits] No subscription found, creating starter subscription');
      subscription = await createUserSubscription(userId, 'starter');
    }
    
    // If no credits exist, initialize them
    if (!credits) {
      console.log('[Credits] No credits found, initializing');
      credits = await initializeUserCredits(userId, subscription.tier);
    }
    
    return {
      success: true,
      subscription,
      credits
    };
  } catch (error) {
    console.error('[Credits] Error ensuring subscription:', error);
    return {
      success: false,
      subscription: null,
      credits: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Deduct credits specifically for quiz generation
 * Deducts QUIZ_GENERATION cost from user's credits
 */
export async function deductCreditsForQuiz(userId: string): Promise<{
  success: boolean;
  remainingCredits: number | 'unlimited';
  error?: string;
}> {
  try {
    const result = await deductCredits(
      userId,
      CREDIT_COSTS.QUIZ_GENERATION,
      'Quiz generation'
    );
    
    return result;
  } catch (error) {
    console.error('[Credits] Error using credits for quiz:', error);
    return {
      success: false,
      remainingCredits: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export credit costs for use in other modules
export { CREDIT_COSTS, hasEnoughCredits, getRemainingCredits };
