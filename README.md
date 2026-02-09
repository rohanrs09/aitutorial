# AI Voice Tutor

An intelligent, emotion-aware AI tutoring platform with voice interaction, real-time emotion detection, and adaptive learning.

Built with **Next.js 16**, **TypeScript**, **Supabase** (Auth + Database), and cutting-edge AI technologies.

---

## Features

### Core Learning
- **Voice Interaction** - Natural voice conversations with AI tutor (spacebar to speak)
- **Emotion Detection** - Real-time camera-based emotion recognition with adaptive responses
- **Adaptive Learning** - Content dynamically adjusts based on emotions and progress
- **Interactive Slides** - AI-generated learning slides with visual explanations
- **Smart Notes** - Auto-generated notes from learning sessions
- **Quiz System** - AI-generated quizzes with detailed analytics

### Progress & Analytics
- **Dashboard Analytics** - Comprehensive learning statistics and insights
- **Achievement System** - Gamification with auto-unlocking achievements
- **Streak Tracking** - Daily learning streaks and motivation
- **Session History** - Full session analysis and resume capability

### Course System
- **Structured Courses** - Multiple courses across different topics
- **YouTube Integration** - Video-based learning content
- **Progress Tracking** - Resume sessions where you left off

### Subscription & Credits
- **Starter Plan** - 50 free credits to get started
- **Pro Plan** - 500 credits/month ($19/mo)
- **Unlimited Plan** - Unlimited credits ($49/mo)
- **Stripe Integration** - Secure payment processing

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Auth & Database** | Supabase (PostgreSQL + Auth + RLS) |
| **AI (Primary)** | SLM via Hugging Face Inference API |
| **AI (Fallback)** | OpenAI GPT-4o, Google Gemini |
| **Voice (TTS)** | ElevenLabs |
| **Voice (STT)** | Deepgram |
| **Payments** | Stripe |
| **Styling** | Tailwind CSS, Framer Motion |
| **Deployment** | Vercel |

---

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account ([supabase.com](https://supabase.com))
- API keys (see Environment Variables below)

### Installation

```bash
git clone <your-repo-url>
cd ai-voice-tutor
npm install
cp .env.example .env.local
# Edit .env.local with your API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your keys:

### Required

| Variable | Description | Get it from |
|----------|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | [supabase.com/dashboard](https://supabase.com/dashboard) > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | Same as above |
| `HF_API_KEY` | Hugging Face API key (primary AI) | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS key | [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys) |
| `DEEPGRAM_API_KEY` | Deepgram STT key | [console.deepgram.com](https://console.deepgram.com) |
| `NEXT_PUBLIC_APP_URL` | App URL (`http://localhost:3000` for dev) | - |

### Optional

| Variable | Description | Get it from |
|----------|-------------|-------------|
| `OPENAI_API_KEY` | OpenAI fallback (if HF_API_KEY not set) | [platform.openai.com](https://platform.openai.com) |
| `GEMINI_API_KEY` | Gemini for quiz generation & fallback | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| `GEMINI_MODEL_NAME` | Gemini model (default: `gemini-1.5-flash`) | - |
| `SLM_MODEL_NAME` | Custom SLM model name | - |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | [dashboard.stripe.com](https://dashboard.stripe.com) |
| `STRIPE_SECRET_KEY` | Stripe secret key | Same as above |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Same as above |
| `STRIPE_PRICE_ID_PRO` | Stripe Price ID for Pro plan | Stripe Dashboard > Products |
| `STRIPE_PRICE_ID_UNLIMITED` | Stripe Price ID for Unlimited plan | Same as above |

---

## Database Setup

### 1. Create Supabase Project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Copy your project URL and keys from **Settings > API**

### 2. Run Migrations
1. Go to **SQL Editor** in your Supabase dashboard
2. Run `migrations/001_complete_schema.sql` (creates all tables, RLS, triggers)
3. Run `migrations/002_add_quiz_tables.sql` (adds quiz system tables)

### 3. Database Schema

| Table | Purpose |
|-------|---------|
| `user_profiles` | User info (linked to `auth.users`) |
| `user_subscriptions` | Subscription tier and status |
| `user_credits` | Credit balance (total, used, bonus) |
| `credit_transactions` | Credit usage history |
| `learning_sessions` | Session data (topic, duration, emotions) |
| `learning_progress` | Progress tracking per session |
| `conversation_messages` | Chat history per session |
| `user_notes` | Auto-generated and manual notes |
| `achievement_definitions` | Available achievements |
| `user_achievements` | Unlocked achievements per user |
| `user_preferences` | User settings (voice, theme, etc.) |
| `stripe_payments` | Payment records |
| `stripe_invoices` | Invoice records |

**Auto-provisioning:** A database trigger (`handle_new_user`) automatically creates `user_profiles`, `user_subscriptions`, `user_credits`, and `user_preferences` when a new user signs up via Supabase Auth.

**Row Level Security (RLS):** All tables have RLS enabled. Users can only access their own data.

---

## Project Structure

```
ai-voice-tutor/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/ensure-profile/  # Profile initialization
│   │   ├── credits/              # Credit balance & usage
│   │   ├── subscription/         # Subscription info & checkout
│   │   ├── tutor/                # AI tutor endpoints
│   │   ├── tts/                  # Text-to-speech
│   │   ├── stt/                  # Speech-to-text
│   │   ├── quiz/                 # Quiz generation
│   │   └── webhooks/stripe/      # Stripe webhooks
│   ├── auth/                     # Login, signup, callback pages
│   ├── dashboard/                # Dashboard pages
│   ├── course/[courseId]/        # Course detail pages
│   ├── session/[sessionId]/     # Session replay
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── dashboard/                # Dashboard widgets
│   ├── providers/                # Context providers
│   ├── ui/                       # Reusable UI components
│   ├── TutorSession.tsx          # Main tutoring session
│   ├── CreditsDisplay.tsx        # Credit balance display
│   └── ...                       # Other feature components
├── contexts/
│   └── AuthContext.tsx            # Supabase Auth context
├── hooks/
│   ├── useCredits.ts             # Credit fetching with cache
│   └── useUserSync.ts            # User data sync
├── lib/
│   ├── auth.ts                   # Server-side auth helpers
│   ├── supabase.ts               # Supabase browser client
│   ├── supabase-auth.ts          # Supabase SSR client
│   ├── ai-adapter.ts             # AI provider abstraction
│   ├── credits-events.ts         # Credit update event system
│   └── subscription/             # Subscription & credit logic
├── migrations/
│   ├── 001_complete_schema.sql   # Main schema
│   └── 002_add_quiz_tables.sql   # Quiz tables
├── middleware.ts                  # Auth middleware (Supabase)
└── docs/                         # Documentation
```

---

## Deployment (Vercel)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all environment variables from the table above
4. Set `NEXT_PUBLIC_APP_URL` to your production URL
5. Deploy

For Stripe webhooks in production, create a webhook endpoint pointing to `https://your-domain.com/api/webhooks/stripe`.

---

## Development

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run linter
```

---

## License

Layfirto
