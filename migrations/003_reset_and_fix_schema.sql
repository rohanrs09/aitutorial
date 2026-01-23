-- ============================================
-- AI Voice Tutor - Database Schema Reset & Fix
-- ============================================
-- Run this SQL in Supabase SQL Editor to reset and fix all tables
-- This ensures proper user-based data mapping with Clerk authentication
-- ============================================

-- STEP 1: Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS concept_mastery CASCADE;
DROP TABLE IF EXISTS user_notes CASCADE;
DROP TABLE IF EXISTS session_messages CASCADE;
DROP TABLE IF EXISTS conversation_messages CASCADE;
DROP TABLE IF EXISTS learning_progress CASCADE;
DROP TABLE IF EXISTS learning_sessions CASCADE;
DROP TABLE IF EXISTS learning_topics CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- ============================================
-- STEP 2: Create Tables with Proper Schema
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

-- 3. Learning Sessions Table (CRITICAL - main session tracking)
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
  quiz_score INTEGER,
  emotions_detected TEXT[],
  primary_emotion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Conversation Messages Table (chat history)
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

-- 5. Learning Progress Table (tracks progress per session)
CREATE TABLE learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  session_id TEXT UNIQUE NOT NULL,
  topic_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('started', 'in_progress', 'completed', 'paused')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  content_position JSONB DEFAULT '{"currentStep": 0, "totalSteps": 0, "bookmarks": []}',
  concepts_covered TEXT[],
  primary_emotion TEXT,
  quiz_score INTEGER,
  total_time_minutes INTEGER DEFAULT 0,
  mastery_level INTEGER CHECK (mastery_level >= 0 AND mastery_level <= 100),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Session Notes Table
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

-- 7. User Achievements Table
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  achievement_key TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clerk_user_id, achievement_key)
);

-- ============================================
-- STEP 3: Create Indexes for Performance
-- ============================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_clerk_user_id ON user_profiles(clerk_user_id);

-- Learning sessions indexes
CREATE INDEX idx_learning_sessions_clerk_user_id ON learning_sessions(clerk_user_id);
CREATE INDEX idx_learning_sessions_session_id ON learning_sessions(session_id);
CREATE INDEX idx_learning_sessions_started_at ON learning_sessions(started_at DESC);
CREATE INDEX idx_learning_sessions_ended_at ON learning_sessions(ended_at);

-- Conversation messages indexes
CREATE INDEX idx_conversation_messages_clerk_user_id ON conversation_messages(clerk_user_id);
CREATE INDEX idx_conversation_messages_session_id ON conversation_messages(session_id);

-- Learning progress indexes
CREATE INDEX idx_learning_progress_clerk_user_id ON learning_progress(clerk_user_id);
CREATE INDEX idx_learning_progress_session_id ON learning_progress(session_id);
CREATE INDEX idx_learning_progress_status ON learning_progress(status);
CREATE INDEX idx_learning_progress_last_accessed ON learning_progress(last_accessed_at DESC);

-- User notes indexes
CREATE INDEX idx_user_notes_clerk_user_id ON user_notes(clerk_user_id);
CREATE INDEX idx_user_notes_session_id ON user_notes(session_id);

-- User achievements indexes
CREATE INDEX idx_user_achievements_clerk_user_id ON user_achievements(clerk_user_id);

-- ============================================
-- STEP 4: Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Create RLS Policies (Allow all for now - app handles auth)
-- ============================================

-- User Profiles policies
CREATE POLICY "Allow all on user_profiles" ON user_profiles FOR ALL USING (true) WITH CHECK (true);

-- User Preferences policies
CREATE POLICY "Allow all on user_preferences" ON user_preferences FOR ALL USING (true) WITH CHECK (true);

-- Learning Sessions policies
CREATE POLICY "Allow all on learning_sessions" ON learning_sessions FOR ALL USING (true) WITH CHECK (true);

-- Conversation Messages policies
CREATE POLICY "Allow all on conversation_messages" ON conversation_messages FOR ALL USING (true) WITH CHECK (true);

-- Learning Progress policies
CREATE POLICY "Allow all on learning_progress" ON learning_progress FOR ALL USING (true) WITH CHECK (true);

