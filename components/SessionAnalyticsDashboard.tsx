'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Brain, 
  Clock, 
  Target,
  Calendar,
  Award,
  AlertCircle
} from 'lucide-react';

interface SessionAnalytics {
  sessionDuration: number; // seconds
  questionsAsked: number;
  correctAnswers: number;
  topicsExplored: string[];
  emotionSequence: Array<{
    emotion: string;
    duration: number;
    timestamp: Date;
  }>;
  slidesViewed: number;
  conceptsMastered: number;
  averageEmotionalState: string;
  learningEfficiency: number; // 0-100
  peakFocusTime: string; // time of day
  timeSpentPerTopic: Record<string, number>; // topic -> seconds
  correctnessRate: number; // 0-100
}

interface SessionAnalyticsDashboardProps {
  analytics: SessionAnalytics;
  sessionDate: Date;
  sessionId: string;
  onClose: () => void;
}

const emotionColors: Record<string, string> = {
  happy: 'text-green-600 bg-green-50',
  confident: 'text-blue-600 bg-blue-50',
  engaged: 'text-purple-600 bg-purple-50',
  neutral: 'text-gray-600 bg-gray-50',
  confused: 'text-yellow-600 bg-yellow-50',
  frustrated: 'text-red-600 bg-red-50',
};

export default function SessionAnalyticsDashboard({
  analytics,
  sessionDate,
  sessionId,
  onClose
}: SessionAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'export'>('overview');

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const generatePDFReport = () => {
    const reportContent = `
SESSION LEARNING REPORT
Generated: ${new Date().toLocaleString()}
Session ID: ${sessionId}
Date: ${sessionDate.toLocaleDateString()}

SUMMARY METRICS
===============
Duration: ${formatDuration(analytics.sessionDuration)}
Questions Asked: ${analytics.questionsAsked}
Correct Answers: ${analytics.correctAnswers}
Correctness Rate: ${analytics.correctnessRate.toFixed(1)}%
Learning Efficiency: ${analytics.learningEfficiency.toFixed(1)}%

LEARNING OUTCOMES
==================
Slides Viewed: ${analytics.slidesViewed}
Concepts Mastered: ${analytics.conceptsMastered}
Topics Explored: ${analytics.topicsExplored.join(', ')}

EMOTIONAL JOURNEY
==================
Average State: ${analytics.averageEmotionalState}
Peak Focus Time: ${analytics.peakFocusTime}

DETAILED BREAKDOWN
==================
${Object.entries(analytics.timeSpentPerTopic)
  .map(([topic, time]) => `${topic}: ${formatDuration(time)}`)
  .join('\n')}

This report reflects your learning progress during this session.
Keep practicing to improve your learning efficiency!
    `;
    
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportContent));
    element.setAttribute('download', `learning-report-${sessionId}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generateJSONExport = () => {
    const exportData = {
      sessionId,
      sessionDate: sessionDate.toISOString(),
      analytics,
      generatedAt: new Date().toISOString()
    };

    const element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2)));
    element.setAttribute('download', `learning-data-${sessionId}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 border-b border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <BarChart3 size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Session Analytics</h2>
                <p className="text-purple-100 text-sm">{sessionDate.toLocaleDateString()} • {formatDuration(analytics.sessionDuration)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-4">
            {['overview', 'detailed', 'export'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-white text-purple-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Duration', value: formatDuration(analytics.sessionDuration), icon: Clock, color: 'blue' },
                  { label: 'Questions', value: analytics.questionsAsked, icon: Target, color: 'purple' },
                  { label: 'Accuracy', value: `${analytics.correctnessRate.toFixed(0)}%`, icon: Award, color: 'green' },
                  { label: 'Efficiency', value: `${analytics.learningEfficiency.toFixed(0)}%`, icon: TrendingUp, color: 'orange' }
                ].map((metric, index) => {
                  const Icon = metric.icon;
                  const colorClass = {
                    blue: 'bg-blue-50 text-blue-600',
                    purple: 'bg-purple-50 text-purple-600',
                    green: 'bg-green-50 text-green-600',
                    orange: 'bg-orange-50 text-orange-600'
                  }[metric.color];

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl ${colorClass} border border-current/10`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase text-gray-600">{metric.label}</span>
                        <Icon size={16} />
                      </div>
                      <p className="text-2xl font-bold">{metric.value}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Learning Outcomes */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Brain size={20} className="text-purple-600" />
                  Learning Outcomes
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Slides Reviewed</p>
                    <p className="text-3xl font-bold text-purple-600">{analytics.slidesViewed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Concepts Mastered</p>
                    <p className="text-3xl font-bold text-blue-600">{analytics.conceptsMastered}</p>
                  </div>
                </div>
              </div>

              {/* Topics Covered */}
              {analytics.topicsExplored.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Topics Explored</h3>
                  <div className="flex flex-wrap gap-2">
                    {analytics.topicsExplored.map((topic, index) => (
                      <motion.span
                        key={topic}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full text-sm font-medium"
                      >
                        {topic}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              {/* Emotional Journey */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Emotional Journey</h3>
                <p className="text-sm text-gray-600 mb-3">Average State: <span className="font-semibold capitalize">{analytics.averageEmotionalState}</span></p>
                <div className="flex flex-wrap gap-2">
                  {analytics.emotionSequence.slice(-10).map((entry, index) => {
                    const colorClass = emotionColors[entry.emotion] || 'text-gray-600 bg-gray-50';
                    return (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}
                      >
                        {entry.emotion}
                      </motion.span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'detailed' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Time Per Topic</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.timeSpentPerTopic).map(([topic, time]) => (
                    <div key={topic}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{topic}</span>
                        <span className="text-sm font-bold text-purple-600">{formatDuration(time)}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(time / analytics.sessionDuration) * 100}%` }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <AlertCircle size={18} />
                  Peak Focus Time
                </h4>
                <p className="text-blue-800">{analytics.peakFocusTime}</p>
                <p className="text-sm text-blue-600 mt-2">Schedule future study sessions during this time for maximum effectiveness.</p>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <Download size={20} />
                  Export Your Learning Data
                </h3>
                <p className="text-purple-800 mb-4">Download your session analytics in multiple formats:</p>

                <div className="space-y-3">
                  <button
                    onClick={generatePDFReport}
                    className="w-full p-4 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-left"
                  >
                    <p className="font-semibold text-gray-800">📄 Text Report (.txt)</p>
                    <p className="text-sm text-gray-600">Human-readable format perfect for review</p>
                  </button>

                  <button
                    onClick={generateJSONExport}
                    className="w-full p-4 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-left"
                  >
                    <p className="font-semibold text-gray-800">📊 Data Export (.json)</p>
                    <p className="text-sm text-gray-600">Structured data for analysis and integration</p>
                  </button>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>Tip:</strong> Export your data regularly to track long-term learning patterns and progress!
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
