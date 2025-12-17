-- AI Voice Tutor Database Schema (SaaS Edition)
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USER PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'team')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due')),
  sessions_this_month INTEGER DEFAULT 0,
  sessions_limit INTEGER DEFAULT 10,
  streak_days INTEGER DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- USER PREFERENCES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  adaptive_learning BOOLEAN DEFAULT true,
  emotion_detection BOOLEAN DEFAULT true,
  notifications BOOLEAN DEFAULT true,
  sound_effects BOOLEAN DEFAULT true,
  dark_mode BOOLEAN DEFAULT true,
  preferred_voice TEXT DEFAULT 'alloy',
  preferred_language TEXT DEFAULT 'en-US',
  voice_speed DECIMAL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- LEARNING TOPICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS learning_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- USER CUSTOM TOPICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_custom_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- LEARNING SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  topic_id UUID REFERENCES learning_topics(id),
  custom_topic_id UUID REFERENCES user_custom_topics(id),
  topic_name TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  total_messages INTEGER DEFAULT 0,
  quiz_score INTEGER,
  emotions_detected TEXT[] DEFAULT '{}',
  primary_emotion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CONVERSATION MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  emotion TEXT,
  audio_url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES learning_sessions(session_id) ON DELETE CASCADE
);

-- =============================================
-- SESSION NOTES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS session_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  is_auto_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES learning_sessions(session_id) ON DELETE CASCADE
);

-- =============================================
-- LEARNING PROGRESS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES learning_topics(id),
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  sessions_completed INTEGER DEFAULT 0,
  total_time_minutes INTEGER DEFAULT 0,
  last_quiz_score INTEGER,
  concepts_mastered TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- USER ACHIEVEMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_key)
);

-- =============================================
-- ANALYTICS EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_id ON user_profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON learning_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON conversation_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON conversation_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);

-- =============================================
-- INSERT DEFAULT LEARNING TOPICS
-- =============================================
INSERT INTO learning_topics (name, category, description, difficulty, is_premium) VALUES
  ('Law of Diminishing Returns', 'Economics', 'Understanding how additional inputs eventually yield smaller increases in output', 'intermediate', false),
  ('Binary Search Algorithm', 'Data Structures & Algorithms', 'Efficient search algorithm for sorted arrays using divide and conquer', 'beginner', false),
  ('Recursion', 'Data Structures & Algorithms', 'A function calling itself to solve problems by breaking them into smaller subproblems', 'intermediate', false),
  ('Percentages & Applications', 'Aptitude', 'Understanding percentage calculations, profit/loss, discount, and interest', 'beginner', false),
  ('Profit and Loss', 'Aptitude', 'Calculating profit, loss, cost price, and selling price in business scenarios', 'beginner', false),
  ('GRE Quantitative Reasoning', 'GRE Prep', 'Arithmetic, algebra, geometry, and data analysis for GRE', 'intermediate', false),
  ('GRE Verbal Reasoning', 'GRE Prep', 'Reading comprehension, text completion, and sentence equivalence', 'intermediate', false),
  ('Object-Oriented Programming Basics', 'Programming', 'Classes, objects, inheritance, polymorphism, and encapsulation', 'beginner', false),
  ('Dynamic Programming', 'Data Structures & Algorithms', 'Solving complex problems by breaking them into overlapping subproblems', 'advanced', true),
  ('System Design Fundamentals', 'Programming', 'Designing scalable and distributed systems', 'advanced', true),
  ('Graph Algorithms', 'Data Structures & Algorithms', 'BFS, DFS, shortest path, and minimum spanning trees', 'advanced', true),
  ('Macroeconomics', 'Economics', 'GDP, inflation, monetary policy, and international trade', 'intermediate', true)
ON CONFLICT DO NOTHING;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Public read access for learning topics
CREATE POLICY "Allow public read access on learning_topics"
  ON learning_topics FOR SELECT
  TO public
  USING (true);

-- User profile policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Allow insert for new users"
  ON user_profiles FOR INSERT
  TO public
  WITH CHECK (true);

-- User preferences policies
CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  TO authenticated
  USING (user_id IN (SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'));

-- Session policies (allow public for demo, restrict in production)
CREATE POLICY "Allow public insert on learning_sessions"
  ON learning_sessions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read on learning_sessions"
  ON learning_sessions FOR SELECT
  TO public
  USING (true);

-- Message policies
CREATE POLICY "Allow public insert on conversation_messages"
  ON conversation_messages FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read on conversation_messages"
  ON conversation_messages FOR SELECT
  TO public
  USING (true);

-- Notes policies
CREATE POLICY "Users can manage own notes"
  ON session_notes FOR ALL
  TO authenticated
  USING (user_id IN (SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'));

-- Progress policies
CREATE POLICY "Users can manage own progress"
  ON user_progress FOR ALL
  TO authenticated
  USING (user_id IN (SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'));

-- Achievements policies
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'));

-- Custom topics policies
CREATE POLICY "Users can manage own custom topics"
  ON user_custom_topics FOR ALL
  TO authenticated
  USING (user_id IN (SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'));

-- =============================================
-- FUNCTIONS FOR AUTOMATIC UPDATES
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment session count
CREATE OR REPLACE FUNCTION increment_session_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET sessions_this_month = sessions_this_month + 1,
      last_active_at = CURRENT_TIMESTAMP
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_session_created
  AFTER INSERT ON learning_sessions
  FOR EACH ROW
  WHEN (NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION increment_session_count();
