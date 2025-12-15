'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveTranscriptProps {
  text: string;
  isActive: boolean;
  wordsPerMinute?: number;
}

export default function LiveTranscript({
  text,
  isActive,
  wordsPerMinute = 150
}: LiveTranscriptProps) {
  const [displayedWords, setDisplayedWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const words = text.split(/\s+/).filter(w => w.length > 0);

  useEffect(() => {
    if (!isActive || !text) {
      setDisplayedWords([]);
      setCurrentWordIndex(0);
      return;
    }

    // Calculate word reveal interval based on WPM
    const intervalMs = (60 / wordsPerMinute) * 1000;

    setDisplayedWords([]);
    setCurrentWordIndex(0);

    const interval = setInterval(() => {
      setCurrentWordIndex(prev => {
        if (prev >= words.length) {
          clearInterval(interval);
          return prev;
        }
        setDisplayedWords(words.slice(0, prev + 1));
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [text, isActive, wordsPerMinute, words.length]);

  // Auto-scroll to keep latest words visible
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [displayedWords]);

  if (!isActive || !text) return null;

  return (
    <div className="bg-black/95 backdrop-blur-sm py-5 px-6">
      <div 
        ref={containerRef}
        className="max-w-4xl mx-auto overflow-x-auto scrollbar-hide"
      >
        <p className="text-xl md:text-2xl font-medium whitespace-nowrap">
          <span className="text-gray-500 mr-3">Tutor:</span>
          <AnimatePresence mode="popLayout">
            {displayedWords.map((word, index) => (
              <motion.span
                key={`${index}-${word}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: index === currentWordIndex - 1 ? 1 : 0.9,
                  y: 0,
                  color: index === currentWordIndex - 1 ? '#ffffff' : '#e5e5e5'
                }}
                className="inline-block mr-2"
                style={{
                  fontWeight: index === currentWordIndex - 1 ? 600 : 400
                }}
              >
                {word}
              </motion.span>
            ))}
          </AnimatePresence>
          
          {/* Typing cursor */}
          {currentWordIndex < words.length && (
            <motion.span
              className="inline-block w-0.5 h-6 bg-white ml-1"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
        </p>
      </div>
    </div>
  );
}
