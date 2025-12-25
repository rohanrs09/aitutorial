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
    return 'flowchart TD\n    A["No diagram"]';
  }

  let result = code.trim();

  // Remove HTML tags
  result = result.replace(/<[^>]*>/g, '');

  // Remove markdown code block wrappers
  result = result.replace(/^```mermaid\s*/i, '');
  result = result.replace(/^```\s*/gm, '');
  result = result.replace(/\s*```$/g, '');

  // Replace problematic Unicode
  result = result
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2026]/g, '...')
    .replace(/[\u00A0]/g, ' ');

  // Process line by line
  const lines = result.split('\n');
  const cleaned = lines.map((line) => {
    const trimmed = line.trim();
    
    // Keep diagram declarations
    if (/^(graph|flowchart|sequenceDiagram)/.test(trimmed)) {
      return line;
    }

    // For all other lines, sanitize bracket contents character by character
    let processed = line;
    
    // Remove semicolons completely
    processed = processed.replace(/;/g, '');
    
    // Fix square brackets - extract and clean content
    processed = processed.replace(/\[([^\]]*)\]/g, (match, content) => {
      // Keep only: letters, numbers, spaces, and word boundaries
      let clean = content
        .replace(/[^\w\s]/g, ' ')  // Replace non-word chars with space
        .replace(/\s+/g, ' ')      // Collapse spaces
        .trim()
        .substring(0, 25);
      return clean ? `["${clean}"]` : '["Item"]';
    });

    // Fix curly braces
    processed = processed.replace(/\{([^}]*)\}/g, (match, content) => {
      let clean = content
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 25);
      return clean ? `{"${clean}"}` : '{"Item"}';
    });

    // Fix parentheses
    processed = processed.replace(/\(([^)]*)\)/g, (match, content) => {
      let clean = content
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 25);
      return clean ? `("${clean}")` : '("Item")';
    });

    return processed;
  });

  result = cleaned.join('\n');

  // Ensure valid start
  if (!result.match(/^\s*(flowchart|graph|sequenceDiagram)/i)) {
    result = `flowchart TD\n    ${result}`;
  }

  return result;
}

export function validateMermaidCode(code: string): { valid: boolean; error?: string } {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Empty code' };
  }

  const sanitized = sanitizeMermaidCode(code);
  
  // Check has diagram type
  if (!/^(flowchart|graph|sequenceDiagram)/i.test(sanitized)) {
    return { valid: false, error: 'Invalid diagram' };
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
