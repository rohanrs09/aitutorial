'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X, 
  TrendingUp,
  Brain,
  Clock,
  Target
} from 'lucide-react';
import { 
  getSessionEmotionHistory, 
  analyzeEmotionPatterns, 
  generateEmotionInsights,
  getRecommendedActions,
  type EmotionInsight,
  type EmotionPattern
} from '@/lib/emotion-analytics';

interface EmotionInsightsProps {
  sessionId: string;
  currentEmotion?: string;
  currentConfidence?: number;
  sessionDuration?: number;
  className?: string;
}

export default function EmotionInsights({ 
  sessionId, 
  currentEmotion,
  currentConfidence,
  sessionDuration = 0,
  className = '' 
}: EmotionInsightsProps) {
  const [insights, setInsights] = useState<EmotionInsight[]>([]);
  const [patterns, setPatterns] = useState<EmotionPattern[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadInsights();
    const interval = setInterval(loadInsights, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    if (currentEmotion && currentConfidence) {
      const actions = getRecommendedActions(currentEmotion, currentConfidence, {
        timeOfDay: getTimeOfDay(),
        sessionDuration,
        topicDifficulty: 'intermediate',
        consecutiveCount: 1,
        activityType: 'learning',
      });
      setRecommendations(actions);
    }
  }, [currentEmotion, currentConfidence, sessionDuration]);

  const loadInsights = () => {
    const events = getSessionEmotionHistory(sessionId);
    if (events.length > 0) {
      const emotionPatterns = analyzeEmotionPatterns(events, 7);
      const generatedInsights = generateEmotionInsights(emotionPatterns);
      setPatterns(emotionPatterns);
      setInsights(generatedInsights.filter(i => !dismissedInsights.has(i.title)));
    }
  };

  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  const dismissInsight = (title: string) => {
    setDismissedInsights(prev => new Set([...prev, title]));
    setInsights(prev => prev.filter(i => i.title !== title));
  };

  const getInsightIcon = (type: EmotionInsight['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
    }
  };

  const getInsightColor = (type: EmotionInsight['type']) => {
    switch (type) {
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'success':
        return 'border-green-500/30 bg-green-500/10';
      case 'info':
        return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  const getInsightTextColor = (type: EmotionInsight['type']) => {
    switch (type) {
      case 'warning':
        return 'text-yellow-400';
      case 'success':
        return 'text-green-400';
      case 'info':
        return 'text-blue-400';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Recommendations */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-purple-400" />
            <h4 className="font-semibold text-white">Recommended Actions</h4>
          </div>
          <ul className="space-y-2">
            {recommendations.map((action, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2 text-sm text-gray-300"
              >
                <span className="text-purple-400 mt-0.5">•</span>
                <span>{action}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Insights */}
      <AnimatePresence>
        {insights.map((insight, index) => (
          <motion.div
            key={insight.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ delay: index * 0.1 }}
            className={`border rounded-xl p-4 ${getInsightColor(insight.type)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className={getInsightTextColor(insight.type)}>
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold mb-1 ${getInsightTextColor(insight.type)}`}>
                    {insight.title}
                  </h4>
                  <p className="text-sm text-gray-300 mb-2">{insight.description}</p>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">💡 Recommendation:</div>
                    <p className="text-sm text-white">{insight.recommendation}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => dismissInsight(insight.title)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Patterns Summary */}
      {patterns.length > 0 && (
        <div className="bg-surface/50 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-violet-400" />
            <h4 className="font-semibold text-white">Emotion Patterns (Last 7 Days)</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {patterns.slice(0, 4).map((pattern) => (
              <div key={pattern.emotion} className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white capitalize">
                    {pattern.emotion}
                  </span>
                  <span className="text-xs text-gray-400">
                    {pattern.frequency}x
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full"
                      style={{ width: `${pattern.averageConfidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {Math.round(pattern.averageConfidence * 100)}%
                  </span>
                </div>
                {pattern.trend !== 'stable' && (
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    {pattern.trend === 'increasing' ? (
                      <>
                        <TrendingUp className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">Increasing</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />
                        <span className="text-red-400">Decreasing</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session Duration Warning */}
      {sessionDuration > 45 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-400" />
            <div>
              <h4 className="font-semibold text-orange-400 mb-1">Long Session Detected</h4>
              <p className="text-sm text-gray-300">
                You've been learning for {sessionDuration} minutes. Consider taking a 5-10 minute break to maintain focus.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
