# End-to-End Flow Design

> **Complete redesigned user journey with dashboard analytics and learning progress**

## Table of Contents
1. [User Journey Overview](#user-journey-overview)
2. [Dashboard Analytics Flow](#dashboard-analytics-flow)
3. [Learning Session Flow](#learning-session-flow)
4. [Progress Tracking Flow](#progress-tracking-flow)
5. [Emotion-Aware Adaptation Flow](#emotion-aware-adaptation-flow)
6. [Data Sync Flow](#data-sync-flow)
7. [Implementation Checklist](#implementation-checklist)

---

## User Journey Overview

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     LANDING PAGE (/)                             │
│  - Hero section                                                  │
│  - Feature highlights                                            │
│  - Sign In / Sign Up buttons                                     │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION (Supabase Auth)                  │
│  - Email/password authentication                                 │
│  - Auto-provision user profile via trigger                       │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DASHBOARD (/dashboard)                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  STATS OVERVIEW                                         │    │
│  │  - Total Sessions (with trend ↑ 20% vs last week)      │    │
│  │  - Total Minutes (with weekly comparison)               │    │
│  │  - Current Streak (with achievement unlock)             │    │
│  │  - Average Score (with effectiveness breakdown)         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  LEARNING INSIGHTS (Toggle: Stats / Insights)           │    │
│  │  - Emotion patterns (7-day analysis)                    │    │
│  │  - Personalized recommendations                         │    │
│  │  - Learning effectiveness score: 78%                    │    │
│  │  - Optimal learning times                               │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  ACTIVE GOALS                                           │    │
│  │  - "Complete 5 sessions this week" [3/5] ████░░        │    │
│  │  - "Maintain 7-day streak" [5/7] ████████░░            │    │
│  │  + Create New Goal                                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  RECENT SESSIONS (Clickable)                            │    │
│  │  - JavaScript Basics | 25 min | Score: 85% | 😊        │    │
│  │  - React Hooks | 30 min | Score: 72% | 😕              │    │
│  │  [View All Sessions]                                    │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  ACHIEVEMENTS                                           │    │
│  │  🎯 First Steps (Unlocked)                              │    │
│  │  🔥 Week Warrior (Unlocked)                             │    │
│  │  🏆 Perfect Score (Locked - Get 100% on a quiz)        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [Start Learning Session] [Browse Courses]                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
┌───────────────────────┐  ┌───────────────────────┐
│  COURSE SELECTION     │  │  DIRECT PRACTICE      │
│  (/courses)           │  │  (/learn)             │
│                       │  │                       │
│  - Browse courses     │  │  - Free-form learning │
│  - Search/Filter      │  │  - No course context  │
│  - View details       │  │  - Quick practice     │
│  - Select course      │  │                       │
└───────────────────────┘  └───────────────────────┘
                │                   │
                ▼                   │
┌───────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────────┐
│              COURSE PLAYER (/course/[courseId])                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  VIDEO PLAYER                                           │    │
│  │  [YouTube Video Embed]                                  │    │
│  │  Progress: ████████░░░░░░░░░░ 45%                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  LECTURE LIST                                           │    │
│  │  ✓ 1. Introduction                                      │    │
│  │  ▶ 2. Core Concepts (Current)                           │    │
│  │  ○ 3. Advanced Topics                                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [Need Help?] ← Opens AI Tutor Panel                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼ (Click "Need Help?")
┌─────────────────────────────────────────────────────────────────┐
│                 AI TUTOR PANEL (Side Panel)                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  TUTOR ORB                                              │    │
│  │  [Animated orb with emotion indicator]                  │    │
│  │  Status: Listening / Thinking / Speaking                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  EMOTION DETECTION                                      │    │
│  │  [Camera feed] Current: Confused (85%)                  │    │
│  │  → Simplifying explanation...                           │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  CHAT INTERFACE                                         │    │
│  │  User: "Explain async/await"                            │    │
│  │  AI: "Let me break it down simply..."                   │    │
│  │  [Learning slides appear]                               │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  LEARNING SLIDES                                        │    │
│  │  Step 1: Understanding Async                            │    │
│  │  [Diagram] [Example Code]                               │    │
│  │  [Previous] [Next] [1/5]                                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  SESSION PROGRESS                                       │    │
│  │  Questions: 5 | Time: 12:34 | Concepts: 3              │    │
│  │  Emotion Timeline: 😊😊😕😊😊                           │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [Hold Spacebar to Speak] [Type Message]                        │
│  [End Session] [Toggle Notes] [Toggle Camera]                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼ (End Session)
┌─────────────────────────────────────────────────────────────────┐
│                   SESSION SUMMARY                                │
│                                                                  │
│  Great work! You completed a 25-minute session.                 │
│                                                                  │
│  📊 Session Stats:                                              │
│  - Questions Asked: 8                                           │
│  - Concepts Covered: 5                                          │
│  - Learning Effectiveness: 82%                                  │
│  - Dominant Emotion: Engaged (70%)                              │
│                                                                  │
│  🎯 Achievements Unlocked:                                      │
│  - "Quick Learner" (Complete session under 30 min)             │
│                                                                  │
│  📝 Notes & Transcript:                                         │
│  [Download PDF] [Email to Me] [View Online]                     │
│                                                                  │
│  [Return to Course] [Back to Dashboard]                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
                  Back to Dashboard
              (Updated with new data)
```

---

## Dashboard Analytics Flow

### Data Loading Sequence

```
1. User lands on /dashboard
   │
   ▼
2. Check authentication (Supabase Auth)
   │
   ├─→ NOT LOGGED IN → Redirect to /auth/login
   │
   └─→ LOGGED IN → Continue
   │
   ▼
3. Load user data (parallel)
   │
   ├─→ getUserStats(userId)
   │   ├─→ Try Supabase first
   │   └─→ Fallback to localStorage
   │
   ├─→ getRecentSessions(userId, 5)
   │   ├─→ Try Supabase first
   │   └─→ Fallback to localStorage
   │
   ├─→ getActiveGoals(userId)
   │   └─→ From Supabase (new feature)
   │
   └─→ getAchievements(userId)
       └─→ From Supabase (new feature)
   │
   ▼
4. Process emotion insights
   │
   ├─→ getSessionEmotionHistory(sessionIds)
   ├─→ analyzeEmotionPatterns(events, 7)
   └─→ generateEmotionInsights(patterns)
   │
   ▼
5. Calculate comparative stats
   │
   ├─→ getCurrentWeekStats()
   ├─→ getPreviousWeekStats()
   └─→ calculateTrends()
   │
   ▼
6. Render dashboard with all data
   │
   └─→ Show loading states during fetch
```

### Dashboard Interactions

```
User clicks "Show Insights"
   │
   ▼
Toggle from emotion stats to personalized insights
   │
   ├─→ Display top 3 insights
   ├─→ Show recommendations
   └─→ Highlight patterns

User clicks session card
   │
   ▼
Navigate to /session/[sessionId]
   │
   ├─→ Load full session data
   ├─→ Display transcript
   ├─→ Show emotion timeline
   └─→ Render learning slides

User clicks "Create Goal"
   │
   ▼
Open goal creation modal
   │
   ├─→ Select goal type (sessions/streak/topic/time)
   ├─→ Set target and deadline
   ├─→ Save to Supabase
   └─→ Update dashboard

User clicks "Export Progress"
   │
   ▼
Generate PDF report
   │
   ├─→ Fetch all session data
   ├─→ Generate charts and tables
   ├─→ Create PDF blob
   └─→ Download or email
```

---

## Learning Session Flow

### Session Initialization

```
User clicks "Start Learning" or "Need Help?"
   │
   ▼
1. Create session
   │
   ├─→ sessionId = generateSessionId()
   ├─→ Save to localStorage (instant)
   └─→ Save to Supabase (async)
   │
   ▼
2. Initialize session state
   │
   ├─→ messages = []
   ├─→ emotionHistory = []
   ├─→ learningSlides = []
   ├─→ sessionStats = { questions: 0, time: 0, ... }
   │
   ▼
3. Load course context (if from course page)
   │
   ├─→ Read sessionStorage.helpContext
   ├─→ Set courseContext state
   └─→ Generate welcome message
   │
   ▼
4. Start timers
   │
   ├─→ Session time tracker (every 1s)
   ├─→ Emotion detection (every 3s, if camera enabled)
   └─→ Auto-save progress (every 30s)
   │
   ▼
5. Ready for user input
```

### User Question Flow

```
User asks question (voice or text)
   │
   ▼
1. VOICE INPUT PATH
   │
   ├─→ Hold spacebar → Start recording
   ├─→ Release spacebar → Stop recording
   ├─→ POST /api/stt (audio blob)
   └─→ Get transcript text
   │
   OR
   │
2. TEXT INPUT PATH
   │
   └─→ Type in input field
   │
   ▼
3. PARALLEL PROCESSING
   │
   ├────────────────────┬────────────────────┐
   │                    │                    │
   ▼                    ▼                    ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Emotion    │  │  AI         │  │  Storage    │
│  Detection  │  │  Response   │  │  Update     │
└─────────────┘  └─────────────┘  └─────────────┘
   │                    │                    │
   │ Every 3s           │ On user message    │ On change
   │                    │                    │
   ▼                    ▼                    ▼
emotion:            response:           updateSession({
"confused"          "Let me explain..." messages: [...],
confidence: 0.85    slides: [...]       emotions: [...]
indicators: [...]   voiceText: "..."    })
   │                    │                    │
   └────────────────────┴────────────────────┘
                        │
                        ▼
4. ADAPTIVE RESPONSE CHECK
   │
   ├─→ IF emotion = confused/frustrated AND confidence > 0.6
   │   ├─→ Check cooldown (60s since last simplification)
   │   ├─→ Modify AI prompt to simplify
   │   └─→ Re-generate response
   │
   └─→ ELSE: Continue with original response
   │
   ▼
5. OUTPUT GENERATION
   │
   ├─→ Display text response in chat
   ├─→ Render learning slides
   ├─→ POST /api/tts (voiceText)
   └─→ Play audio
   │
   ▼
6. UPDATE SESSION STATS
   │
   ├─→ questionsAsked++
   ├─→ slidesViewed += slides.length
   ├─→ emotionHistory.push(emotion)
   └─→ conceptsCovered.push(extractedConcepts)
   │
   ▼
7. SAVE PROGRESS (every 30s or on change)
   │
   ├─→ localStorage (instant)
   └─→ Supabase (async)
```

### Session End Flow

```
User clicks "End Session"
   │
   ▼
1. Show confirmation modal
   │
   ├─→ "Are you sure? Your progress will be saved."
   └─→ [Cancel] [End Session]
   │
   ▼
2. Calculate final stats
   │
   ├─→ duration = now - startTime
   ├─→ effectiveness = calculateLearningEffectiveness(emotionHistory)
   ├─→ dominantEmotion = mostFrequentEmotion(emotionHistory)
   │
   ▼
3. Save session data
   │
   ├─→ endSession(sessionId)
   ├─→ Save to session history (localStorage)
   ├─→ Update user stats (totalSessions++, etc.)
   └─→ Sync to Supabase
   │
   ▼
4. Check for achievements
   │
   ├─→ checkAchievements(userStats)
   ├─→ IF new achievements unlocked
   │   └─→ Show celebration animation
   │
   ▼
5. Display session summary
   │
   ├─→ Show stats
   ├─→ Show unlocked achievements
   ├─→ Offer export options
   └─→ [Return to Course] [Back to Dashboard]
   │
   ▼
6. Navigate based on user choice
   │
   ├─→ Return to course player (if from course)
   └─→ Return to dashboard (if direct practice)
```

---

## Progress Tracking Flow

### Real-time Progress Updates

```
During Learning Session:
   │
   ├─→ Every 30 seconds
   │   ├─→ Calculate progress percentage
   │   ├─→ Save to localStorage
   │   └─→ Sync to Supabase (background)
   │
   ├─→ On slide view
   │   ├─→ slidesViewed++
   │   └─→ Update progress tracker UI
   │
   ├─→ On concept covered
   │   ├─→ conceptsCovered.push(concept)
   │   └─→ Update concept mastery
   │
   └─→ On emotion change
       ├─→ emotionHistory.push(emotion)
       └─→ Recalculate effectiveness
```

### Cross-Session Progress

```
User completes multiple sessions:
   │
   ▼
1. Track across sessions
   │
   ├─→ Total sessions
   ├─→ Total time
   ├─→ Streak (consecutive days)
   ├─→ Average score
   ├─→ Topics completed
   │
   ▼
2. Calculate trends
   │
   ├─→ Week-over-week comparison
   ├─→ Emotion pattern changes
   ├─→ Learning velocity
   │
   ▼
3. Update dashboard
   │
   ├─→ Stats with trends (↑ ↓)
   ├─→ Insights with recommendations
   └─→ Goal progress updates
```

---

## Emotion-Aware Adaptation Flow

### Emotion Detection Pipeline

```
Camera enabled → Every 3 seconds:
   │
   ▼
1. Capture frame from camera
   │
   ▼
2. Convert to base64 image
   │
   ▼
3. POST /api/emotion-vision
   │
   ├─→ Check OPENAI_API_KEY
   │   ├─→ Present: Continue
   │   └─→ Missing: Return neutral
   │
   ▼
4. OpenAI Vision API
   │
   ├─→ Analyze facial expression
   ├─→ Detect emotion category
   ├─→ Calculate confidence (0-1)
   └─→ Identify indicators
   │
   ▼
5. Return emotion data
   {
     emotion: "confused",
     confidence: 0.85,
     indicators: ["furrowed brow", "squinting"]
   }
   │
   ▼
6. Frontend processing
   │
   ├─→ Add to emotionHistory (last 10)
   ├─→ Calculate smoothed confidence
   ├─→ Update UI badge
   └─→ Store in sessionStats
   │
   ▼
7. Check adaptation trigger
   │
   ├─→ IF confidence > 0.6
   │   AND emotion IN [confused, frustrated, bored]
   │   AND cooldown elapsed (60s)
   │   │
   │   ▼
   │   Trigger adaptive response
   │   ├─→ Simplify current explanation
   │   ├─→ Show encouragement message
   │   └─→ Adjust pacing
   │
   └─→ ELSE: Continue normally
```

### Adaptation Strategies

```
Emotion: CONFUSED (confidence > 0.6)
   │
   ├─→ Simplify language
   ├─→ Break into smaller steps
   ├─→ Add more examples
   ├─→ Use analogies
   └─→ Encourage questions

Emotion: FRUSTRATED (confidence > 0.6)
   │
   ├─→ Simplify significantly
   ├─→ Provide encouragement
   ├─→ Suggest break
   └─→ Offer alternative approach

Emotion: BORED (confidence > 0.7)
   │
   ├─→ Increase pace
   ├─→ Add challenges
   ├─→ Introduce advanced topics
   └─→ Make it interactive

Emotion: ENGAGED (confidence > 0.5)
   │
   ├─→ Continue current approach
   ├─→ Gradually increase difficulty
   └─→ Introduce related concepts
```

---

## Data Sync Flow

### Three-Tier Sync Strategy

```
USER ACTION (e.g., ask question)
   │
   ▼
┌─────────────────────────────────────────────────────────────────┐
│ TIER 1: MEMORY (React State)                                    │
│ Speed: Instant | Persistence: None                              │
│ - messages.push(newMessage)                                     │
│ - UI updates immediately                                        │
└─────────────────────────────────────────────────────────────────┘
   │
   ▼ (on state change)
┌─────────────────────────────────────────────────────────────────┐
│ TIER 2: localStorage                                            │
│ Speed: ~5ms | Persistence: Weeks                                │
│ - localStorage.setItem('session', JSON.stringify(session))      │
│ - Survives page refresh                                         │
│ - Works offline                                                 │
└─────────────────────────────────────────────────────────────────┘
   │
   ▼ (async, non-blocking)
┌─────────────────────────────────────────────────────────────────┐
│ TIER 3: Supabase (PostgreSQL)                                   │
│ Speed: 100-500ms | Persistence: Forever, Cross-device           │
│ - supabase.from('sessions').upsert(data)                        │
│ - Syncs across devices                                          │
│ - Enables analytics                                             │
│ - IF FAILS: Data safe in localStorage, retry later              │
└─────────────────────────────────────────────────────────────────┘
```

### Sync Failure Handling

```
Supabase write fails:
   │
   ├─→ Log error to console
   ├─→ Data remains in localStorage (safe)
   ├─→ Show subtle notification (optional)
   └─→ Retry on next action (future enhancement)

User goes offline:
   │
   ├─→ All data saved to localStorage
   ├─→ App continues to function
   ├─→ Queue operations (future enhancement)
   └─→ Sync when back online
```

---

## Implementation Checklist

### Phase 1: Dashboard Enhancement (Priority: P0)

- [ ] Add comparative analytics (week-over-week)
- [ ] Display learning effectiveness score
- [ ] Make session cards clickable
- [ ] Add export functionality (CSV/PDF)
- [ ] Show trend indicators (↑ ↓)

### Phase 2: Achievements & Goals (Priority: P1)

- [ ] Create achievements database table
- [ ] Implement achievement unlock logic
- [ ] Build goal creation UI
- [ ] Add goal progress tracking
- [ ] Show achievement notifications

### Phase 3: Session Deep Dive (Priority: P1)

- [ ] Create session detail page
- [ ] Display full transcript
- [ ] Show emotion timeline visualization
- [ ] Render learning slides
- [ ] Add export session report

### Phase 4: Advanced Features (Priority: P2)

- [ ] Spaced repetition system
- [ ] Concept mastery tracking
- [ ] Real-time sync (WebSocket)
- [ ] Response streaming
- [ ] Mobile optimization

---

## Success Metrics

### User Engagement
- Session completion rate > 80%
- Average session duration > 15 minutes
- Return rate (7-day) > 60%

### Learning Effectiveness
- Average effectiveness score > 75%
- Positive emotion ratio > 70%
- Concept mastery rate > 65%

### Technical Performance
- Dashboard load time < 2s
- AI response time < 3s
- Supabase sync success rate > 95%

---

## Next Steps

1. Review this flow with stakeholders
2. Prioritize features based on impact/effort
3. Begin implementation with Phase 1
4. Iterate based on user feedback
