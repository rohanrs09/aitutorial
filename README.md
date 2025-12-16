# AI Voice Tutor

An adaptive, emotion-aware AI tutoring application with voice interaction, real-time emotion detection, and personalized learning experiences.

## Features

- **Voice Interaction**: Hold spacebar to speak, receive audio responses
- **Emotion Detection**: Real-time facial emotion analysis via camera
- **Adaptive Learning**: Content automatically simplifies when confusion is detected
- **Learning Slides**: Auto-generated slides synchronized with audio explanations
- **Progress Tracking**: Session statistics and concept mastery visualization
- **Custom Topics**: Create personalized learning paths
- **Notes System**: Auto-generated notes with download capability

## Quick Start

### Prerequisites

- Node.js 18+
- OpenAI API key (required)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-voice-tutor

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for GPT-4, TTS, and Whisper STT |
| `ELEVENLABS_API_KEY` | No | ElevenLabs API key for enhanced TTS |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase URL for data persistence |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anonymous key |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Add environment variables in project settings
4. Deploy

### Manual Deployment

```bash
npm run build
npm start
```

## Project Structure

```
ai-voice-tutor/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── tutor/         # Main AI tutor endpoint
│   │   ├── stt/           # Speech-to-text (Whisper)
│   │   ├── tts/           # Text-to-speech
│   │   ├── emotion-vision/# Facial emotion detection
│   │   └── generate-slides/# Learning slide generation
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── TutorSession.tsx   # Main session controller
│   ├── SpacebarVoiceInput.tsx
│   ├── EmotionCameraWidget.tsx
│   ├── LearningSlidePanel.tsx
│   ├── LearningProgressTracker.tsx
│   └── NotesPanel.tsx
├── lib/                   # Utilities and helpers
│   ├── tutor-prompts.ts   # Topic definitions
│   ├── adaptive-response.ts # Emotion-adaptive logic
│   └── utils.ts           # Common utilities
└── vercel.json            # Vercel deployment config
```

## Usage

1. **Select a Topic**: Click the topic button to choose a subject
2. **Ask Questions**: Hold spacebar and speak, or type in the chat
3. **Enable Camera**: Turn on emotion detection for adaptive responses
4. **View Slides**: Learning slides appear as the tutor explains
5. **Download Notes**: Save your session notes for later review

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **AI Services**:
  - GPT-4o (conversation and slide generation)
  - Whisper (speech-to-text)
  - OpenAI TTS (text-to-speech)
  - GPT-4o Vision (emotion detection)

## License

MIT
