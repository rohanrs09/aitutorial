'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Zap, Crown, Sparkles, ArrowRight, ArrowLeft, Home, AlertTriangle, X } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription/types';
import { useUser } from '@/contexts/AuthContext';
import Link from 'next/link';
import { createPortal } from 'react-dom';

export default function PricingPage() {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<{ show: boolean; title: string; message: string }>({
    show: false, title: '', message: ''
  });

  const showError = (title: string, message: string) => {
    setErrorModal({ show: true, title, message });
    setLoading(null);
  };

  const handleSelectPlan = async (planId: string) => {
    if (!isSignedIn) {
      router.push('/auth/login?redirect=/pricing');
      return;
    }

    if (planId === 'starter') {
      router.push('/dashboard');
      return;
    }

    setLoading(planId);

    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || data.details || 'Something went wrong';
        if (response.status === 503) {
          showError('Payment Not Available', 'The payment system is not configured yet. Please contact support or try again later.');
        } else if (response.status === 401) {
          showError('Authentication Required', 'Please sign in to upgrade your plan.');
        } else {
          showError('Checkout Failed', errorMsg);
        }
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        showError('Checkout Error', 'Could not create a checkout session. Please try again or contact support.');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      showError('Connection Error', 'Unable to connect to the payment server. Please check your internet connection and try again.');
    }
  };

  const plans = [
    {
      ...SUBSCRIPTION_PLANS.starter,
      icon: Sparkles,
      popular: false,
      color: 'from-gray-500 to-gray-600',
      borderColor: 'border-gray-700',
      buttonStyle: 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
    },
    {
      ...SUBSCRIPTION_PLANS.pro,
      icon: Zap,
      popular: true,
      color: 'from-orange-500 to-amber-500',
      borderColor: 'border-orange-500/50',
      buttonStyle: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-lg shadow-orange-500/30'
    },
    {
      ...SUBSCRIPTION_PLANS.unlimited,
      icon: Crown,
      popular: false,
      color: 'from-purple-500 to-pink-500',
      borderColor: 'border-purple-500/50',
      buttonStyle: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-purple-500/30'
    }
  ];

  return (
    <div className="min-h-screen bg-atmospheric relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Mobile-Friendly Header with Navigation */}
      <div className="z-20 border-b border-orange-500/20 bg-gray-900/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-orange-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>

            {/* Title */}
            <h1 className="text-lg sm:text-xl font-bold text-white">
              Choose Your Plan
            </h1>

            {/* Home Button */}
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-orange-400 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 sm:py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-orange-200 to-amber-200 bg-clip-text text-transparent mb-4">
            Choose Your Learning Plan
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Unlock the full potential of AI-powered learning with flexible pricing that grows with you
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = loading === plan.id;
            
            return (
              <div
                key={plan.id}
                className={`relative bg-gray-900/80 backdrop-blur-xl rounded-2xl border ${plan.borderColor} p-8 transition-all hover:scale-105 ${
                  plan.popular ? 'shadow-2xl shadow-orange-500/20' : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-white text-center mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="text-center mb-6">
                  {plan.price === 0 ? (
                    <div className="text-4xl font-bold text-white">Free</div>
                  ) : (
                    <>
                      <div className="text-4xl font-bold text-white">
                        ${(plan.price / 100).toFixed(0)}
                        <span className="text-lg text-gray-400">/month</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Credits Info */}
                <div className="bg-gray-800/50 rounded-xl p-4 mb-6 text-center">
                  <div className="text-sm text-gray-400 mb-1">Monthly Credits</div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                    {plan.credits === -1 ? 'Unlimited' : plan.credits}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrentPlan}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${plan.buttonStyle}`}
                >
                  {isCurrentPlan ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {plan.id === 'starter' ? 'Get Started' : 'Upgrade Now'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            <div className="bg-gray-900/80 backdrop-blur-xl rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                How do credits work?
              </h3>
              <p className="text-gray-400">
                Credits are used for AI interactions. Each voice session uses ~5 credits, slide generation uses 1 credit, and quizzes are free. Credits reset monthly.
              </p>
            </div>

            <div className="bg-gray-900/80 backdrop-blur-xl rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-400">
                Yes! You can cancel your subscription at any time. You&apos;ll continue to have access until the end of your billing period.
              </p>
            </div>

            <div className="bg-gray-900/80 backdrop-blur-xl rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                What happens if I run out of credits?
              </h3>
              <p className="text-gray-400">
                You&apos;ll be prompted to upgrade your plan. Alternatively, wait until your credits reset at the start of your next billing period.
              </p>
            </div>

            <div className="bg-gray-900/80 backdrop-blur-xl rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-400">
                Yes! The Starter plan is completely free with 50 credits per month. No credit card required.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm mb-4">Trusted by learners worldwide</p>
          <div className="flex justify-center items-center gap-8 text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {errorModal.show && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setErrorModal({ show: false, title: '', message: '' })}
          />
          <div className="relative bg-gray-900/95 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-6 mx-4 max-w-sm shadow-2xl shadow-black/50 shadow-orange-500/5 sm:mx-auto sm:max-w-md">
            <button
              onClick={() => setErrorModal({ show: false, title: '', message: '' })}
              className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">
              {errorModal.title}
            </h3>
            <p className="text-sm text-gray-400 text-center mb-6">
              {errorModal.message}
            </p>
            <button
              onClick={() => setErrorModal({ show: false, title: '', message: '' })}
              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 rounded-xl transition-all shadow-lg shadow-orange-500/30"
            >
              Got it
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
