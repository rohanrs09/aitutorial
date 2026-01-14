import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Mermaid diagram utilities
export function sanitizeMermaidCode(code: string): string {
  // Remove potentially dangerous code
  return code
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

export function validateMermaidCode(code: string): { valid: boolean; error?: string } {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: 'Code is empty' };
  }

  // Check for basic mermaid syntax
  const validTypes = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'gantt', 'pie', 'journey'];
  const hasValidType = validTypes.some(type => code.toLowerCase().includes(type.toLowerCase()));

  if (!hasValidType) {
    return { valid: false, error: 'Invalid diagram type' };
  }

  return { valid: true };
}

// Emotion types
export type EmotionType = 'neutral' | 'engaged' | 'curious' | 'confused' | 'confident' | 'frustrated';

// Accessibility utility
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Simple text-based emotion detection
export function detectEmotionFromText(text: string): EmotionType {
  const lowerText = text.toLowerCase();
  
  // Confusion indicators
  if (lowerText.match(/\b(confused|don't understand|what|why|how|unclear|lost|help)\b/)) {
    return 'confused';
  }
  
  // Confidence indicators
  if (lowerText.match(/\b(got it|understand|clear|makes sense|i see|right|correct)\b/)) {
    return 'confident';
  }
  
  // Curiosity indicators
  if (lowerText.match(/\b(interesting|tell me more|what about|curious|wonder|explore)\b/)) {
    return 'curious';
  }
  
  // Frustration indicators
  if (lowerText.match(/\b(frustrated|annoyed|difficult|hard|stuck|can't)\b/)) {
    return 'frustrated';
  }
  
  // Engagement indicators
  if (lowerText.match(/\b(yes|ok|continue|next|more|please|thanks)\b/)) {
    return 'engaged';
  }
  
  return 'neutral';
}
