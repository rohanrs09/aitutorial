import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Emotion type definitions
export type EmotionType = 
  | 'neutral' 
  | 'confused' 
  | 'confident' 
  | 'frustrated' 
  | 'bored' 
  | 'excited' 
  | 'curious';

// Emotion detection keywords
export const emotionKeywords: Record<EmotionType, string[]> = {
  neutral: [],
  confused: ['confused', 'don\'t understand', 'unclear', 'lost', 'what does', 'what is', 'how do', 'can you explain', 'i don\'t get'],
  confident: ['got it', 'i understand', 'makes sense', 'i see', 'clear', 'yes', 'right', 'exactly'],
  frustrated: ['frustrated', 'difficult', 'hard', 'can\'t', 'stuck', 'ugh', 'annoying', 'complicated'],
  bored: ['boring', 'bored', 'uninteresting', 'meh', 'whatever', 'okay'],
  excited: ['cool', 'awesome', 'amazing', 'interesting', 'wow', 'great', 'love', 'excited'],
  curious: ['why', 'how come', 'what if', 'curious', 'wonder', 'tell me more', 'interesting']
};

// Detect emotion from text
export function detectEmotionFromText(text: string): EmotionType {
  const lowerText = text.toLowerCase();
  
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    if (emotion === 'neutral') continue;
    
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return emotion as EmotionType;
      }
    }
  }
  
  return 'neutral';
}

// Get emotion color
export function getEmotionColor(emotion: EmotionType): string {
  const colors: Record<EmotionType, string> = {
    neutral: 'bg-gray-500',
    confused: 'bg-yellow-500',
    confident: 'bg-green-500',
    frustrated: 'bg-red-500',
    bored: 'bg-blue-300',
    excited: 'bg-purple-500',
    curious: 'bg-cyan-500'
  };
  
  return colors[emotion] || colors.neutral;
}

// Get emotion emoji
export function getEmotionEmoji(emotion: EmotionType): string {
  const emojis: Record<EmotionType, string> = {
    neutral: '😐',
    confused: '😕',
    confident: '😊',
    frustrated: '😤',
    bored: '😑',
    excited: '🤩',
    curious: '🤔'
  };
  
  return emojis[emotion] || emojis.neutral;
}

// Format timestamp
export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}

// Generate session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
