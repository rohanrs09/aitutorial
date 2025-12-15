'use client';

import { BookOpen, Plus } from 'lucide-react';
import { learningTopics } from '@/lib/tutor-prompts';

interface TopicSelectorProps {
  selectedTopic: string;
  onTopicChange: (topicId: string) => void;
  onCreateCustom?: () => void;
  customTopics?: any[];
}

export default function TopicSelector({ selectedTopic, onTopicChange, onCreateCustom, customTopics = [] }: TopicSelectorProps) {
  // Combine default and custom topics
  const allTopics = [...learningTopics, ...customTopics];

  // Group topics by category
  const categories = allTopics.reduce((acc, topic) => {
    if (!acc[topic.category]) {
      acc[topic.category] = [];
    }
    acc[topic.category].push(topic);
    return acc;
  }, {} as Record<string, typeof allTopics>);

  return (
    <div className="max-h-80 overflow-y-auto">
      {/* Create Custom Topic Button */}
      {onCreateCustom && (
        <div className="p-3 border-b border-gray-200 sticky top-0 bg-white z-10">
          <button
            onClick={onCreateCustom}
            className="w-full px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border border-green-300 rounded-xl transition-all flex items-center justify-center gap-2 text-green-700 font-semibold"
          >
            <Plus size={20} />
            Create Custom Learning Path
          </button>
        </div>
      )}
      
      {Object.entries(categories).map(([category, topics]) => (
        <div key={category} className="p-2">
          <div className="text-xs font-bold text-purple-600 uppercase px-3 py-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            {category}
          </div>
          {(topics as any[]).map((topic: any) => (
            <button
              key={topic.id}
              onClick={() => onTopicChange(topic.id)}
              className={`
                w-full text-left px-3 py-2.5 rounded-lg transition-all mb-1
                ${selectedTopic === topic.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                  : 'hover:bg-gray-100 text-gray-700'
                }
              `}
            >
              <div className="font-medium text-sm">{topic.name}</div>
              <div className={`text-xs mt-0.5 ${selectedTopic === topic.id ? 'text-white/80' : 'text-gray-500'}`}>
                {topic.description}
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
