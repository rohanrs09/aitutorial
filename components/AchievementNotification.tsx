'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Award, X } from 'lucide-react';
import { Achievement } from '@/lib/achievements';

interface AchievementNotificationProps {
  achievements: Achievement[];
  onClose: () => void;
}

export default function AchievementNotification({ achievements, onClose }: AchievementNotificationProps) {
  if (achievements.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4"
      >
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Award className="text-yellow-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {achievements.length === 1 ? 'Achievement Unlocked!' : `${achievements.length} Achievements Unlocked!`}
                </h3>
                <p className="text-sm text-gray-400">Congratulations! 🎉</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {achievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 bg-surface/50 rounded-xl"
              >
                <div className="text-3xl">{achievement.icon}</div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{achievement.name}</p>
                  <p className="text-xs text-gray-400">{achievement.description}</p>
                </div>
                <div className="text-yellow-400 font-bold text-sm">
                  +{achievement.points}
                </div>
              </motion.div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Awesome!
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