-- User Notes policies
CREATE POLICY "Allow all on user_notes" ON user_notes FOR ALL USING (true) WITH CHECK (true);

-- User Achievements policies
CREATE POLICY "Allow all on user_achievements" ON user_achievements FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- STEP 6: Create Helper Functions
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_sessions_updated_at BEFORE UPDATE ON learning_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_progress_updated_at BEFORE UPDATE ON learning_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notes_updated_at BEFORE UPDATE ON user_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 7: Quiz System Tables
-- ============================================

-- 8. Quiz Sessions Table (tracks individual quiz attempts)
CREATE TABLE quiz_sessions (
  id TEXT PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Quiz configuration
  topic TEXT NOT NULL,
  module_id TEXT,  -- Links to course module
  difficulty TEXT NOT NULL DEFAULT 'mixed' CHECK (difficulty IN ('easy', 'medium', 'hard', 'mixed')),
  
  -- Questions and answers stored as JSONB
  questions JSONB NOT NULL DEFAULT '[]',
  attempts JSONB NOT NULL DEFAULT '[]',
  
  -- Scoring
  score INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  average_time_per_question INTEGER DEFAULT 0,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed', 'abandoned')),
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Quiz Results Table (stores completed quiz results for analytics)
CREATE TABLE quiz_results (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Result details
  topic TEXT NOT NULL,
  module_id TEXT,
  difficulty TEXT NOT NULL DEFAULT 'mixed',
  
  -- Scores
  score INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL,
  
  -- Question stats
  questions_attempted INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_spent INTEGER NOT NULL DEFAULT 0, -- seconds
  
  -- Performance breakdown
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  difficulty_breakdown JSONB DEFAULT '{}',
  question_results JSONB DEFAULT '[]', -- Detailed per-question results
  
  -- Timestamps
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Quiz Analytics Table (aggregated performance per topic)
CREATE TABLE quiz_analytics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  clerk_user_id TEXT NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Topic-specific analytics
  topic TEXT NOT NULL,
  module_id TEXT,
  
  -- Aggregate metrics
  total_quizzes INTEGER NOT NULL DEFAULT 0,
  total_questions_attempted INTEGER NOT NULL DEFAULT 0,
  total_correct_answers INTEGER NOT NULL DEFAULT 0,
  average_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  average_accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  total_time_spent INTEGER NOT NULL DEFAULT 0,
  
  -- Performance trend
  performance_trend TEXT NOT NULL DEFAULT 'stable' CHECK (performance_trend IN ('improving', 'stable', 'declining')),
  last_5_scores INTEGER[] DEFAULT '{}',
  
  -- Difficulty performance
  easy_accuracy DECIMAL(5,2) DEFAULT 0,
  medium_accuracy DECIMAL(5,2) DEFAULT 0,
  hard_accuracy DECIMAL(5,2) DEFAULT 0,
  
  -- Mastery tracking
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  
  -- Subtopic performance (JSON map of subtopic -> accuracy)
  subtopic_performance JSONB DEFAULT '{}',
  
  -- Timestamps
  first_attempt_at TIMESTAMP WITH TIME ZONE,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(clerk_user_id, topic)
);

-- 11. Quiz Recommendations Table
CREATE TABLE quiz_recommendations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  clerk_user_id TEXT NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Recommendation details
  recommended_topic TEXT NOT NULL,
  module_id TEXT,
  reason TEXT NOT NULL CHECK (reason IN ('weak_area', 'not_attempted', 'needs_practice', 'mastery_check', 'scheduled_review')),
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  
  -- Suggested configuration
  suggested_difficulty TEXT NOT NULL DEFAULT 'medium',
  suggested_question_count INTEGER NOT NULL DEFAULT 5,
  focus_subtopics TEXT[] DEFAULT '{}',
  
  -- Context
  based_on_results TEXT[] DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed', 'completed')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE
);

