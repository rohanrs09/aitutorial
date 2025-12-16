'use client';

import { useState } from 'react';
import { Plus, X, Save, BookOpen, Target, Sparkles } from 'lucide-react';

interface CustomTopic {
  id: string;
  name: string;
  category: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learningGoals: string[];
}

interface CustomTopicBuilderProps {
  onTopicCreated: (topic: CustomTopic) => void;
  onClose: () => void;
}

export default function CustomTopicBuilder({ onTopicCreated, onClose }: CustomTopicBuilderProps) {
  const [topicName, setTopicName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [learningGoals, setLearningGoals] = useState<string[]>(['']);

  const addLearningGoal = () => {
    setLearningGoals([...learningGoals, '']);
  };

  const removeLearningGoal = (index: number) => {
    setLearningGoals(learningGoals.filter((_, i) => i !== index));
  };

  const updateLearningGoal = (index: number, value: string) => {
    const updated = [...learningGoals];
    updated[index] = value;
    setLearningGoals(updated);
  };

  const handleSave = () => {
    const filteredGoals = learningGoals.filter(goal => goal.trim());
    
    if (!topicName.trim() || !category.trim() || filteredGoals.length === 0) {
      alert('Please fill in all required fields and add at least one learning goal');
      return;
    }

    const newTopic: CustomTopic = {
      id: `custom-${Date.now()}`,
      name: topicName,
      category: category,
      description: description || `Learn about ${topicName}`,
      difficulty: difficulty,
      learningGoals: filteredGoals
    };

    onTopicCreated(newTopic);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-t-2xl sm:rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl w-full sm:max-w-xl md:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col safe-area-inset">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 p-4 sm:p-5 md:p-6 rounded-t-2xl sm:rounded-t-2xl md:rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Sparkles className="text-white w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Create Custom Path</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 min-h-touch min-w-touch flex items-center justify-center hover:bg-white/20 active:bg-white/30 rounded-lg transition-colors"
            >
              <X className="text-white w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Form - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 scrollbar-hide">
          {/* Topic Name */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              Topic Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="e.g., Machine Learning Basics"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 min-h-touch bg-white/5 border border-white/10 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              Category <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Computer Science, Mathematics"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 min-h-touch bg-white/5 border border-white/10 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what you want to learn..."
              rows={2}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`
                    px-2 sm:px-4 py-2.5 sm:py-3 min-h-touch rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all
                    ${difficulty === level
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 active:bg-white/15'
                    }
                  `}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Learning Goals */}
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <label className="text-xs sm:text-sm font-medium text-gray-300">
                Learning Goals <span className="text-red-400">*</span>
              </label>
              <button
                onClick={addLearningGoal}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 min-h-touch bg-green-500/20 hover:bg-green-500/30 active:bg-green-500/40 text-green-400 rounded-lg transition-colors text-xs sm:text-sm"
              >
                <Plus size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Add Goal</span>
                <span className="xs:hidden">Add</span>
              </button>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              {learningGoals.map((goal, index) => (
                <div key={index} className="flex gap-1.5 sm:gap-2">
                  <div className="flex items-center justify-center w-6 sm:w-8 h-10 sm:h-12 text-purple-400 font-bold text-xs sm:text-sm">
                    {index + 1}.
                  </div>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => updateLearningGoal(index, e.target.value)}
                    placeholder="What do you want to learn?"
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 min-h-touch bg-white/5 border border-white/10 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                  {learningGoals.length > 1 && (
                    <button
                      onClick={() => removeLearningGoal(index)}
                      className="p-2 sm:p-3 min-h-touch min-w-touch flex items-center justify-center hover:bg-red-500/20 active:bg-red-500/30 text-red-400 rounded-lg sm:rounded-xl transition-colors"
                    >
                      <X size={18} className="sm:w-5 sm:h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 flex gap-2 sm:gap-3 p-4 sm:p-5 md:p-6 border-t border-white/10 bg-gray-900/50">
          <button
            onClick={onClose}
            className="flex-1 px-4 sm:px-6 py-3 sm:py-3.5 min-h-touch bg-white/5 hover:bg-white/10 active:bg-white/15 text-gray-300 rounded-lg sm:rounded-xl transition-colors font-medium text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 sm:px-6 py-3 sm:py-3.5 min-h-touch bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:from-purple-700 active:to-pink-700 text-white rounded-lg sm:rounded-xl transition-all font-medium text-sm sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg"
          >
            <Save size={16} className="sm:w-5 sm:h-5" />
            <span className="hidden xs:inline">Create Path</span>
            <span className="xs:hidden">Create</span>
          </button>
        </div>
      </div>
    </div>
  );
}
