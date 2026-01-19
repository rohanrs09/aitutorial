'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the main dashboard component
const DashboardPage = dynamic(() => import('../page').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
    </div>
  )
});

export default function DynamicDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // For any dashboard sub-route, just show the main dashboard
    // This handles /dashboard/bk, /dashboard/analytics, etc.
    if (pathname !== '/dashboard') {
      console.log('[Dynamic Dashboard] Redirecting sub-route to main dashboard:', pathname);
      router.replace('/dashboard');
    }
  }, [router, pathname]);

  return <DashboardPage />;
}
