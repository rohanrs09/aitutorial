# Database Schema for Quiz System

## Required Supabase Tables

### 1. quiz_sessions

Stores active and completed quiz sessions.

```sql
CREATE TABLE quiz_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  clerk_user_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  questions JSONB NOT NULL,
  attempts JSONB NOT NULL DEFAULT '[]',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  score INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
  average_time_per_question DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('in-progress', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_quiz_sessions_clerk_user_id ON quiz_sessions(clerk_user_id);
CREATE INDEX idx_quiz_sessions_topic ON quiz_sessions(topic);
CREATE INDEX idx_quiz_sessions_status ON quiz_sessions(status);
CREATE INDEX idx_quiz_sessions_started_at ON quiz_sessions(started_at DESC);

-- RLS Policies
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz sessions"
  ON quiz_sessions FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own quiz sessions"
  ON quiz_sessions FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own quiz sessions"
  ON quiz_sessions FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub');
```

### 2. quiz_results

Stores completed quiz results for analytics.

```sql
CREATE TABLE quiz_results (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES quiz_sessions(id),
  user_id UUID REFERENCES auth.users(id),
  clerk_user_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL,
  questions_attempted INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_spent INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  strengths TEXT[] NOT NULL DEFAULT '{}',
  weaknesses TEXT[] NOT NULL DEFAULT '{}',
  difficulty_breakdown JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_quiz_results_clerk_user_id ON quiz_results(clerk_user_id);
CREATE INDEX idx_quiz_results_topic ON quiz_results(topic);
CREATE INDEX idx_quiz_results_completed_at ON quiz_results(completed_at DESC);
CREATE INDEX idx_quiz_results_accuracy ON quiz_results(accuracy DESC);

-- RLS Policies
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz results"
  ON quiz_results FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own quiz results"
  ON quiz_results FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');
```

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL commands above to create the tables
4. Verify RLS policies are enabled
5. Test by running a quiz through the application

## Data Flow

1. **Start Quiz**: Creates entry in `quiz_sessions` with status 'in-progress'
2. **Submit Answer**: Updates `attempts` array in `quiz_sessions`
3. **Complete Quiz**: 
   - Updates `quiz_sessions` status to 'completed'
   - Creates entry in `quiz_results` with analytics
4. **View Analytics**: Queries `quiz_results` for user's performance data

## Example Queries

### Get user's quiz analytics
```sql
SELECT 
  topic,
  COUNT(*) as quiz_count,
  AVG(accuracy) as avg_accuracy,
  MAX(score) as best_score
FROM quiz_results
WHERE clerk_user_id = 'user_xxx'
GROUP BY topic
ORDER BY avg_accuracy DESC;
```

### Get recent quiz results
```sql
SELECT *
FROM quiz_results
WHERE clerk_user_id = 'user_xxx'
ORDER BY completed_at DESC
LIMIT 10;
```
