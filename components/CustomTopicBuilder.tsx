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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-white/10 shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="text-white" size={28} />
              <h2 className="text-2xl font-bold text-white">Create Custom Learning Path</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="text-white" size={24} />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Topic Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Topic Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="e.g., Machine Learning Basics"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Computer Science, Mathematics, etc."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what you want to learn..."
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`
                    px-4 py-3 rounded-xl font-medium transition-all
                    ${difficulty === level
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
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
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-300">
                Learning Goals <span className="text-red-400">*</span>
              </label>
              <button
                onClick={addLearningGoal}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm"
              >
                <Plus size={16} />
                Add Goal
              </button>
            </div>
            
            <div className="space-y-3">
              {learningGoals.map((goal, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex items-center justify-center w-8 h-12 text-purple-400 font-bold">
                    {index + 1}.
                  </div>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => updateLearningGoal(index, e.target.value)}
                    placeholder="What do you want to learn?"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  {learningGoals.length > 1 && (
                    <button
                      onClick={() => removeLearningGoal(index)}
                      className="p-3 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2 shadow-lg"
            >
              <Save size={20} />
              Create Learning Path
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
