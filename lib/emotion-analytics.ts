/**
 * ==========================================================
 * EMOTION ANALYTICS ENGINE
 * ==========================================================
 * 
 * Advanced emotion tracking with:
 * - Context awareness (time of day, session duration)
 * - Pattern recognition (recurring emotional states)
 * - Personalized insights and recommendations
 * - Emotion history timeline
 * 
 * ==========================================================
 */

import { supabase, isSupabaseConfigured } from './supabase';

export interface EmotionEvent {
  id: string;
  sessionId: string;
  userId: string | null;
  emotion: string;
  confidence: number;
  timestamp: Date;
  context: EmotionContext;
}

export interface EmotionContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  sessionDuration: number; // minutes
  topicDifficulty: 'beginner' | 'intermediate' | 'advanced';
  consecutiveCount: number; // How many times in a row
  activityType: 'learning' | 'quiz' | 'review';
}

export interface EmotionPattern {
  emotion: string;
  frequency: number;
  averageConfidence: number;
  commonContexts: string[];
  trend: 'increasing' | 'decreasing' | 'stable';
  lastOccurrence: Date;
}

export interface EmotionInsight {
  type: 'warning' | 'success' | 'info';
  title: string;
  description: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

// Emotion weights for learning effectiveness
const EMOTION_WEIGHTS = {
  engaged: 1.0,
  curious: 0.9,
  confident: 0.8,
  concentrating: 0.7,
  neutral: 0.5,
  confused: 0.3,
  frustrated: 0.2,
  bored: 0.1,
};

/**
 * Get time of day context
 */
function getTimeOfDay(): EmotionContext['timeOfDay'] {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Track emotion event with context
 */
export async function trackEmotionEvent(
  sessionId: string,
  emotion: string,
  confidence: number,
  userId: string | null,
  additionalContext?: Partial<EmotionContext>
): Promise<void> {
  const event: EmotionEvent = {
    id: `emotion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sessionId,
    userId,
    emotion,
    confidence,
    timestamp: new Date(),
    context: {
      timeOfDay: getTimeOfDay(),
      sessionDuration: additionalContext?.sessionDuration || 0,
      topicDifficulty: additionalContext?.topicDifficulty || 'intermediate',
      consecutiveCount: additionalContext?.consecutiveCount || 1,
      activityType: additionalContext?.activityType || 'learning',
    },
  };

  // Store in localStorage
  if (typeof window !== 'undefined') {
    const key = `emotion_events_${sessionId}`;
    const stored = localStorage.getItem(key);
    const events = stored ? JSON.parse(stored) : [];
    events.push(event);
    localStorage.setItem(key, JSON.stringify(events));
  }

  // Store in Supabase if configured
  if (isSupabaseConfigured && userId) {
    try {
      await supabase.from('emotion_events').insert({
        session_id: sessionId,
        user_id: userId,
        emotion,
        confidence,
        timestamp: event.timestamp.toISOString(),
        context: event.context,
      });
    } catch (error) {
      console.error('[EmotionAnalytics] Failed to save to Supabase:', error);
    }
  }
}

/**
 * Get emotion history for a session
 */
export function getSessionEmotionHistory(sessionId: string): EmotionEvent[] {
  if (typeof window === 'undefined') return [];
  
  const key = `emotion_events_${sessionId}`;
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  
  try {
    const events = JSON.parse(stored);
    return events.map((e: any) => ({
      ...e,
      timestamp: new Date(e.timestamp),
    }));
  } catch {
    return [];
  }
}

/**
 * Analyze emotion patterns across sessions
 */
export function analyzeEmotionPatterns(
  events: EmotionEvent[],
  windowDays: number = 7
): EmotionPattern[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - windowDays);
  
  const recentEvents = events.filter(e => e.timestamp >= cutoffDate);
  
  // Group by emotion
  const emotionGroups = recentEvents.reduce((acc, event) => {
    if (!acc[event.emotion]) {
      acc[event.emotion] = [];
    }
    acc[event.emotion].push(event);
    return acc;
  }, {} as Record<string, EmotionEvent[]>);
  
  // Analyze each emotion
  const patterns: EmotionPattern[] = Object.entries(emotionGroups).map(([emotion, emotionEvents]) => {
    const sortedEvents = emotionEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const avgConfidence = emotionEvents.reduce((sum, e) => sum + e.confidence, 0) / emotionEvents.length;
    
    // Determine trend (compare first half vs second half)
    const midpoint = Math.floor(emotionEvents.length / 2);
    const firstHalf = emotionEvents.slice(0, midpoint);
    const secondHalf = emotionEvents.slice(midpoint);
    
    const firstAvg = firstHalf.reduce((sum, e) => sum + e.confidence, 0) / (firstHalf.length || 1);
    const secondAvg = secondHalf.reduce((sum, e) => sum + e.confidence, 0) / (secondHalf.length || 1);
    
    let trend: EmotionPattern['trend'] = 'stable';
    if (secondAvg > firstAvg * 1.2) trend = 'increasing';
    if (secondAvg < firstAvg * 0.8) trend = 'decreasing';
    
    // Extract common contexts
    const contexts = emotionEvents.map(e => e.context.timeOfDay);
    const contextCounts = contexts.reduce((acc, ctx) => {
      acc[ctx] = (acc[ctx] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const commonContexts = Object.entries(contextCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([ctx]) => ctx);
    
    return {
      emotion,
      frequency: emotionEvents.length,
      averageConfidence: avgConfidence,
      commonContexts,
      trend,
      lastOccurrence: sortedEvents[sortedEvents.length - 1].timestamp,
    };
  });
  
  return patterns.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Generate personalized insights based on emotion patterns
 */
export function generateEmotionInsights(patterns: EmotionPattern[]): EmotionInsight[] {
  const insights: EmotionInsight[] = [];
  
  // Check for high confusion/frustration
  const negativeEmotions = patterns.filter(p => 
    ['confused', 'frustrated', 'bored'].includes(p.emotion)
  );
  const totalNegative = negativeEmotions.reduce((sum, p) => sum + p.frequency, 0);
  const totalEvents = patterns.reduce((sum, p) => sum + p.frequency, 0);
  
  if (totalNegative / totalEvents > 0.4) {
    insights.push({
      type: 'warning',
      title: 'High Frustration Detected',
      description: `${Math.round((totalNegative / totalEvents) * 100)}% of your recent sessions showed confusion or frustration.`,
      recommendation: 'Consider switching to easier topics or taking more frequent breaks. Try reviewing fundamentals before tackling advanced concepts.',
      priority: 'high',
    });
  }
  
  // Check for declining engagement
  const engagedPattern = patterns.find(p => p.emotion === 'engaged');
  if (engagedPattern && engagedPattern.trend === 'decreasing') {
    insights.push({
      type: 'warning',
      title: 'Engagement Declining',
      description: 'Your engagement levels have been decreasing over recent sessions.',
      recommendation: 'Try mixing up your learning topics or taking a short break. Consider switching to more interactive content.',
      priority: 'medium',
    });
  }
  
  // Check for optimal learning times
  const timePatterns = patterns.reduce((acc, p) => {
    p.commonContexts.forEach(ctx => {
      if (!acc[ctx]) acc[ctx] = { positive: 0, total: 0 };
      acc[ctx].total += p.frequency;
      if (['engaged', 'curious', 'confident'].includes(p.emotion)) {
        acc[ctx].positive += p.frequency;
      }
    });
    return acc;
  }, {} as Record<string, { positive: number; total: number }>);
  
  const bestTime = Object.entries(timePatterns)
    .map(([time, stats]) => ({
      time,
      ratio: stats.positive / stats.total,
      total: stats.total,
    }))
    .sort((a, b) => b.ratio - a.ratio)[0];
  
  if (bestTime && bestTime.ratio > 0.6) {
    insights.push({
      type: 'success',
      title: `Best Learning Time: ${bestTime.time}`,
      description: `You're ${Math.round(bestTime.ratio * 100)}% more engaged during ${bestTime.time} sessions.`,
      recommendation: `Schedule your most challenging topics during ${bestTime.time} for optimal learning.`,
      priority: 'medium',
    });
  }
  
