// Credits Management System
import { createClient } from '@supabase/supabase-js';
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

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// User Subscription Management
// ============================================

export async function getUserSubscription(clerkUserId: string): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    tier: data.tier,
    status: data.status,
    clerkSubscriptionId: data.clerk_subscription_id,
    currentPeriodStart: new Date(data.current_period_start),
    currentPeriodEnd: new Date(data.current_period_end),
    cancelAtPeriodEnd: data.cancel_at_period_end,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
}

export async function createUserSubscription(
  clerkUserId: string,
  tier: 'starter' | 'pro' | 'unlimited' = 'starter'
): Promise<UserSubscription> {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert({
      clerk_user_id: clerkUserId,
      tier,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create subscription: ${error.message}`);
  }

  // Note: Credits should be initialized separately to avoid duplicate key errors
  // The calling function should handle credit initialization

  return {
    id: data.id,
    userId: data.user_id,
    tier: data.tier,
    status: data.status,
    clerkSubscriptionId: data.clerk_subscription_id,
    currentPeriodStart: new Date(data.current_period_start),
    currentPeriodEnd: new Date(data.current_period_end),
    cancelAtPeriodEnd: data.cancel_at_period_end,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
}

export async function updateSubscription(
  clerkUserId: string,
  updates: Partial<{
    tier: 'starter' | 'pro' | 'unlimited';
    status: string;
    clerkSubscriptionId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  }>
): Promise<UserSubscription> {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  
  if (updates.tier) updateData.tier = updates.tier;
  if (updates.status) updateData.status = updates.status;
  if (updates.clerkSubscriptionId) updateData.clerk_subscription_id = updates.clerkSubscriptionId;
  if (updates.currentPeriodStart) updateData.current_period_start = updates.currentPeriodStart.toISOString();
  if (updates.currentPeriodEnd) updateData.current_period_end = updates.currentPeriodEnd.toISOString();
  if (typeof updates.cancelAtPeriodEnd === 'boolean') updateData.cancel_at_period_end = updates.cancelAtPeriodEnd;

  const { data, error } = await supabase
    .from('user_subscriptions')
    .update(updateData)
    .eq('clerk_user_id', clerkUserId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`);
  }

  // If tier changed, update credits
  if (updates.tier) {
    await resetUserCredits(clerkUserId, updates.tier);
  }

  return {
    id: data.id,
    userId: data.user_id,
    tier: data.tier,
    status: data.status,
    clerkSubscriptionId: data.clerk_subscription_id,
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

export async function getUserCredits(clerkUserId: string): Promise<UserCredits | null> {
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error || !data) {
    return null;
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

export async function initializeUserCredits(
  clerkUserId: string,
  tier: 'starter' | 'pro' | 'unlimited'
): Promise<UserCredits> {
  const plan = SUBSCRIPTION_PLANS[tier];
  const now = new Date();

  // Check if credits already exist to avoid duplicate key error
  const existing = await getUserCredits(clerkUserId);
  if (existing) {
    console.log('[Credits] Credits already exist for user:', clerkUserId);
    return existing;
  }

  const { data, error } = await supabase
    .from('user_credits')
    .insert({
      clerk_user_id: clerkUserId,
      total_credits: plan.credits,
      used_credits: 0,
      bonus_credits: 0,
      last_reset_at: now.toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to initialize credits: ${error.message}`);
  }

  // Log the transaction
  await logCreditTransaction(clerkUserId, plan.credits, 'subscription_reset', 'Initial credits allocation');

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
  clerkUserId: string,
  tier: 'starter' | 'pro' | 'unlimited'
): Promise<UserCredits> {
  const plan = SUBSCRIPTION_PLANS[tier];
  const now = new Date();

  const { data, error } = await supabase
    .from('user_credits')
    .update({
      total_credits: plan.credits,
      used_credits: 0,
      last_reset_at: now.toISOString(),
      updated_at: now.toISOString()
    })
    .eq('clerk_user_id', clerkUserId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to reset credits: ${error.message}`);
  }

  // Log the transaction
  await logCreditTransaction(clerkUserId, plan.credits, 'subscription_reset', 'Monthly credits reset');

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
  clerkUserId: string,
  amount: number,
  description: string
): Promise<{ success: boolean; remainingCredits: number | 'unlimited'; error?: string }> {
  // Get user subscription and credits
  const [subscription, credits] = await Promise.all([
    getUserSubscription(clerkUserId),
    getUserCredits(clerkUserId)
  ]);

  if (!subscription || !credits) {
    return { success: false, remainingCredits: 0, error: 'No subscription found' };
  }

  // Check if subscription is active
  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    return { success: false, remainingCredits: 0, error: 'Subscription is not active' };
  }

  // Unlimited plan doesn't need to check credits
  if (subscription.tier === 'unlimited') {
    // Still log the usage for analytics
    await logCreditTransaction(clerkUserId, -amount, 'usage', description);
    return { success: true, remainingCredits: 'unlimited' };
  }

  // Check if user has enough credits
  if (!hasEnoughCredits(credits, subscription, amount)) {
    const remaining = getRemainingCredits(credits, subscription);
    return { 
      success: false, 
      remainingCredits: remaining, 
      error: `Insufficient credits. Need ${amount}, have ${remaining}` 
    };
  }

  // Deduct credits
  const { error } = await supabase
    .from('user_credits')
    .update({
      used_credits: credits.usedCredits + amount,
      updated_at: new Date().toISOString()
    })
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    return { success: false, remainingCredits: 0, error: error.message };
  }

  // Log the transaction
  await logCreditTransaction(clerkUserId, -amount, 'usage', description);

  const newRemaining = credits.totalCredits - (credits.usedCredits + amount) + credits.bonusCredits;
  return { success: true, remainingCredits: Math.max(0, newRemaining) };
}

export async function addBonusCredits(
  clerkUserId: string,
  amount: number,
  description: string
): Promise<UserCredits> {
  const credits = await getUserCredits(clerkUserId);
  
  if (!credits) {
    throw new Error('User credits not found');
  }

  const { data, error } = await supabase
    .from('user_credits')
    .update({
      bonus_credits: credits.bonusCredits + amount,
      updated_at: new Date().toISOString()
    })
    .eq('clerk_user_id', clerkUserId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add bonus credits: ${error.message}`);
  }

  // Log the transaction
  await logCreditTransaction(clerkUserId, amount, 'bonus', description);

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
  clerkUserId: string,
  amount: number,
  type: CreditTransactionType,
  description: string,
  metadata?: Record<string, unknown>
): Promise<CreditTransaction> {
  const { data, error } = await supabase
    .from('credit_transactions')
    .insert({
      clerk_user_id: clerkUserId,
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
      userId: clerkUserId,
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
  clerkUserId: string,
  limit: number = 50
): Promise<CreditTransaction[]> {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
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
export async function ensureUserSubscription(clerkUserId: string): Promise<{
  success: boolean;
  subscription: UserSubscription | null;
  credits: UserCredits | null;
  error?: string;
}> {
  try {
    console.log('[Credits] Ensuring subscription for:', clerkUserId);
    
    // Try to get existing subscription
    let subscription = await getUserSubscription(clerkUserId);
    let credits = await getUserCredits(clerkUserId);
    
    // If no subscription exists, create one with starter tier
    if (!subscription) {
      console.log('[Credits] No subscription found, creating starter subscription');
      subscription = await createUserSubscription(clerkUserId, 'starter');
    }
    
    // If no credits exist, initialize them
    if (!credits) {
      console.log('[Credits] No credits found, initializing');
      credits = await initializeUserCredits(clerkUserId, subscription.tier);
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
export async function deductCreditsForQuiz(clerkUserId: string): Promise<{
  success: boolean;
  remainingCredits: number | 'unlimited';
  error?: string;
}> {
  try {
    const result = await deductCredits(
      clerkUserId,
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
