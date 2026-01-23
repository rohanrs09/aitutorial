# Quiz System - Complete Documentation

## Overview

A comprehensive quiz system that generates topic-based quizzes, tracks user performance, and provides detailed analytics. The system is fully integrated with the user's learning history and dashboard.

---

## Features

### ✅ Core Functionality
- **Topic-Based Quiz Generation** - Quizzes generated from predefined question banks
- **Multiple Question Types** - Multiple choice, true/false, code output, fill-in-blank
- **Difficulty Levels** - Easy, Medium, Hard, or Mixed
- **Real-time Feedback** - Immediate answer validation with explanations
- **Progress Tracking** - Live progress bar and score tracking
- **Session Management** - Save and resume quiz sessions
- **Result Analytics** - Comprehensive performance analysis

### 📊 Analytics & Insights
- **Overall Statistics** - Total quizzes, average score, accuracy, time spent
- **Topic Performance** - Per-topic scores, trends, and best scores
- **Strengths & Weaknesses** - Automatic identification of strong/weak topics
- **Recent Quiz History** - Last 5 quiz results with details
- **Difficulty Breakdown** - Performance by difficulty level
- **Performance Trends** - Improving, stable, or declining indicators

---

## Architecture

### File Structure

```
lib/
├── quiz-types.ts          # TypeScript types and interfaces
└── quiz-service.ts        # Quiz generation and data management

components/
├── QuizSession.tsx        # Active quiz interface
├── QuizStarter.tsx        # Quiz configuration and start screen
└── dashboard/
    └── QuizAnalytics.tsx  # Analytics dashboard component

app/
└── quiz/
    └── page.tsx           # Main quiz page with routing
```

### Data Flow

```
1. User selects topic → QuizStarter
2. Generate quiz → quiz-service.ts → createQuizSession()
3. Store in Supabase → quiz_sessions table
4. User takes quiz → QuizSession component
5. Submit answers → submitAnswer() → Update session
6. Complete quiz → completeQuizSession()
7. Store results → quiz_results table
8. View analytics → QuizAnalytics component
```

---

## Database Schema

### Tables Required

#### 1. `quiz_sessions`
Stores active and completed quiz sessions.

**Columns:**
- `id` (TEXT, PRIMARY KEY)
- `clerk_user_id` (TEXT, NOT NULL)
- `topic` (TEXT, NOT NULL)
- `questions` (JSONB, NOT NULL)
- `attempts` (JSONB, NOT NULL)
- `started_at` (TIMESTAMPTZ)
- `completed_at` (TIMESTAMPTZ)
- `score` (INTEGER)
- `total_points` (INTEGER)
- `accuracy` (DECIMAL)
- `average_time_per_question` (DECIMAL)
- `status` (TEXT) - 'in-progress' | 'completed' | 'abandoned'

#### 2. `quiz_results`
Stores completed quiz results for analytics.

**Columns:**
- `id` (TEXT, PRIMARY KEY)
- `session_id` (TEXT, REFERENCES quiz_sessions)
- `clerk_user_id` (TEXT, NOT NULL)
- `topic` (TEXT, NOT NULL)
- `score` (INTEGER)
- `total_points` (INTEGER)
- `accuracy` (DECIMAL)
- `questions_attempted` (INTEGER)
- `total_questions` (INTEGER)
- `time_spent` (INTEGER)
- `completed_at` (TIMESTAMPTZ)
- `strengths` (TEXT[])
- `weaknesses` (TEXT[])
- `difficulty_breakdown` (JSONB)

**See `DATABASE_SCHEMA.md` for complete SQL setup.**

---

## Usage Guide

### For Users

#### Starting a Quiz

1. **From Dashboard:**
   - Navigate to Dashboard → Quizzes tab
   - Click "New Quiz" or select a recommended topic
   - Choose topic, difficulty, and question count
   - Click "Start Quiz"

2. **From UserLearningInsights:**
   - Click "Quick Quiz" tab
   - Click "Start Quick Quiz"

3. **Direct URL:**
   - Visit `/quiz`
   - Or `/quiz?topic=Arrays%20%26%20Strings` for specific topic

#### Taking a Quiz

- Read each question carefully
- Select your answer from the options
- Click "Submit Answer" to check correctness
- Review the explanation provided
- Click "Next Question" to continue
- Click "Finish Quiz" on the last question

#### Viewing Results

- Immediate results shown after completion
- Score, accuracy, and question breakdown
- Navigate to Dashboard → Quizzes for detailed analytics

### For Developers

#### Adding New Questions

Edit `lib/quiz-service.ts` and add to `QUESTION_BANK`:

```typescript
const QUESTION_BANK: Record<string, QuizQuestion[]> = {
  'Your Topic': [
    {
      id: 'unique-id',
      topic: 'Your Topic',
      subtopic: 'Specific Area',
      question: 'Your question here?',
      type: 'multiple-choice',
      difficulty: 'medium',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 1, // Index of correct option
      explanation: 'Why this is the correct answer',
      points: 10,
    },
  ],
};
```

#### Creating a Quiz Programmatically

