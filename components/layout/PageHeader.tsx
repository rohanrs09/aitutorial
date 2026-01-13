'use client';

/**
 * PageHeader Component
 * 
 * WHY: Provides consistent navigation header across all pages
 * - Fixed position for easy access
 * - Responsive layout (mobile/desktop)
 * - Clear visual separation from content
 * - Proper z-index for overlays
 */

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  transparent?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = 'Back',
  actions,
  children,
  className,
  transparent = false,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b transition-colors',
        transparent
          ? 'bg-background/80 backdrop-blur-lg border-white/5'
          : 'bg-surface border-white/10',
        className
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Back button or title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {backHref && (
              <Link href={backHref}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0"
                  aria-label={backLabel}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            )}
            
            {(title || subtitle) && (
              <div className="min-w-0 flex-1">
                {title && (
                  <h1 className="text-lg font-semibold text-white truncate">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm text-gray-400 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            
            {children}
          </div>

          {/* Right: Actions */}
          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
