'use client';

/**
 * EMOTION DISTRIBUTION CHART
 * 
 * Purpose: Show emotion distribution during learning sessions
 * - Pie chart with emotion percentages
 * - Color-coded by emotion type
 * 
 * WHY: Helps users understand their emotional engagement patterns
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent } from '@/components/ui/Card';
import type { EmotionDistribution } from '@/lib/dashboard-service';

interface EmotionChartProps {
  data: EmotionDistribution[];
  isLoading?: boolean;
}

const EMOTION_COLORS: Record<string, string> = {
  'Engaged': '#10b981',
  'Curious': '#8b5cf6',
  'Confused': '#f59e0b',
  'Confident': '#3b82f6',
  'Neutral': '#6b7280',
};

export function EmotionChart({ data, isLoading }: EmotionChartProps) {
  if (isLoading) {
    return (
      <Card variant="elevated" padding="md">
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading emotion data...</p>
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
            <p className="text-gray-400">No emotion data yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(d => ({
    name: d.emotion,
    value: d.count,
    percentage: d.percentage,
  }));

  return (
    <Card variant="elevated" padding="md">
      <CardContent>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-1">Emotion Insights</h3>
          <p className="text-sm text-gray-400">Your emotional engagement during learning</p>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) => `${entry.name}: ${entry.percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={EMOTION_COLORS[entry.name] || '#6b7280'} 
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a2e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: number | undefined, name?: string, props?: any) => [
                `${value || 0} sessions (${props?.payload?.percentage || 0}%)`,
                name || ''
              ]}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Emotion breakdown list */}
        <div className="mt-4 space-y-2">
          {data.map((emotion, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: EMOTION_COLORS[emotion.emotion] || '#6b7280' }}
                />
                <span className="text-gray-300">{emotion.emotion}</span>
              </div>
              <span className="text-gray-400">{emotion.count} sessions</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
