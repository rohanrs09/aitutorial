'use client';

/**
 * ACTIVITY CHART COMPONENT
 * 
 * Purpose: Visualize user learning activity over time
 * - Line chart showing sessions, minutes, and scores
 * - Uses recharts for production-grade charts
 * - Responsive design
 * 
 * WHY: Users need to see their learning patterns and progress visually
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '@/components/ui/Card';
import type { ActivityData } from '@/lib/dashboard-service';

interface ActivityChartProps {
  data: ActivityData[];
  isLoading?: boolean;
}

export function ActivityChart({ data, isLoading }: ActivityChartProps) {
  if (isLoading) {
    return (
      <Card variant="elevated" padding="md">
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading activity data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card variant="elevated" padding="md">
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-gray-400">No activity data yet. Start learning to see your progress!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format date for display (e.g., "Mon 13")
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = date.getDate();
    return `${day} ${dayNum}`;
  };

  const chartData = data.map(d => ({
    date: formatDate(d.date),
    sessions: d.sessions,
    minutes: d.minutes,
    score: d.score,
  }));

  return (
    <Card variant="elevated" padding="md">
      <CardContent>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-1">Weekly Activity</h3>
          <p className="text-sm text-gray-400">Your learning activity over the last 7 days</p>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a2e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
            />
            <Line 
              type="monotone" 
              dataKey="sessions" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Sessions"
            />
            <Line 
              type="monotone" 
              dataKey="minutes" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              name="Minutes"
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
              name="Avg Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
