# AI Voice Tutor - Complete Codebase Understanding

## 🎯 Project Overview

**AI Voice Tutor** is an adaptive, emotion-aware AI tutoring application built with Next.js that provides personalized learning experiences. It combines voice interaction, facial emotion detection, and intelligent content adaptation to help students learn effectively.

### Key Features
- 🎤 Voice interaction (hold spacebar to speak)
- 😊 Real-time facial emotion detection
- 📊 Adaptive learning based on student emotions
- 📚 Auto-generated learning slides
- 📈 Progress tracking and concept mastery visualization
- 📝 Auto-generated notes with download capability
- 🎓 Custom topic creation

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React + Next.js)            │
│  - TutorSession (main component)                         │
│  - Voice Input / Text Input                              │
│  - Emotion Detection Camera Widget                       │
│  - Learning Slides Display                               │
│  - Progress Tracker                                      │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│              Next.js API Routes (Backend)                │
│  - /api/tutor - Main AI tutoring endpoint                │
│  - /api/stt - Speech-to-Text (Whisper)                   │
│  - /api/tts - Text-to-Speech (OpenAI/ElevenLabs)         │
│  - /api/emotion-vision - Facial emotion analysis         │
│  - /api/generate-slides - Learning slide generation      │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│              External AI Services                        │
│  - OpenAI GPT-4 (tutoring, vision, STT, TTS)            │
│  - OpenAI Whisper (speech-to-text)                       │
│  - ElevenLabs (optional enhanced TTS)                    │
│  - Supabase (optional data persistence)                  │
└─────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure & File Breakdown

### **Root Configuration Files**
```
package.json              - Dependencies & scripts
tsconfig.json             - TypeScript configuration
tailwind.config.ts        - Tailwind CSS setup
next.config.js            - Next.js configuration
vercel.json               - Vercel deployment config
.env.local                - Environment variables (not in repo)
```

### **App Directory** (`app/`)
Next.js App Router structure with API routes and pages.

#### **Main Page**
- **`app/page.tsx`** (6 lines)
  - Entry point for the application
  - Renders `TutorSession` component
  - Uses client-side rendering (`'use client'`)

#### **API Routes** (`app/api/`)

1. **`app/api/tutor/route.ts`** (396 lines) - Main Tutoring Engine
   - **Purpose**: Core AI tutoring logic
   - **Endpoints**: POST
   - **Functionality**:
     - Receives student messages and context
     - Analyzes emotions and adapts responses
     - Generates structured responses with slides
     - Supports custom topics with learning goals
     - Returns JSON with:
       - `response`: AI tutor's message
       - `slides`: Generated learning slides
       - `simplificationLevel`: Content difficulty
       - `conversationalResponse`: Audio-friendly text
   - **Key Functions**:
     - `getTutorSystemPrompt()`: Gets emotion-specific system prompt
     - `analyzeEmotionAndAdapt()`: Determines if content needs simplification
     - `enhancePromptForEmotion()`: Customizes prompts based on emotion
   - **Dependencies**: OpenAI API

2. **`app/api/stt/route.ts`** (60 lines) - Speech-to-Text
   - **Purpose**: Convert audio to text
   - **Endpoints**: POST (expects FormData with audio file)
   - **Technology**: OpenAI Whisper API
   - **Returns**: `{ text: string, success: boolean }`
   - **Accepts**: WebM audio format

3. **`app/api/tts/route.ts`** (110 lines) - Text-to-Speech
   - **Purpose**: Convert text responses to audio
   - **Endpoints**: POST
   - **Supports**:
     - OpenAI TTS (default, voice: "nova")
     - ElevenLabs TTS (optional, higher quality)
   - **Returns**: MP3 audio buffer
   - **Input**: `{ text: string, useElevenLabs?: boolean }`

4. **`app/api/emotion-vision/route.ts`** (114 lines) - Facial Emotion Detection
   - **Purpose**: Analyze facial expressions from camera frames
   - **Endpoints**: POST
   - **Technology**: OpenAI Vision API (gpt-4o-mini)
   - **Input**: Base64 encoded JPEG image
   - **Output**: `{ emotion: string, confidence: 0-1 }`
   - **Detected Emotions**:
     - neutral, confused, frustrated, happy
     - concentrating, engaged, bored, curious, excited
   - **Rate Limited**: 2.5 second intervals