```typescript
import { createQuizSession } from '@/lib/quiz-service';

const config = {
  topic: 'Arrays & Strings',
  questionCount: 5,
  difficulty: 'mixed', // or 'easy', 'medium', 'hard'
};

const session = await createQuizSession(userId, config);
```

#### Fetching Analytics

```typescript
import { getQuizAnalytics } from '@/lib/quiz-service';

const analytics = await getQuizAnalytics(userId);
console.log(analytics.averageScore);
console.log(analytics.strongTopics);
console.log(analytics.weakTopics);
```

---

## API Reference

### Quiz Service Functions

#### `generateQuiz(config: TopicQuizConfig): QuizQuestion[]`
Generates a quiz based on configuration.

**Parameters:**
- `config.topic` - Topic name
- `config.questionCount` - Number of questions (3-10)
- `config.difficulty` - 'easy' | 'medium' | 'hard' | 'mixed'

**Returns:** Array of quiz questions

---

#### `createQuizSession(userId: string, config: TopicQuizConfig): Promise<QuizSession>`
Creates a new quiz session.

**Parameters:**
- `userId` - Clerk user ID
- `config` - Quiz configuration

**Returns:** QuizSession object

---

#### `submitAnswer(sessionId: string, questionId: string, userAnswer: string | number, timeSpent: number)`
Submits an answer for a question.

**Returns:** `{ isCorrect: boolean, explanation: string }`

---

#### `completeQuizSession(sessionId: string): Promise<QuizResult | null>`
Completes a quiz and generates results.

**Returns:** QuizResult with analytics

---

#### `getQuizAnalytics(userId: string): Promise<QuizAnalytics | null>`
Fetches comprehensive quiz analytics for a user.

**Returns:** QuizAnalytics object

---

#### `getAvailableTopics(): string[]`
Gets list of available quiz topics.

**Returns:** Array of topic names

---

## Component Props

### QuizSession

```typescript
interface QuizSessionProps {
  session: QuizSession;
  onComplete: (result: QuizResult) => void;
  onExit: () => void;
}
```

### QuizStarter

```typescript
interface QuizStarterProps {
  userId: string;
  onStartQuiz: (config: TopicQuizConfig) => void;
  onCancel: () => void;
  suggestedTopics?: string[];
}
```

### QuizAnalytics

```typescript
interface QuizAnalyticsProps {
  userId: string | null;
  onStartQuiz?: (topic: string) => void;
}
```

---

## Available Topics

Current question banks available:
- **Arrays & Strings** - Array basics, two pointers, sliding window
- **Linked Lists** - Basics, cycle detection
- **Stacks & Queues** - LIFO/FIFO, applications
- **Binary Search** - Search algorithms, prerequisites
- **Recursion** - Base cases, recursive thinking

---

## Performance Metrics

### Scoring System
- Each question has a point value (typically 5-10 points)
- Score = Sum of points for correct answers
- Accuracy = (Correct answers / Total questions) × 100

### Trend Calculation
- **Improving**: Recent average > Previous average by 10%+
- **Declining**: Recent average < Previous average by 10%+
- **Stable**: Within ±10% range

### Strength/Weakness Thresholds
- **Strong Topic**: Average score ≥ 80%
- **Weak Topic**: Average score < 60%

---

## Setup Instructions

### 1. Database Setup
Run the SQL commands in `DATABASE_SCHEMA.md` in your Supabase SQL Editor.

### 2. Environment Variables
Ensure these are set:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

### 3. Test the System
1. Navigate to `/quiz`
2. Start a quiz
3. Complete it
4. Check Dashboard → Quizzes tab for analytics

---

## Troubleshooting

### Quiz not saving
- Check Supabase connection
- Verify RLS policies are enabled
- Check browser console for errors

### Questions not loading
- Verify topic name matches exactly
- Check QUESTION_BANK in quiz-service.ts
- Ensure questionCount ≤ available questions

### Analytics not showing
- Complete at least one quiz
- Check quiz_results table has data
- Verify clerk_user_id matches current user

---

## Future Enhancements

### Planned Features
- [ ] AI-generated questions based on learning content
- [ ] Adaptive difficulty (questions get harder/easier based on performance)
- [ ] Timed quizzes with countdown
- [ ] Leaderboards and achievements
- [ ] Quiz sharing and challenges
- [ ] Export quiz results as PDF
- [ ] Question explanations with video links
- [ ] Practice mode (no score tracking)
- [ ] Custom quiz creation by users

### Extensibility
The system is designed to be easily extended:
- Add new question types in `quiz-types.ts`
- Implement custom scoring algorithms
- Add new analytics metrics
- Integrate with external question APIs

---

## Contributing

When adding new questions:
1. Follow the existing question format
2. Include clear explanations
3. Test all answer options
4. Verify difficulty level is appropriate
5. Add relevant subtopics for better analytics

---

## License

Part of the AI Voice Tutor application.

---

## Support

For issues or questions:
1. Check this documentation
2. Review `DATABASE_SCHEMA.md`
3. Check browser console for errors
4. Verify Supabase tables exist and have correct schema
