'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Zap, X, ArrowRight } from 'lucide-react';

interface CreditExhaustedModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredCredits?: number;
  remainingCredits?: number;
  actionName?: string;
}

export function CreditExhaustedModal({
  isOpen,
  onClose,
  requiredCredits = 0,
  remainingCredits = 0,
  actionName = 'this action'
}: CreditExhaustedModalProps) {
  const router = useRouter();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleUpgrade = () => {
    onClose();
    router.push('/pricing');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-orange-500/30 max-w-md w-full p-6 relative"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                  Insufficient Credits
                </h2>
                <p className="text-gray-400 mb-4">
                  You need <span className="text-orange-400 font-semibold">{requiredCredits} credits</span> for {actionName}, but you only have{' '}
                  <span className="text-orange-400 font-semibold">{remainingCredits} credits</span> remaining.
                </p>

                {/* Credit Info Box */}
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Required:</span>
                    <span className="text-orange-400 font-semibold">{requiredCredits} credits</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-400">Available:</span>
                    <span className="text-orange-400 font-semibold">{remainingCredits} credits</span>
                  </div>
                  <div className="border-t border-orange-500/30 mt-3 pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Shortage:</span>
                      <span className="text-red-400 font-semibold">{requiredCredits - remainingCredits} credits</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-500">
                  Upgrade your plan to get more credits and continue learning without interruptions.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleUpgrade}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] shadow-lg shadow-orange-500/30"
                >
                  <Zap className="w-5 h-5" />
                  Upgrade Now
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={onClose}
                  className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-all border border-gray-700"
                >
                  Maybe Later
                </button>
              </div>

              {/* Footer Note */}
              <p className="text-xs text-center text-gray-500 mt-4">
                💡 Pro tip: Unlimited plan gives you unlimited credits!
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CreditExhaustedModal;
