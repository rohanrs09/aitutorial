-- ============================================
-- AI VOICE TUTOR - COMPLETE DATABASE SCHEMA
-- Supabase Auth Migration
-- ============================================
-- This migration creates a clean schema for AI Voice Tutor
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: ENABLE EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- STEP 2: CREATE ALL TABLES
-- ============================================

-- 1. User Profiles Table (linked to auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'pro', 'unlimited')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'inactive')),
  sessions_this_month INTEGER DEFAULT 0 CHECK (sessions_this_month >= 0),
  sessions_limit INTEGER DEFAULT 100 CHECK (sessions_limit > 0),
  streak_days INTEGER DEFAULT 0 CHECK (streak_days >= 0),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Subscriptions Table
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'starter' CHECK (tier IN ('starter', 'pro', 'unlimited')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'inactive')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Credits Table
CREATE TABLE user_credits (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_credits INTEGER NOT NULL DEFAULT 50 CHECK (total_credits >= 0),
  used_credits INTEGER NOT NULL DEFAULT 0 CHECK (used_credits >= 0),
  bonus_credits INTEGER NOT NULL DEFAULT 0 CHECK (bonus_credits >= 0),
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Credit Transactions Table
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('subscription_reset', 'usage', 'bonus', 'refund', 'purchase')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Learning Sessions Table
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- 6. Learning Progress Table
CREATE TABLE learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('started', 'in_progress', 'completed', 'paused')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  content_position JSONB DEFAULT '{"currentStep": 0, "totalSteps": 0, "bookmarks": []}',
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Conversation Messages Table
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  emotion TEXT,
  audio_url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. User Notes Table
CREATE TABLE user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  is_auto_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Achievement Definitions Table
CREATE TABLE achievement_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10 CHECK (points > 0),
  requirement JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. User Achievements Table
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0),
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- 11. User Preferences Table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_enabled BOOLEAN DEFAULT true,
  emotion_detection_enabled BOOLEAN DEFAULT true,
  auto_generate_notes BOOLEAN DEFAULT true,
  difficulty_level TEXT DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  preferred_language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 12. Stripe Payments Table
CREATE TABLE stripe_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled', 'refunded')),
  payment_method TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Stripe Invoices Table
CREATE TABLE stripe_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT,
  amount_due INTEGER NOT NULL CHECK (amount_due >= 0),
  amount_paid INTEGER NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 3: INSERT DEFAULT DATA
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
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_last_active ON user_profiles(last_active_at DESC);

CREATE INDEX idx_user_subscriptions_tier ON user_subscriptions(tier);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);

CREATE INDEX idx_user_credits_last_reset ON user_credits(last_reset_at);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

CREATE INDEX idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX idx_learning_sessions_session_id ON learning_sessions(session_id);
CREATE INDEX idx_learning_sessions_started_at ON learning_sessions(started_at DESC);
CREATE INDEX idx_learning_sessions_topic ON learning_sessions(topic_name);

CREATE INDEX idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX idx_learning_progress_session_id ON learning_progress(session_id);
CREATE INDEX idx_learning_progress_status ON learning_progress(status);
CREATE INDEX idx_learning_progress_last_accessed ON learning_progress(last_accessed_at DESC);

CREATE INDEX idx_conversation_messages_session_id ON conversation_messages(session_id);
CREATE INDEX idx_conversation_messages_user_id ON conversation_messages(user_id);
CREATE INDEX idx_conversation_messages_timestamp ON conversation_messages(timestamp DESC);

CREATE INDEX idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX idx_user_notes_session_id ON user_notes(session_id);
CREATE INDEX idx_user_notes_created_at ON user_notes(created_at DESC);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

CREATE INDEX idx_stripe_payments_user_id ON stripe_payments(user_id);
CREATE INDEX idx_stripe_payments_intent_id ON stripe_payments(stripe_payment_intent_id);
CREATE INDEX idx_stripe_payments_status ON stripe_payments(status);
CREATE INDEX idx_stripe_payments_created_at ON stripe_payments(created_at DESC);

