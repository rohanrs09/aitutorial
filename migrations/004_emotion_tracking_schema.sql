-- ============================================
-- EMOTION TRACKING SCHEMA
-- ============================================

-- Emotion Events Table
CREATE TABLE IF NOT EXISTS emotion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id TEXT,
  emotion TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_emotion_events_session_id ON emotion_events(session_id);
CREATE INDEX IF NOT EXISTS idx_emotion_events_user_id ON emotion_events(user_id);
CREATE INDEX IF NOT EXISTS idx_emotion_events_timestamp ON emotion_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_emotion_events_emotion ON emotion_events(emotion);
CREATE INDEX IF NOT EXISTS idx_emotion_events_user_timestamp ON emotion_events(user_id, timestamp DESC);

-- RLS Policies
ALTER TABLE emotion_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own emotion events" ON emotion_events;
CREATE POLICY "Users can view own emotion events" ON emotion_events
  FOR SELECT USING (user_id IS NULL OR auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own emotion events" ON emotion_events
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid()::text = user_id);

-- Emotion Insights Table (cached insights)
CREATE TABLE IF NOT EXISTS emotion_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emotion_insights_user_id ON emotion_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_emotion_insights_generated_at ON emotion_insights(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_emotion_insights_priority ON emotion_insights(priority);

ALTER TABLE emotion_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own insights" ON emotion_insights;
CREATE POLICY "Users can view own insights" ON emotion_insights
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own insights" ON emotion_insights
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own insights" ON emotion_insights
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Learning Effectiveness Scores Table
CREATE TABLE IF NOT EXISTS learning_effectiveness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id TEXT,
  effectiveness_score INTEGER NOT NULL CHECK (effectiveness_score >= 0 AND effectiveness_score <= 100),
  dominant_emotion TEXT,
  session_duration_minutes INTEGER,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_effectiveness_session_id ON learning_effectiveness(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_effectiveness_user_id ON learning_effectiveness(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_effectiveness_calculated_at ON learning_effectiveness(calculated_at DESC);

ALTER TABLE learning_effectiveness ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own effectiveness scores" ON learning_effectiveness;
CREATE POLICY "Users can view own effectiveness scores" ON learning_effectiveness
  FOR SELECT USING (user_id IS NULL OR auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own effectiveness scores" ON learning_effectiveness
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid()::text = user_id);

-- Function to get emotion patterns for a user
CREATE OR REPLACE FUNCTION get_emotion_patterns(
  p_user_id TEXT,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  emotion TEXT,
  frequency BIGINT,
  avg_confidence DECIMAL,
  common_contexts TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.emotion,
    COUNT(*) as frequency,
    AVG(e.confidence)::DECIMAL(3,2) as avg_confidence,
    ARRAY_AGG(DISTINCT (e.context->>'timeOfDay')::TEXT) as common_contexts
  FROM emotion_events e
  WHERE e.user_id = p_user_id
    AND e.timestamp >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY e.emotion
  ORDER BY frequency DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate learning effectiveness
CREATE OR REPLACE FUNCTION calculate_session_effectiveness(
  p_session_id TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_effectiveness INTEGER;
  v_emotion_weights JSONB := '{
    "engaged": 1.0,
    "curious": 0.9,
    "confident": 0.8,
    "concentrating": 0.7,
    "neutral": 0.5,
    "confused": 0.3,
    "frustrated": 0.2,
    "bored": 0.1
  }'::JSONB;
BEGIN
  SELECT 
    ROUND(
      (SUM(
        e.confidence * 
        COALESCE((v_emotion_weights->>e.emotion)::DECIMAL, 0.5)
      ) / COUNT(*)) * 100
    )::INTEGER
  INTO v_effectiveness
  FROM emotion_events e
  WHERE e.session_id = p_session_id;
  
  RETURN COALESCE(v_effectiveness, 50);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
