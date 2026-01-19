'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Custom404() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 Number */}
        <div className="text-6xl font-bold text-gray-600 mb-4">404</div>
        
        {/* Error Message */}
        <h1 className="text-2xl font-semibold text-white mb-2">Page Not Found</h1>
        <p className="text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto">
              <Home size={16} className="mr-2" />
              Go Home
            </Button>
          </Link>
          
          <Link href="/courses">
            <Button variant="outline" className="w-full sm:w-auto border-white/20 hover:bg-white/10">
              Browse Courses
            </Button>
          </Link>
        </div>
        
        {/* Back Link */}
        <div className="mt-8">
          <Link href="/" className="text-gray-500 hover:text-white text-sm inline-flex items-center gap-1">
            <ArrowLeft size={14} />
            Back to previous page
          </Link>
        </div>
      </div>
    </div>
  );
}
