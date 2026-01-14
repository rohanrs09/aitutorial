'use client';

/**
 * TOPIC PROGRESS COMPONENT
 * 
 * Purpose: Show progress across different topics
 * - Bar chart or list view of topics
 * - Sessions count, time spent, average score
 * 
 * WHY: Users want to see which topics they're focusing on and improving in
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { TopicProgress as TopicProgressType } from '@/lib/dashboard-service';

interface TopicProgressProps {
  topics: TopicProgressType[];
  isLoading?: boolean;
}

export function TopicProgress({ topics, isLoading }: TopicProgressProps) {
  if (isLoading) {
    return (
      <Card variant="elevated" padding="md">
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading topic data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!topics || topics.length === 0) {
    return (
      <Card variant="elevated" padding="md">
        <CardContent>
          <h3 className="text-lg font-semibold text-white mb-4">Topic Progress</h3>
          <div className="text-center py-8">
            <p className="text-gray-400">No topics practiced yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = topics.map(t => ({
    name: t.topicName.length > 15 ? t.topicName.substring(0, 15) + '...' : t.topicName,
    sessions: t.sessionsCount,
    score: t.averageScore,
  }));

  return (
    <Card variant="elevated" padding="md">
      <CardContent>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-1">Topic Progress</h3>
          <p className="text-sm text-gray-400">Your most practiced topics</p>
        </div>
        
        {/* Bar Chart */}
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af"
              style={{ fontSize: '11px' }}
              angle={-45}
              textAnchor="end"
              height={80}
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
            <Bar dataKey="sessions" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Topic List */}
        <div className="mt-6 space-y-3">
          {topics.map((topic, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-surface rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate mb-1">
                  {topic.topicName}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{topic.sessionsCount} sessions</span>
                  <span>•</span>
                  <span>{Math.floor(topic.totalMinutes / 60)}h {topic.totalMinutes % 60}m</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge 
                  variant={topic.averageScore >= 80 ? 'success' : topic.averageScore >= 60 ? 'warning' : 'default'}
                  size="sm"
                >
                  {topic.averageScore}% avg
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