5. **`app/api/generate-slides/route.ts`** (262 lines) - Slide Generation
   - **Purpose**: Generate educational slides for topics
   - **Endpoints**: POST
   - **Input**:
     - `topicName`: Title of the topic
     - `description`: Topic details
     - `learningGoals[]`: Array of learning objectives
     - `emotion`: Student's emotional state
     - `emotionConfidence`: 0-1 confidence level
   - **Output**: Array of `LearningSlide` objects with:
     - title, type, content, keyPoints, example
     - visualAid (Mermaid diagrams)
     - quiz with MCQ format
     - audio timing metadata
   - **Simplification Logic**:
     - Basic: Confused/frustrated + high confidence
     - Intermediate: Confused/frustrated + medium confidence
     - Advanced: Neutral/confident

---

### **Components Directory** (`components/`)
Reusable React components using Framer Motion for animations.

#### **Core Session Management**
- **`TutorSession.tsx`** (1,475 lines) - Main application orchestrator
  - **State Management**:
    - Messages, topic selection, custom topics
    - Learning slides, progress tracking
    - Emotion history, session statistics
    - Concept mastery levels
    - UI state (notes panel, chat history, etc.)
  - **Key Features**:
    - Handles message flow (voice/text input)
    - Manages API calls to all endpoints
    - Tracks time spent, questions asked, concepts covered
    - Implements concept mastery scoring (0-100%)
    - Provides guidance based on confusion detection
  - **Flows**:
    - User speaks/types → STT conversion
    - Message sent to tutor API
    - Emotion detected from camera
    - Adaptive response generated
    - TTS conversion for audio response
    - Slides generated and displayed
    - Progress tracked automatically

#### **Input Components**
- **`SpacebarVoiceInput.tsx`** (260 lines)
  - Hold spacebar to record audio
  - Visual recording indicator
  - Supports WebM audio format
  - Auto-stops on spacebar release
  - Sends to STT endpoint
  - Uses MediaRecorder API

- **Text Input**: Integrated in TutorSession
  - Type-based input alternative
  - Supports Enter to send

#### **Emotion Detection**
- **`EmotionCameraWidget.tsx`** (238 lines)
  - Real-time camera widget
  - Captures frames at 2.5s intervals
  - Sends to emotion-vision API
  - Displays:
    - Current emotion badge
    - Confidence percentage
    - Camera on/off toggle
    - Expandable/collapsible UI
  - Position options: corner or sidebar
  - Error handling for camera access

#### **Learning Display Components**
- **`LearningSlidePanel.tsx`** (443 lines)
  - Displays generated slides one at a time
  - **Slide Types**:
    - concept: Key concepts
    - example: Real-world examples
    - tip: Best practices
    - practice: Quiz questions
    - diagram: Visual aids
    - summary: Summary of topic
  - **Features**:
    - Next/Previous slide navigation
    - Quiz interaction with feedback
    - Audio sync timing
    - Progress bar within slides
    - Auto-advance based on audio playback
    - Simplification hints for confused students
  - **Audio Integration**:
    - audioStartTime: When slide should appear in audio
    - audioDuration: How long to show slide
    - Automatically advances based on audio timing

- **`MermaidDiagram.tsx`** (65 lines)
  - Renders Mermaid diagrams (flowcharts, graphs, etc.)
  - Handles rendering errors gracefully
  - Shows code on error for debugging

- **`ScenarioSlide.tsx`**
  - Interactive scenario-based questions
  - Multiple choice or scenario responses

#### **Progress & Statistics**
- **`LearningProgressTracker.tsx`**
  - Displays session statistics
  - Concept mastery visualization
  - Time spent tracking
  - Questions answered counter
  - Emotional state history
  - Visual progress bars

#### **Notes System**
- **`NotesPanel.tsx`** (165 lines)
  - Organizes notes by type:
    - Concepts (key learning points)
    - Examples (real-world applications)
    - Tips (best practices)
    - Summaries (recap)
  - **Actions**:
    - Expand/collapse sections
    - Copy notes to clipboard
    - Download notes (PDF/TXT)
    - Email notes
  - **Responsive**: Touch-friendly design

- **`NotesDisplay.tsx`**
  - Display-only version of notes
  - Used in history view

#### **Topic Management**
- **`TopicSelector.tsx`**
  - Browse available learning topics
  - Filter by category
  - Select topic to start learning
  - Shows topic description and difficulty

- **`CustomTopicBuilder.tsx`**
  - Create custom learning topics
  - Set:
    - Topic name & category
    - Description
    - Learning goals (multiple)
    - Difficulty level
  - Generates custom system prompts

