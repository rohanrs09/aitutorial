'use client';

/**
 * DASHBOARD HEADER - Modern, Clean Header
 * 
 * Purpose: Consistent header across dashboard with user info and actions
 * Uses proper shadcn/ui components
 */

import Link from 'next/link';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/separator';

interface DashboardHeaderProps {
  userName: string;
  greeting: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  userButton: React.ReactNode;
}

export function DashboardHeader({ 
  userName, 
  greeting, 
  onRefresh, 
  isRefreshing,
  userButton 
}: DashboardHeaderProps) {
  return (
    <div className="sticky top-0 z-40 w-full border-b bg-gray-900/95 backdrop-blur-xl border-orange-500/20 shadow-lg shadow-orange-500/5">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Back Button + Greeting */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link href="/" className="p-2 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all flex-shrink-0 border border-transparent hover:border-orange-500/30">
              <ArrowLeft size={20} />
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">
                {greeting}, <span className="text-orange-400">{userName}</span>
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Here&apos;s your learning overview
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="hidden sm:flex hover:bg-orange-500/10 hover:text-orange-400 border border-transparent hover:border-orange-500/30 transition-all"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-orange-400' : ''} />
              <span className="ml-2">Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="sm:hidden hover:bg-orange-500/10 hover:text-orange-400"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-orange-400' : ''} />
            </Button>
            <Separator orientation="vertical" className="h-6 hidden sm:block bg-orange-500/20" />
            {userButton}
          </div>
        </div>
      </div>
    </div>
  );
}
