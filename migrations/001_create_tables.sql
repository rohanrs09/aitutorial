-- ============================================
-- AI Voice Tutor - Database Schema
-- ============================================
-- Run this SQL in Supabase SQL Editor to create all required tables
-- ============================================

-- 1. User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Learning Topics Table
CREATE TABLE IF NOT EXISTS learning_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  difficulty_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Learning Sessions Table (CRITICAL)
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  clerk_user_id TEXT,
  topic_name TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  total_messages INTEGER DEFAULT 0,
  quiz_score INTEGER,
  emotions_detected TEXT[],
  primary_emotion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Session Messages Table
CREATE TABLE IF NOT EXISTS session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES learning_sessions(session_id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  emotion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4B. Conversation Messages Table (for chat history)
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES learning_sessions(session_id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  clerk_user_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  emotion TEXT,
  audio_url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Quiz Attempts Table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES learning_sessions(session_id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  user_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Concept Mastery Table
CREATE TABLE IF NOT EXISTS concept_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  mastery_level INTEGER CHECK (mastery_level >= 0 AND mastery_level <= 100),
  last_practiced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. User Notes Table
CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES learning_sessions(session_id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies - Allow anonymous/public access (development)
-- ============================================
-- Drop existing policies first (in case migration is re-run)

DROP POLICY IF EXISTS "Allow public read on user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow insert on user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow public read on learning_topics" ON learning_topics;
DROP POLICY IF EXISTS "Allow insert on learning_topics" ON learning_topics;
DROP POLICY IF EXISTS "Allow insert learning_sessions" ON learning_sessions;
DROP POLICY IF EXISTS "Allow select learning_sessions" ON learning_sessions;
DROP POLICY IF EXISTS "Allow update learning_sessions" ON learning_sessions;
DROP POLICY IF EXISTS "Allow delete learning_sessions" ON learning_sessions;
DROP POLICY IF EXISTS "Allow insert session_messages" ON session_messages;
DROP POLICY IF EXISTS "Allow select session_messages" ON session_messages;
DROP POLICY IF EXISTS "Allow insert conversation_messages" ON conversation_messages;
DROP POLICY IF EXISTS "Allow select conversation_messages" ON conversation_messages;
DROP POLICY IF EXISTS "Allow insert quiz_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Allow select quiz_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Allow insert concept_mastery" ON concept_mastery;
DROP POLICY IF EXISTS "Allow select concept_mastery" ON concept_mastery;
DROP POLICY IF EXISTS "Allow update concept_mastery" ON concept_mastery;
DROP POLICY IF EXISTS "Allow insert user_notes" ON user_notes;
DROP POLICY IF EXISTS "Allow select user_notes" ON user_notes;
DROP POLICY IF EXISTS "Allow update user_notes" ON user_notes;

-- User Profiles
CREATE POLICY "Allow public read on user_profiles" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow insert on user_profiles" ON user_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update own profile" ON user_profiles
  FOR UPDATE USING (true);

-- Learning Topics
CREATE POLICY "Allow public read on learning_topics" ON learning_topics
  FOR SELECT USING (true);

CREATE POLICY "Allow insert on learning_topics" ON learning_topics
  FOR INSERT WITH CHECK (true);

-- Learning Sessions (CRITICAL)
CREATE POLICY "Allow insert learning_sessions" ON learning_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select learning_sessions" ON learning_sessions
  FOR SELECT USING (true);

CREATE POLICY "Allow update learning_sessions" ON learning_sessions
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete learning_sessions" ON learning_sessions
  FOR DELETE USING (true);

-- Session Messages
CREATE POLICY "Allow insert session_messages" ON session_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select session_messages" ON session_messages
  FOR SELECT USING (true);

-- Conversation Messages (CRITICAL - for chat history)
CREATE POLICY "Allow insert conversation_messages" ON conversation_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select conversation_messages" ON conversation_messages
  FOR SELECT USING (true);

-- Quiz Attempts
CREATE POLICY "Allow insert quiz_attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select quiz_attempts" ON quiz_attempts
  FOR SELECT USING (true);

-- Concept Mastery
CREATE POLICY "Allow insert concept_mastery" ON concept_mastery
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select concept_mastery" ON concept_mastery
  FOR SELECT USING (true);

CREATE POLICY "Allow update concept_mastery" ON concept_mastery
  FOR UPDATE USING (true);

-- User Notes
CREATE POLICY "Allow insert user_notes" ON user_notes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select user_notes" ON user_notes
  FOR SELECT USING (true);

CREATE POLICY "Allow update user_notes" ON user_notes
  FOR UPDATE USING (true);

-- ============================================
-- Create Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_learning_sessions_session_id ON learning_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_clerk_user_id ON learning_sessions(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_session_id ON session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_session_id ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_id ON conversation_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_clerk_user_id ON conversation_messages(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_session_id ON quiz_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_concept_mastery_user_id ON concept_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_session_id ON user_notes(session_id);

-- ============================================
-- Insert Sample Learning Topics (Optional)
-- ============================================

INSERT INTO learning_topics (name, description, category, difficulty_level)
VALUES
  ('Photosynthesis', 'Process of converting light energy to chemical energy', 'Biology', 'Intermediate'),
  ('Algebra Basics', 'Fundamental algebraic equations and operations', 'Mathematics', 'Beginner'),
  ('French Vocabulary', 'Essential French words and phrases', 'Languages', 'Beginner'),
  ('Quantum Physics', 'Introduction to quantum mechanics', 'Physics', 'Advanced'),
  ('World History', 'Key events in global history', 'History', 'Intermediate')
ON CONFLICT DO NOTHING;

-- ============================================
-- Setup Complete
-- ============================================
-- All tables created with RLS enabled
-- All policies set to allow public access (development mode)
-- Ready for AI Voice Tutor application
