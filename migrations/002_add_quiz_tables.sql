-- ============================================
-- AI VOICE TUTOR - ADD QUIZ TABLES
-- Run this in Supabase SQL Editor after 001_complete_schema.sql
-- ============================================

-- 1. Quiz Sessions Table
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  attempts JSONB NOT NULL DEFAULT '[]',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  accuracy NUMERIC(5,2) DEFAULT 0,
  average_time_per_question NUMERIC(8,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed', 'abandoned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Quiz Results Table
CREATE TABLE IF NOT EXISTS quiz_results (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  difficulty TEXT DEFAULT 'mixed',
  score INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  accuracy NUMERIC(5,2) DEFAULT 0,
  questions_attempted INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  time_spent NUMERIC(8,2) DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  difficulty_breakdown JSONB DEFAULT '{"easy":{"correct":0,"total":0},"medium":{"correct":0,"total":0},"hard":{"correct":0,"total":0}}',
  question_results JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Topic Mastery Table (for quiz recommendations)
CREATE TABLE IF NOT EXISTS topic_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  quiz_sessions_count INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, topic)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_topic ON quiz_sessions(topic);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON quiz_sessions(status);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_started_at ON quiz_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_session_id ON quiz_results(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_topic ON quiz_results(topic);
CREATE INDEX IF NOT EXISTS idx_quiz_results_completed_at ON quiz_results(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_topic_mastery_user_id ON topic_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_topic ON topic_mastery(topic);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_mastery ENABLE ROW LEVEL SECURITY;

-- Quiz Sessions policies
CREATE POLICY "quiz_sessions_select" ON quiz_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "quiz_sessions_insert" ON quiz_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "quiz_sessions_update" ON quiz_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Quiz Results policies
CREATE POLICY "quiz_results_select" ON quiz_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "quiz_results_insert" ON quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Topic Mastery policies
CREATE POLICY "topic_mastery_select" ON topic_mastery FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "topic_mastery_insert" ON topic_mastery FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "topic_mastery_update" ON topic_mastery FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_quiz_sessions_updated_at BEFORE UPDATE ON quiz_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_topic_mastery_updated_at BEFORE UPDATE ON topic_mastery FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PERMISSIONS
-- ============================================

GRANT ALL ON quiz_sessions TO postgres, authenticated, service_role;
GRANT ALL ON quiz_results TO postgres, authenticated, service_role;
GRANT ALL ON topic_mastery TO postgres, authenticated, service_role;
GRANT SELECT ON quiz_sessions TO anon;
GRANT SELECT ON quiz_results TO anon;
GRANT SELECT ON topic_mastery TO anon;

DO $$
BEGIN
  RAISE NOTICE '✅ Quiz tables created successfully!';
  RAISE NOTICE '📊 Tables: quiz_sessions, quiz_results, topic_mastery';
  RAISE NOTICE '🔒 RLS enabled with proper policies';
END $$;
