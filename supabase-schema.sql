-- AI Voice Tutor Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Learning Topics Table
CREATE TABLE IF NOT EXISTS learning_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Learning Sessions Table
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT UNIQUE NOT NULL,
  topic TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE,
  total_messages INTEGER DEFAULT 0,
  emotions_detected TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conversation Messages Table
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  emotion TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES learning_sessions(session_id) ON DELETE CASCADE
);

-- User Progress Table (optional - for tracking learning progress)
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  topic_id UUID REFERENCES learning_topics(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  quiz_score INTEGER,
  notes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON learning_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON conversation_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON user_progress(user_id);

-- Insert default learning topics
INSERT INTO learning_topics (name, category, description) VALUES
  ('Law of Diminishing Returns', 'Economics', 'Understanding how additional inputs eventually yield smaller increases in output'),
  ('Binary Search Algorithm', 'Data Structures & Algorithms', 'Efficient search algorithm for sorted arrays using divide and conquer'),
  ('Recursion', 'Data Structures & Algorithms', 'A function calling itself to solve problems by breaking them into smaller subproblems'),
  ('Percentages & Applications', 'Aptitude', 'Understanding percentage calculations, profit/loss, discount, and interest'),
  ('Profit and Loss', 'Aptitude', 'Calculating profit, loss, cost price, and selling price in business scenarios'),
  ('GRE Quantitative Reasoning', 'GRE Prep', 'Arithmetic, algebra, geometry, and data analysis for GRE'),
  ('GRE Verbal Reasoning', 'GRE Prep', 'Reading comprehension, text completion, and sentence equivalence'),
  ('Object-Oriented Programming Basics', 'Programming', 'Classes, objects, inheritance, polymorphism, and encapsulation')
ON CONFLICT DO NOTHING;

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE learning_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Public read access for learning topics
CREATE POLICY "Allow public read access on learning_topics"
  ON learning_topics FOR SELECT
  TO public
  USING (true);

-- Allow anyone to insert sessions and messages (for MVP without auth)
CREATE POLICY "Allow public insert on learning_sessions"
  ON learning_sessions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read on learning_sessions"
  ON learning_sessions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on conversation_messages"
  ON conversation_messages FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read on conversation_messages"
  ON conversation_messages FOR SELECT
  TO public
  USING (true);

-- For production with authentication, replace above policies with:
-- CREATE POLICY "Users can read their own sessions"
--   ON learning_sessions FOR SELECT
--   TO authenticated
--   USING (auth.uid()::text = user_id);
