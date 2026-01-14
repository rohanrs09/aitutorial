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
    gradient: 'from-primary-500 to-pink-500',
    primary: true,
  },
  {
    href: '/courses',
    icon: BookOpen,
    title: 'Browse Courses',
    description: 'Explore new topics',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    href: '/dashboard',
    icon: TrendingUp,
    title: 'View Analytics',
    description: 'Track your progress',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    href: '/settings',
    icon: Settings,
    title: 'Settings',
    description: 'Customize your experience',
    gradient: 'from-purple-500 to-violet-500',
  },
];

export function QuickActions() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <Link key={index} href={action.href}>
          <Card 
            variant={action.primary ? 'gradient' : 'elevated'} 
            padding="md" 
            hover 
            className="group h-full"
          >
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                  <action.icon size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {action.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
