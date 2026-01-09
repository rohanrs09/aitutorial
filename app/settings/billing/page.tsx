'use client';

import Link from 'next/link';
import { ArrowLeft, CreditCard } from 'lucide-react';

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/settings" className="p-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-lg font-semibold text-white">Billing</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <section className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-surface-lighter flex items-center justify-center">
              <CreditCard size={18} className="text-gray-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Subscription & Payments</h2>
              <p className="text-gray-500 text-sm">Upgrade, cancel, and manage billing.</p>
            </div>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-white font-medium mb-1">Billing is not enabled yet</p>
            <p className="text-gray-500 text-sm mb-4">
              Next step: integrate Clerk Billing (or Stripe) and connect it to your Supabase user profile.
            </p>
            <Link href="/#pricing" className="btn-primary text-sm w-full justify-center">
              View Pricing
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