CREATE INDEX idx_stripe_invoices_user_id ON stripe_invoices(user_id);
CREATE INDEX idx_stripe_invoices_invoice_id ON stripe_invoices(stripe_invoice_id);
CREATE INDEX idx_stripe_invoices_subscription_id ON stripe_invoices(stripe_subscription_id);
CREATE INDEX idx_stripe_invoices_status ON stripe_invoices(status);

-- ============================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_invoices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================

-- User Profiles: Users can only access their own profile
CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "user_profiles_delete" ON user_profiles FOR DELETE USING (auth.uid() = id);

-- User Subscriptions: Users can only access their own subscription
CREATE POLICY "user_subscriptions_select" ON user_subscriptions FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_subscriptions_insert" ON user_subscriptions FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "user_subscriptions_update" ON user_subscriptions FOR UPDATE USING (auth.uid() = id);

-- User Credits: Users can only access their own credits
CREATE POLICY "user_credits_select" ON user_credits FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_credits_insert" ON user_credits FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "user_credits_update" ON user_credits FOR UPDATE USING (auth.uid() = id);

-- Credit Transactions: Users can only view their own transactions
CREATE POLICY "credit_transactions_select" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "credit_transactions_insert" ON credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Learning Sessions: Users can only access their own sessions
CREATE POLICY "learning_sessions_select" ON learning_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "learning_sessions_insert" ON learning_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "learning_sessions_update" ON learning_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Learning Progress: Users can only access their own progress
CREATE POLICY "learning_progress_select" ON learning_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "learning_progress_insert" ON learning_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "learning_progress_update" ON learning_progress FOR UPDATE USING (auth.uid() = user_id);

-- Conversation Messages: Users can only access their own messages
CREATE POLICY "conversation_messages_select" ON conversation_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "conversation_messages_insert" ON conversation_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Notes: Users can only access their own notes
CREATE POLICY "user_notes_select" ON user_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_notes_insert" ON user_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_notes_update" ON user_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_notes_delete" ON user_notes FOR DELETE USING (auth.uid() = user_id);

-- Achievement Definitions: Anyone can read
CREATE POLICY "achievement_definitions_select" ON achievement_definitions FOR SELECT USING (true);

-- User Achievements: Users can only access their own achievements
CREATE POLICY "user_achievements_select" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_achievements_insert" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Preferences: Users can only access their own preferences
CREATE POLICY "user_preferences_select" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_preferences_insert" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_preferences_update" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Stripe Payments: Users can only access their own payments
CREATE POLICY "stripe_payments_select" ON stripe_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "stripe_payments_insert" ON stripe_payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stripe Invoices: Users can only access their own invoices
CREATE POLICY "stripe_invoices_select" ON stripe_invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "stripe_invoices_insert" ON stripe_invoices FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STEP 7: CREATE TRIGGERS FOR AUTO-UPDATE
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON user_credits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_sessions_updated_at BEFORE UPDATE ON learning_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_progress_updated_at BEFORE UPDATE ON learning_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_notes_updated_at BEFORE UPDATE ON user_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stripe_payments_updated_at BEFORE UPDATE ON stripe_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stripe_invoices_updated_at BEFORE UPDATE ON stripe_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 8: AUTO-CREATE USER DATA ON SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO user_profiles (id, email, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create subscription with starter tier
  INSERT INTO user_subscriptions (id, tier, status)
  VALUES (NEW.id, 'starter', 'active');
  
  -- Create credits with 50 starter credits
  INSERT INTO user_credits (id, total_credits, used_credits, bonus_credits)
  VALUES (NEW.id, 50, 0, 0);
  
  -- Create default preferences
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- STEP 9: GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant all privileges on all tables to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant all privileges on all sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, service_role;

-- Grant execute on all functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, service_role;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database schema created successfully!';
  RAISE NOTICE '📊 Tables created: 11 tables';
  RAISE NOTICE '🔒 RLS enabled on all tables with proper policies';
  RAISE NOTICE '⚡ Triggers: Auto-create user data on signup, auto-update timestamps';
  RAISE NOTICE '📈 Indexes: Created for optimal query performance';
  RAISE NOTICE '🎉 Ready for AI Voice Tutor with Supabase Auth!';
END $$;
