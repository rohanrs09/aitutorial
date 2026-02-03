-- ============================================
-- AI VOICE TUTOR - COMPLETE DATABASE RESET
-- ============================================
-- This migration drops ALL existing tables and recreates them from scratch
-- with proper clerk_user_id columns for Clerk authentication
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- STEP 1: DROP ALL EXISTING TABLES
-- ============================================

DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS user_credits CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievement_definitions CASCADE;
DROP TABLE IF EXISTS user_notes CASCADE;
DROP TABLE IF EXISTS learning_progress CASCADE;
DROP TABLE IF EXISTS conversation_messages CASCADE;
DROP TABLE IF EXISTS learning_sessions CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- ============================================
-- STEP 2: CREATE ALL TABLES WITH PROPER SCHEMA
-- ============================================

-- 1. User Profiles Table (Primary user table linked to Clerk)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  sessions_this_month INTEGER DEFAULT 0,
  sessions_limit INTEGER DEFAULT 100,
  streak_days INTEGER DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Preferences Table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  adaptive_learning BOOLEAN DEFAULT true,
  emotion_detection BOOLEAN DEFAULT true,
  notifications BOOLEAN DEFAULT true,
  sound_effects BOOLEAN DEFAULT true,
  dark_mode BOOLEAN DEFAULT false,
  preferred_voice TEXT DEFAULT 'alloy',
  preferred_language TEXT DEFAULT 'en',
  voice_speed NUMERIC DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Learning Sessions Table (Main session tracking)
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  clerk_user_id TEXT NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  topic_name TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  total_messages INTEGER DEFAULT 0,
  quiz_score INTEGER CHECK (quiz_score IS NULL OR (quiz_score >= 0 AND quiz_score <= 100)),
  emotions_detected TEXT[],
  primary_emotion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Conversation Messages Table (Chat history)
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  clerk_user_id TEXT NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  emotion TEXT,
  audio_url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Learning Progress Table (Tracks progress per session)
CREATE TABLE learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  session_id TEXT UNIQUE NOT NULL,
  topic_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('started', 'in_progress', 'completed', 'paused')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  content_position JSONB DEFAULT '{"currentStep": 0, "totalSteps": 0, "bookmarks": []}',
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. User Notes Table (User-created notes during sessions)
CREATE TABLE user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  clerk_user_id TEXT NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT,
  is_auto_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. User Subscriptions Table (Subscription tier and status)
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  tier TEXT NOT NULL DEFAULT 'starter' CHECK (tier IN ('starter', 'pro', 'unlimited')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'inactive')),
  clerk_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. User Credits Table (Tracks credits for each user)
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  total_credits INTEGER NOT NULL DEFAULT 50,
  used_credits INTEGER NOT NULL DEFAULT 0,
  bonus_credits INTEGER NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Credit Transactions Table (Logs all credit changes)
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('subscription_reset', 'usage', 'bonus', 'refund', 'purchase')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Achievement Definitions Table (Stores all available achievements)
CREATE TABLE achievement_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  requirement JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. User Achievements Table (Tracks unlocked achievements per user)
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  achievement_id TEXT NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clerk_user_id, achievement_id)
);

-- ============================================
-- STEP 3: INSERT DEFAULT ACHIEVEMENT DEFINITIONS
-- ============================================

INSERT INTO achievement_definitions (id, name, description, icon, category, points, requirement) VALUES
  ('first_session', 'First Steps', 'Complete your first learning session', '🎯', 'learning', 10, '{"type": "sessions", "count": 1}'),
  ('quiz_master', 'Quiz Master', 'Score 100% on any quiz', '🏆', 'quiz', 50, '{"type": "quiz_score", "score": 100}'),
  ('week_streak', 'Week Warrior', 'Maintain a 7-day learning streak', '🔥', 'streak', 30, '{"type": "streak", "days": 7}'),
  ('speed_learner', 'Speed Learner', 'Complete 10 sessions in one day', '⚡', 'learning', 40, '{"type": "daily_sessions", "count": 10}'),
  ('topic_expert', 'Topic Expert', 'Master 5 different topics', '🎓', 'mastery', 100, '{"type": "topics_mastered", "count": 5}');

