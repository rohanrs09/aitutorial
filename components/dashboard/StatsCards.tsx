'use client';

/**
 * STATS CARDS COMPONENT
 * 
 * Purpose: Display key metrics in card format
 * - Total sessions, minutes, streak, average score
 * - Shows progress indicators (weekly/monthly change)
 * - Responsive grid layout
 * 
 * WHY: Quick overview of user's learning progress at a glance
 */

import { MessageSquare, Clock, Flame, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import type { DashboardStats } from '@/lib/dashboard-service';

interface StatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} variant="elevated" padding="md">
            <CardContent>
              <div className="animate-pulse">
                <div className="w-10 h-10 bg-surface-lighter rounded-lg mb-3" />
                <div className="h-6 bg-surface-lighter rounded mb-2" />
                <div className="h-4 bg-surface-lighter rounded w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Sessions',
      value: stats.totalSessions,
      icon: MessageSquare,
      iconColor: 'text-primary-400',
      bgColor: 'bg-primary-500/10',
      trend: stats.weeklyProgress,
    },
    {
      title: 'Learning Time',
      value: `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`,
      icon: Clock,
      iconColor: 'text-green-400',
      bgColor: 'bg-green-500/10',
      trend: null,
    },
    {
      title: 'Current Streak',
      value: `${stats.currentStreak} days`,
      icon: Flame,
      iconColor: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      trend: null,
    },
    {
      title: 'Average Score',
      value: `${stats.averageScore}%`,
      icon: Target,
      iconColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} variant="elevated" padding="md" hover>
          <CardContent>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <card.icon size={20} className={card.iconColor} />
              </div>
              {card.trend !== null && card.trend !== 0 && (
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  card.trend > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {card.trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>{Math.abs(card.trend)}%</span>
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
            <p className="text-xs text-gray-400">{card.title}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
