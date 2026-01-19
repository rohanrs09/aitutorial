'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the main settings component
const SettingsPage = dynamic(() => import('../page').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
    </div>
  )
});

export default function DynamicSettingsPage() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // For any settings sub-route, just show the main settings
    if (pathname !== '/settings') {
      console.log('[Dynamic Settings] Redirecting sub-route to main settings:', pathname);
      router.replace('/settings');
    }
  }, [router, pathname]);

  return <SettingsPage />;
}
