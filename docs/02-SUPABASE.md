# Supabase Integration Guide

> **Single source of truth for database setup, migrations, and troubleshooting**

## Table of Contents
1. [Overview](#overview)
2. [Quick Setup](#quick-setup)
3. [Database Schema](#database-schema)
4. [Migrations](#migrations)
5. [RLS Policies](#rls-policies)
6. [Connection Management](#connection-management)
7. [Troubleshooting](#troubleshooting)
8. [Production Checklist](#production-checklist)

---

## Overview

### Architecture

```
User Action
    ↓
[1] JavaScript Memory (instant)
    ↓
[2] localStorage (5ms, persists weeks)
    ↓
[3] Supabase PostgreSQL (100-500ms, forever, cross-device)
```

### Key Features
- **Graceful Degradation**: Works without Supabase (localStorage only)
- **Offline Support**: Queues operations when offline
- **Auto-sync**: Background sync to cloud when available
- **RLS Security**: Row-level security for data isolation

---

## Quick Setup

### Step 1: Get Credentials

1. Go to https://supabase.com/dashboard
2. Create or select your project
3. Navigate to **Settings → API**
4. Copy:
   - Project URL
   - anon/public key

### Step 2: Configure Environment

Add to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Run Migrations

1. Go to Supabase Dashboard → **SQL Editor**
2. Run migrations in order:

```sql
-- Run each file in order:
-- migrations/001_create_tables.sql
-- migrations/002_production_rls_policies.sql
-- migrations/003_performance_indexes.sql
-- migrations/004_emotion_tracking_schema.sql (optional)
```

### Step 4: Verify

```bash
npm run dev
# Check browser console for:
# [Supabase] ✅ Connection validated - tables exist
```

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `user_profiles` | User information and preferences |
| `learning_sessions` | Session metadata and stats |
| `session_messages` | Chat history per session |
| `conversation_messages` | AI conversation logs |
| `learning_progress` | Progress tracking per user |
| `user_achievements` | Gamification badges |

### Emotion Tables (Optional)

| Table | Purpose |
|-------|---------|
| `emotion_events` | Individual emotion detections |
| `emotion_insights` | Cached pattern analysis |
| `learning_effectiveness` | Session effectiveness scores |

### Schema Diagram

```
user_profiles
├── id (UUID, PK)
├── clerk_user_id (TEXT)
├── email (TEXT)
├── display_name (TEXT)
├── preferences (JSONB)
└── created_at (TIMESTAMP)

learning_sessions
├── id (UUID, PK)
├── user_id (UUID, FK → user_profiles)
├── session_id (TEXT, UNIQUE)
├── topic_name (TEXT)
├── status (TEXT)
├── duration_minutes (INT)
├── quiz_score (INT)
├── emotions_detected (TEXT[])
├── created_at (TIMESTAMP)
└── ended_at (TIMESTAMP)

session_messages
├── id (UUID, PK)
├── session_id (TEXT, FK)
├── role (TEXT: 'user' | 'assistant')
├── content (TEXT)
├── emotion (TEXT)
└── timestamp (TIMESTAMP)

emotion_events (optional)
├── id (UUID, PK)
├── session_id (TEXT)
├── user_id (TEXT)
├── emotion (TEXT)
├── confidence (FLOAT)
├── context (JSONB)
└── timestamp (TIMESTAMP)
```

---

## Migrations

### Migration 001: Core Tables

```sql
-- Creates: user_profiles, learning_sessions, session_messages, etc.
-- Run: migrations/001_create_tables.sql
```

### Migration 002: RLS Policies

```sql
-- Creates: Row-level security policies for all tables
-- Run: migrations/002_production_rls_policies.sql
```

### Migration 003: Performance Indexes

```sql
-- Creates: Indexes for common queries
-- Run: migrations/003_performance_indexes.sql
```

### Migration 004: Emotion Tracking (Optional)

```sql
-- Creates: emotion_events, emotion_insights, learning_effectiveness
-- Run: migrations/004_emotion_tracking_schema.sql
```

### Running Migrations

**Option 1: Supabase Dashboard**
1. Go to SQL Editor
2. Click "New Query"
3. Paste migration content
4. Click "Run"

**Option 2: CLI**
```bash
# If using Supabase CLI
supabase db push
```

---

## RLS Policies

### Development (Current)

```sql
-- Allows all operations (for development only)
CREATE POLICY "Allow all" ON table_name
  FOR ALL USING (true) WITH CHECK (true);
```

### Production (Recommended)

```sql
-- Users can only access their own data
CREATE POLICY "Users see own data" ON learning_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own data" ON learning_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own data" ON learning_sessions
  FOR UPDATE USING (auth.uid() = user_id);
```

### Clerk Integration

```sql
-- Support both Supabase auth and Clerk user IDs
CREATE POLICY "Clerk user access" ON learning_sessions
  FOR ALL USING (
    auth.uid() = user_id 
    OR clerk_user_id = current_setting('request.jwt.claims')::json->>'sub'
  );
```

---

## Connection Management

### Configuration Check

```typescript
import { isSupabaseConfigured } from '@/lib/supabase';

if (isSupabaseConfigured) {
  // Supabase is ready
}
```

### Connection Validation

```typescript
import { validateSupabaseConnection } from '@/lib/supabase';

const result = await validateSupabaseConnection();
// { isConnected: true, tablesExist: true, error: null }
```

### Health Check

```typescript
import { checkSupabaseHealth } from '@/lib/supabase';

const health = await checkSupabaseHealth();
// { status: 'healthy' | 'degraded' | 'offline' }
```

### Offline Queue

The app automatically queues operations when offline:

```typescript
// lib/supabase-connection-fix.ts handles:
// - Connection pooling
// - Retry with exponential backoff
// - Offline operation queue
// - Real-time subscription management
```

---

## Troubleshooting

### "Supabase not configured"

```bash
# Check .env.local exists and has values
cat .env.local | grep SUPABASE

# Should show:
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Restart server after adding
npm run dev
```

### "Tables not found"

1. Go to Supabase Dashboard → Table Editor
2. Check if tables exist
3. If not, run `migrations/001_create_tables.sql`

### "Permission denied - RLS"

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Run RLS policies
-- migrations/002_production_rls_policies.sql
```

### "Policy already exists"

The migrations use `DROP POLICY IF EXISTS` so they're safe to re-run.

If you still get errors:
```sql
-- Drop all policies first
DROP POLICY IF EXISTS "policy_name" ON table_name CASCADE;
```

### "Network error"

1. Check internet connection
2. Verify Supabase project is active
3. Check https://status.supabase.com
4. Verify URL in `.env.local` is correct

### Data in localStorage but not Supabase

1. Check console for errors
2. Verify RLS policies allow INSERT
3. Run migrations if tables missing
4. Check user authentication

---

## Production Checklist

### Security
- [ ] Change RLS from `USING (true)` to `USING (auth.uid() = user_id)`
- [ ] Enable Clerk authentication integration
- [ ] Add user_id checks to all policies
- [ ] Restrict cross-user data access

### Performance
- [ ] Run migration 003 (indexes)
- [ ] Enable connection pooling
- [ ] Set up read replicas if needed

### Reliability
- [ ] Configure database backups
- [ ] Set up error monitoring
- [ ] Add audit logging
- [ ] Test offline functionality

### Monitoring
- [ ] Set up Supabase alerts
- [ ] Monitor query performance
- [ ] Track error rates

---

## Debug Commands

### Browser Console

```javascript
// Check configuration
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// Check localStorage
Object.keys(localStorage).forEach(key => {
  if (key.includes('tutor') || key.includes('session')) {
    console.log(key, localStorage.getItem(key));
  }
});

// Clear local data
localStorage.clear();
location.reload();
```

### Verify Tables

```sql
-- In Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Check RLS Status

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Client initialization, validation |
| `lib/supabase-connection-fix.ts` | Offline queue, retry logic |
| `lib/user-data.ts` | Session management |
| `migrations/*.sql` | Database schema |
