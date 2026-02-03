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

export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
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
  userId: string,
  tier: 'starter' | 'pro' | 'unlimited' = 'starter'
): Promise<UserSubscription> {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
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

  // Initialize credits for the user
  await initializeUserCredits(userId, tier);

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
  userId: string,
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
    .eq('user_id', userId)
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

export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
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
  userId: string,
  tier: 'starter' | 'pro' | 'unlimited'
): Promise<UserCredits> {
  const plan = SUBSCRIPTION_PLANS[tier];
  const now = new Date();

  const { data, error } = await supabase
    .from('user_credits')
    .insert({
      user_id: userId,
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
  await logCreditTransaction(userId, plan.credits, 'subscription_reset', 'Initial credits allocation');

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

  const { data, error } = await supabase
    .from('user_credits')
    .update({
      total_credits: plan.credits,
      used_credits: 0,
      last_reset_at: now.toISOString(),
      updated_at: now.toISOString()
    })
    .eq('user_id', userId)
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

export async function useCredits(
  userId: string,
  amount: number,
  description: string
): Promise<{ success: boolean; remainingCredits: number | 'unlimited'; error?: string }> {
  // Get user subscription and credits
  const [subscription, credits] = await Promise.all([
    getUserSubscription(userId),
    getUserCredits(userId)
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
    await logCreditTransaction(userId, -amount, 'usage', description);
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
    .eq('user_id', userId);

  if (error) {
    return { success: false, remainingCredits: 0, error: error.message };
  }

  // Log the transaction
  await logCreditTransaction(userId, -amount, 'usage', description);

  const newRemaining = credits.totalCredits - (credits.usedCredits + amount) + credits.bonusCredits;
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

  const { data, error } = await supabase
    .from('user_credits')
    .update({
      bonus_credits: credits.bonusCredits + amount,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
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
      userId,
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

// Export credit costs for use in other modules
export { CREDIT_COSTS, hasEnoughCredits, getRemainingCredits };
