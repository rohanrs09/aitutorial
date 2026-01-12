-- ============================================
-- ACHIEVEMENTS AND GOALS SYSTEM
-- ============================================

-- Achievement Definitions Table
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('sessions', 'streak', 'score', 'time', 'emotion', 'special')),
  criteria_type TEXT NOT NULL,
  criteria_threshold INTEGER NOT NULL,
  points INTEGER DEFAULT 10,
  is_secret BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL REFERENCES achievement_definitions(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own achievements" ON user_achievements;
CREATE POLICY "Users can update own achievements" ON user_achievements
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Learning Goals Table
CREATE TABLE IF NOT EXISTS learning_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('sessions', 'streak', 'topic', 'time', 'score')),
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'paused')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_goals_user_id ON learning_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_goals_status ON learning_goals(status);
CREATE INDEX IF NOT EXISTS idx_learning_goals_deadline ON learning_goals(deadline);

ALTER TABLE learning_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own goals" ON learning_goals;
CREATE POLICY "Users can view own goals" ON learning_goals
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own goals" ON learning_goals;
CREATE POLICY "Users can insert own goals" ON learning_goals
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own goals" ON learning_goals;
CREATE POLICY "Users can update own goals" ON learning_goals
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own goals" ON learning_goals;
CREATE POLICY "Users can delete own goals" ON learning_goals
  FOR DELETE USING (auth.uid()::text = user_id);

-- Insert default achievements
INSERT INTO achievement_definitions (id, name, description, icon, category, criteria_type, criteria_threshold, points) VALUES
  ('first_steps', 'First Steps', 'Complete your first learning session', '🎯', 'sessions', 'total_sessions', 1, 10),
  ('getting_started', 'Getting Started', 'Complete 5 learning sessions', '🚀', 'sessions', 'total_sessions', 5, 20),
  ('dedicated_learner', 'Dedicated Learner', 'Complete 10 learning sessions', '📚', 'sessions', 'total_sessions', 10, 30),
  ('learning_master', 'Learning Master', 'Complete 25 learning sessions', '🏆', 'sessions', 'total_sessions', 25, 50),
  ('week_warrior', 'Week Warrior', 'Maintain a 7-day learning streak', '🔥', 'streak', 'current_streak', 7, 40),
  ('consistency_king', 'Consistency King', 'Maintain a 14-day learning streak', '👑', 'streak', 'current_streak', 14, 60),
  ('unstoppable', 'Unstoppable', 'Maintain a 30-day learning streak', '⚡', 'streak', 'current_streak', 30, 100),
  ('perfect_score', 'Perfect Score', 'Get 100% on a quiz', '💯', 'score', 'quiz_score', 100, 30),
  ('high_achiever', 'High Achiever', 'Average score above 85%', '⭐', 'score', 'average_score', 85, 40),
  ('quick_learner', 'Quick Learner', 'Complete a session in under 15 minutes', '⚡', 'time', 'session_duration', 15, 20),
  ('marathon_learner', 'Marathon Learner', 'Complete a 60-minute session', '🏃', 'time', 'session_duration', 60, 30),
  ('time_invested', 'Time Invested', 'Spend 5 hours learning total', '⏰', 'time', 'total_minutes', 300, 40),
  ('engaged_learner', 'Engaged Learner', 'Maintain engaged emotion for 80% of a session', '😊', 'emotion', 'engaged_percentage', 80, 35),
  ('curious_mind', 'Curious Mind', 'Ask 20 questions in a single session', '🤔', 'special', 'questions_asked', 20, 25),
  ('note_taker', 'Note Taker', 'Generate notes in 10 sessions', '📝', 'special', 'sessions_with_notes', 10, 20),
  ('early_bird', 'Early Bird', 'Complete a session before 8 AM', '🌅', 'special', 'early_session', 1, 15),
  ('night_owl', 'Night Owl', 'Complete a session after 10 PM', '🦉', 'special', 'late_session', 1, 15)
