'use client';

import { motion } from 'framer-motion';
import { LucideIcon, FileQuestion, Inbox, Search, FolderOpen, BookOpen, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MotionButton } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'subtle' | 'card';
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  size = 'md',
  variant = 'default',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-6 px-4',
      icon: 'w-10 h-10',
      iconWrapper: 'w-14 h-14',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'py-8 sm:py-12 px-4 sm:px-6',
      icon: 'w-8 h-8 sm:w-10 sm:h-10',
      iconWrapper: 'w-16 h-16 sm:w-20 sm:h-20',
      title: 'text-lg sm:text-xl',
      description: 'text-sm sm:text-base',
    },
    lg: {
      container: 'py-12 sm:py-16 px-6 sm:px-8',
      icon: 'w-12 h-12 sm:w-14 sm:h-14',
      iconWrapper: 'w-20 h-20 sm:w-24 sm:h-24',
      title: 'text-xl sm:text-2xl',
      description: 'text-base sm:text-lg',
    },
  };

  const variantClasses = {
    default: 'bg-transparent',
    subtle: 'bg-white/5 rounded-2xl border border-white/5',
    card: 'bg-surface-light rounded-2xl border border-white/10 shadow-lg',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeClasses[size].container,
        variantClasses[variant],
        className
      )}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className={cn(
          'flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/10 to-pink-500/10 border border-primary-500/20 mb-4 sm:mb-6',
          sizeClasses[size].iconWrapper
        )}
      >
        <Icon className={cn('text-primary-400', sizeClasses[size].icon)} />
      </motion.div>

      {/* Title */}
      <h3 className={cn('font-semibold text-white mb-2', sizeClasses[size].title)}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={cn('text-gray-400 max-w-md mb-6', sizeClasses[size].description)}>
          {description}
        </p>
      )}

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {actionLabel && onAction && (
            <MotionButton
              variant="primary"
              size={size === 'sm' ? 'sm' : 'md'}
              onClick={onAction}
              leftIcon={ActionIcon && <ActionIcon size={18} />}
            >
              {actionLabel}
            </MotionButton>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <MotionButton
              variant="ghost"
              size={size === 'sm' ? 'sm' : 'md'}
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </MotionButton>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Pre-built empty state variants

export function NoSessionsEmpty({ onStartSession }: { onStartSession?: () => void }) {
  return (
    <EmptyState
      icon={BookOpen}
      title="No learning sessions yet"
      description="Start your first voice learning session to see your progress here."
      actionLabel="Start Learning"
      actionIcon={Play}
      onAction={onStartSession}
      variant="subtle"
    />
  );
}

export function NoResultsEmpty({ query, onClear }: { query?: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={query ? `We couldn't find anything matching "${query}". Try adjusting your search.` : 'Try adjusting your search or filters.'}
      actionLabel="Clear Search"
      onAction={onClear}
      size="sm"
    />
  );
}

export function EmptyFolderState({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="No files here"
      description="Upload files or create new content to get started."
      actionLabel="Upload File"
      onAction={onUpload}
    />
  );
}

export function InboxEmpty() {
  return (
    <EmptyState
      icon={Inbox}
      title="You're all caught up!"
      description="No new notifications or messages."
      size="sm"
      variant="subtle"
    />
  );
}

export function NotesEmpty() {
  return (
    <EmptyState
      icon={BookOpen}
      title="No notes yet"
      description="Notes will appear here as you learn. Ask questions or explore topics to generate notes."
      size="sm"
    />
  );
}
