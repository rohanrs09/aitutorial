'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, AlertCircle, Crown, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface SubscriptionInfo {
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

interface CreditsDisplayProps {
  variant?: 'compact' | 'full';
  showUpgrade?: boolean;
}

export default function CreditsDisplay({ 
  variant = 'compact', 
  showUpgrade = true 
}: CreditsDisplayProps) {
  const [data, setData] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/subscription');
        if (!response.ok) throw new Error('Failed to fetch subscription');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError('Unable to load subscription info');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-2 text-red-400">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  const { subscription, credits, plan } = data;
  const isUnlimited = credits.remaining === 'unlimited';
  const remainingCredits = isUnlimited ? Infinity : (credits.remaining as number);
  const totalCredits = credits.total === -1 ? Infinity : credits.total;
  const usagePercent = isUnlimited ? 0 : Math.min((credits.used / totalCredits) * 100, 100);
  const isLow = !isUnlimited && remainingCredits < 20;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/80 rounded-lg border border-orange-500/20">
          <Zap className={`w-4 h-4 ${isLow ? 'text-red-400' : 'text-orange-400'}`} />
          <span className={`text-sm font-medium ${isLow ? 'text-red-400' : 'text-white'}`}>
            {isUnlimited ? '∞' : remainingCredits}
          </span>
          <span className="text-xs text-gray-500">credits</span>
        </div>
        
        {/* subscription.tier !== 'unlimited' && showUpgrade && (
          <Link href="#pricing">
            <Badge 
              variant="outline" 
              className="text-xs border-orange-500/30 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 cursor-pointer transition-colors"
            >
              <Crown className="w-3 h-3 mr-1" />
              Upgrade
            </Badge>
          </Link>
        ) */}
      </div>
    );
  }

  // Full variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-gray-900/80 rounded-xl border border-orange-500/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            subscription.tier === 'unlimited' 
              ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
              : subscription.tier === 'pro'
              ? 'bg-gradient-to-br from-orange-500 to-amber-500'
              : 'bg-gray-700'
          }`}>
            {subscription.tier === 'unlimited' ? (
              <Crown className="w-4 h-4 text-white" />
            ) : (
              <Zap className="w-4 h-4 text-white" />
            )}
          </div>
          <div>
            <p className="text-white font-semibold">{plan.name} Plan</p>
            <p className="text-xs text-gray-400">
              {subscription.status === 'active' ? 'Active' : subscription.status}
            </p>
          </div>
        </div>
        
        {/* subscription.tier !== 'unlimited' && showUpgrade && (
          <Link href="#pricing">
            <Button size="sm" variant="outline" className="text-xs border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
              <TrendingUp className="w-3 h-3 mr-1" />
              Upgrade
            </Button>
          </Link>
        ) */}
      </div>

      {/* Credits Display */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Credits Remaining</span>
          <span className={`text-lg font-bold ${isLow ? 'text-red-400' : 'text-white'}`}>
            {isUnlimited ? '∞ Unlimited' : `${remainingCredits} / ${totalCredits}`}
          </span>
        </div>

        {!isUnlimited && (
          <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${100 - usagePercent}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full rounded-full ${
                isLow 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                  : 'bg-gradient-to-r from-orange-500 to-amber-500'
              }`}
            />
          </div>
        )}

        {credits.bonus > 0 && (
          <div className="flex items-center gap-2 text-xs text-green-400">
            <span>+{credits.bonus} bonus credits</span>
          </div>
        )}

        {isLow && (
          <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-400">
              {/* Running low on credits! Consider upgrading. */}
              Running low on credits!
            </span>
          </div>
        )}

        <div className="pt-2 border-t border-gray-800">
          <p className="text-xs text-gray-500">
            Resets on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
