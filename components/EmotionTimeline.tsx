'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { 
  getSessionEmotionHistory, 
  getEmotionTimeline, 
  calculateLearningEffectiveness,
  type TimelineDataPoint 
} from '@/lib/emotion-analytics';

interface EmotionTimelineProps {
  sessionId: string;
  className?: string;
}

const EMOTION_COLORS: Record<string, string> = {
  engaged: '#10b981',
  curious: '#8b5cf6',
  confident: '#3b82f6',
  concentrating: '#6366f1',
  neutral: '#6b7280',
  confused: '#f59e0b',
  frustrated: '#ef4444',
  bored: '#64748b',
  tired: '#94a3b8',
  stressed: '#dc2626',
  excited: '#ec4899',
  happy: '#22c55e',
};

const EMOTION_ICONS: Record<string, string> = {
  engaged: '🎯',
  curious: '🤔',
  confident: '💪',
  concentrating: '🧠',
  neutral: '😐',
  confused: '😕',
  frustrated: '😤',
  bored: '😴',
  tired: '🥱',
  stressed: '😰',
  excited: '🤩',
  happy: '😊',
};

export default function EmotionTimeline({ sessionId, className = '' }: EmotionTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineDataPoint[]>([]);
  const [effectiveness, setEffectiveness] = useState<number>(50);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
    const interval = setInterval(loadTimeline, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, [sessionId]);

  const loadTimeline = () => {
    const events = getSessionEmotionHistory(sessionId);
    if (events.length > 0) {
      const timelineData = getEmotionTimeline(events, 5); // 5-minute intervals
      setTimeline(timelineData);
      setEffectiveness(calculateLearningEffectiveness(events));
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className={`bg-surface/50 backdrop-blur-sm rounded-xl p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/3"></div>
          <div className="h-32 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className={`bg-surface/50 backdrop-blur-sm rounded-xl p-6 ${className}`}>
        <div className="text-center text-gray-400">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No emotion data yet. Start learning to see your emotional journey!</p>
        </div>
      </div>
    );
  }

  const getEffectivenessColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getEffectivenessIcon = (score: number) => {
    if (score >= 70) return <TrendingUp className="w-5 h-5" />;
    if (score >= 50) return <Minus className="w-5 h-5" />;
    return <TrendingDown className="w-5 h-5" />;
  };

  return (
    <div className={`bg-surface/50 backdrop-blur-sm rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Emotion Timeline</h3>
          <p className="text-sm text-gray-400">Your emotional journey during this session</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 ${getEffectivenessColor(effectiveness)}`}>
            {getEffectivenessIcon(effectiveness)}
            <div>
              <div className="text-xs text-gray-400">Effectiveness</div>
              <div className="text-xl font-bold">{effectiveness}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {timeline.map((point, index) => {
          const color = EMOTION_COLORS[point.emotion] || EMOTION_COLORS.neutral;
          const icon = EMOTION_ICONS[point.emotion] || '😐';
          const timeStr = point.timestamp.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4"
            >
              {/* Time */}
              <div className="text-xs text-gray-500 w-16 text-right">{timeStr}</div>

              {/* Emotion Indicator */}
              <div className="flex items-center gap-3 flex-1">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${color}20`, border: `2px solid ${color}` }}
                >
                  {icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white capitalize">
                      {point.emotion}
                    </span>
                    <span className="text-xs text-gray-400">
                      {Math.round(point.confidence * 100)}% confidence
                    </span>
                  </div>
                  
                  {/* Effectiveness Bar */}
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${point.effectiveness}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </div>

                {/* Effectiveness Score */}
                <div className="text-sm font-semibold" style={{ color }}>
                  {point.effectiveness}%
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="text-xs text-gray-400 mb-2">Emotion Guide:</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(EMOTION_COLORS).slice(0, 6).map(([emotion, color]) => (
            <div key={emotion} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-gray-400 capitalize">{emotion}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
