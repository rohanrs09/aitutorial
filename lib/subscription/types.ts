// Subscription and Credits System Types

export type SubscriptionTier = 'starter' | 'pro' | 'unlimited';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'inactive';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number; // in cents
  credits: number; // -1 for unlimited
  stripePriceId: string | null;
  features: string[];
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeSubscriptionId: string | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCredits {
  id: string;
  userId: string;
  totalCredits: number; // Total credits available this period
  usedCredits: number; // Credits used this period
  bonusCredits: number; // Extra credits (promotions, etc.)
  lastResetAt: Date; // When credits were last reset
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number; // Positive = added, negative = used
  type: CreditTransactionType;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type CreditTransactionType = 
  | 'subscription_reset' // Monthly credit reset
  | 'usage' // Credit used for AI interaction
  | 'bonus' // Promotional credits
  | 'refund' // Credit refund
  | 'purchase'; // One-time credit purchase

// Credit costs for different actions
export const CREDIT_COSTS = {
  AI_RESPONSE: 1, // Basic AI text response
  VOICE_SESSION: 5, // Full voice tutoring session
  EMOTION_DETECTION: 2, // Emotion detection per minute
  SLIDE_GENERATION: 1, // Generate learning slides (Need Help button)
  QUIZ_GENERATION: 0, // Quiz generation is FREE
} as const;

// Plan definitions
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 0,
    credits: 50,
    stripePriceId: null,
    features: [
      '50 AI credits per month',
      '~10 voice sessions',
      '3 course topics',
      'Basic progress tracking',
      'Email support'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 1900, // $19.00
    credits: 500,
    stripePriceId: process.env.STRIPE_PRICE_ID_PRO || null,
    features: [
      '500 AI credits per month',
      '~100 voice sessions',
      'All topics + custom topics',
      'Emotion detection',
      'Advanced analytics',
      'Priority support',
      'Session history export'
    ]
  },
  unlimited: {
    id: 'unlimited',
    name: 'Unlimited',
    price: 4900, // $49.00
    credits: -1, // Unlimited
    stripePriceId: process.env.STRIPE_PRICE_ID_UNLIMITED || null,
    features: [
      'Unlimited AI credits',
      'Unlimited voice sessions',
      'All Pro features',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'Early access to new features'
    ]
  }
};

// Helper to check if user has enough credits
export function hasEnoughCredits(
  userCredits: UserCredits,
  subscription: UserSubscription,
  cost: number
): boolean {
  // Unlimited plan always has credits
  if (subscription.tier === 'unlimited' && subscription.status === 'active') {
    return true;
  }
  
  const availableCredits = 
    userCredits.totalCredits - userCredits.usedCredits + userCredits.bonusCredits;
  
  return availableCredits >= cost;
}

// Helper to get remaining credits
export function getRemainingCredits(
  userCredits: UserCredits,
  subscription: UserSubscription
): number | 'unlimited' {
  if (subscription.tier === 'unlimited' && subscription.status === 'active') {
    return 'unlimited';
  }
  
  return Math.max(
    0,
    userCredits.totalCredits - userCredits.usedCredits + userCredits.bonusCredits
  );
}