#### **Audio Components**
- **`AudioPlayer.tsx`**
  - Basic audio playback
  - Controls for play/pause

- **`EnhancedAudioPlayer.tsx`**
  - Advanced audio player
  - Timeline scrubbing
  - Speed controls
  - Transcript display

- **`VoiceRecorder.tsx`**
  - Alternative voice recording interface
  - May be used for testing

#### **UI Components**
- **`AnimatedTutorOrb.tsx`**
  - Animated visual representation of AI tutor
  - Responds to speaking/listening states
  - Emotion-aware animations

- **`LiveTranscript.tsx`**
  - Shows real-time transcription while recording
  - Updates as user speaks

- **`ChatMessage.tsx`**
  - Individual message display
  - Formats user vs assistant messages
  - Optional Markdown rendering

- **`EmotionBadge.tsx`**
  - Small emotion indicator
  - Shows current emotion + confidence
  - Color-coded by emotion type

- **`ConversationalText.tsx`**
  - Displays tutor's text response
  - Makes AI responses conversational

- **`ZoomStyleLayout.tsx`**
  - Custom layout system
  - Responsive design for different screen sizes

- **`EnhancedLearningInterface.tsx`**
  - Advanced UI for learning
  - Integrates multiple components

---

### **Library/Utilities** (`lib/`)

- **`tutor-prompts.ts`** (178 lines)
  - **`getTutorSystemPrompt(emotion, topic)`**: Returns GPT system prompt
    - Customized for student emotion
    - Different approaches per emotion type
    - Examples:
      - **confused**: Use basic language, multiple simple examples, check understanding
      - **frustrated**: Validate feelings, offer breaks, rebuild confidence
      - **confident**: Provide deeper insights, challenging questions
      - **bored**: Engaging examples, real-world applications
      - **curious**: Encourage questions, explore "why" aspects
      - **excited**: Match energy, provide enriching details
  - **`learningTopics`**: Database of predefined topics
    - Currently includes:
      - Law of Diminishing Returns (Economics)
      - Binary Search Algorithm (DSA)
      - Plus others...
    - Each topic has:
      - id, name, category, description
      - example use cases
  - **`getTopicById(id)`**: Lookup topic by ID
  - **`Topic` Interface**: Defines topic structure

- **`adaptive-response.ts`** (149 lines)
  - **`analyzeEmotionAndAdapt(emotion, confidence, message)`**
    - Decides if response should be simplified
    - Determines simplification level
    - Returns adaptive response object:
      ```typescript
      {
        shouldRegenerateSimplified: boolean,
        simplificationLevel: 'basic' | 'intermediate' | 'advanced',
        additionalPrompt?: string
      }
      ```
  - **`generateSimplificationPrompt(emotion, message)`**
    - Creates emotion-specific simplification guidance
    - **confused**: Break into tiny steps, use 10-year-old language
    - **frustrated**: Validate feelings, build confidence, offer alternatives
  - **`enhancePromptForEmotion(prompt, emotion, confidence)`**
    - Modifies system prompt based on emotion
    - Injects emotion-specific instructions

- **`utils.ts`** (65 lines)
  - **Type Definitions**:
    - `EmotionType`: Union of all supported emotions
    - `emotionKeywords`: Map emotions to trigger words
  - **Emotion Detection**:
    - `detectEmotionFromText(text)`: Analyzes message text
    - Looks for keywords like "confused", "excited", etc.
  - **Utilities**:
    - `getEmotionColor(emotion)`: Returns Tailwind color class
    - `getEmotionEmoji(emotion)`: Returns emoji for emotion
    - `formatTimestamp(date)`: Format timestamps
    - `generateSessionId()`: Create unique session ID
    - `cn()`: ClassNames utility (clsx + tailwind-merge)

---

## 🔄 Data Flow & Application Flow

### **User Interaction Flow**

```
1. Student selects topic OR creates custom topic
   ↓
2. Student speaks (hold spacebar) or types message
   ↓
3. Audio sent to /api/stt (Speech-to-Text)
   ↓
4. Transcribed text + emotion state sent to /api/tutor
   ↓
5. Camera frame sent to /api/emotion-vision (Emotion Detection)
   ↓
6. Tutor analyzes:
   - Student emotion & confidence
   - Message content
   - Applies adaptive response logic
   ↓
7. Tutor generates response with:
   - Adaptive difficulty based on emotion
   - Structured content with slides
   ↓
8. Response sent to /api/generate-slides (if needed)
   ↓
9. Slide content generated with:
   - Mermaid diagrams
   - Quiz questions
   - Audio timing metadata
   ↓
10. AI response sent to /api/tts (Text-to-Speech)
    ↓
11. Audio played to student
    ↓
12. Slides displayed synchronized with audio
    ↓
13. Progress tracked:
    - Time spent
    - Questions asked
    - Concepts covered
    - Concept mastery updated
    - Emotion history recorded
```

