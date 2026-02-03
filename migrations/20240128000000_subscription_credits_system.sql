-- Subscription and Credits Database Schema
-- Migration: Credit-based SaaS subscription system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'starter' CHECK (tier IN ('starter', 'pro', 'unlimited')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'inactive')),
  clerk_subscription_id TEXT,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Credits Table
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE REFERENCES user_subscriptions(user_id) ON DELETE CASCADE,
  total_credits INTEGER NOT NULL DEFAULT 50,
  used_credits INTEGER NOT NULL DEFAULT 0,
  bonus_credits INTEGER NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Credit Transactions Table (for audit/history)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('subscription_reset', 'usage', 'bonus', 'refund', 'purchase')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_clerk_subscription_id ON user_subscriptions(clerk_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own subscription
CREATE POLICY "Users can read own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can only read their own credits
CREATE POLICY "Users can read own credits" ON user_credits
  FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can only read their own transactions
CREATE POLICY "Users can read own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid()::text = user_id);

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access subscriptions" ON user_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access credits" ON user_credits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access transactions" ON credit_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON user_credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create credits when subscription is created
CREATE OR REPLACE FUNCTION create_user_credits()
RETURNS TRIGGER AS $$
DECLARE
  credit_amount INTEGER;
BEGIN
  -- Set credits based on tier
  CASE NEW.tier
    WHEN 'starter' THEN credit_amount := 50;
    WHEN 'pro' THEN credit_amount := 500;
    WHEN 'unlimited' THEN credit_amount := -1; -- Unlimited
    ELSE credit_amount := 50;
  END CASE;

  -- Insert credits record
  INSERT INTO user_credits (user_id, total_credits, used_credits, bonus_credits, last_reset_at)
  VALUES (NEW.user_id, credit_amount, 0, 0, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    total_credits = credit_amount,
    used_credits = 0,
    last_reset_at = NOW(),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create credits
DROP TRIGGER IF EXISTS auto_create_credits ON user_subscriptions;
CREATE TRIGGER auto_create_credits
  AFTER INSERT ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION create_user_credits();

-- Comments for documentation
COMMENT ON TABLE user_subscriptions IS 'Stores user subscription information with Clerk integration';
COMMENT ON TABLE user_credits IS 'Tracks user credit balance for the credit-based SaaS model';
COMMENT ON TABLE credit_transactions IS 'Audit log of all credit changes for transparency and debugging';
COMMENT ON COLUMN user_credits.total_credits IS '-1 indicates unlimited credits';
COMMENT ON COLUMN user_subscriptions.clerk_subscription_id IS 'Clerk subscription ID for payment tracking';
