-- Add User Preferences Table
-- Stores per-user settings that mirror localStorage preferences

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  adaptive_learning BOOLEAN DEFAULT true,
  emotion_detection BOOLEAN DEFAULT true,
  notifications BOOLEAN DEFAULT true,
  sound_effects BOOLEAN DEFAULT true,
  dark_mode BOOLEAN DEFAULT true,
  preferred_voice TEXT DEFAULT 'alloy',
  preferred_language TEXT DEFAULT 'en',
  voice_speed DOUBLE PRECISION DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select user_preferences" ON user_preferences;
DROP POLICY IF EXISTS "Allow insert user_preferences" ON user_preferences;
DROP POLICY IF EXISTS "Allow update user_preferences" ON user_preferences;

CREATE POLICY "Allow select user_preferences" ON user_preferences
  FOR SELECT USING (true);

CREATE POLICY "Allow insert user_preferences" ON user_preferences
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update user_preferences" ON user_preferences
  FOR UPDATE USING (true);


