'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: TooltipPosition;
  delay?: number;
  className?: string;
  disabled?: boolean;
  showArrow?: boolean;
  maxWidth?: number;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  className,
  disabled = false,
  showArrow = true,
  maxWidth = 250,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Adjust position if tooltip would overflow viewport
  useEffect(() => {
    if (isVisible && tooltipRef.current && containerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      let newPosition = position;
      
      if (position === 'top' && tooltipRect.top < 0) {
        newPosition = 'bottom';
      } else if (position === 'bottom' && tooltipRect.bottom > window.innerHeight) {
        newPosition = 'top';
      } else if (position === 'left' && tooltipRect.left < 0) {
        newPosition = 'right';
      } else if (position === 'right' && tooltipRect.right > window.innerWidth) {
        newPosition = 'left';
      }
      
      if (newPosition !== actualPosition) {
        setActualPosition(newPosition);
      }
    }
  }, [isVisible, position, actualPosition]);

  const positionClasses: Record<TooltipPosition, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses: Record<TooltipPosition, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-700 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-700 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-700 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-700 border-t-transparent border-b-transparent border-l-transparent',
  };

  const motionVariants = {
    initial: {
      opacity: 0,
      scale: 0.95,
      y: actualPosition === 'top' ? 4 : actualPosition === 'bottom' ? -4 : 0,
      x: actualPosition === 'left' ? 4 : actualPosition === 'right' ? -4 : 0,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
    },
  };

  return (
    <div 
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            ref={tooltipRef}
            role="tooltip"
            className={cn(
              'absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg pointer-events-none whitespace-normal',
              positionClasses[actualPosition],
              className
            )}
            style={{ maxWidth }}
            variants={motionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.15 }}
          >
            {content}
            
            {showArrow && (
              <div 
                className={cn(
                  'absolute w-0 h-0 border-4',
                  arrowClasses[actualPosition]
                )}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Guided tooltip for onboarding/tutorials
interface GuidedTooltipProps extends Omit<TooltipProps, 'children'> {
  children: ReactNode;
  step?: number;
  totalSteps?: number;
  onNext?: () => void;
  onSkip?: () => void;
  isOpen?: boolean;
}

export function GuidedTooltip({
  content,
  children,
  position = 'bottom',
  step,
  totalSteps,
  onNext,
  onSkip,
  isOpen = false,
  className,
  maxWidth = 280,
  ...props
}: GuidedTooltipProps) {
  const positionClasses: Record<TooltipPosition, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
    left: 'right-full top-1/2 -translate-y-1/2 mr-3',
    right: 'left-full top-1/2 -translate-y-1/2 ml-3',
  };

  return (
    <div className="relative inline-flex">
      {children}
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={cn(
              'absolute z-50 p-4 bg-primary-500 text-white rounded-xl shadow-xl shadow-primary-500/25',
              positionClasses[position],
              className
            )}
            style={{ maxWidth }}
          >
            <div className="text-sm leading-relaxed mb-3">{content}</div>
            
            <div className="flex items-center justify-between">
              {step !== undefined && totalSteps !== undefined && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-1.5 h-1.5 rounded-full transition-colors',
                        i === step ? 'bg-white' : 'bg-white/40'
                      )}
                    />
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-2 ml-auto">
                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="text-xs text-white/70 hover:text-white transition-colors"
                  >
                    Skip
                  </button>
                )}
                {onNext && (
                  <button
                    onClick={onNext}
                    className="px-3 py-1 text-xs font-medium bg-white text-primary-600 rounded-lg hover:bg-white/90 transition-colors"
                  >
                    {step !== undefined && totalSteps !== undefined && step === totalSteps - 1 ? 'Got it!' : 'Next'}
                  </button>
                )}
              </div>
            </div>
            
            {/* Arrow */}
            <div 
              className={cn(
                'absolute w-3 h-3 bg-primary-500 rotate-45',
                position === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1.5',
                position === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1.5',
                position === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1.5',
                position === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1.5'
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Shortcut hint component
interface ShortcutHintProps {
  keys: string[];
  className?: string;
}

export function ShortcutHint({ keys, className }: ShortcutHintProps) {
  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      {keys.map((key, index) => (
        <span key={index}>
          <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-800 border border-gray-600 rounded text-gray-300">
            {key}
          </kbd>
          {index < keys.length - 1 && <span className="text-gray-500 mx-0.5">+</span>}
        </span>
      ))}
    </div>
  );
}

// Combined tooltip with shortcut hint
export function TooltipWithShortcut({
  content,
  shortcut,
  children,
  ...props
}: TooltipProps & { shortcut?: string[] }) {
  return (
    <Tooltip
      {...props}
      content={
        <div className="flex items-center gap-2">
          <span>{content}</span>
          {shortcut && <ShortcutHint keys={shortcut} />}
        </div>
      }
    >
      {children}
    </Tooltip>
  );
}
