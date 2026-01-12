-- ============================================
-- PRODUCTION RLS POLICIES
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public read on user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow insert on user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow insert learning_sessions" ON learning_sessions;
DROP POLICY IF EXISTS "Allow select learning_sessions" ON learning_sessions;
DROP POLICY IF EXISTS "Allow update learning_sessions" ON learning_sessions;
DROP POLICY IF EXISTS "Allow delete learning_sessions" ON learning_sessions;

-- User Profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid()::text = clerk_user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = clerk_user_id)
  WITH CHECK (auth.uid()::text = clerk_user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = clerk_user_id);

-- Learning Sessions
CREATE POLICY "Users can view own sessions" ON learning_sessions
  FOR SELECT USING (user_id IS NULL OR auth.uid()::text = user_id);

CREATE POLICY "Users can create sessions" ON learning_sessions
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid()::text = user_id);

CREATE POLICY "Users can update own sessions" ON learning_sessions
  FOR UPDATE USING (user_id IS NULL OR auth.uid()::text = user_id)
  WITH CHECK (user_id IS NULL OR auth.uid()::text = user_id);

CREATE POLICY "Users can delete own sessions" ON learning_sessions
  FOR DELETE USING (user_id IS NULL OR auth.uid()::text = user_id);

-- Conversation Messages
CREATE POLICY "Users can view own messages" ON conversation_messages
  FOR SELECT USING (
    user_id IS NULL OR 
    auth.uid()::text = user_id OR
    session_id IN (SELECT session_id FROM learning_sessions WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "Users can create messages" ON conversation_messages
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid()::text = user_id);

-- Session Notes
CREATE POLICY "Users can view own notes" ON session_notes
  FOR SELECT USING (user_id IS NULL OR auth.uid()::text = user_id);

CREATE POLICY "Users can create notes" ON session_notes
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid()::text = user_id);

CREATE POLICY "Users can update own notes" ON session_notes
  FOR UPDATE USING (user_id IS NULL OR auth.uid()::text = user_id)
  WITH CHECK (user_id IS NULL OR auth.uid()::text = user_id);

-- User Progress
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- User Achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
