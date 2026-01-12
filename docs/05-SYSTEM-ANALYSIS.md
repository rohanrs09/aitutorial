# System Analysis & Data Flow

> **Deep analysis of existing architecture, data flow, and component interactions**

## Table of Contents
1. [Current Architecture Analysis](#current-architecture-analysis)
2. [Data Flow Mapping](#data-flow-mapping)
3. [Component Interaction Matrix](#component-interaction-matrix)
4. [Storage Strategy](#storage-strategy)
5. [API Endpoint Analysis](#api-endpoint-analysis)
6. [State Management](#state-management)
7. [Performance Characteristics](#performance-characteristics)

---

## Current Architecture Analysis

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYERS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  PRESENTATION LAYER (Pages)                             │    │
│  │  - app/page.tsx (Landing)                               │    │
│  │  - app/dashboard/page.tsx (User Dashboard)              │    │
│  │  - app/courses/page.tsx (Course Selection)              │    │
│  │  - app/course/[courseId]/page.tsx (Course Player)       │    │
│  │  - app/learn/page.tsx (Direct Practice)                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                           ↓                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  COMPONENT LAYER (UI Components)                        │    │
│  │  - TutorSession (Main orchestrator)                     │    │
│  │  - CoursePlayer (Video + AI panel)                      │    │
│  │  - EmotionCameraWidget (Emotion detection)              │    │
│  │  - SpacebarVoiceInput (Voice recording)                 │    │
│  │  - LearningSlidePanel (Educational content)             │    │
│  └────────────────────────────────────────────────────────┘    │
│                           ↓                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  BUSINESS LOGIC LAYER (lib/)                            │    │
│  │  - user-data.ts (Session management)                    │    │
│  │  - emotion-analytics.ts (Pattern analysis)              │    │
│  │  - ai-adapter.ts (Model abstraction)                    │    │
│  │  - supabase.ts (Database client)                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     API ROUTES (Serverless)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /api/tutor          → Main AI tutoring logic                   │
│  /api/tutor/explain  → Structured explanations                  │
│  /api/stt            → Speech-to-text (Deepgram/Whisper)        │
│  /api/tts            → Text-to-speech (ElevenLabs/OpenAI)       │
│  /api/emotion-vision → Emotion detection (OpenAI Vision)        │
│  /api/progress/*     → Progress tracking endpoints              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  APIServiceFactory (lib/services/api-service.ts)                │
│  ├─→ createAIService()   → HF/OpenAI/Gemini                     │
│  ├─→ createTTSService()  → ElevenLabs/OpenAI                    │
│  └─→ createSTTService()  → Deepgram/OpenAI                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Mapping

### Complete Learning Session Flow

```
USER ACTION: Start Learning
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. SESSION INITIALIZATION                                        │
└─────────────────────────────────────────────────────────────────┘
    │
    ├─→ createSession(topic, userId)
    │   ├─→ Generate sessionId
    │   ├─→ Save to localStorage (instant)
    │   └─→ Save to Supabase (async, non-blocking)
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. USER INPUT CAPTURE                                            │
└─────────────────────────────────────────────────────────────────┘
    │
    ├─→ Voice Input (SpacebarVoiceInput)
    │   ├─→ Capture audio via MediaRecorder
    │   ├─→ Send to /api/stt
    │   └─→ Return transcript
    │
    OR
    │
    └─→ Text Input (direct)
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. PARALLEL PROCESSING                                           │
└─────────────────────────────────────────────────────────────────┘
    │
    ├─────────────────────┬─────────────────────┐
    │                     │                     │
    ▼                     ▼                     ▼
┌─────────┐      ┌─────────────┐      ┌─────────────┐
│ Emotion │      │ AI Response │      │   Storage   │
│Detection│      │ Generation  │      │  (Session)  │
└─────────┘      └─────────────┘      └─────────────┘
    │                     │                     │
    │ /api/emotion-vision │ /api/tutor         │ updateSession()
    │ (every 3s)          │                     │
    │                     │                     │
    ▼                     ▼                     ▼
emotion:              response:            messages[]
"confused"            "Let me explain..."  emotionsDetected[]
confidence: 0.85      slides: [...]        
    │                     │                     │
    └─────────────────────┴─────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. ADAPTIVE RESPONSE (if emotion confidence > 0.6)               │
└─────────────────────────────────────────────────────────────────┘
    │
    ├─→ analyzeEmotionPatterns()
    ├─→ Modify AI prompt complexity
    └─→ Re-generate response (simpler/faster)
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. OUTPUT GENERATION                                             │
└─────────────────────────────────────────────────────────────────┘
    │
    ├─→ Text Response → Display in UI
    ├─→ Learning Slides → LearningSlidePanel
    └─→ Voice Output → /api/tts → Audio playback
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. SESSION UPDATE                                                │
└─────────────────────────────────────────────────────────────────┘
    │
    ├─→ Update sessionStats (questions, time, emotions)
    ├─→ Save to localStorage (instant)
    └─→ Sync to Supabase (background)
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. SESSION END                                                   │
└─────────────────────────────────────────────────────────────────┘
    │
    ├─→ endSession(sessionId)
    ├─→ Calculate duration, stats
    ├─→ Save to session history
    ├─→ Update user stats (totalSessions, streak, etc.)
    └─→ Sync to Supabase
    │
    ▼
Dashboard updated with new data
```

### Emotion Detection Flow (Detailed)

```
Camera Frame Captured (every 3 seconds)
    │
    ▼
Convert to base64 image
    │
    ▼
POST /api/emotion-vision
    │
    ├─→ Check OPENAI_API_KEY exists
    │   ├─→ YES: Continue
    │   └─→ NO: Return { emotion: 'neutral', fallback: true }
    │
    ▼
OpenAI Vision API (GPT-4o-mini)
    │
    ├─→ System Prompt: "Analyze facial expression for learning emotions"
    ├─→ Detect: neutral, confused, frustrated, engaged, bored, tired, stressed
    └─→ Return: { emotion, confidence, indicators }
    │
    ▼
Frontend receives emotion data
    │
    ├─→ Update emotionHistory (smoothing)
    ├─→ Display emotion badge
    ├─→ Store in sessionStats.emotionHistory
    │
    ▼
Check if adaptation needed
    │
    ├─→ IF confidence > 0.6 AND emotion = confused/frustrated
    │   ├─→ Check cooldown (60s since last adaptation)
    │   └─→ Trigger simplification
    │
    └─→ ELSE: Continue normally
```

---

## Component Interaction Matrix

| Component | Interacts With | Data Exchanged | Direction |
|-----------|----------------|----------------|-----------|
| **TutorSession** | SpacebarVoiceInput | Audio blob | → |
| | LiveTranscript | Transcript text | ← |
| | EmotionCameraWidget | Emotion data | ← |
| | LearningSlidePanel | Slides array | → |
| | NotesPanel | Notes array | → |
| | /api/tutor | User message, emotion | → |
| | /api/stt | Audio blob | → |
| | /api/tts | Text to speak | → |
| | user-data.ts | Session data | ↔ |
| **Dashboard** | user-data.ts | Stats, sessions | ← |
| | emotion-analytics.ts | Insights, patterns | ← |
| | supabase.ts | User data | ← |
| **CoursePlayer** | course-data.ts | Course info | ← |
| | TutorSession (panel) | Help context | → |
| | localStorage | Progress data | ↔ |
| **EmotionCameraWidget** | /api/emotion-vision | Image, emotion | ↔ |
| | TutorSession | Emotion callback | → |

---

## Storage Strategy

### Three-Tier Storage System

```
┌─────────────────────────────────────────────────────────────────┐
│                     TIER 1: MEMORY (RAM)                         │
│  Speed: Instant | Persistence: Session only                      │
│  - React state (messages, currentEmotion, etc.)                  │
│  - Component refs (audioRef, ttsCache)                           │
│  - Temporary UI state                                            │
└─────────────────────────────────────────────────────────────────┘
                          ↓ (on change)
┌─────────────────────────────────────────────────────────────────┐
│                  TIER 2: localStorage                            │
│  Speed: ~5ms | Persistence: Weeks/Months                         │
│  - Current session (STORAGE_KEYS.CURRENT_SESSION)                │
│  - Session history (STORAGE_KEYS.SESSION_HISTORY)                │
│  - User stats (STORAGE_KEYS.USER_STATS)                          │
│  - User preferences (STORAGE_KEYS.USER_PREFERENCES)              │
│  - Course progress (course-progress-{courseId})                  │
└─────────────────────────────────────────────────────────────────┘
                          ↓ (async sync)
┌─────────────────────────────────────────────────────────────────┐
│                   TIER 3: Supabase (PostgreSQL)                  │
│  Speed: 100-500ms | Persistence: Forever, Cross-device           │
│  - user_profiles                                                 │
│  - learning_sessions                                             │
│  - session_messages                                              │
│  - emotion_events (optional)                                     │
│  - learning_progress                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Storage Decision Logic

```typescript
// From lib/user-data.ts

async function saveData(data) {
  // 1. ALWAYS save to localStorage first (instant feedback)
  localStorage.setItem(key, JSON.stringify(data));
  
  // 2. Check if Supabase configured
  if (!isSupabaseConfigured) {
    return; // Stop here, localStorage only
  }
  
  // 3. Validate Supabase connection
  const validation = await validateSupabaseConnection();
  if (!validation.isConnected || !validation.tablesExist) {
    console.warn('Supabase unavailable - using localStorage only');
    return;
  }
  
  // 4. Sync to Supabase (non-blocking)
  try {
    await supabase.from('table').upsert(data);
  } catch (error) {
    console.warn('Supabase sync failed - data safe in localStorage');
  }
}
```

---

## API Endpoint Analysis

### Endpoint Performance Characteristics

| Endpoint | Avg Latency | Rate Limit | Fallback | Critical? |
|----------|-------------|------------|----------|-----------|
| `/api/tutor` | 1-3s | 60/min | Gemini | YES |
| `/api/tutor/explain` | 2-4s | 60/min | Gemini | YES |
| `/api/stt` | 200-800ms | 100/min | OpenAI | YES |
| `/api/tts` | 500-1500ms | 10/min | OpenAI | YES |
| `/api/emotion-vision` | 300-1000ms | 60/min | Neutral | NO |
| `/api/progress/save` | 100-300ms | Unlimited | localStorage | NO |

### Request Flow Analysis

**Example: User asks a question**

```
1. User speaks (hold spacebar)
   Time: 0ms
   
2. Audio captured
   Time: ~2000ms (user speaking duration)
   
3. POST /api/stt
   Time: +500ms (Deepgram) or +1000ms (Whisper)
   Result: Transcript text
   
4. PARALLEL:
   ├─→ POST /api/emotion-vision (if camera enabled)
   │   Time: +800ms
   │   Result: { emotion: "confused", confidence: 0.85 }
   │
   └─→ POST /api/tutor
       Time: +2000ms (SLM) or +3000ms (OpenAI)
       Result: { response, slides, voiceText }
   
5. POST /api/tts
   Time: +1000ms (ElevenLabs) or +1500ms (OpenAI)
   Result: Audio blob
   
6. Play audio
   Time: +duration of audio

TOTAL TIME: ~6-9 seconds from question to audio response
```

---

## State Management

### Session State (TutorSession.tsx)

```typescript
// Core session state
sessionId: string                    // Unique session identifier
messages: Message[]                  // Chat history
isProcessing: boolean                // AI is thinking
isSpeaking: boolean                  // Audio is playing
isListening: boolean                 // Microphone is active

// Emotion state
currentEmotion: string               // Latest detected emotion
emotionConfidence: number            // Confidence score (0-1)
emotionHistory: EmotionEvent[]       // Last N emotions for smoothing

// Content state
learningSlides: LearningSlide[]      // Current slides
currentSlideIndex: number            // Active slide
notes: Note[]                        // Auto-generated notes

// Session stats (for analytics)
sessionStats: {
  questionsAsked: number
  correctAnswers: number
  slidesViewed: number
  timeSpent: number
  emotionHistory: EmotionEvent[]
  conceptsCovered: string[]
}

// Course context (if from course page)
courseContext: {
  courseId: string
  lectureId: string
  lectureTitle: string
  lectureDescription: string
  sectionTitle?: string
  returnPath?: string
} | null
```

### Dashboard State (dashboard/page.tsx)

```typescript
// User data
user: User | null                    // Clerk user object
stats: UserStats                     // Aggregated stats
recentSessions: Session[]            // Last N sessions

// Analytics
showInsights: boolean                // Toggle insights/stats view
emotionInsights: EmotionInsight[]    // Personalized insights

// UI state
isLoadingData: boolean               // Loading indicator
refreshing: boolean                  // Manual refresh in progress
```

### Global State (No Redux/Zustand)

**Strategy:** Local state + localStorage + Supabase
- No global state management library
- Each component manages its own state
- Shared data via props or context (Clerk for auth)
- Persistence via localStorage + Supabase sync

---

## Performance Characteristics

### Bottlenecks Identified

1. **AI Response Time (2-4s)**
   - Largest contributor to perceived latency
   - Mitigation: Show loading states, stream responses (future)

2. **TTS Generation (1-1.5s)**
   - Blocks audio playback
   - Mitigation: TTS cache (implemented), pre-generate for slides

3. **Emotion Detection (800ms every 3s)**
   - Can cause UI jank if not throttled
   - Mitigation: Debouncing, confidence smoothing

4. **Supabase Writes (100-500ms)**
   - Can block UI if synchronous
   - Mitigation: localStorage-first, async sync

### Optimization Strategies

```typescript
// 1. TTS Caching (implemented)
const ttsCache = new Map<string, string>();
if (ttsCache.has(text)) {
  return ttsCache.get(text); // Instant
}

// 2. Emotion Smoothing (implemented)
const recentEmotions = emotionHistory.slice(-5);
const avgConfidence = recentEmotions.reduce(...) / 5;

// 3. Lazy Loading
const EmotionTimeline = dynamic(() => import('./EmotionTimeline'));

// 4. Request Deduplication
if (currentTTSRequest === text) return; // Skip duplicate
```

### Memory Management

```typescript
// Cleanup on unmount
useEffect(() => {
  return () => {
    // Revoke cached audio URLs
    ttsCache.current.forEach(url => URL.revokeObjectURL(url));
    
    // Clear intervals
    clearInterval(timerId);
    
    // Stop audio
    audioRef.current?.pause();
  };
}, []);
```

---

## Key Findings

### Strengths
✅ **Graceful degradation** - Works without Supabase  
✅ **Offline support** - localStorage fallback  
✅ **Modular architecture** - Clear separation of concerns  
✅ **Type safety** - Full TypeScript coverage  
✅ **Performance optimizations** - Caching, debouncing  

### Weaknesses
⚠️ **No real-time sync** - Supabase writes are fire-and-forget  
⚠️ **No error recovery** - Failed Supabase writes are logged but not retried  
⚠️ **No request queuing** - Offline requests are lost  
⚠️ **Limited analytics** - Basic stats only, no trends  
⚠️ **No A/B testing** - Can't experiment with different prompts  

### Opportunities
🔹 **WebSocket integration** - Real-time dashboard updates  
🔹 **Service worker** - True offline mode with sync  
🔹 **Request queue** - Retry failed Supabase operations  
🔹 **Streaming responses** - Faster perceived performance  
🔹 **Edge functions** - Lower latency for API routes  

---

## Next Steps

This analysis feeds into:
- **Missing Features Identification** (next document)
- **End-to-End Flow Design** (next document)
- **Implementation Priorities** (next document)
