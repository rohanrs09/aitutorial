'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  TrendingUp, 
  Crown, 
  Sparkles,
  ChevronRight,
  Infinity,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

interface CreditsData {
  subscription: {
    tier: 'starter' | 'pro' | 'unlimited';
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  };
  credits: {
    total: number;
    used: number;
    bonus: number;
    remaining: number | 'unlimited';
    lastResetAt: string;
  };
  plan: {
    name: string;
    price: number;
    features: string[];
  };
}

const tierColors = {
  starter: {
    bg: 'from-slate-500/20 to-slate-600/10',
    border: 'border-slate-500/30',
    text: 'text-slate-400',
    accent: 'text-slate-300',
    glow: 'shadow-slate-500/20',
    progress: 'bg-slate-500',
  },
  pro: {
    bg: 'from-orange-500/20 to-amber-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    accent: 'text-orange-300',
    glow: 'shadow-orange-500/30',
    progress: 'bg-gradient-to-r from-orange-500 to-amber-500',
  },
  unlimited: {
    bg: 'from-violet-500/20 to-purple-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
    accent: 'text-violet-300',
    glow: 'shadow-violet-500/30',
    progress: 'bg-gradient-to-r from-violet-500 to-purple-500',
  },
};

export function CreditsDisplay() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [data, setData] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch when Clerk is loaded and user is signed in
    if (isLoaded && isSignedIn) {
      fetchCredits();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
      setError('Please sign in to view credits');
    }
  }, [isLoaded, isSignedIn]);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[CreditsDisplay] Fetching subscription data...');
      const response = await fetch('/api/subscription');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[CreditsDisplay] API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || `Failed to fetch subscription (${response.status})`);
      }
      
      const result = await response.json();
      console.log('[CreditsDisplay] ✅ Subscription data loaded:', {
        tier: result.subscription?.tier,
        credits: result.credits?.remaining
      });
      setData(result);
      setError(null);
    } catch (err: any) {
      console.error('[CreditsDisplay] ❌ Error fetching credits:', err);
      setError(err.message || 'Unable to load credits');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700/50">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700/50 rounded w-1/3"></div>
          <div className="h-4 bg-gray-700/50 rounded w-full"></div>
          <div className="h-10 bg-gray-700/50 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700/50">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 text-yellow-400">
            <AlertCircle size={20} />
            <span className="text-sm">{error || 'No subscription data'}</span>
          </div>
          {isSignedIn && (
            <button 
              onClick={fetchCredits}
              className="text-sm text-orange-400 hover:text-orange-300 transition-colors text-left"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  const { subscription, credits, plan } = data;
  const colors = tierColors[subscription.tier];
  const isUnlimited = subscription.tier === 'unlimited';
  const creditsPercentage = isUnlimited ? 100 : Math.max(0, Math.min(100, (credits.remaining as number / credits.total) * 100));
  const daysUntilReset = Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colors.bg} rounded-2xl p-6 border ${colors.border} shadow-lg ${colors.glow} h-full flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-gradient-to-br ${colors.bg} ${colors.border} border`}>
            {subscription.tier === 'unlimited' ? (
              <Crown className={colors.text} size={20} />
            ) : subscription.tier === 'pro' ? (
              <Sparkles className={colors.text} size={20} />
            ) : (
              <Zap className={colors.text} size={20} />
            )}
          </div>
          <div>
            <h3 className={`font-semibold ${colors.accent}`}>{plan.name}</h3>
            <p className="text-xs text-gray-400">
              {subscription.status === 'active' ? 'Active' : subscription.status}
              {subscription.cancelAtPeriodEnd && ' · Cancels soon'}
            </p>
          </div>
        </div>
        
        {subscription.tier !== 'unlimited' && (
          <Link 
            href="/#pricing"
            className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors group"
          >
            Upgrade
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {/* Credits Display */}
      <div className="mb-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <span className="text-3xl font-bold text-white">
              {isUnlimited ? (
                <span className="flex items-center gap-2">
                  <Infinity size={32} className={colors.text} />
                </span>
              ) : (
                credits.remaining
              )}
            </span>
            {!isUnlimited && (
              <span className="text-gray-400 text-sm ml-1">/ {credits.total}</span>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {isUnlimited ? 'Unlimited credits' : 'credits remaining'}
          </span>
        </div>

        {/* Progress Bar */}
        {!isUnlimited && (
          <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${creditsPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full ${colors.progress} rounded-full`}
            />
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-700/50">
        <div className="text-center">
          <p className="text-lg font-semibold text-white">
            {isUnlimited ? '∞' : credits.used}
          </p>
          <p className="text-xs text-gray-400">Used</p>
        </div>
        <div className="text-center border-x border-gray-700/50">
          <p className="text-lg font-semibold text-white">{credits.bonus}</p>
          <p className="text-xs text-gray-400">Bonus</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-white">{daysUntilReset}d</p>
          <p className="text-xs text-gray-400">Reset</p>
        </div>
      </div>

      {/* Low Credits Warning */}
      {!isUnlimited && creditsPercentage < 20 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="text-yellow-400" size={16} />
            <span className="text-sm text-yellow-300">
              Low on credits! <Link href="/#pricing" className="underline hover:text-yellow-200">Upgrade now</Link>
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default CreditsDisplay;