### **Emotion Adaptation Logic**

```
Emotion Detected
    ↓
    ├─ CONFUSED (confidence > 0.6)
    │  ├─ Simplification Level: BASIC
    │  ├─ Prompt: Use 10-year-old language
    │  └─ Break into tiny steps
    │
    ├─ FRUSTRATED (confidence > 0.5)
    │  ├─ Simplification Level: INTERMEDIATE
    │  ├─ Prompt: Validate feelings, rebuild confidence
    │  └─ Offer breaks and alternative explanations
    │
    ├─ BORED (confidence > 0.5)
    │  ├─ Action: Boost engagement
    │  ├─ Prompt: Add stories, real-world applications
    │  └─ Use enthusiasm
    │
    ├─ CONFIDENT (confidence > 0.7)
    │  ├─ Simplification Level: ADVANCED
    │  ├─ Prompt: Deeper insights, challenging questions
    │  └─ Explore advanced concepts
    │
    ├─ CURIOUS
    │  ├─ Prompt: Encourage questions
    │  └─ Explore "why" and "how"
    │
    ├─ EXCITED
    │  ├─ Prompt: Match their energy
    │  └─ Provide enriching details
    │
    └─ NEUTRAL
       └─ Continue with balanced pacing
```

---

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 14.2.3** - React framework with App Router
- **React 18.3.1** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 3.4.3** - Styling
- **Framer Motion 12.23.26** - Animations
- **Lucide React** - Icons
- **Mermaid 10.9.1** - Diagram generation

### **Backend**
- **Next.js API Routes** - Serverless functions
- **OpenAI API** (GPT-4, GPT-4o-mini, Whisper, TTS)
  - GPT-4 for tutoring logic
  - GPT-4o-mini for emotion detection
  - Whisper for speech-to-text
  - TTS for text-to-speech
- **ElevenLabs API** (Optional) - High-quality TTS

### **Database** (Optional)
- **Supabase** - PostgreSQL with real-time capabilities
- Not required for basic functionality

### **Deployment**
- **Vercel** - Recommended deployment platform

### **Development Tools**
- **ESLint** - Code linting
- **Autoprefixer** - CSS vendor prefixes
- **PostCSS** - CSS processing

---

## 📊 Key Data Structures

