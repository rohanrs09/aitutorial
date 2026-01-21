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
          <div key={i} className="bg-gray-900/80 border border-orange-500/20 rounded-xl p-4">
            <div className="animate-pulse">
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg mb-3" />
              <div className="h-6 bg-orange-500/10 rounded mb-2" />
              <div className="h-4 bg-orange-500/10 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Sessions',
      value: stats.totalSessions,
      icon: MessageSquare,
      iconColor: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500/40',
      glowColor: 'shadow-orange-500/20',
      trend: stats.weeklyProgress,
    },
    {
      title: 'Learning Time',
      value: `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`,
      icon: Clock,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/40',
      glowColor: 'shadow-amber-500/20',
      trend: null,
    },
    {
      title: 'Current Streak',
      value: `${stats.currentStreak} days`,
      icon: Flame,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-600/20',
      borderColor: 'border-orange-600/40',
      glowColor: 'shadow-orange-600/20',
      trend: null,
    },
    {
      title: 'Average Score',
      value: `${stats.averageScore}%`,
      icon: Target,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-600/20',
      borderColor: 'border-amber-600/40',
      glowColor: 'shadow-amber-600/20',
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className={`bg-gray-900/80 border ${card.borderColor} rounded-xl p-4 hover:bg-gray-900/90 transition-all duration-300 hover:shadow-lg ${card.glowColor} group cursor-default`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center border ${card.borderColor} group-hover:scale-110 transition-transform duration-300`}>
              <card.icon size={20} className={card.iconColor} />
            </div>
            {card.trend !== null && card.trend !== 0 && (
              <div className={`flex items-center gap-1 text-xs font-bold ${
                card.trend > 0 ? 'text-orange-400' : 'text-red-400'
              }`}>
                {card.trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{Math.abs(card.trend)}%</span>
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
          <p className="text-xs text-gray-500 font-medium">{card.title}</p>
        </div>
      ))}
    </div>
  );
}
