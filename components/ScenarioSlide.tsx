'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, HelpCircle, Lightbulb } from 'lucide-react';

export interface ScenarioQuestion {
  id: string;
  scenarioNumber: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint?: string;
}

interface ScenarioSlideProps {
  scenario: ScenarioQuestion;
  onAnswer: (selectedIndex: number, isCorrect: boolean) => void;
  showHint?: boolean;
  tutorOrb?: React.ReactNode;
}

export default function ScenarioSlide({
  scenario,
  onAnswer,
  showHint = false,
  tutorOrb
}: ScenarioSlideProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHintState, setShowHintState] = useState(false);

  const handleOptionClick = (index: number) => {
    if (showResult) return;
    setSelectedIndex(index);
  };

  const handleSubmit = () => {
    if (selectedIndex === null) return;
    setShowResult(true);
    onAnswer(selectedIndex, selectedIndex === scenario.correctIndex);
  };

  const isCorrect = selectedIndex === scenario.correctIndex;

  return (
    <div className="h-full flex flex-col text-[#2a2a2a]">
      {/* Scenario Header */}
      <div className="mb-6">
        <span className="inline-block px-4 py-2 bg-[#5c4d9a] text-white text-sm font-semibold rounded-lg">
          Scenario {scenario.scenarioNumber}
        </span>
      </div>

      {/* Question */}
      <div className="mb-8 pr-40">
        <p className="text-lg leading-relaxed">
          <span className="font-semibold">Question: </span>
          {scenario.question}
        </p>
      </div>

      {/* Options */}
      <div className="mb-6">
        <p className="font-semibold mb-4">Options:</p>
        <div className="space-y-3">
          {scenario.options.map((option, index) => (
            <motion.button
              key={index}
              onClick={() => handleOptionClick(index)}
              disabled={showResult}
              className={`
                w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3
                ${selectedIndex === index
                  ? showResult
                    ? index === scenario.correctIndex
                      ? 'bg-green-100 border-2 border-green-500'
                      : 'bg-red-100 border-2 border-red-500'
                    : 'bg-[#5c4d9a]/10 border-2 border-[#5c4d9a]'
                  : showResult && index === scenario.correctIndex
                    ? 'bg-green-100 border-2 border-green-500'
                    : 'bg-white/50 border border-gray-300 hover:bg-white hover:border-gray-400'
                }
              `}
              whileHover={{ scale: showResult ? 1 : 1.01 }}
              whileTap={{ scale: showResult ? 1 : 0.99 }}
            >
              <span className="font-semibold text-gray-600">{index + 1}.</span>
              <span className="flex-1">{option}</span>
              
              {showResult && index === scenario.correctIndex && (
                <CheckCircle className="text-green-500" size={20} />
              )}
              {showResult && selectedIndex === index && index !== scenario.correctIndex && (
                <XCircle className="text-red-500" size={20} />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Hint Button */}
      {scenario.hint && !showResult && (
        <button
          onClick={() => setShowHintState(!showHintState)}
          className="flex items-center gap-2 text-[#5c4d9a] hover:text-[#4a3d7a] mb-4 text-sm"
        >
          <Lightbulb size={16} />
          {showHintState ? 'Hide hint' : 'Need a hint?'}
        </button>
      )}

      {/* Hint Display */}
      <AnimatePresence>
        {showHintState && !showResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4"
          >
            <div className="flex items-start gap-2">
              <Lightbulb className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-yellow-800">{scenario.hint}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      {!showResult && selectedIndex !== null && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleSubmit}
          className="self-start px-6 py-2 bg-[#5c4d9a] text-white rounded-lg font-medium hover:bg-[#4a3d7a] transition-colors"
        >
          Submit Answer
        </motion.button>
      )}

      {/* Result Explanation */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-auto p-4 rounded-lg ${
              isCorrect ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
              ) : (
                <HelpCircle className="text-orange-500 flex-shrink-0" size={24} />
              )}
              <div>
                <p className={`font-semibold mb-1 ${isCorrect ? 'text-green-700' : 'text-orange-700'}`}>
                  {isCorrect ? 'Correct!' : 'Not quite right'}
                </p>
                <p className={`text-sm ${isCorrect ? 'text-green-600' : 'text-orange-600'}`}>
                  {scenario.explanation}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutor Orb - Positioned by parent */}
      {tutorOrb && (
        <div className="absolute top-6 right-6 w-40 h-28 bg-[#5a5a5a] rounded-xl flex items-center justify-center shadow-lg">
          {tutorOrb}
        </div>
      )}
    </div>
  );
}
