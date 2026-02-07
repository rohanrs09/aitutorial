-- ============================================
-- AI VOICE TUTOR - DATABASE SETUP
-- ============================================
-- Safe database setup with proper error handling
-- Compatible with Clerk authentication
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLE CREATION
-- ============================================

-- 1. User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'pro', 'unlimited')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'inactive')),
  sessions_this_month INTEGER DEFAULT 0,
  sessions_limit INTEGER DEFAULT 100,
  streak_days INTEGER DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
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
  voice_speed NUMERIC DEFAULT 1.0 CHECK (voice_speed > 0 AND voice_speed <= 3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Learning Sessions Table
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  clerk_user_id TEXT NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  topic_name TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER CHECK (duration_minutes >= 0),
  total_messages INTEGER DEFAULT 0 CHECK (total_messages >= 0),
  quiz_score INTEGER CHECK (quiz_score IS NULL OR (quiz_score >= 0 AND quiz_score <= 100)),
  emotions_detected TEXT[],
  primary_emotion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Conversation Messages Table
CREATE TABLE IF NOT EXISTS conversation_messages (
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

-- 5. Learning Progress Table
CREATE TABLE IF NOT EXISTS learning_progress (
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

-- 6. User Notes Table
CREATE TABLE IF NOT EXISTS user_notes (
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

-- 7. User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
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

-- 8. User Credits Table
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  total_credits INTEGER NOT NULL DEFAULT 50 CHECK (total_credits >= 0),
  used_credits INTEGER NOT NULL DEFAULT 0 CHECK (used_credits >= 0),
  bonus_credits INTEGER NOT NULL DEFAULT 0 CHECK (bonus_credits >= 0),
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Credit Transactions Table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('subscription_reset', 'usage', 'bonus', 'refund', 'purchase')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Achievement Definitions Table
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10 CHECK (points > 0),
  requirement JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  achievement_id TEXT NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0),
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clerk_user_id, achievement_id)
);

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

INSERT INTO achievement_definitions (id, name, description, icon, category, points, requirement) 
VALUES
  ('first_session', 'First Steps', 'Complete your first learning session', '🎯', 'learning', 10, '{"type": "sessions", "count": 1}'),
  ('quiz_master', 'Quiz Master', 'Score 100% on any quiz', '🏆', 'quiz', 50, '{"type": "quiz_score", "score": 100}'),
  ('week_streak', 'Week Warrior', 'Maintain a 7-day learning streak', '🔥', 'streak', 30, '{"type": "streak", "days": 7}'),
  ('speed_learner', 'Speed Learner', 'Complete 10 sessions in one day', '⚡', 'learning', 40, '{"type": "daily_sessions", "count": 10}'),
  ('topic_expert', 'Topic Expert', 'Master 5 different topics', '🎓', 'mastery', 100, '{"type": "topics_mastered", "count": 5}')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CREATE INDEXES
-- ============================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_user_id ON user_profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON user_profiles(subscription_tier);

-- Learning sessions indexes
CREATE INDEX IF NOT EXISTS idx_learning_sessions_clerk_user_id ON learning_sessions(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_session_id ON learning_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_started_at ON learning_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_topic_name ON learning_sessions(topic_name);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_quiz_score ON learning_sessions(clerk_user_id, quiz_score) WHERE quiz_score IS NOT NULL;

-- Conversation messages indexes
CREATE INDEX IF NOT EXISTS idx_conversation_messages_session_id ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_clerk_user_id ON conversation_messages(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_timestamp ON conversation_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_role ON conversation_messages(role);

-- Learning progress indexes
CREATE INDEX IF NOT EXISTS idx_learning_progress_clerk_user_id ON learning_progress(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_session_id ON learning_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_status ON learning_progress(status);
CREATE INDEX IF NOT EXISTS idx_learning_progress_last_accessed ON learning_progress(last_accessed_at DESC);

-- User notes indexes
CREATE INDEX IF NOT EXISTS idx_user_notes_clerk_user_id ON user_notes(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_session_id ON user_notes(session_id);

-- User subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_clerk_user_id ON user_subscriptions(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON user_subscriptions(tier);

-- User credits indexes
CREATE INDEX IF NOT EXISTS idx_user_credits_clerk_user_id ON user_credits(clerk_user_id);

-- Credit transactions indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_clerk_user_id ON credit_transactions(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- Achievement indexes
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_category ON achievement_definitions(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_clerk_user_id ON user_achievements(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

DO $$
BEGIN
    -- Enable RLS on all tables
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
END $$;

-- ============================================
-- CREATE RLS POLICIES
-- ============================================

DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
    DROP POLICY IF EXISTS "user_profiles_insert" ON user_profiles;
    DROP POLICY IF EXISTS "user_profiles_update" ON user_profiles;
    DROP POLICY IF EXISTS "user_profiles_delete" ON user_profiles;
    
    -- Create new policies
    CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT USING (true);
    CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT WITH CHECK (true);
    CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE USING (true) WITH CHECK (true);
    CREATE POLICY "user_profiles_delete" ON user_profiles FOR DELETE USING (true);
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "user_preferences_select" ON user_preferences;
    DROP POLICY IF EXISTS "user_preferences_insert" ON user_preferences;
    DROP POLICY IF EXISTS "user_preferences_update" ON user_preferences;
    DROP POLICY IF EXISTS "user_preferences_delete" ON user_preferences;
    
    CREATE POLICY "user_preferences_select" ON user_preferences FOR SELECT USING (true);
    CREATE POLICY "user_preferences_insert" ON user_preferences FOR INSERT WITH CHECK (true);
    CREATE POLICY "user_preferences_update" ON user_preferences FOR UPDATE USING (true) WITH CHECK (true);
    CREATE POLICY "user_preferences_delete" ON user_preferences FOR DELETE USING (true);
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "learning_sessions_select" ON learning_sessions;
    DROP POLICY IF EXISTS "learning_sessions_insert" ON learning_sessions;
    DROP POLICY IF EXISTS "learning_sessions_update" ON learning_sessions;
    DROP POLICY IF EXISTS "learning_sessions_delete" ON learning_sessions;
    
    CREATE POLICY "learning_sessions_select" ON learning_sessions FOR SELECT USING (true);
    CREATE POLICY "learning_sessions_insert" ON learning_sessions FOR INSERT WITH CHECK (true);
    CREATE POLICY "learning_sessions_update" ON learning_sessions FOR UPDATE USING (true) WITH CHECK (true);
    CREATE POLICY "learning_sessions_delete" ON learning_sessions FOR DELETE USING (true);
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "conversation_messages_select" ON conversation_messages;
    DROP POLICY IF EXISTS "conversation_messages_insert" ON conversation_messages;
    DROP POLICY IF EXISTS "conversation_messages_update" ON conversation_messages;
    DROP POLICY IF EXISTS "conversation_messages_delete" ON conversation_messages;
    
    CREATE POLICY "conversation_messages_select" ON conversation_messages FOR SELECT USING (true);
    CREATE POLICY "conversation_messages_insert" ON conversation_messages FOR INSERT WITH CHECK (true);
    CREATE POLICY "conversation_messages_update" ON conversation_messages FOR UPDATE USING (true) WITH CHECK (true);
    CREATE POLICY "conversation_messages_delete" ON conversation_messages FOR DELETE USING (true);
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "learning_progress_select" ON learning_progress;
    DROP POLICY IF EXISTS "learning_progress_insert" ON learning_progress;
    DROP POLICY IF EXISTS "learning_progress_update" ON learning_progress;
    DROP POLICY IF EXISTS "learning_progress_delete" ON learning_progress;
    
    CREATE POLICY "learning_progress_select" ON learning_progress FOR SELECT USING (true);
    CREATE POLICY "learning_progress_insert" ON learning_progress FOR INSERT WITH CHECK (true);
    CREATE POLICY "learning_progress_update" ON learning_progress FOR UPDATE USING (true) WITH CHECK (true);
    CREATE POLICY "learning_progress_delete" ON learning_progress FOR DELETE USING (true);
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "user_notes_select" ON user_notes;
    DROP POLICY IF EXISTS "user_notes_insert" ON user_notes;
    DROP POLICY IF EXISTS "user_notes_update" ON user_notes;
    DROP POLICY IF EXISTS "user_notes_delete" ON user_notes;
    
    CREATE POLICY "user_notes_select" ON user_notes FOR SELECT USING (true);
    CREATE POLICY "user_notes_insert" ON user_notes FOR INSERT WITH CHECK (true);
    CREATE POLICY "user_notes_update" ON user_notes FOR UPDATE USING (true) WITH CHECK (true);
    CREATE POLICY "user_notes_delete" ON user_notes FOR DELETE USING (true);
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "user_subscriptions_select" ON user_subscriptions;
    DROP POLICY IF EXISTS "user_subscriptions_insert" ON user_subscriptions;
    DROP POLICY IF EXISTS "user_subscriptions_update" ON user_subscriptions;
    DROP POLICY IF EXISTS "user_subscriptions_delete" ON user_subscriptions;
    
    CREATE POLICY "user_subscriptions_select" ON user_subscriptions FOR SELECT USING (true);
    CREATE POLICY "user_subscriptions_insert" ON user_subscriptions FOR INSERT WITH CHECK (true);
    CREATE POLICY "user_subscriptions_update" ON user_subscriptions FOR UPDATE USING (true) WITH CHECK (true);
    CREATE POLICY "user_subscriptions_delete" ON user_subscriptions FOR DELETE USING (true);
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "user_credits_select" ON user_credits;
    DROP POLICY IF EXISTS "user_credits_insert" ON user_credits;
    DROP POLICY IF EXISTS "user_credits_update" ON user_credits;
    DROP POLICY IF EXISTS "user_credits_delete" ON user_credits;
    
    CREATE POLICY "user_credits_select" ON user_credits FOR SELECT USING (true);
    CREATE POLICY "user_credits_insert" ON user_credits FOR INSERT WITH CHECK (true);
    CREATE POLICY "user_credits_update" ON user_credits FOR UPDATE USING (true) WITH CHECK (true);
    CREATE POLICY "user_credits_delete" ON user_credits FOR DELETE USING (true);
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "credit_transactions_select" ON credit_transactions;
    DROP POLICY IF EXISTS "credit_transactions_insert" ON credit_transactions;
    DROP POLICY IF EXISTS "credit_transactions_update" ON credit_transactions;
    DROP POLICY IF EXISTS "credit_transactions_delete" ON credit_transactions;
    
    CREATE POLICY "credit_transactions_select" ON credit_transactions FOR SELECT USING (true);
    CREATE POLICY "credit_transactions_insert" ON credit_transactions FOR INSERT WITH CHECK (true);
    CREATE POLICY "credit_transactions_update" ON credit_transactions FOR UPDATE USING (true) WITH CHECK (true);
    CREATE POLICY "credit_transactions_delete" ON credit_transactions FOR DELETE USING (true);
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "achievement_definitions_select" ON achievement_definitions;
    DROP POLICY IF EXISTS "achievement_definitions_insert" ON achievement_definitions;
    DROP POLICY IF EXISTS "achievement_definitions_update" ON achievement_definitions;
    DROP POLICY IF EXISTS "achievement_definitions_delete" ON achievement_definitions;
    
    CREATE POLICY "achievement_definitions_select" ON achievement_definitions FOR SELECT USING (true);
    CREATE POLICY "achievement_definitions_insert" ON achievement_definitions FOR INSERT WITH CHECK (true);
    CREATE POLICY "achievement_definitions_update" ON achievement_definitions FOR UPDATE USING (true) WITH CHECK (true);
    CREATE POLICY "achievement_definitions_delete" ON achievement_definitions FOR DELETE USING (true);
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "user_achievements_select" ON user_achievements;
    DROP POLICY IF EXISTS "user_achievements_insert" ON user_achievements;
    DROP POLICY IF EXISTS "user_achievements_update" ON user_achievements;
    DROP POLICY IF EXISTS "user_achievements_delete" ON user_achievements;
    
    CREATE POLICY "user_achievements_select" ON user_achievements FOR SELECT USING (true);
    CREATE POLICY "user_achievements_insert" ON user_achievements FOR INSERT WITH CHECK (true);
    CREATE POLICY "user_achievements_update" ON user_achievements FOR UPDATE USING (true) WITH CHECK (true);
    CREATE POLICY "user_achievements_delete" ON user_achievements FOR DELETE USING (true);
END $$;

-- ============================================
-- CREATE TRIGGERS AND FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
DROP TRIGGER IF EXISTS update_learning_sessions_updated_at ON learning_sessions;
DROP TRIGGER IF EXISTS update_learning_progress_updated_at ON learning_progress;
DROP TRIGGER IF EXISTS update_user_notes_updated_at ON user_notes;
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;

-- Create triggers
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
-- VERIFICATION QUERIES
-- ============================================

-- Check if all tables exist
DO $$
DECLARE
    table_name TEXT;
    missing_tables TEXT[] := '{}';
BEGIN
    FOR table_name IN 
        SELECT unnest(ARRAY[
            'user_profiles', 'user_preferences', 'learning_sessions', 
            'conversation_messages', 'learning_progress', 'user_notes',
            'user_subscriptions', 'user_credits', 'credit_transactions',
            'achievement_definitions', 'user_achievements'
        ])
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✅ All tables created successfully';
    END IF;
END $$;

-- Check if RLS is enabled on all tables
DO $$
DECLARE
    table_name TEXT;
    rls_disabled TEXT[] := '{}';
BEGIN
    FOR table_name IN 
        SELECT unnest(ARRAY[
            'user_profiles', 'user_preferences', 'learning_sessions', 
            'conversation_messages', 'learning_progress', 'user_notes',
            'user_subscriptions', 'user_credits', 'credit_transactions',
            'achievement_definitions', 'user_achievements'
        ])
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = table_name AND rowsecurity = true) THEN
            rls_disabled := array_append(rls_disabled, table_name);
        END IF;
    END LOOP;
    
    IF array_length(rls_disabled, 1) > 0 THEN
        RAISE EXCEPTION 'RLS not enabled on: %', array_to_string(rls_disabled, ', ');
    ELSE
        RAISE NOTICE '✅ RLS enabled on all tables';
    END IF;
END $$;

-- Check if policies exist
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    IF policy_count >= 44 THEN -- 11 tables × 4 policies each
        RAISE NOTICE '✅ All RLS policies created (total: %)', policy_count;
    ELSE
        RAISE EXCEPTION 'Expected 44+ policies, found %', policy_count;
    END IF;
END $$;

-- ============================================
-- SETUP COMPLETE
-- ============================================

RAISE NOTICE '🎉 Database setup complete!';
RAISE NOTICE '📊 Tables: 11 created';
RAISE NOTICE '🔒 RLS: Enabled on all tables';
RAISE NOTICE '📝 Policies: Created for all operations';
RAISE NOTICE '🔍 Indexes: Created for performance';
RAISE NOTICE '🏆 Achievements: 5 default achievements inserted';
RAISE NOTICE '⚡ Triggers: Created for updated_at columns';
RAISE NOTICE '';
RAISE NOTICE '✅ Ready for AI Voice Tutor application!';
