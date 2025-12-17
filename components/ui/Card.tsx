'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-2xl border transition-all',
  {
    variants: {
      variant: {
        default: 'bg-surface-light border-white/5',
        elevated: 'bg-surface-light border-white/10 shadow-xl',
        ghost: 'bg-transparent border-transparent',
        gradient: 'bg-gradient-to-br from-primary-500/10 to-pink-500/10 border-primary-500/20',
        glass: 'bg-white/5 backdrop-blur-xl border-white/10',
      },
      padding: {
        none: 'p-0',
        sm: 'p-3 sm:p-4',
        md: 'p-4 sm:p-6',
        lg: 'p-6 sm:p-8',
      },
      hover: {
        true: 'hover:border-primary-500/30 hover:shadow-lg cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      hover: false,
    },
  }
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, hover, ...props }, ref) => {
    return (
      <div
        className={cn(cardVariants({ variant, padding, hover, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

// Motion Card for animations
interface MotionCardProps extends VariantProps<typeof cardVariants> {
  children?: React.ReactNode;
  className?: string;
  initial?: HTMLMotionProps<'div'>['initial'];
  animate?: HTMLMotionProps<'div'>['animate'];
  exit?: HTMLMotionProps<'div'>['exit'];
  transition?: HTMLMotionProps<'div'>['transition'];
  whileHover?: HTMLMotionProps<'div'>['whileHover'];
  whileTap?: HTMLMotionProps<'div'>['whileTap'];
  onClick?: () => void;
}

const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
  ({ className, variant, padding, hover, children, ...props }, ref) => {
    return (
      <motion.div
        className={cn(cardVariants({ variant, padding, hover, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
MotionCard.displayName = 'MotionCard';

// Card Header
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn('flex items-center justify-between mb-4', className)}
        ref={ref}
        {...props}
      />
    );
  }
);
CardHeader.displayName = 'CardHeader';

// Card Title
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        className={cn('text-lg font-semibold text-white', className)}
        ref={ref}
        {...props}
      />
    );
  }
);
CardTitle.displayName = 'CardTitle';

// Card Content
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return <div className={cn('', className)} ref={ref} {...props} />;
  }
);
CardContent.displayName = 'CardContent';

// Card Footer
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn('flex items-center justify-end gap-3 mt-4 pt-4 border-t border-white/5', className)}
        ref={ref}
        {...props}
      />
    );
  }
);
CardFooter.displayName = 'CardFooter';

export { Card, MotionCard, CardHeader, CardTitle, CardContent, CardFooter, cardVariants };
