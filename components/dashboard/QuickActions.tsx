'use client';

/**
 * QUICK ACTIONS - Primary CTAs for Dashboard
 * 
 * Purpose: Main actions user can take from dashboard
 * Uses proper shadcn/ui components with modern design
 */

import Link from 'next/link';
import { Play, BookOpen, TrendingUp, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

const actions = [
  {
    href: '/courses',
    icon: Play,
    title: 'Continue Learning',
    description: 'Pick up where you left off',
    gradient: 'from-orange-500 to-amber-500',
    borderColor: 'border-orange-500/40',
    glowColor: 'shadow-orange-500/30',
    primary: true,
  },
  {
    href: '/courses',
    icon: BookOpen,
    title: 'Browse Courses',
    description: 'Explore new topics',
    gradient: 'from-amber-500 to-orange-400',
    borderColor: 'border-amber-500/30',
    glowColor: 'shadow-amber-500/20',
  },
  {
    href: '/dashboard',
    icon: TrendingUp,
    title: 'View Analytics',
    description: 'Track your progress',
    gradient: 'from-orange-600 to-red-500',
    borderColor: 'border-orange-600/30',
    glowColor: 'shadow-orange-600/20',
  },
  {
    href: '/settings',
    icon: Settings,
    title: 'Settings',
    description: 'Customize your experience',
    gradient: 'from-gray-500 to-gray-600',
    borderColor: 'border-gray-500/30',
    glowColor: 'shadow-gray-500/10',
  },
];

export function QuickActions() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <Link key={index} href={action.href}>
          <div 
            className={`bg-gray-900/80 border ${action.borderColor} rounded-xl p-4 hover:bg-gray-900/90 transition-all duration-300 hover:shadow-lg ${action.glowColor} group h-full ${action.primary ? 'ring-1 ring-orange-500/30' : ''}`}
          >
            <div className="flex flex-col gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg ${action.glowColor}`}>
                <action.icon size={24} className="text-gray-900" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1 group-hover:text-orange-400 transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs text-gray-500">
                  {action.description}
                </p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
