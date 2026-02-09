# AI Voice Tutor - System Architecture

> **Single source of truth for system design, data flow, and component structure**

## Table of Contents
1. [System Overview](#system-overview)
2. [User Journey](#user-journey)
3. [Data Flow](#data-flow)
4. [Component Architecture](#component-architecture)
5. [API Architecture](#api-architecture)
6. [Database Schema](#database-schema)
7. [Dashboard Analytics](#dashboard-analytics)
8. [Missing Features & Gaps](#missing-features--gaps)
9. [Implementation Roadmap](#implementation-roadmap)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AI VOICE TUTOR                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Frontend   │    │   Backend    │    │   Services   │          │
│  │   (Next.js)  │◄──►│  (API Routes)│◄──►│   (External) │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                   │                   │                   │
│         ▼                   ▼                   ▼                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │  Components  │    │   Services   │    │  AI Models   │          │
│  │  - Dashboard │    │  - AI Adapter│    │  - SLM (HF)  │          │
│  │  - Courses   │    │  - Supabase  │    │  - OpenAI    │          │
│  │  - Learning  │    │  - Auth      │    │  - Gemini    │          │
│  │  - Emotion   │    │  - Analytics │    │  - ElevenLabs│          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS |
| **UI** | Framer Motion, Lucide Icons, shadcn/ui |
| **Backend** | Next.js API Routes (Serverless) |
| **AI** | SLM (Hugging Face), OpenAI, Gemini |
| **Voice** | ElevenLabs (TTS), Deepgram (STT) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Deployment** | Vercel |

---

## User Journey

### Complete Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                                  │
└─────────────────────────────────────────────────────────────────────┘

1. LANDING PAGE (/)
   │
   ├─→ Sign Up/Sign In (Supabase Auth)
   │
   ▼
2. DASHBOARD (/dashboard)
   │
   ├─→ View Stats (sessions, time, streak, score)
   ├─→ View Recent Sessions
   ├─→ View Emotion Insights
   ├─→ View Achievements
   │
   ├─→ Click "Start Learning Session"
   │
   ▼
3. COURSE SELECTION (/courses)
   │
   ├─→ Browse Courses
   ├─→ Search/Filter
   ├─→ Select Course
   │
   ▼
4. COURSE PLAYER (/course/[courseId])
   │
   ├─→ Watch Video Lectures
   ├─→ Track Progress
   ├─→ Click "Need Help?" → Opens AI Tutor
   │
   ▼
5. AI TUTOR (Side Panel)
   │
   ├─→ Voice Input (spacebar)
   ├─→ Text Input
   ├─→ Emotion Detection (camera)
   ├─→ Adaptive Responses
   ├─→ Learning Slides
   │
   ▼
6. END SESSION
   │
   ├─→ Session Stats Saved
   ├─→ Progress Updated
   ├─→ Return to Dashboard
   │
   ▼
7. DASHBOARD (Updated)
   │
   ├─→ New Stats
   ├─→ New Insights
   └─→ Continue Learning
```

### Alternative Flow: Direct Practice

```
Dashboard → /learn → Free Practice Session (no course context)
```

---

## Data Flow

### Learning Session Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LEARNING SESSION DATA FLOW                        │
└─────────────────────────────────────────────────────────────────────┘

User Speaks
    │
    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Microphone │────►│  /api/stt   │────►│  Deepgram/  │
│   (Browser) │     │  (Route)    │     │  Whisper    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Transcript │
                    │   (Text)    │
                    └─────────────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
    ▼                      ▼                      ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Camera    │     │ /api/tutor  │     │  Supabase   │
│  (Emotion)  │     │  (AI Logic) │     │  (Storage)  │
└─────────────┘     └─────────────┘     └─────────────┘
    │                      │                      │
    ▼                      ▼                      │
┌─────────────┐     ┌─────────────┐              │
│ /api/       │     │  SLM/OpenAI │              │
│ emotion-    │     │  Response   │              │
│ vision      │     └─────────────┘              │
└─────────────┘            │                      │
    │                      ▼                      │
    │               ┌─────────────┐              │
    │               │  /api/tts   │              │
    │               │  (Voice)    │              │
    │               └─────────────┘              │
    │                      │                      │
    ▼                      ▼                      │
┌─────────────────────────────────────────────────┐
│                  FRONTEND UI                     │
│  - Emotion Display                               │
│  - AI Response (Text + Audio)                   │
│  - Learning Slides                               │
│  - Progress Tracker                              │
└─────────────────────────────────────────────────┘
```

### Emotion Detection Flow

```
Camera Frame (every 3s)
    │
    ▼
/api/emotion-vision
    │
    ▼
OpenAI Vision (GPT-4o-mini)
    │
    ▼
{
  emotion: "confused",
  confidence: 0.85,
  indicators: ["furrowed brow", "squinting"]
}
    │
    ├─→ Update UI (emotion badge)
    ├─→ Store in session history
    ├─→ Trigger adaptation if confidence > 0.6
    │
    ▼
Adaptive Response (if needed)
```

---

## Component Architecture

### Page Structure

```
app/
├── page.tsx                    # Landing page
├── dashboard/
│   └── page.tsx               # User dashboard
├── courses/
│   └── page.tsx               # Course selection
├── course/
│   └── [courseId]/
│       └── page.tsx           # Course player
├── learn/
│   └── page.tsx               # Direct practice
└── api/
    ├── tutor/
    │   ├── route.ts           # Main AI endpoint
    │   └── explain/
    │       └── route.ts       # Structured explanations
    ├── stt/route.ts           # Speech-to-text
    ├── tts/route.ts           # Text-to-speech
    ├── emotion-vision/route.ts # Emotion detection
    └── progress/              # Progress tracking
```

### Component Hierarchy

```
TutorSession (Main Orchestrator)
├── AnimatedTutorOrb (Visual AI representation)
├── SpacebarVoiceInput (Voice recording)
├── LiveTranscript (Real-time transcription)
├── EmotionCameraWidget (Emotion detection)
├── LearningSlidePanel (Educational slides)
├── LearningProgressTracker (Progress visualization)
└── NotesPanel (Auto-generated notes)

Dashboard
├── StatsGrid (Sessions, time, streak, score)
├── RecentSessions (Session history)
├── EmotionInsights (Pattern analysis)
├── Achievements (Gamification)
└── WeeklyProgressChart (Visual progress)

CoursePlayer
├── VideoPlayer (YouTube embed)
├── LectureList (Course structure)
├── AITutorPanel (Side panel)
└── ProgressTracker (Course progress)
```

---

## API Architecture

### Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tutor` | POST | Main AI tutoring |
| `/api/tutor/explain` | POST | Structured explanations |
| `/api/stt` | POST | Speech-to-text |
| `/api/tts` | POST | Text-to-speech |
| `/api/emotion-vision` | POST | Emotion detection |
| `/api/progress/save` | POST | Save progress |
| `/api/progress/resume` | GET | Resume session |
| `/api/progress/history` | GET | Get history |

### Service Layer

```typescript
// lib/services/api-service.ts

APIServiceFactory
├── createTTSService()    → ElevenLabsService | OpenAIService
├── createSTTService()    → DeepgramService | OpenAIService
└── createAIService()     → HuggingFaceService | OpenAIService
```

### Rate Limiting

```typescript
// lib/api-rate-limiter.ts

RATE_LIMITS = {
  elevenlabs: { maxRequestsPerMinute: 10 },
  deepgram: { maxRequestsPerMinute: 100 },
  openai: { maxRequestsPerMinute: 60 },
  huggingface: { maxRequestsPerMinute: 30 }
}
```

---

## Database Schema

### Entity Relationship

```
user_profiles (1) ──────< (N) learning_sessions
                              │
                              ├──< (N) session_messages
                              │
                              └──< (N) emotion_events

learning_sessions (1) ──< (N) session_messages
                    (1) ──< (N) emotion_events
```

### Tables

| Table | Key Fields |
|-------|------------|
| `user_profiles` | id, user_id, email, preferences |
| `learning_sessions` | id, user_id, topic, status, duration, score |
| `session_messages` | id, session_id, role, content, emotion |
| `emotion_events` | id, session_id, emotion, confidence, context |
| `learning_progress` | id, user_id, session_id, progress_percentage |

---

## Dashboard Analytics

### Current Features

| Feature | Status | Location |
|---------|--------|----------|
| Total Sessions | ✅ | Dashboard |
| Total Minutes | ✅ | Dashboard |
| Current Streak | ✅ | Dashboard |
| Average Score | ✅ | Dashboard |
| Recent Sessions | ✅ | Dashboard |
| Basic Emotion % | ✅ | Dashboard |
| Achievements | ✅ (mock) | Dashboard |
| Weekly Chart | ✅ | Dashboard |

### New Analytics Features

| Feature | Status | Location |
|---------|--------|----------|
| Emotion Patterns | ✅ | Dashboard (toggle) |
| Personalized Insights | ✅ | Dashboard (toggle) |
| Learning Effectiveness | ✅ | lib/emotion-analytics.ts |
| Emotion Timeline | ✅ | components/EmotionTimeline.tsx |
| Session Analytics | ✅ | components/SessionAnalyticsDashboard.tsx |

### Analytics Data Flow

```
Session Emotions
    │
    ▼
getSessionEmotionHistory()
    │
    ▼
analyzeEmotionPatterns()
    │
    ▼
generateEmotionInsights()
    │
    ▼
Dashboard Display
├── Warning: High frustration
├── Success: Good engagement
└── Info: Optimal learning times
```

---

## Missing Features & Gaps

### Identified Gaps

| Gap | Priority | Status |
|-----|----------|--------|
| Course selection before learning | HIGH | ✅ Fixed |
| Emotion analytics in dashboard | HIGH | ✅ Fixed |
| Real achievements (not mock) | MEDIUM | ❌ Pending |
| Export session reports | MEDIUM | ❌ Pending |
| Social features | LOW | ❌ Pending |
| Offline mode | LOW | Partial |
| Mobile app | LOW | ❌ Pending |

### Dashboard Improvements Needed

1. **Real-time Updates**: WebSocket for live stats
2. **Goal Setting**: User-defined learning goals
3. **Comparative Analytics**: Week-over-week comparison
4. **Export**: PDF/CSV export of progress
5. **Notifications**: Learning reminders

### Learning Flow Improvements

1. **Spaced Repetition**: Review scheduling
2. **Concept Mastery**: Track individual concepts
3. **Adaptive Difficulty**: Auto-adjust based on performance
4. **Collaborative Learning**: Study groups

---

## Implementation Roadmap

### Phase 1: Core Fixes (DONE)
- ✅ Navigation flow (Dashboard → Courses → Learn)
- ✅ Emotion detection verification
- ✅ Dashboard insights integration
- ✅ Documentation consolidation

### Phase 2: Analytics Enhancement
- [ ] Real achievements system
- [ ] Goal setting UI
- [ ] Comparative analytics
- [ ] Export functionality

### Phase 3: Learning Optimization
- [ ] Spaced repetition
- [ ] Concept mastery tracking
- [ ] Adaptive difficulty
- [ ] Quiz improvements

### Phase 4: Scale & Polish
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Offline support
- [ ] Error monitoring

---

## Quick Reference

### Start Development
```bash
npm run dev
```

### Key Files
- `app/dashboard/page.tsx` - Dashboard
- `app/courses/page.tsx` - Course selection
- `components/TutorSession.tsx` - Learning session
- `lib/emotion-analytics.ts` - Emotion analysis
- `lib/supabase.ts` - Database client

### Environment Check
```bash
cat .env.local | grep -E "OPENAI|HF_API|SUPABASE"
```

### Database Check
```bash
# In browser console
# Should show: [Supabase] ✅ Connection validated
```
