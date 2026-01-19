'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CatchAllPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to home page for any undefined routes
    router.replace('/');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p className="text-gray-600">Taking you to the home page...</p>
      </div>
    </div>
  );
}