-- 12. Topic Mastery Table (tracks mastery per topic with linkage to learning progress)
CREATE TABLE topic_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Topic identification
  topic TEXT NOT NULL,
  module_id TEXT,
  
  -- Mastery metrics
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  confidence_score DECIMAL(5,2) DEFAULT 0,
  
  -- Learning linkage
  learning_sessions_count INTEGER DEFAULT 0,
  quiz_sessions_count INTEGER DEFAULT 0,
  total_study_time INTEGER DEFAULT 0, -- minutes
  
  -- Subtopic mastery (JSON map)
  subtopic_mastery JSONB DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'learning' CHECK (status IN ('not_started', 'learning', 'practicing', 'mastered')),
  
  -- Timestamps
  first_learned_at TIMESTAMP WITH TIME ZONE,
  last_practiced_at TIMESTAMP WITH TIME ZONE,
  mastered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(clerk_user_id, topic)
);

-- ============================================
-- STEP 8: Quiz System Indexes
-- ============================================

-- Quiz sessions indexes
CREATE INDEX idx_quiz_sessions_clerk_user_id ON quiz_sessions(clerk_user_id);
CREATE INDEX idx_quiz_sessions_topic ON quiz_sessions(topic);
CREATE INDEX idx_quiz_sessions_status ON quiz_sessions(status);
CREATE INDEX idx_quiz_sessions_started_at ON quiz_sessions(started_at DESC);

-- Quiz results indexes
CREATE INDEX idx_quiz_results_clerk_user_id ON quiz_results(clerk_user_id);
CREATE INDEX idx_quiz_results_session_id ON quiz_results(session_id);
CREATE INDEX idx_quiz_results_topic ON quiz_results(topic);
CREATE INDEX idx_quiz_results_completed_at ON quiz_results(completed_at DESC);

-- Quiz analytics indexes
CREATE INDEX idx_quiz_analytics_clerk_user_id ON quiz_analytics(clerk_user_id);
CREATE INDEX idx_quiz_analytics_topic ON quiz_analytics(topic);
CREATE INDEX idx_quiz_analytics_user_topic ON quiz_analytics(clerk_user_id, topic);

-- Quiz recommendations indexes
CREATE INDEX idx_quiz_recommendations_clerk_user_id ON quiz_recommendations(clerk_user_id);
CREATE INDEX idx_quiz_recommendations_status ON quiz_recommendations(status);
CREATE INDEX idx_quiz_recommendations_priority ON quiz_recommendations(priority DESC);

-- Topic mastery indexes
CREATE INDEX idx_topic_mastery_clerk_user_id ON topic_mastery(clerk_user_id);
CREATE INDEX idx_topic_mastery_topic ON topic_mastery(topic);
CREATE INDEX idx_topic_mastery_status ON topic_mastery(status);

-- ============================================
-- STEP 9: Enable RLS for Quiz Tables
-- ============================================

ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_mastery ENABLE ROW LEVEL SECURITY;

-- Quiz Sessions policies
CREATE POLICY "Allow all on quiz_sessions" ON quiz_sessions FOR ALL USING (true) WITH CHECK (true);

-- Quiz Results policies
CREATE POLICY "Allow all on quiz_results" ON quiz_results FOR ALL USING (true) WITH CHECK (true);

-- Quiz Analytics policies
CREATE POLICY "Allow all on quiz_analytics" ON quiz_analytics FOR ALL USING (true) WITH CHECK (true);

-- Quiz Recommendations policies
CREATE POLICY "Allow all on quiz_recommendations" ON quiz_recommendations FOR ALL USING (true) WITH CHECK (true);

-- Topic Mastery policies
CREATE POLICY "Allow all on topic_mastery" ON topic_mastery FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- STEP 10: Quiz Helper Functions
-- ============================================

-- Function to calculate performance trend from scores array
CREATE OR REPLACE FUNCTION calculate_performance_trend(scores INTEGER[])
RETURNS TEXT AS $$
DECLARE
  first_half_avg DECIMAL;
  second_half_avg DECIMAL;
  mid_point INTEGER;
  arr_length INTEGER;
BEGIN
  arr_length := array_length(scores, 1);
  IF arr_length IS NULL OR arr_length < 3 THEN
    RETURN 'stable';
  END IF;
  
  mid_point := arr_length / 2;
  
  SELECT AVG(s) INTO first_half_avg FROM unnest(scores[1:mid_point]) AS s;
  SELECT AVG(s) INTO second_half_avg FROM unnest(scores[mid_point+1:arr_length]) AS s;
  
  IF second_half_avg > first_half_avg + 5 THEN
    RETURN 'improving';
  ELSIF second_half_avg < first_half_avg - 5 THEN
    RETURN 'declining';
  ELSE
    RETURN 'stable';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate mastery level based on accuracy and consistency