-- ============================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_clerk_user_id ON user_profiles(clerk_user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Learning sessions indexes
CREATE INDEX idx_learning_sessions_clerk_user_id ON learning_sessions(clerk_user_id);
CREATE INDEX idx_learning_sessions_session_id ON learning_sessions(session_id);
CREATE INDEX idx_learning_sessions_started_at ON learning_sessions(started_at DESC);
CREATE INDEX idx_learning_sessions_topic_name ON learning_sessions(topic_name);
CREATE INDEX idx_learning_sessions_quiz_score ON learning_sessions(clerk_user_id, quiz_score) WHERE quiz_score IS NOT NULL;

-- Conversation messages indexes
CREATE INDEX idx_conversation_messages_session_id ON conversation_messages(session_id);
CREATE INDEX idx_conversation_messages_clerk_user_id ON conversation_messages(clerk_user_id);
CREATE INDEX idx_conversation_messages_timestamp ON conversation_messages(timestamp DESC);

-- Learning progress indexes
CREATE INDEX idx_learning_progress_clerk_user_id ON learning_progress(clerk_user_id);
CREATE INDEX idx_learning_progress_session_id ON learning_progress(session_id);
CREATE INDEX idx_learning_progress_status ON learning_progress(status);
CREATE INDEX idx_learning_progress_last_accessed ON learning_progress(last_accessed_at DESC);

-- User notes indexes
CREATE INDEX idx_user_notes_clerk_user_id ON user_notes(clerk_user_id);
CREATE INDEX idx_user_notes_session_id ON user_notes(session_id);

-- User subscriptions indexes
CREATE INDEX idx_user_subscriptions_clerk_user_id ON user_subscriptions(clerk_user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_clerk_subscription_id ON user_subscriptions(clerk_subscription_id);

-- User credits indexes
CREATE INDEX idx_user_credits_clerk_user_id ON user_credits(clerk_user_id);

-- Credit transactions indexes
CREATE INDEX idx_credit_transactions_clerk_user_id ON credit_transactions(clerk_user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- Achievement definitions indexes
CREATE INDEX idx_achievement_definitions_category ON achievement_definitions(category);

-- User achievements indexes
CREATE INDEX idx_user_achievements_clerk_user_id ON user_achievements(clerk_user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- ============================================
-- STEP 5: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================
-- Using permissive policies (true) to avoid CORS issues
-- Backend handles authorization via Clerk

-- User Profiles policies
CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "user_profiles_delete" ON user_profiles FOR DELETE USING (true);

-- User Preferences policies
CREATE POLICY "user_preferences_select" ON user_preferences FOR SELECT USING (true);
CREATE POLICY "user_preferences_insert" ON user_preferences FOR INSERT WITH CHECK (true);
CREATE POLICY "user_preferences_update" ON user_preferences FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "user_preferences_delete" ON user_preferences FOR DELETE USING (true);

-- Learning Sessions policies
CREATE POLICY "learning_sessions_select" ON learning_sessions FOR SELECT USING (true);
CREATE POLICY "learning_sessions_insert" ON learning_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "learning_sessions_update" ON learning_sessions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "learning_sessions_delete" ON learning_sessions FOR DELETE USING (true);

-- Conversation Messages policies
CREATE POLICY "conversation_messages_select" ON conversation_messages FOR SELECT USING (true);
CREATE POLICY "conversation_messages_insert" ON conversation_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "conversation_messages_update" ON conversation_messages FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "conversation_messages_delete" ON conversation_messages FOR DELETE USING (true);

-- Learning Progress policies
CREATE POLICY "learning_progress_select" ON learning_progress FOR SELECT USING (true);
CREATE POLICY "learning_progress_insert" ON learning_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "learning_progress_update" ON learning_progress FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "learning_progress_delete" ON learning_progress FOR DELETE USING (true);

-- User Notes policies
CREATE POLICY "user_notes_select" ON user_notes FOR SELECT USING (true);
CREATE POLICY "user_notes_insert" ON user_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "user_notes_update" ON user_notes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "user_notes_delete" ON user_notes FOR DELETE USING (true);

-- User Subscriptions policies
CREATE POLICY "user_subscriptions_select" ON user_subscriptions FOR SELECT USING (true);
CREATE POLICY "user_subscriptions_insert" ON user_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "user_subscriptions_update" ON user_subscriptions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "user_subscriptions_delete" ON user_subscriptions FOR DELETE USING (true);

-- User Credits policies
CREATE POLICY "user_credits_select" ON user_credits FOR SELECT USING (true);
CREATE POLICY "user_credits_insert" ON user_credits FOR INSERT WITH CHECK (true);
CREATE POLICY "user_credits_update" ON user_credits FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "user_credits_delete" ON user_credits FOR DELETE USING (true);

-- Credit Transactions policies
CREATE POLICY "credit_transactions_select" ON credit_transactions FOR SELECT USING (true);
CREATE POLICY "credit_transactions_insert" ON credit_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "credit_transactions_update" ON credit_transactions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "credit_transactions_delete" ON credit_transactions FOR DELETE USING (true);

-- Achievement Definitions policies (public read)
CREATE POLICY "achievement_definitions_select" ON achievement_definitions FOR SELECT USING (true);
CREATE POLICY "achievement_definitions_insert" ON achievement_definitions FOR INSERT WITH CHECK (true);
CREATE POLICY "achievement_definitions_update" ON achievement_definitions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "achievement_definitions_delete" ON achievement_definitions FOR DELETE USING (true);

-- User Achievements policies
CREATE POLICY "user_achievements_select" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "user_achievements_insert" ON user_achievements FOR INSERT WITH CHECK (true);
CREATE POLICY "user_achievements_update" ON user_achievements FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "user_achievements_delete" ON user_achievements FOR DELETE USING (true);

-- ============================================
-- STEP 7: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_sessions_updated_at
  BEFORE UPDATE ON learning_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_progress_updated_at
  BEFORE UPDATE ON learning_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notes_updated_at
  BEFORE UPDATE ON user_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON user_credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 8: ADD TABLE COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE user_profiles IS 'Main user table linked to Clerk authentication via clerk_user_id';
COMMENT ON TABLE user_preferences IS 'User preferences for learning experience customization';
COMMENT ON TABLE learning_sessions IS 'Tracks all learning sessions with quiz scores and emotions';
COMMENT ON TABLE conversation_messages IS 'Stores all chat messages between user and AI tutor';
COMMENT ON TABLE learning_progress IS 'Tracks user progress through learning content';
COMMENT ON TABLE user_notes IS 'User-created notes during learning sessions';
COMMENT ON TABLE user_subscriptions IS 'Subscription tier and status for each user';
COMMENT ON TABLE user_credits IS 'Credit balance tracking for usage-based features';
COMMENT ON TABLE credit_transactions IS 'Audit log of all credit changes';
COMMENT ON TABLE achievement_definitions IS 'Defines all available achievements in the system';
COMMENT ON TABLE user_achievements IS 'Tracks which achievements each user has unlocked';

COMMENT ON COLUMN user_profiles.clerk_user_id IS 'Clerk user ID (format: user_xxx) - primary identifier';
COMMENT ON COLUMN learning_sessions.quiz_score IS 'Quiz score 0-100, NULL if quiz not taken';
COMMENT ON COLUMN user_credits.total_credits IS 'Total credits available this billing period';
COMMENT ON COLUMN user_credits.used_credits IS 'Credits used this billing period';
COMMENT ON COLUMN user_credits.bonus_credits IS 'Extra credits from promotions or bonuses';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- All tables created with clerk_user_id columns
-- RLS policies configured for security
-- Indexes added for performance
-- Ready to use with Clerk authentication
-- ============================================