  // Check for consistent positive emotions
  const positiveEmotions = patterns.filter(p => 
    ['engaged', 'curious', 'confident', 'excited'].includes(p.emotion)
  );
  const totalPositive = positiveEmotions.reduce((sum, p) => sum + p.frequency, 0);
  
  if (totalPositive / totalEvents > 0.6) {
    insights.push({
      type: 'success',
      title: 'Great Learning Momentum!',
      description: `${Math.round((totalPositive / totalEvents) * 100)}% of your sessions show positive engagement.`,
      recommendation: 'Keep up the excellent work! Consider challenging yourself with more advanced topics.',
      priority: 'low',
    });
  }
  
  // Check for boredom patterns
  const boredPattern = patterns.find(p => p.emotion === 'bored');
  if (boredPattern && boredPattern.frequency > totalEvents * 0.2) {
    insights.push({
      type: 'info',
      title: 'Boredom Detected',
      description: 'You seem bored in some sessions. This might indicate the content is too easy.',
      recommendation: 'Try increasing the difficulty level or exploring more advanced topics in your areas of interest.',
      priority: 'medium',
    });
  }
  
  return insights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Calculate learning effectiveness score (0-100)
 */
export function calculateLearningEffectiveness(events: EmotionEvent[]): number {
  if (events.length === 0) return 50;
  
  const weightedSum = events.reduce((sum, event) => {
    const weight = EMOTION_WEIGHTS[event.emotion as keyof typeof EMOTION_WEIGHTS] || 0.5;
    return sum + (weight * event.confidence);
  }, 0);
  
  const maxPossible = events.length * 1.0; // Max weight
  const score = (weightedSum / maxPossible) * 100;
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Get emotion timeline data for visualization
 */
export interface TimelineDataPoint {
  timestamp: Date;
  emotion: string;
  confidence: number;
  effectiveness: number;
}

export function getEmotionTimeline(
  events: EmotionEvent[],
  intervalMinutes: number = 5
): TimelineDataPoint[] {
  if (events.length === 0) return [];
  
  const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const timeline: TimelineDataPoint[] = [];
  
  let currentInterval = new Date(sortedEvents[0].timestamp);
  currentInterval.setMinutes(Math.floor(currentInterval.getMinutes() / intervalMinutes) * intervalMinutes);
  currentInterval.setSeconds(0);
  currentInterval.setMilliseconds(0);
  
  let intervalEvents: EmotionEvent[] = [];
  
  sortedEvents.forEach(event => {
    const eventInterval = new Date(event.timestamp);
    eventInterval.setMinutes(Math.floor(eventInterval.getMinutes() / intervalMinutes) * intervalMinutes);
    eventInterval.setSeconds(0);
    eventInterval.setMilliseconds(0);
    
    if (eventInterval.getTime() === currentInterval.getTime()) {
      intervalEvents.push(event);
    } else {
      if (intervalEvents.length > 0) {
        const dominantEmotion = intervalEvents.reduce((acc, e) => {
          acc[e.emotion] = (acc[e.emotion] || 0) + e.confidence;
          return acc;
        }, {} as Record<string, number>);
        
        const topEmotion = Object.entries(dominantEmotion)
          .sort((a, b) => b[1] - a[1])[0];
        
        const avgConfidence = intervalEvents.reduce((sum, e) => sum + e.confidence, 0) / intervalEvents.length;
        const effectiveness = calculateLearningEffectiveness(intervalEvents);
        
        timeline.push({
          timestamp: new Date(currentInterval),
          emotion: topEmotion[0],
          confidence: avgConfidence,
          effectiveness,
        });
      }
      
      currentInterval = eventInterval;
      intervalEvents = [event];
    }
  });
  
  // Add last interval
  if (intervalEvents.length > 0) {
    const dominantEmotion = intervalEvents.reduce((acc, e) => {
      acc[e.emotion] = (acc[e.emotion] || 0) + e.confidence;
      return acc;
    }, {} as Record<string, number>);
    
    const topEmotion = Object.entries(dominantEmotion)
      .sort((a, b) => b[1] - a[1])[0];
    
    const avgConfidence = intervalEvents.reduce((sum, e) => sum + e.confidence, 0) / intervalEvents.length;
    const effectiveness = calculateLearningEffectiveness(intervalEvents);
    
    timeline.push({
      timestamp: new Date(currentInterval),
      emotion: topEmotion[0],
      confidence: avgConfidence,
      effectiveness,
    });
  }
  
  return timeline;
}

/**
 * Get recommended actions based on current emotion state
 */
export function getRecommendedActions(
  currentEmotion: string,
  confidence: number,
  context: EmotionContext
): string[] {
  const actions: string[] = [];
  
  if (currentEmotion === 'confused' && confidence > 0.7) {
    actions.push('Request a simpler explanation');
    actions.push('Review previous concepts');
    actions.push('Take a short break');
    if (context.sessionDuration > 30) {
      actions.push('Consider ending session - you\'ve been learning for a while');
    }
  }
  
  if (currentEmotion === 'frustrated' && confidence > 0.6) {
    actions.push('Switch to an easier topic');
    actions.push('Take a 5-minute break');
    actions.push('Try a different learning approach');
    actions.push('Review fundamentals');
  }
  
  if (currentEmotion === 'bored' && confidence > 0.6) {
    actions.push('Increase difficulty level');
    actions.push('Try a more challenging topic');
    actions.push('Switch to interactive quizzes');
    actions.push('Explore advanced concepts');
  }
  
  if (currentEmotion === 'engaged' && confidence > 0.7) {
    actions.push('Continue with current pace');
    actions.push('Try more advanced examples');
    if (context.sessionDuration < 45) {
      actions.push('Great momentum - keep going!');
    }
  }
  
  if (context.sessionDuration > 60) {
    actions.push('⚠️ Long session detected - consider taking a break');
  }
  
  if (context.timeOfDay === 'night' && context.sessionDuration > 30) {
    actions.push('💤 Late night learning - ensure you\'re well-rested');
  }
  
  return actions;
}
