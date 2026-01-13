'use client';

/**
 * StatCard Component
 * 
 * WHY: Reusable stat display for dashboard
 * - Consistent styling across all stat cards
 * - Supports trend indicators
 * - Responsive layout
 * - Clear visual hierarchy
 */

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: string;
    isPositive: boolean;
    icon: ReactNode;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-primary-400',
  trend,
  className,
}: StatCardProps) {
  return (
    <Card variant="elevated" padding="md" className={className}>
      <CardContent>
        <div className="flex items-start justify-between">
          {/* Icon */}
          <div className={cn('p-2 rounded-lg bg-white/5', iconColor)}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Trend indicator */}
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              )}
            >
              {trend.icon}
              <span>{trend.value}</span>
            </div>
          )}
        </div>

        {/* Value and title */}
        <div className="mt-4 space-y-1">
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {value}
          </p>
          <p className="text-sm text-gray-400">
            {title}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