CREATE OR REPLACE FUNCTION calculate_mastery_level(
  avg_accuracy DECIMAL,
  total_quizzes INTEGER,
  trend TEXT
)
RETURNS INTEGER AS $$
DECLARE
  base_mastery INTEGER;
  consistency_bonus INTEGER;
  trend_modifier INTEGER;
BEGIN
  -- Base mastery from accuracy
  base_mastery := LEAST(GREATEST(ROUND(avg_accuracy * 0.8), 0), 80);
  
  -- Consistency bonus (up to 15 points for 10+ quizzes)
  consistency_bonus := LEAST(total_quizzes * 1.5, 15);
  
  -- Trend modifier
  IF trend = 'improving' THEN
    trend_modifier := 5;
  ELSIF trend = 'declining' THEN
    trend_modifier := -5;
  ELSE
    trend_modifier := 0;
  END IF;
  
  RETURN LEAST(GREATEST(base_mastery + consistency_bonus + trend_modifier, 0), 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function to auto-update quiz analytics on result insert
CREATE OR REPLACE FUNCTION update_quiz_analytics_on_result()
RETURNS TRIGGER AS $$
DECLARE
  existing_analytics RECORD;
  new_scores INTEGER[];
  correct_count INTEGER;
BEGIN
  -- Get existing analytics for this user and topic
  SELECT * INTO existing_analytics
  FROM quiz_analytics
  WHERE clerk_user_id = NEW.clerk_user_id AND topic = NEW.topic;
  
  correct_count := ROUND(NEW.questions_attempted * NEW.accuracy / 100);
  
  IF existing_analytics IS NULL THEN
    -- Create new analytics record
    INSERT INTO quiz_analytics (
      clerk_user_id,
      topic,
      module_id,
      total_quizzes,
      total_questions_attempted,
      total_correct_answers,
      average_score,
      average_accuracy,
      best_score,
      total_time_spent,
      last_5_scores,
      first_attempt_at,
      last_attempt_at,
      mastery_level
    ) VALUES (
      NEW.clerk_user_id,
      NEW.topic,
      NEW.module_id,
      1,
      NEW.questions_attempted,
      correct_count,
      NEW.score,
      NEW.accuracy,
      NEW.score,
      NEW.time_spent,
      ARRAY[NEW.score],
      NEW.completed_at,
      NEW.completed_at,
      calculate_mastery_level(NEW.accuracy, 1, 'stable')
    );
  ELSE
    -- Update existing analytics
    new_scores := existing_analytics.last_5_scores || NEW.score;
    IF array_length(new_scores, 1) > 5 THEN
      new_scores := new_scores[array_length(new_scores, 1)-4:array_length(new_scores, 1)];
    END IF;
    
    UPDATE quiz_analytics SET
      total_quizzes = total_quizzes + 1,
      total_questions_attempted = total_questions_attempted + NEW.questions_attempted,
      total_correct_answers = total_correct_answers + correct_count,
      average_score = ROUND((average_score * total_quizzes + NEW.score) / (total_quizzes + 1), 2),
      average_accuracy = ROUND((average_accuracy * total_quizzes + NEW.accuracy) / (total_quizzes + 1), 2),
      best_score = GREATEST(best_score, NEW.score),
      total_time_spent = total_time_spent + NEW.time_spent,
      last_5_scores = new_scores,
      performance_trend = calculate_performance_trend(new_scores),
      last_attempt_at = NEW.completed_at,
      mastery_level = calculate_mastery_level(
        ROUND((average_accuracy * total_quizzes + NEW.accuracy) / (total_quizzes + 1), 2),
        total_quizzes + 1,
        calculate_performance_trend(new_scores)
      ),
      updated_at = NOW()
    WHERE clerk_user_id = NEW.clerk_user_id AND topic = NEW.topic;
  END IF;
  
  -- Also update or create topic_mastery record
  INSERT INTO topic_mastery (clerk_user_id, topic, module_id, quiz_sessions_count, last_practiced_at)
  VALUES (NEW.clerk_user_id, NEW.topic, NEW.module_id, 1, NEW.completed_at)
  ON CONFLICT (clerk_user_id, topic) DO UPDATE SET
    quiz_sessions_count = topic_mastery.quiz_sessions_count + 1,
    last_practiced_at = NEW.completed_at,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating analytics
DROP TRIGGER IF EXISTS trigger_update_quiz_analytics ON quiz_results;
CREATE TRIGGER trigger_update_quiz_analytics
  AFTER INSERT ON quiz_results
  FOR EACH ROW
  EXECUTE FUNCTION update_quiz_analytics_on_result();

-- Trigger function to update topic_mastery when learning_progress is updated
CREATE OR REPLACE FUNCTION update_topic_mastery_on_learning()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO topic_mastery (clerk_user_id, topic, learning_sessions_count, total_study_time, first_learned_at, status)
  VALUES (
    NEW.clerk_user_id, 
    NEW.topic_name, 
    1, 
    COALESCE(NEW.total_time_minutes, 0),
    NEW.started_at,
    'learning'
  )
  ON CONFLICT (clerk_user_id, topic) DO UPDATE SET
    learning_sessions_count = topic_mastery.learning_sessions_count + 1,
    total_study_time = topic_mastery.total_study_time + COALESCE(NEW.total_time_minutes, 0),
    status = CASE 
      WHEN topic_mastery.mastery_level >= 80 THEN 'mastered'
      WHEN topic_mastery.quiz_sessions_count > 0 THEN 'practicing'
      ELSE 'learning'
    END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for learning progress
DROP TRIGGER IF EXISTS trigger_update_topic_mastery ON learning_progress;
CREATE TRIGGER trigger_update_topic_mastery
  AFTER INSERT OR UPDATE ON learning_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_mastery_on_learning();

-- Create triggers for updated_at on new tables
CREATE TRIGGER update_quiz_sessions_updated_at BEFORE UPDATE ON quiz_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_analytics_updated_at BEFORE UPDATE ON quiz_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topic_mastery_updated_at BEFORE UPDATE ON topic_mastery
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 11: Views for Easy Querying
-- ============================================

-- View: User's complete learning profile with quiz performance
CREATE OR REPLACE VIEW user_learning_profile AS
SELECT 
  up.clerk_user_id,
  up.email,
  up.first_name,
  up.last_name,
  up.streak_days,
  up.last_active_at,
  COUNT(DISTINCT ls.id) as total_learning_sessions,
  COUNT(DISTINCT qs.id) as total_quiz_sessions,
  COALESCE(AVG(qr.accuracy), 0) as overall_quiz_accuracy,
  COUNT(DISTINCT lp.topic_name) as topics_studied
FROM user_profiles up
LEFT JOIN learning_sessions ls ON up.clerk_user_id = ls.clerk_user_id
LEFT JOIN quiz_sessions qs ON up.clerk_user_id = qs.clerk_user_id
LEFT JOIN quiz_results qr ON up.clerk_user_id = qr.clerk_user_id
LEFT JOIN learning_progress lp ON up.clerk_user_id = lp.clerk_user_id
GROUP BY up.id, up.clerk_user_id, up.email, up.first_name, up.last_name, up.streak_days, up.last_active_at;

-- View: Topic performance summary
CREATE OR REPLACE VIEW topic_performance_summary AS
SELECT 
  tm.clerk_user_id,
  tm.topic,
  tm.module_id,
  tm.mastery_level,
  tm.status,
  tm.learning_sessions_count,
  tm.quiz_sessions_count,
  tm.total_study_time,
  qa.average_accuracy,
  qa.performance_trend,
  qa.best_score,
  qa.last_attempt_at
FROM topic_mastery tm
LEFT JOIN quiz_analytics qa ON tm.clerk_user_id = qa.clerk_user_id AND tm.topic = qa.topic;

-- ============================================
-- VERIFICATION: Check tables were created
-- ============================================
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'user_preferences', 'learning_sessions', 
                   'conversation_messages', 'learning_progress', 'user_notes', 'user_achievements',
                   'quiz_sessions', 'quiz_results', 'quiz_analytics', 'quiz_recommendations', 'topic_mastery');
