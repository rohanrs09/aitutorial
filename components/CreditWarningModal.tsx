'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, AlertTriangle, Zap, CreditCard } from 'lucide-react';

interface CreditWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  remainingCredits: number | 'unlimited';
  requiredCredits: number;
  currentTier: 'starter' | 'pro' | 'unlimited';
}

export default function CreditWarningModal({
  isOpen,
  onClose,
  remainingCredits,
  requiredCredits,
  currentTier
}: CreditWarningModalProps) {
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);

  if (!isOpen) return null;

    // const handleUpgrade = async () => {
    //   setIsUpgrading(true);
    //   try {
    //     // Redirect to pricing page
    //     router.push('/#pricing');
    //     onClose();
    //   } catch (error) {
    //     console.error('Error navigating to upgrade:', error);
    //     setIsUpgrading(false);
    //   }
    // };

  const isOutOfCredits = typeof remainingCredits === 'number' && remainingCredits < requiredCredits;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-full ${isOutOfCredits ? 'bg-red-100 dark:bg-red-900/20' : 'bg-yellow-100 dark:bg-yellow-900/20'}`}>
              <AlertTriangle className={`w-8 h-8 ${isOutOfCredits ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-3 text-gray-900 dark:text-white">
            {isOutOfCredits ? 'Out of Credits!' : 'Low Credits Warning'}
          </h2>

          {/* Message */}
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
            {isOutOfCredits ? (
              <>
                You need <span className="font-semibold text-red-600 dark:text-red-400">{requiredCredits} credits</span> to generate a quiz, 
                but you only have <span className="font-semibold">{remainingCredits} credits</span> remaining.
              </>
            ) : (
              <>
                You have <span className="font-semibold text-yellow-600 dark:text-yellow-400">{remainingCredits} credits</span> remaining. 
                This action requires <span className="font-semibold">{requiredCredits} credits</span>.
              </>
            )}
          </p>

          {/* Current Plan */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Plan</span>
              <span className="font-semibold text-gray-900 dark:text-white capitalize">
                {currentTier}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Credits Remaining</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {typeof remainingCredits === 'number' ? remainingCredits : '∞'}
              </span>
            </div>
          </div>

          {/* Upgrade Options - COMMENTED OUT */}
          {/* {currentTier === 'starter' && (
            <div className="space-y-3 mb-6">
              <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Pro Plan</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      500 credits/month + all premium features
                    </p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">$9.99/month</p>
                  </div>
                </div>
              </div>

              <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Unlimited Plan</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Unlimited credits + priority support
                    </p>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">$19.99/month</p>
                  </div>
                </div>
              </div>
            </div>
          )} */}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              // onClick={handleUpgrade}
              onClick={onClose}
              // disabled={isUpgrading}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* {isUpgrading ? 'Loading...' : 'Upgrade Now'} */}
              Got it
            </button>
          </div>

          {/* Note */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
            Credits reset monthly. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
