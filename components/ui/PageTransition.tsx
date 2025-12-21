'use client';

import { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { prefersReducedMotion } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  mode?: 'fade' | 'slide' | 'scale' | 'none';
}

const transitionVariants: Record<string, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  },
  none: {
    initial: {},
    animate: {},
    exit: {},
  },
};

export function PageTransition({ 
  children, 
  className,
  mode = 'slide' 
}: PageTransitionProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    setMounted(true);
    setShouldAnimate(!prefersReducedMotion());
  }, []);

  // Don't animate on first mount to avoid flash
  if (!mounted) {
    return <div className={className}>{children}</div>;
  }

  const activeMode = shouldAnimate ? mode : 'none';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        className={className}
        variants={transitionVariants[activeMode]}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration: shouldAnimate ? 0.25 : 0,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Simple fade transition for modals/overlays
interface FadeTransitionProps {
  show: boolean;
  children: ReactNode;
  className?: string;
  duration?: number;
}

export function FadeTransition({ 
  show, 
  children, 
  className,
  duration = 0.2 
}: FadeTransitionProps) {
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    setShouldAnimate(!prefersReducedMotion());
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={className}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldAnimate ? duration : 0 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Slide up transition for bottom sheets/panels
interface SlideUpTransitionProps {
  show: boolean;
  children: ReactNode;
  className?: string;
}

export function SlideUpTransition({ 
  show, 
  children, 
  className 
}: SlideUpTransitionProps) {
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    setShouldAnimate(!prefersReducedMotion());
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={className}
          initial={shouldAnimate ? { opacity: 0, y: 50 } : { opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldAnimate ? { opacity: 0, y: 50 } : { opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 300,
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Staggered children animation
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ 
  children, 
  className,
  staggerDelay = 0.05 
}: StaggerContainerProps) {
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    setShouldAnimate(!prefersReducedMotion());
  }, []);

  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={{
        animate: {
          transition: {
            staggerChildren: shouldAnimate ? staggerDelay : 0,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Stagger child item
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        initial: { opacity: 0, y: 20 },
        animate: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.3,
            ease: [0.25, 0.1, 0.25, 1],
          }
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Scale animation for modals
interface ScaleTransitionProps {
  show: boolean;
  children: ReactNode;
  className?: string;
}

export function ScaleTransition({ 
  show, 
  children, 
  className 
}: ScaleTransitionProps) {
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    setShouldAnimate(!prefersReducedMotion());
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={className}
          initial={shouldAnimate ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={shouldAnimate ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
          transition={{
            duration: 0.2,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Loading overlay with fade
interface LoadingOverlayProps {
  show: boolean;
  message?: string;
}

export function LoadingOverlay({ show, message }: LoadingOverlayProps) {
  return (
    <FadeTransition show={show}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          {message && (
            <p className="text-sm text-gray-400">{message}</p>
          )}
        </div>
      </div>
    </FadeTransition>
  );
}
