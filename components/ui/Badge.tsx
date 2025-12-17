'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-surface-lighter text-gray-300',
        primary: 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
        success: 'bg-green-500/20 text-green-400 border border-green-500/30',
        warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
        danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
        info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        outline: 'bg-transparent border border-white/20 text-gray-400',
      },
      size: {
        sm: 'text-xs px-2 py-0.5 rounded',
        md: 'text-xs px-2.5 py-1 rounded-md',
        lg: 'text-sm px-3 py-1.5 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot, dotColor, children, ...props }, ref) => {
    return (
      <span
        className={cn(badgeVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        {dot && (
          <span 
            className={cn(
              'w-1.5 h-1.5 rounded-full mr-1.5',
              dotColor || 'bg-current'
            )} 
          />
        )}
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';

// Status Badge Component
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'away' | 'busy';
  label?: string;
  className?: string;
}

const StatusBadge = ({ status, label, className }: StatusBadgeProps) => {
  const statusConfig = {
    online: { color: 'bg-green-500', label: 'Online' },
    offline: { color: 'bg-gray-500', label: 'Offline' },
    away: { color: 'bg-yellow-500', label: 'Away' },
    busy: { color: 'bg-red-500', label: 'Busy' },
  };

  const config = statusConfig[status];

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-gray-400', className)}>
      <span className={cn('w-2 h-2 rounded-full', config.color)} />
      {label || config.label}
    </span>
  );
};

// Emotion Badge Component
interface EmotionBadgeProps {
  emotion: string;
  className?: string;
}

const EmotionBadge = ({ emotion, className }: EmotionBadgeProps) => {
  const emotionConfig: Record<string, { color: string; emoji: string }> = {
    neutral: { color: 'bg-gray-500', emoji: '😐' },
    happy: { color: 'bg-green-500', emoji: '😊' },
    sad: { color: 'bg-blue-500', emoji: '😢' },
    confused: { color: 'bg-yellow-500', emoji: '🤔' },
    frustrated: { color: 'bg-red-500', emoji: '😤' },
    excited: { color: 'bg-pink-500', emoji: '🤩' },
    curious: { color: 'bg-purple-500', emoji: '🧐' },
    confident: { color: 'bg-green-400', emoji: '😎' },
    bored: { color: 'bg-gray-400', emoji: '😴' },
  };

  const config = emotionConfig[emotion.toLowerCase()] || emotionConfig.neutral;

  return (
    <Badge 
      variant="outline" 
      className={cn('gap-1', className)}
    >
      <span className={cn('w-2 h-2 rounded-full', config.color)} />
      <span className="capitalize">{emotion}</span>
      <span>{config.emoji}</span>
    </Badge>
  );
};

export { Badge, StatusBadge, EmotionBadge, badgeVariants };
