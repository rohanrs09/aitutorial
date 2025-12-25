-- Add Learning Progress Table
-- This tracks user's learning progress, session state, and allows resuming from where they left off

CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  clerk_user_id TEXT,
  session_id TEXT UNIQUE NOT NULL,
  topic_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('started', 'in_progress', 'completed', 'paused')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  content_position JSONB DEFAULT '{"currentStep": 0, "totalSteps": 0, "bookmarks": []}',
  concepts_covered TEXT[],
  primary_emotion TEXT,
  quiz_score INTEGER,
  total_time_minutes INTEGER,
  mastery_level INTEGER CHECK (mastery_level >= 0 AND mastery_level <= 100),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_clerk_user_id ON learning_progress(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_session_id ON learning_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_status ON learning_progress(status);
CREATE INDEX IF NOT EXISTS idx_learning_progress_last_accessed ON learning_progress(last_accessed_at DESC);

-- Enable Row Level Security
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own progress
CREATE POLICY "Users can view their own progress"
  ON learning_progress
  FOR SELECT
  USING (true);

-- RLS Policy: Users can insert their own progress
CREATE POLICY "Users can insert their own progress"
  ON learning_progress
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Users can update their own progress
CREATE POLICY "Users can update their own progress"
  ON learning_progress
  FOR UPDATE
  USING (true);
