# Progress Tracking Setup

## Database Migration

Run in Supabase SQL Editor:

```sql
CREATE TABLE learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  topic_name TEXT NOT NULL,
  status TEXT DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'completed', 'paused')),
  progress_percentage INT DEFAULT 0,
  content_position JSONB DEFAULT '{"currentStep": 0, "totalSteps": 0, "bookmarks": []}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_progress_user ON learning_progress(user_id);
CREATE INDEX idx_progress_session ON learning_progress(session_id);
CREATE INDEX idx_progress_status ON learning_progress(status);
CREATE INDEX idx_progress_last_accessed ON learning_progress(last_accessed_at DESC);

ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON learning_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON learning_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON learning_progress FOR UPDATE USING (auth.uid() = user_id);
```

## How It Works

**User Flow:**
1. Start learning → Session created
2. Every 30 seconds → Progress auto-saved
3. Refresh page → Loads from Supabase/localStorage
4. Go home → "Continue Learning" card shows
5. Click resume → Continues from same spot

**Dashboard Shows:**
- Total sessions
- Completed sessions
- Learning time
- Topics learned
- Recent sessions with progress %

## Components

**ResumeSession** - Home page widget
- Shows active sessions
- Progress percentage
- One-click resume

**ProgressDashboard** - Stats page
- All user statistics
- Session history
- Dynamic data from Supabase

**TutorSession** - Learning component
- Auto-saves every 30s
- Tracks questions, slides
- Uses progress tracking hook

## API Endpoints

- `GET /api/progress/resume?userId=xxx` - Resume session
- `POST /api/progress/save` - Save progress
- `GET /api/progress/history?userId=xxx` - Get all sessions
- `POST /api/progress/complete` - Mark complete

## Usage

```typescript
import { useProgressTracking } from '@/lib/useProgressTracking';
import { useUser } from '@clerk/nextjs';

function MyComponent() {
  const { user } = useUser();
  const { summary, history } = useProgressTracking(user?.id);
  
  return (
    <div>
      <p>Sessions: {summary?.totalSessions}</p>
      <p>Time: {summary?.totalLearningTime} mins</p>
    </div>
  );
}
```

## Status

✅ All features working
✅ Zero TypeScript errors
✅ Database ready
✅ APIs functional
✅ Components integrated
