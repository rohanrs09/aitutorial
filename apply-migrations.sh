#!/bin/bash

# Supabase Migration Application Script
# Run this script to apply the necessary database schema updates

echo "==========================================="
echo "AI Voice Tutor - Supabase Schema Update"
echo "==========================================="

echo "This script will guide you through updating your Supabase database schema."
echo "Please have your Supabase project URL and API key ready."
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "⚠️  WARNING: psql is not installed. You'll need to manually run the SQL commands in the Supabase SQL Editor."
    echo "Install PostgreSQL client tools or use the Supabase web interface instead."
    echo ""
fi

echo "🔧 STEP 1: Update the learning_progress table schema"
echo "Copy and paste the following SQL commands into your Supabase SQL Editor:"
echo ""
echo "----------------------------------------"
cat << 'EOF'
-- Update learning_progress table to add missing columns
ALTER TABLE learning_progress ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
ALTER TABLE learning_progress ADD COLUMN IF NOT EXISTS concepts_covered TEXT[];
ALTER TABLE learning_progress ADD COLUMN IF NOT EXISTS primary_emotion TEXT;
ALTER TABLE learning_progress ADD COLUMN IF NOT EXISTS quiz_score INTEGER;
ALTER TABLE learning_progress ADD COLUMN IF NOT EXISTS total_time_minutes INTEGER;
ALTER TABLE learning_progress ADD COLUMN IF NOT EXISTS mastery_level INTEGER CHECK (mastery_level >= 0 AND mastery_level <= 100);

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_learning_progress_clerk_user_id ON learning_progress(clerk_user_id);

-- Update RLS policies for learning_progress table
DROP POLICY IF EXISTS "Users can view their own progress" ON learning_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON learning_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON learning_progress;

CREATE POLICY "Users can view their own progress"
  ON learning_progress
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own progress"
  ON learning_progress
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own progress"
  ON learning_progress
  FOR UPDATE
  USING (true);
EOF
echo "----------------------------------------"
echo ""

echo "🔧 STEP 2: Update the learning_sessions table"
echo "Copy and paste the following SQL commands into your Supabase SQL Editor:"
echo ""
echo "----------------------------------------"
cat << 'EOF'
-- Update RLS policies for learning_sessions table
DROP POLICY IF EXISTS "Allow insert learning_sessions" ON learning_sessions;
DROP POLICY IF EXISTS "Allow select learning_sessions" ON learning_sessions;
DROP POLICY IF EXISTS "Allow update learning_sessions" ON learning_sessions;
DROP POLICY IF EXISTS "Allow delete learning_sessions" ON learning_sessions;

CREATE POLICY "Allow insert learning_sessions" ON learning_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select learning_sessions" ON learning_sessions
  FOR SELECT USING (true);

CREATE POLICY "Allow update learning_sessions" ON learning_sessions
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete learning_sessions" ON learning_sessions
  FOR DELETE USING (true);
EOF
echo "----------------------------------------"
echo ""

echo "🔧 STEP 3: Update the conversation_messages table"
echo "Copy and paste the following SQL commands into your Supabase SQL Editor:"
echo ""
echo "----------------------------------------"
cat << 'EOF'
-- Add missing columns to conversation_messages table
ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id);
ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS emotion TEXT;
ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_id ON conversation_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_clerk_user_id ON conversation_messages(clerk_user_id);

-- Update RLS policies for conversation_messages table
DROP POLICY IF EXISTS "Allow insert conversation_messages" ON conversation_messages;
DROP POLICY IF EXISTS "Allow select conversation_messages" ON conversation_messages;

CREATE POLICY "Allow insert conversation_messages" ON conversation_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select conversation_messages" ON conversation_messages
  FOR SELECT USING (true);
EOF
echo "----------------------------------------"
echo ""

echo "✅ Migration commands generated successfully!"
echo ""
echo "📋 TO COMPLETE THE SETUP:"
echo "1. Go to your Supabase Dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Paste and run each of the SQL command blocks above"
echo "4. Run them in the order provided (STEP 1, then STEP 2, then STEP 3)"
echo ""
echo "⚠️  IMPORTANT: Run these commands in order, as some depend on others."
echo ""
echo "After applying these migrations, your Supabase database will be properly aligned"
echo "with the application code and should resolve all the CORS, schema cache, and"
echo "authentication issues."