### **Message Interface**
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
```

### **LearningSlide Interface**
```typescript
interface LearningSlide {
  id: string;
  title: string;
  type: 'concept' | 'example' | 'tip' | 'practice' | 'diagram' | 'summary';
  content: string;
  keyPoints?: string[];
  example?: string;
  visualAid?: {
    type: 'mermaid' | 'illustration' | 'flowchart';
    data: string;
  };
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  };
  isSimplified?: boolean;
  simplificationLevel?: 'basic' | 'intermediate' | 'advanced';
  audioStartTime?: number;
  audioDuration?: number;
  spokenContent?: string;
}
```

### **Note Interface**
```typescript
interface Note {
  id: string;
  type: 'concept' | 'example' | 'tip' | 'summary';
  content: string;
  timestamp: Date;
}
```

### **ConceptMastery Interface**
```typescript
interface ConceptMastery {
  id: string;
  name: string;
  masteryLevel: number;        // 0-100
  timesReviewed: number;
  lastReviewed: Date;
  status: 'new' | 'learning' | 'reviewing' | 'mastered';
}
```

### **SessionStats Interface**
```typescript
interface SessionStats {
  questionsAsked: number;
  correctAnswers: number;
  slidesViewed: number;
  timeSpent: number;           // in seconds
  emotionHistory: Array<{
    emotion: string;
    timestamp: Date;
  }>;
  conceptsCovered: string[];
}
```

### **CustomTopic Interface**
```typescript
interface CustomTopic {
  id: string;
  name: string;
  category: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learningGoals: string[];
}
```

---

## 🎨 Emotion System

### **Detected Emotions**
1. **neutral** - Default, no special adaptation
2. **confused** - Needs simplification and multiple examples
3. **confident** - Ready for advanced concepts
4. **frustrated** - Needs encouragement and alternative approaches
5. **bored** - Needs engagement and real-world applications
6. **excited** - Positive momentum, match the energy
7. **curious** - Encourage deeper exploration

### **Detection Methods**
1. **Text-based**: Keywords in user messages
   - "confused" → confused
   - "got it" → confident
   - "boring" → bored

2. **Vision-based**: Facial expressions via camera
   - OpenAI Vision API analyzes expressions
   - Returns emotion + confidence (0-1)
   - Rate limited to 2.5 second intervals

3. **Hybrid**: Combines both methods for best accuracy

---

## 🚀 Usage & Key Workflows

### **Starting a Session**
1. Navigate to homepage
2. Select topic from TopicSelector or create custom
3. Enable camera (optional, for emotion detection)
4. Choose input method (voice or text)

### **Voice Input Workflow**
1. Hold spacebar to start recording
2. Speak question/message
3. Release spacebar to stop
4. Audio sent to STT
5. Transcribed text sent to tutor
6. Wait for AI response

### **Emotion Adaptation Workflow**
1. Camera captures frame every 2.5 seconds
2. Sent to emotion-vision API
3. Emotion detected (e.g., "confused")
4. Tutor generates simplified response
5. Simplified slides generated
6. Content complexity reduced

### **Progress Tracking Workflow**
1. Each interaction updates session stats
2. Concepts extracted from content
3. Concept mastery updated:
   - First encounter: +25 mastery, status="learning"
   - Each review: +15 mastery
   - At 80+ mastery: status="mastered"
4. Progress tracker visualizes improvement

---

## 🔑 Important Configuration

### **Environment Variables Required**
```
OPENAI_API_KEY=sk-... (Required)
ELEVENLABS_API_KEY=... (Optional, for better TTS)
NEXT_PUBLIC_SUPABASE_URL=... (Optional, for persistence)
NEXT_PUBLIC_SUPABASE_ANON_KEY=... (Optional)
```

### **Key Constants**
- **Emotion Detection Confidence Threshold**: 0.5-0.7
- **Simplification Trigger**: confidence > 0.6 for confused/frustrated
- **Audio Analysis Rate Limit**: 2.5 seconds between frames
- **Concept Mastery Increment**: +15 per review, +25 new concept
- **Mastery Threshold**: 80+ = mastered status

---

## 📝 API Request/Response Examples

### **POST /api/tutor**
**Request:**
```json
{
  "message": "What is binary search?",
  "topic": "dsa-binary-search",
  "emotion": "neutral",
  "emotionConfidence": 0.5,
  "history": []
}
```

**Response:**
```json
{
  "response": "Binary search is an efficient...",
  "slides": [...],
  "conversationalResponse": "Binary search is...",
  "simplificationLevel": "intermediate",
  "concepts": ["Binary Search", "Divide and Conquer"]
}
```

### **POST /api/emotion-vision**
**Request:**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "emotion": "confused",
  "confidence": 0.85
}
```

### **POST /api/generate-slides**
**Request:**
```json
{
  "topicName": "Binary Search",
  "description": "Finding elements in sorted arrays",
  "learningGoals": ["Understand divide and conquer", "Implement algorithm"],
  "emotion": "confused",
  "emotionConfidence": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "slides": [
    {
      "id": "slide-1",
      "title": "What is Binary Search?",
      "type": "concept",
      "content": "...",
      "keyPoints": ["...", "..."]
    }
  ]
}
```

---

## 🎯 Component Interaction Diagram

```
TutorSession (Main Orchestrator)
├── SpacebarVoiceInput
│   └── → /api/stt → LiveTranscript
├── EmotionCameraWidget
│   └── → /api/emotion-vision → EmotionBadge
├── LearningSlidePanel
│   ├── → /api/generate-slides
│   └── → MermaidDiagram (for visualizations)
├── LearningProgressTracker
│   └── Displays SessionStats & ConceptMastery
├── NotesPanel
│   └── Organizes and exports notes
├── TopicSelector / CustomTopicBuilder
│   └── Topic management
└── EnhancedAudioPlayer / AudioPlayer
    └── Plays TTS audio from /api/tts
```

---

## 💡 Key Features & Implementation

### **1. Adaptive Content Difficulty**
- **How**: Emotion detection triggers simplification
- **Where**: `lib/adaptive-response.ts` and `/api/tutor/route.ts`
- **Effect**: Content complexity adjusts in real-time