ON CONFLICT (id) DO NOTHING;

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION check_achievements(p_user_id TEXT)
RETURNS TABLE (
  achievement_id TEXT,
  achievement_name TEXT,
  newly_unlocked BOOLEAN
) AS $$
DECLARE
  v_stats RECORD;
  v_achievement RECORD;
  v_exists BOOLEAN;
BEGIN
  -- Get user stats
  SELECT 
    COUNT(*) FILTER (WHERE ended_at IS NOT NULL) as total_sessions,
    COALESCE(MAX(quiz_score), 0) as max_quiz_score,
    COALESCE(AVG(quiz_score) FILTER (WHERE quiz_score IS NOT NULL), 0) as avg_score,
    COALESCE(SUM(duration_minutes), 0) as total_minutes
  INTO v_stats
  FROM learning_sessions
  WHERE (user_id = p_user_id OR clerk_user_id = p_user_id)
    AND ended_at IS NOT NULL;

  -- Check each achievement
  FOR v_achievement IN 
    SELECT * FROM achievement_definitions
  LOOP
    v_exists := EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = p_user_id AND achievement_id = v_achievement.id
    );

    -- Check criteria and unlock if met
    IF NOT v_exists THEN
      IF (v_achievement.criteria_type = 'total_sessions' AND v_stats.total_sessions >= v_achievement.criteria_threshold) OR
         (v_achievement.criteria_type = 'quiz_score' AND v_stats.max_quiz_score >= v_achievement.criteria_threshold) OR
         (v_achievement.criteria_type = 'average_score' AND v_stats.avg_score >= v_achievement.criteria_threshold) OR
         (v_achievement.criteria_type = 'total_minutes' AND v_stats.total_minutes >= v_achievement.criteria_threshold)
      THEN
        INSERT INTO user_achievements (user_id, achievement_id, progress)
        VALUES (p_user_id, v_achievement.id, 100);
        
        RETURN QUERY SELECT v_achievement.id, v_achievement.name, TRUE;
      END IF;
    ELSE
      RETURN QUERY SELECT v_achievement.id, v_achievement.name, FALSE;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update goal progress
CREATE OR REPLACE FUNCTION update_goal_progress(p_user_id TEXT)
RETURNS void AS $$
DECLARE
  v_goal RECORD;
  v_stats RECORD;
  v_new_value INTEGER;
BEGIN
  -- Get current user stats
  SELECT 
    COUNT(*) FILTER (WHERE ended_at IS NOT NULL) as total_sessions,
    COALESCE(SUM(duration_minutes), 0) as total_minutes,
    COALESCE(AVG(quiz_score) FILTER (WHERE quiz_score IS NOT NULL), 0) as avg_score
  INTO v_stats
  FROM learning_sessions
  WHERE (user_id = p_user_id OR clerk_user_id = p_user_id)
    AND ended_at IS NOT NULL
    AND started_at >= NOW() - INTERVAL '30 days'; -- Last 30 days

  -- Update each active goal
  FOR v_goal IN 
    SELECT * FROM learning_goals 
    WHERE user_id = p_user_id AND status = 'active'
  LOOP
    v_new_value := CASE v_goal.goal_type
      WHEN 'sessions' THEN v_stats.total_sessions
      WHEN 'time' THEN v_stats.total_minutes
      WHEN 'score' THEN v_stats.avg_score::INTEGER
      ELSE v_goal.current_value
    END;

    UPDATE learning_goals
    SET 
      current_value = v_new_value,
      status = CASE 
        WHEN v_new_value >= target_value THEN 'completed'
        WHEN deadline IS NOT NULL AND deadline < NOW() THEN 'failed'
        ELSE 'active'
      END,
      completed_at = CASE WHEN v_new_value >= target_value THEN NOW() ELSE completed_at END,
      updated_at = NOW()
    WHERE id = v_goal.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
