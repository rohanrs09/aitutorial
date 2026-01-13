'use client';

/**
 * PageContainer Component
 * 
 * WHY: Provides consistent page layout and spacing
 * - Responsive padding (mobile-first)
 * - Max-width for readability on large screens
 * - Proper vertical spacing
 * - Full height support for learn pages
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  fullHeight?: boolean;
  noPadding?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

export function PageContainer({
  children,
  className,
  maxWidth = 'xl',
  fullHeight = false,
  noPadding = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'w-full mx-auto',
        maxWidthClasses[maxWidth],
        fullHeight ? 'h-full' : 'min-h-screen',
        !noPadding && 'px-4 py-6 sm:px-6 sm:py-8 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * PageSection Component
 * 
 * WHY: Provides consistent section spacing within pages
 * - Proper vertical rhythm
 * - Optional titles and descriptions
 * - Responsive spacing
 */

interface PageSectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  headerAction?: ReactNode;
}

export function PageSection({
  children,
  title,
  description,
  className,
  headerAction,
}: PageSectionProps) {
  return (
    <section className={cn('space-y-4 sm:space-y-6', className)}>
      {(title || description || headerAction) && (
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            {title && (
              <h2 className="text-xl sm:text-2xl font-semibold text-white">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-gray-400">
                {description}
              </p>
            )}
          </div>
          {headerAction && (
            <div className="shrink-0">
              {headerAction}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