### **2. Concept Mastery Tracking**
- **How**: Extracts concepts from responses, updates mastery levels
- **Where**: `components/TutorSession.tsx` (updateConceptMastery function)
- **Levels**: new → learning → reviewing → mastered

### **3. Audio-Slide Synchronization**
- **How**: Slides include audioStartTime and audioDuration
- **Where**: `components/LearningSlidePanel.tsx`
- **Benefit**: Slides advance automatically with audio

### **4. Session Statistics**
- **Tracked**: Time spent, questions asked, correct answers, concepts covered
- **Display**: `LearningProgressTracker` component
- **Updates**: Real-time as session progresses

### **5. Custom Topic Creation**
- **Purpose**: Allow users to create personalized learning paths
- **Details**: Set description, goals, difficulty level
- **Implementation**: `CustomTopicBuilder` component, enhanced prompts in `/api/tutor`

---

## 🔍 Understanding the Learning Flow

### **When a Student Asks a Question:**

1. **Capture**: Student speaks (voice) or types (text)
   - Voice: Recorded as WebM, sent to `/api/stt`
   - Text: Directly available

2. **Transcribe**: `/api/stt` converts audio to text using Whisper

3. **Analyze Emotion**: 
   - Text-based: Check keywords in message
   - Camera-based: Send frame to `/api/emotion-vision`
   - Combined: Use both for confidence

4. **Generate Response**: `/api/tutor` receives:
   - Student message
   - Detected emotion + confidence
   - Current topic
   - Conversation history
   - Returns: AI response + recommended slides

5. **Adapt Content**:
   - If confused + high confidence: Simplify to "basic"
   - If bored: Add engaging examples
   - If confident: Provide advanced concepts

6. **Generate Slides**: `/api/generate-slides`
   - Creates 5 slides of mixed types
   - Includes quiz questions
   - Adds Mermaid diagrams
   - Includes audio timing metadata

7. **Audio Response**: `/api/tts` converts response to speech
   - Uses OpenAI TTS or ElevenLabs
   - Plays to student via EnhancedAudioPlayer

8. **Display**: 
   - Text response shown in chat
   - Slides displayed and auto-advance with audio
   - Progress updated
   - Notes auto-generated

9. **Track Progress**:
   - Concepts extracted and mastery updated
   - Emotion recorded in history
   - Session time updated
   - Questions counter incremented

---

## 🐛 Debugging Tips

### **Common Issues & Solutions**

1. **No audio response**
   - Check: OPENAI_API_KEY is set correctly
   - Check: `/api/tts` is responding
   - Check: Browser allows audio playback

2. **Emotion not detecting**
   - Check: Camera enabled and permission granted
   - Check: `/api/emotion-vision` endpoint responding
   - Check: Adequate lighting for face detection

3. **Slides not appearing**
   - Check: `/api/generate-slides` returns valid JSON
   - Check: Mermaid syntax is valid (check console)
   - Check: Response includes slide content

4. **Transcription errors**
   - Check: Audio quality and noise levels
   - Check: `/api/stt` receiving audio file
   - Check: Whisper model is available

### **Key Debug Points**
- Browser console for frontend errors
- Server logs for API errors
- Network tab to inspect request/response payloads
- Emotion widget shows detected emotion (helpful for testing)

---

## 📈 Scalability Considerations

1. **Rate Limiting**: Emotion detection throttled to 2.5s intervals
2. **Slide Generation**: Can be memory-intensive with GPT-4o
3. **Session Storage**: Currently in-memory; Supabase optional for persistence
4. **Real-time Updates**: Framer Motion may need optimization for large lists
5. **Audio Files**: Temporary WebM files cleaned up after STT

---

## 🎓 Learning Resources in Code

- **Predefined Topics**: `lib/tutor-prompts.ts` - Economics, DSA examples
- **Emotion Guidance**: `lib/tutor-prompts.ts` - Teaching strategies per emotion
- **System Prompts**: Comprehensive in both tutor-prompts and API routes

---

## Summary

The **AI Voice Tutor** is a sophisticated learning application that:
- ✅ Detects student emotions (face + text)
- ✅ Adapts teaching style in real-time
- ✅ Generates personalized learning slides
- ✅ Tracks progress and concept mastery
- ✅ Provides voice interaction
- ✅ Supports custom topics
- ✅ Auto-generates notes

All powered by OpenAI's APIs and delivered through a modern Next.js stack.
