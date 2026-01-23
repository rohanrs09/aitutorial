'use client';

/**
 * QUIZ STARTER COMPONENT
 * 
 * Interface for starting a new quiz
 * - Topic selection based on course structure
 * - Difficulty level selection
 * - Question count configuration
 * - Quick start options with adaptive recommendations
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, ChevronRight, Sparkles, Loader2, TrendingUp, Target, Award, BookOpen, Clock, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { TopicQuizConfig, DifficultyLevel } from '@/lib/quiz-types';
import { getAvailableTopicsFromCourse, generateQuizRecommendations } from '@/lib/quiz-generator';
import { getUserLearningTopics } from '@/lib/quiz-service';

interface QuizStarterProps {
  userId: string;
  onStartQuiz: (config: TopicQuizConfig) => void;
  onCancel: () => void;
  suggestedTopics?: string[];
}

interface CourseTopicInfo {
  topic: string;
  moduleId: string;
  subtopics: string[];
}

interface Recommendation {
  topic: string;
  reason: string;
  difficulty: string;
  priority: number;
}

export default function QuizStarter({ 
  userId, 
  onStartQuiz, 
  onCancel,
  suggestedTopics = []
}: QuizStarterProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel | 'mixed'>('mixed');
  const [questionCount, setQuestionCount] = useState(5);
  const [courseTopics, setCourseTopics] = useState<CourseTopicInfo[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [learningTopics, setLearningTopics] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'recommended' | 'all' | 'learned'>('recommended');

  // Load topics and recommendations
  useEffect(() => {
    async function loadData() {
      try {
        const [topics, recs, learned] = await Promise.all([
          getAvailableTopicsFromCourse(),
          generateQuizRecommendations(userId),
          getUserLearningTopics(userId)
        ]);
        setCourseTopics(topics);
        setRecommendations(recs.recommended);
        setLearningTopics(learned);
      } catch (error) {
        console.error('[QuizStarter] Failed to load data:', error);
      } finally {
        setLoadingTopics(false);
      }
    }
    loadData();
  }, [userId]);

  const handleQuickStart = (topic: string, suggestedDifficulty?: string) => {
    const config: TopicQuizConfig = {
      topic,
      questionCount: 5,
      difficulty: (suggestedDifficulty || 'mixed') as DifficultyLevel | 'mixed',
    };
    onStartQuiz(config);
  };

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case 'weak_area': return { text: 'Needs Practice', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
      case 'not_attempted': return { text: 'New Topic', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'scheduled_review': return { text: 'Review Time', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
      default: return { text: 'Recommended', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    }
  };

  const handleCustomStart = () => {
    if (!selectedTopic) return;

    const config: TopicQuizConfig = {
      topic: selectedTopic,
      questionCount,
      difficulty,
    };
    onStartQuiz(config);
  };

  return (
    <div className="py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="bg-gray-900/80 border-orange-500/20">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Start Your Quiz</h2>
              <p className="text-gray-400">Personalized questions based on your learning journey</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-gray-800">
              <button
                onClick={() => setActiveTab('recommended')}
                className={`px-4 py-2 font-medium transition-all relative ${
                  activeTab === 'recommended'
                    ? 'text-orange-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Star className="w-4 h-4 inline mr-2" />
                For You
                {activeTab === 'recommended' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('learned')}
                className={`px-4 py-2 font-medium transition-all relative ${
                  activeTab === 'learned'
                    ? 'text-orange-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                Learned
                {activeTab === 'learned' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 font-medium transition-all relative ${
                  activeTab === 'all'
                    ? 'text-orange-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Target className="w-4 h-4 inline mr-2" />
                All Topics
                {activeTab === 'all' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                  />
                )}
              </button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'recommended' && (
                <motion.div
                  key="recommended"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-8"
                >
                  {loadingTopics ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
                    </div>
                  ) : recommendations.length > 0 ? (
                    <div className="space-y-3">
                      {recommendations.slice(0, 5).map((rec, index) => {
                        const badge = getReasonBadge(rec.reason);
                        return (
                          <motion.button
                            key={rec.topic}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleQuickStart(rec.topic, rec.difficulty)}
                            className="w-full p-4 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-2 border-orange-500/20 hover:border-orange-500/40 rounded-xl text-left transition-all group"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Award className="w-4 h-4 text-orange-400" />
                                  <p className="font-semibold text-white">{rec.topic}</p>
                                </div>
                                <Badge className={`text-xs ${badge.color} border`}>
                                  {badge.text}
                                </Badge>
                              </div>
                              <Zap className="w-5 h-5 text-orange-400 group-hover:text-orange-300 transition-colors flex-shrink-0" />
                            </div>
                            <p className="text-xs text-gray-400">5 questions • {rec.difficulty} difficulty</p>
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">Start learning to get personalized recommendations!</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'learned' && (
                <motion.div
                  key="learned"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-8"
                >
                  {loadingTopics ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
                    </div>
                  ) : learningTopics.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {learningTopics.map((topic, index) => (
                        <motion.button
                          key={topic}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleQuickStart(topic)}
                          className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/20 hover:border-green-500/40 rounded-xl text-left transition-all group"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            <p className="font-semibold text-white">{topic}</p>
                          </div>
                          <p className="text-xs text-gray-400">Test what you&apos;ve learned</p>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No learning sessions yet. Start learning to see topics here!</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'all' && (
                <motion.div
                  key="all"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-8"
                >
                  <p className="text-sm text-gray-400 mb-4">Select a topic to create a custom quiz</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Custom Quiz Configuration */}
            {activeTab === 'all' && (
              <div className="border-t border-gray-800 pt-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-400" />
                  Custom Quiz Settings
                </h3>

                {/* Topic Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    Select Topic
                  </label>
                  {loadingTopics ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                      <span className="ml-2 text-gray-400">Loading topics...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
                      {courseTopics.map((topicInfo, index) => {
                        const isLearned = learningTopics.includes(topicInfo.topic);
                        return (
                          <motion.button
                            key={topicInfo.topic}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            onClick={() => setSelectedTopic(topicInfo.topic)}
                            className={`p-4 rounded-xl border-2 text-sm font-medium transition-all text-left relative group ${
                              selectedTopic === topicInfo.topic
                                ? 'bg-orange-500/20 border-orange-500 text-white shadow-lg shadow-orange-500/20'
                                : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-orange-500/50 hover:bg-gray-800'
                            }`}
                          >
                            {isLearned && (
                              <div className="absolute top-2 right-2">
                                <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                                  Learned
                                </Badge>
                              </div>
                            )}
                            <div className="font-semibold mb-2">{topicInfo.topic}</div>
                            <div className="text-xs opacity-60 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {topicInfo.subtopics.length} subtopics
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Difficulty Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {(['easy', 'medium', 'hard', 'mixed'] as const).map((level) => {
                      const icons = {
                        easy: '🟢',
                        medium: '🟡',
                        hard: '🔴',
                        mixed: '🎯'
                      };
                      return (
                        <button
                          key={level}
                          onClick={() => setDifficulty(level)}
                          className={`p-4 rounded-xl border-2 text-sm font-medium transition-all capitalize ${
                            difficulty === level
                              ? 'bg-orange-500/20 border-orange-500 text-white shadow-lg'
                              : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-orange-500/50'
                          }`}
                        >
                          <div className="text-xl mb-1">{icons[level]}</div>
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question Count */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    <div className="flex items-center justify-between">
                      <span>Number of Questions</span>
                      <span className="text-orange-400 font-bold text-lg">{questionCount}</span>
                    </div>
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    style={{
                      background: `linear-gradient(to right, rgb(249 115 22) 0%, rgb(249 115 22) ${((questionCount - 3) / 7) * 100}%, rgb(55 65 81) ${((questionCount - 3) / 7) * 100}%, rgb(55 65 81) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~2 min</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~5 min</span>
                  </div>
                </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomStart}
                  disabled={!selectedTopic}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-gray-900 font-bold rounded-xl hover:from-orange-400 hover:to-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Start Quiz
                  <ChevronRight size={18} />
                </button>
              </div>
              </div>
            )}

            {/* Quick Start for Recommended/Learned tabs */}
            {activeTab !== 'all' && (
              <div className="border-t border-gray-800 pt-6">
                <p className="text-sm text-gray-400 text-center mb-4">
                  Want to customize? Switch to <button onClick={() => setActiveTab('all')} className="text-orange-400 hover:text-orange-300 underline">All Topics</button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
