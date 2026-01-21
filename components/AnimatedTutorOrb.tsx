'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnimatedTutorOrbProps {
  isSpeaking: boolean;
  isListening: boolean;
  emotion?: 'neutral' | 'happy' | 'thinking' | 'explaining';
  size?: 'small' | 'medium' | 'large';
}

export default function AnimatedTutorOrb({
  isSpeaking,
  isListening,
  emotion = 'neutral',
  size = 'medium'
}: AnimatedTutorOrbProps) {
  const [pulseIntensity, setPulseIntensity] = useState(1);

  // Simulate voice activity when speaking
  useEffect(() => {
    if (isSpeaking) {
      const interval = setInterval(() => {
        setPulseIntensity(0.8 + Math.random() * 0.4);
      }, 150);
      return () => clearInterval(interval);
    } else {
      setPulseIntensity(1);
    }
  }, [isSpeaking]);

  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-20 h-20',
    large: 'w-32 h-32'
  };

  const emotionGradients = {
    neutral: 'from-gray-200 via-white to-gray-100',
    happy: 'from-yellow-100 via-white to-orange-50',
    thinking: 'from-orange-100 via-white to-amber-50',
    explaining: 'from-amber-100 via-white to-orange-50'
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring when speaking */}
      {isSpeaking && (
        <motion.div
          className="absolute rounded-full bg-white/20"
          style={{
            width: size === 'small' ? 60 : size === 'medium' ? 100 : 160,
            height: size === 'small' ? 60 : size === 'medium' ? 100 : 160,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}

      {/* Listening indicator ring */}
      {isListening && (
        <motion.div
          className="absolute rounded-full border-2 border-red-400"
          style={{
            width: size === 'small' ? 56 : size === 'medium' ? 88 : 144,
            height: size === 'small' ? 56 : size === 'medium' ? 88 : 144,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [1, 0.5, 1]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}

      {/* Main Orb */}
      <motion.div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${emotionGradients[emotion]} shadow-2xl relative overflow-hidden`}
        animate={{
          scale: isSpeaking ? pulseIntensity : 1,
        }}
        transition={{
          duration: 0.1,
          ease: 'easeOut'
        }}
        style={{
          boxShadow: `
            0 0 20px rgba(255, 255, 255, 0.3),
            inset -10px -10px 30px rgba(0, 0, 0, 0.1),
            inset 10px 10px 30px rgba(255, 255, 255, 0.8)
          `
        }}
      >
        {/* 3D Highlight effect */}
        <div 
          className="absolute top-2 left-2 w-1/3 h-1/3 rounded-full bg-white/60"
          style={{
            filter: 'blur(4px)'
          }}
        />
        
        {/* Secondary highlight */}
        <div 
          className="absolute bottom-4 right-4 w-1/4 h-1/4 rounded-full bg-white/30"
          style={{
            filter: 'blur(3px)'
          }}
        />

        {/* Speaking animation waves inside orb */}
        {isSpeaking && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 bg-gray-400/30 rounded-full"
                style={{ height: '30%' }}
                animate={{
                  scaleY: [0.3, 1, 0.3],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 0.4,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Status indicator dot */}
      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#5a5a5a] ${
        isSpeaking ? 'bg-green-500 animate-pulse' : 
        isListening ? 'bg-red-500 animate-pulse' : 
        'bg-gray-400'
      }`} />
    </div>
  );
}
