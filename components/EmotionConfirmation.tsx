'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

interface EmotionConfirmationProps {
  emotion: string;
  confidence: number;
  onConfirm: () => void;
  onDismiss: () => void;
  isVisible: boolean;
}

export default function EmotionConfirmation({
  emotion,
  confidence,
  onConfirm,
  onDismiss,
  isVisible
}: EmotionConfirmationProps) {
  if (!isVisible) return null;

  const getEmotionMessage = (emotion: string) => {
    switch (emotion) {
      case 'confused':
        return "I notice you might be confused. Should I simplify the explanation?";
      case 'frustrated':
        return "You seem frustrated. Would you like me to explain this differently?";
      default:
        return "I notice a change in your expression. Should I adjust my teaching approach?";
    }
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'confused': return 'bg-yellow-500';
      case 'frustrated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md mx-4"
    >
      <div className="bg-[#2a2a2a] border border-gray-600 rounded-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full ${getEmotionColor(emotion)} flex items-center justify-center flex-shrink-0`}>
            <AlertTriangle size={16} className="text-white" />
          </div>
          
          <div className="flex-1">
            <p className="text-white text-sm font-medium mb-3">
              {getEmotionMessage(emotion)}
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={onConfirm}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
              >
                <CheckCircle size={14} />
                Yes, help me
              </button>
              
              <button
                onClick={onDismiss}
                className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
              >
                <X size={14} />
                I am fine
              </button>
            </div>
            
            <p className="text-gray-400 text-xs mt-2">
              Confidence: {Math.round(confidence * 100)}%
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
