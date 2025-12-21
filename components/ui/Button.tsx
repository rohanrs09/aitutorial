'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-200 ease-out-expo min-h-touch focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed select-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 active:scale-[0.98] focus-visible:ring-primary-500 shadow-md hover:shadow-lg hover:shadow-primary-500/20',
        secondary: 'bg-surface-lighter text-white hover:bg-surface-light active:bg-surface active:scale-[0.98] focus-visible:ring-white/20 border border-white/10 hover:border-white/20',
        ghost: 'bg-transparent text-gray-400 hover:bg-white/10 hover:text-white active:bg-white/5 active:scale-[0.98] focus-visible:ring-white/20',
        danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 active:scale-[0.98] focus-visible:ring-red-500 shadow-md hover:shadow-lg hover:shadow-red-500/20',
        outline: 'border border-white/20 text-white hover:bg-white/10 hover:border-white/30 active:bg-white/5 active:scale-[0.98] focus-visible:ring-white/20',
        gradient: 'bg-gradient-to-r from-primary-500 to-pink-500 text-white hover:opacity-90 active:opacity-80 active:scale-[0.98] focus-visible:ring-primary-500 shadow-md hover:shadow-lg hover:shadow-primary-500/25',
        success: 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700 active:scale-[0.98] focus-visible:ring-green-500 shadow-md hover:shadow-lg hover:shadow-green-500/20',
      },
      size: {
        xs: 'text-xs px-2.5 py-1 rounded-lg gap-1',
        sm: 'text-sm px-3 py-1.5 rounded-lg gap-1.5',
        md: 'text-sm px-4 py-2 rounded-xl gap-2',
        lg: 'text-base px-6 py-3 rounded-xl gap-2',
        xl: 'text-lg px-8 py-4 rounded-2xl gap-2.5',
        icon: 'w-10 h-10 rounded-xl p-0',
        'icon-sm': 'w-8 h-8 rounded-lg p-0',
        'icon-lg': 'w-12 h-12 rounded-xl p-0',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = 'Button';

// Motion Button for animations
interface MotionButtonProps extends VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ className, variant, size, fullWidth, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </motion.button>
    );
  }
);
MotionButton.displayName = 'MotionButton';

export { Button, MotionButton, buttonVariants };
