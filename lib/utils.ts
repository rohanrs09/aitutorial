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

// ============================================
// MERMAID DIAGRAM SANITIZATION UTILITIES
// ============================================

/**
 * Sanitizes Mermaid diagram code by removing invalid characters and fixing common issues
 * that cause parse errors at runtime.
 */
export function sanitizeMermaidCode(code: string): string {
  if (!code || typeof code !== 'string') {
    return 'graph TD\n    A[No diagram available]';
  }

  let sanitized = code.trim();

  // Remove HTML tags that break Mermaid parsing
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove markdown code block wrappers if present
  sanitized = sanitized.replace(/^```mermaid\s*/i, '');
  sanitized = sanitized.replace(/^```\s*/gm, '');
  sanitized = sanitized.replace(/\s*```$/g, '');

  // Replace problematic Unicode characters
  sanitized = sanitized
    .replace(/[\u2018\u2019]/g, "'") // Smart quotes to regular quotes
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
    .replace(/[\u2013\u2014]/g, '-') // En/em dashes to regular dash
    .replace(/[\u2026]/g, '...') // Ellipsis
    .replace(/[\u00A0]/g, ' '); // Non-breaking space

  // Escape special characters in node labels that break parsing
  // Replace unescaped brackets/parentheses inside labels
  sanitized = sanitized.replace(/\[([^\]]*?)\(([^)]*?)\)([^\]]*?)\]/g, '[\$1\$2\$3]');
  
  // Remove or escape characters that break Mermaid
  sanitized = sanitized
    .replace(/[{}]/g, '') // Remove curly braces (except in subgraph)
    .replace(/\|\|/g, ' or ') // Replace double pipes
    .replace(/&&/g, ' and ') // Replace double ampersands
    .replace(/\$/g, '') // Remove dollar signs
    .replace(/@/g, 'at ') // Replace @ symbol
    .replace(/#(?!\w)/g, ''); // Remove standalone hash symbols

  // Fix common issues with arrows
  sanitized = sanitized
    .replace(/--+>/g, '-->') // Normalize arrows
    .replace(/<--+/g, '<--')
    .replace(/=+>/g, '==>')
    .replace(/<-+\./g, '<-.')
    .replace(/\.-+>/g, '.->');

  // Ensure node IDs are valid (alphanumeric + underscore)
  const lines = sanitized.split('\n');
  const cleanedLines = lines.map(line => {
    // Skip directive lines
    if (line.trim().startsWith('%%') || line.trim().startsWith('graph') || 
        line.trim().startsWith('flowchart') || line.trim().startsWith('sequenceDiagram') ||
        line.trim().startsWith('classDiagram') || line.trim().startsWith('stateDiagram') ||
        line.trim().startsWith('erDiagram') || line.trim().startsWith('gantt') ||
        line.trim().startsWith('pie') || line.trim().startsWith('subgraph') ||
        line.trim() === 'end') {
      return line;
    }
    // Clean up whitespace issues
    return line.replace(/\s{2,}/g, ' ');
  });

  sanitized = cleanedLines.join('\n');

  // Validate that the code starts with a valid diagram type
  const validStarts = [
    'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 
    'stateDiagram', 'erDiagram', 'gantt', 'pie', 'journey',
    'gitGraph', 'mindmap', 'timeline', 'quadrantChart'
  ];
  
  const firstLine = sanitized.split('\n')[0].trim().toLowerCase();
  const hasValidStart = validStarts.some(start => firstLine.startsWith(start.toLowerCase()));
  
  if (!hasValidStart) {
    // Wrap in a basic flowchart if no valid start
    sanitized = `flowchart TD\n    ${sanitized}`;
  }

  return sanitized;
}

/**
 * Validates if a Mermaid code string is likely to parse successfully
 */
export function validateMermaidCode(code: string): { valid: boolean; error?: string } {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Empty or invalid diagram code' };
  }

  const sanitized = sanitizeMermaidCode(code);
  
  // Check for balanced brackets
  const brackets = { '[': 0, '(': 0, '{': 0 };
  for (const char of sanitized) {
    if (char === '[') brackets['[']++;
    if (char === ']') brackets['[']--;
    if (char === '(') brackets['(']++;
    if (char === ')') brackets['(']--;
    if (char === '{') brackets['{']++;
    if (char === '}') brackets['{']--;
  }
  
  if (brackets['['] !== 0 || brackets['('] !== 0) {
    return { valid: false, error: 'Unbalanced brackets in diagram' };
  }

  // Check for minimum valid structure
  if (sanitized.length < 10) {
    return { valid: false, error: 'Diagram code too short' };
  }

  return { valid: true };
}

// ============================================
// MOTION/ANIMATION UTILITIES
// ============================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get motion-safe animation variants
 */
export function getMotionVariants(enableMotion: boolean = true) {
  const shouldAnimate = enableMotion && !prefersReducedMotion();
  
  return {
    fadeIn: {
      initial: shouldAnimate ? { opacity: 0 } : { opacity: 1 },
      animate: { opacity: 1 },
      exit: shouldAnimate ? { opacity: 0 } : { opacity: 1 },
      transition: { duration: shouldAnimate ? 0.2 : 0 }
    },
    slideUp: {
      initial: shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      exit: shouldAnimate ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 },
      transition: { duration: shouldAnimate ? 0.3 : 0 }
    },
    slideInRight: {
      initial: shouldAnimate ? { opacity: 0, x: 20 } : { opacity: 1, x: 0 },
      animate: { opacity: 1, x: 0 },
      exit: shouldAnimate ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 },
      transition: { duration: shouldAnimate ? 0.25 : 0 }
    },
    scale: {
      initial: shouldAnimate ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 },
      animate: { opacity: 1, scale: 1 },
      exit: shouldAnimate ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 },
      transition: { duration: shouldAnimate ? 0.2 : 0 }
    },
    stagger: {
      animate: {
        transition: {
          staggerChildren: shouldAnimate ? 0.05 : 0
        }
      }
    }
  };
}

/**
 * Page transition variants for consistent page animations
 */
export const pageTransitionVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1]
    }
  },
  exit: { 
    opacity: 0, 
    y: -8,
    transition: {
      duration: 0.2
    }
  }
};
