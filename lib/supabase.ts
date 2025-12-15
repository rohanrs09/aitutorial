import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface ConversationMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  emotion?: string;
  timestamp: string;
  created_at: string;
}

export interface LearningSession {
  id: string;
  topic: string;
  started_at: string;
  ended_at?: string;
  total_messages: number;
  emotions_detected: string[];
  created_at: string;
}

export interface LearningTopic {
  id: string;
  name: string;
  category: string;
  description: string;
  created_at: string;
}
