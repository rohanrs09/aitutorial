# AI Voice Tutor

An advanced, adaptive, emotion-aware AI tutoring application with voice interaction, real-time emotion detection, and personalized learning experiences. Built with Next.js 14, TypeScript, and powered by cutting-edge AI technologies.

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
- [Core Components](#core-components)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Usage Guide](#usage-guide)
- [Development Workflow](#development-workflow)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

### Core Learning Features

- **Voice Interaction**: Natural conversation with AI tutor using spacebar voice input or text chat
- **Emotion Detection**: Real-time facial emotion analysis via camera for adaptive teaching
- **Adaptive Learning**: Content automatically simplifies when confusion is detected, accelerates when confidence is high
- **Learning Slides**: Auto-generated educational slides with diagrams, synchronized with audio explanations
- **Progress Tracking**: Comprehensive session statistics and concept mastery visualization
- **Custom Topics**: Create personalized learning paths with custom goals and difficulty levels
- **Notes System**: Auto-generated structured notes (concepts, examples, tips) with download capability
- **Quiz Integration**: Interactive quizzes embedded in learning slides for knowledge reinforcement

### Technical Features

- **Responsive Design**: Fully mobile-first responsive UI with touch-friendly interactions
- **Real-time Audio Processing**: Low-latency speech-to-text and text-to-speech conversion
- **Visual Feedback**: Animated tutor orb with emotion indicators and speaking/listening states
- **Offline Capability**: Local storage for session data when Supabase is not configured
- **Multi-modal Input**: Support for both voice and text input methods
- **Accessibility**: Keyboard navigation, screen reader support, and reduced motion options

## Architecture Overview

The AI Voice Tutor follows a client-server architecture with the following key components:

### Client-Side (Frontend)

- **Next.js App Router**: Modern React framework with server-side rendering capabilities
- **Component-Based UI**: Modular React components for reusable UI elements
- **State Management**: React hooks for local state, with optional Supabase integration for persistence
- **Real-time Media Processing**: Web Audio API and MediaDevices API for microphone and camera access
- **Animations**: Framer Motion for smooth UI transitions and micro-interactions

### Server-Side (Backend)

- **Next.js API Routes**: Serverless functions for handling API requests
- **AI Service Integration**: Direct integration with OpenAI APIs (GPT-4o, Whisper, TTS)
- **Business Logic**: Adaptive teaching algorithms and emotion processing
- **Data Persistence**: Optional Supabase integration for user data and session history

### Data Flow

1. **User Input**: Voice captured via microphone or text entered in chat
2. **Speech Processing**: Audio converted to text using Whisper STT
3. **Emotion Analysis**: Camera feed analyzed for facial expressions using GPT-4o Vision
4. **AI Response Generation**: GPT-4o generates contextual responses considering emotional state
5. **Audio Output**: Response converted to speech using TTS
6. **Visual Content**: Learning slides and diagrams generated dynamically
7. **Data Storage**: Session data persisted locally or in Supabase

### Adaptive Teaching Engine

The core intelligence lies in the adaptive teaching system:

- **Emotion Detection**: Analyzes 7 emotions (neutral, confused, confident, frustrated, bored, excited, curious)
- **Content Adjustment**: Modifies explanation complexity based on detected emotions
- **Pacing Control**: Adjusts teaching speed based on user engagement levels
- **Concept Mastery Tracking**: Tracks understanding of learning objectives over time

## Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Microphone for voice interaction
- Camera for emotion detection (optional but recommended)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-voice-tutor

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys (see Environment Configuration below)

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
# Required - OpenAI API key for core functionality
OPENAI_API_KEY=sk-...

# Optional - Enhanced text-to-speech
ELEVENLABS_API_KEY=...

# Optional - User authentication and data persistence
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

#### API Key Requirements

1. **OpenAI API Key** (Required):
   - Navigate to [OpenAI Platform](https://platform.openai.com/)
   - Create an account and obtain an API key
   - Ensure you have credits in your account

2. **ElevenLabs API Key** (Optional):
   - For enhanced voice synthesis quality
   - Sign up at [ElevenLabs](https://elevenlabs.io/)

3. **Clerk Keys** (Optional):
   - For user authentication
   - Sign up at [Clerk](https://clerk.dev/)

4. **Supabase Keys** (Optional):
   - For data persistence
   - Sign up at [Supabase](https://supabase.io/)
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

## Development Workflow

### Code Structure Guidelines

- **Components**: Reusable UI elements in `components/`
- **Pages**: Route-specific components in `app/[route]/page.tsx`
- **API Routes**: Serverless functions in `app/api/[endpoint]/route.ts`
- **Business Logic**: Shared utilities in `lib/`
- **Styles**: Tailwind classes with custom utilities in `app/globals.css`

### Component Development

1. **Create Component**: Place new components in appropriate directories
2. **Type Safety**: Use TypeScript interfaces for props
3. **Accessibility**: Implement proper ARIA attributes and keyboard navigation
4. **Responsive Design**: Test on mobile, tablet, and desktop viewports
5. **Performance**: Optimize re-renders and bundle size

### API Development

1. **New Endpoint**: Create in `app/api/[endpoint]/route.ts`
2. **Validation**: Implement input validation and error handling
3. **Security**: Sanitize inputs and implement rate limiting
4. **Documentation**: Update this README with new endpoints

### Testing

- **Manual Testing**: Test all user flows in development
- **Browser Compatibility**: Verify functionality across major browsers
- **Responsive Testing**: Check layouts on various screen sizes
- **Accessibility Testing**: Use screen readers and keyboard navigation

### Performance Optimization

- **Bundle Analysis**: Monitor bundle size with `npm run analyze`
- **Image Optimization**: Use Next.js Image component
- **Code Splitting**: Leverage dynamic imports for heavy components
- **Caching**: Implement appropriate caching strategies

## Core Components

### Main Application Components

- **TutorSession.tsx**: Central orchestrator managing the entire tutoring session
- **AnimatedTutorOrb.tsx**: Visual representation of the AI tutor with emotion states
- **SpacebarVoiceInput.tsx**: Handles voice recording via spacebar press
- **LiveTranscript.tsx**: Displays real-time transcription of user speech
- **EmotionCameraWidget.tsx**: Manages camera access and emotion detection
- **LearningSlidePanel.tsx**: Renders educational slides with diagrams and quizzes
- **NotesPanel.tsx**: Displays and manages auto-generated learning notes
- **TopicSelector.tsx**: Interface for selecting learning topics
- **CustomTopicBuilder.tsx**: Form for creating custom learning paths

### UI Components

- **Button.tsx**: Reusable button with multiple variants and states
- **Card.tsx**: Flexible card container with hover and focus states
- **Input.tsx**: Styled input fields with validation support
- **Badge.tsx**: Status and emotion indicator badges
- **Skeleton.tsx**: Loading placeholders for better UX
- **EmptyState.tsx**: Consistent empty state illustrations
- **Tooltip.tsx**: Contextual help and guidance tooltips
- **PageTransition.tsx**: Smooth page and component transitions

### Utility Modules

- **tutor-prompts.ts**: Defines learning topics and AI prompting strategies
- **adaptive-response.ts**: Implements emotion-aware response adaptation
- **slide-generator.ts**: Generates learning slides from tutor responses
- **user-data.ts**: Manages user session data and statistics
- **utils.ts**: Common helper functions and constants

## API Endpoints

All API routes are located in `app/api/` and follow RESTful conventions:

### Core Tutoring

- **POST `/api/tutor`**: Main AI tutoring endpoint
  - Processes user input and generates contextual responses
  - Integrates emotion data for adaptive responses
  - Returns both text response and slide content

### Speech Processing

- **POST `/api/stt`**: Speech-to-text conversion
  - Accepts audio blob and returns transcribed text
  - Uses OpenAI Whisper for accurate transcription

- **POST `/api/tts`**: Text-to-speech conversion
  - Accepts text and returns audio stream
  - Supports multiple voices and speeds

### Emotion Analysis

- **POST `/api/emotion`**: Text-based emotion detection
  - Analyzes sentiment from text input
  - Returns emotion classification and confidence

- **POST `/api/emotion-vision`**: Image-based emotion detection
  - Analyzes facial expressions from camera feed
  - Returns detailed emotion analysis

### Content Generation

- **POST `/api/generate-slides`**: Learning slide generation
  - Creates structured educational content from topics
  - Returns formatted slides with key points

- **POST `/api/diagram`**: Educational diagram generation
  - Creates Mermaid diagrams for visual learning
  - Supports multiple diagram types (flowcharts, graphs)

### Utility

- **POST `/api/email-notes`**: Notes delivery via email
  - Formats and sends session notes to user
  - Requires valid email address

## Project Structure

```
ai-voice-tutor/
├── app/                          # Next.js App Router structure
│   ├── api/                      # API Routes
│   │   ├── diagram/              # Diagram generation endpoint
│   │   ├── email-notes/          # Notes email delivery
│   │   ├── emotion/              # Text emotion analysis
│   │   ├── emotion-vision/       # Camera-based emotion detection
│   │   ├── generate-slides/      # Learning slide generation
│   │   ├── stt/                  # Speech-to-text processing
│   │   ├── tts/                  # Text-to-speech conversion
│   │   └── tutor/                # Main AI tutoring endpoint
│   ├── dashboard/                # User dashboard page
│   ├── learn/                    # Learning session page
│   ├── settings/                 # User settings page
│   ├── sign-in/                  # Authentication pages
│   ├── sign-up/                  # Registration pages
│   ├── layout.tsx                # Root layout component
│   └── page.tsx                  # Landing page
├── components/                   # Reusable React components
│   ├── ui/                       # Primitive UI components
│   │   ├── Button.tsx            # Button variations
│   │   ├── Card.tsx              # Card containers
│   │   ├── Input.tsx             # Input fields
│   │   └── Badge.tsx             # Status indicators
│   ├── AnimatedTutorOrb.tsx      # Visual tutor representation
│   ├── AudioQualityMonitor.tsx   # Audio input monitoring
│   ├── CustomTopicBuilder.tsx    # Custom topic creation
│   ├── EmotionCameraWidget.tsx   # Camera emotion detection
│   ├── LearningProgressTracker.tsx # Progress visualization
│   ├── LearningSlidePanel.tsx    # Educational slide display
│   ├── LiveTranscript.tsx        # Real-time transcription
│   ├── MermaidDiagram.tsx        # Diagram rendering
│   ├── NotesPanel.tsx            # Learning notes display
│   ├── ScenarioSlide.tsx         # Quiz scenario slides
│   ├── SessionAnalyticsDashboard.tsx # Session metrics
│   ├── SpacebarVoiceInput.tsx    # Voice recording interface
│   ├── TopicSelector.tsx         # Topic selection UI
│   └── TutorSession.tsx          # Main tutoring session
├── lib/                          # Business logic and utilities
│   ├── adaptive-response.ts      # Emotion-adaptive algorithms
│   ├── keyboard-shortcuts.ts     # Keyboard interaction
│   ├── slide-generator.ts        # Slide content creation
│   ├── supabase.ts               # Database integration
│   ├── tutor-prompts.ts          # AI prompting templates
│   ├── user-data.ts              # User data management
│   └── utils.ts                  # Helper functions
├── public/                       # Static assets
├── .env.example                  # Environment template
├── middleware.ts                 # Route protection
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── vercel.json                   # Vercel deployment settings
```

## Technology Stack

### Frontend Framework

- **Next.js 14**: React framework with App Router for modern SSR/SSG
- **TypeScript**: Strongly typed JavaScript for better developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Framer Motion**: Production-ready motion library for React
- **Lucide React**: Beautiful, consistent icons as React components

### AI Services

- **OpenAI GPT-4o**: Primary language model for conversation and content generation
- **OpenAI Whisper**: Speech-to-text for converting voice to text
- **OpenAI TTS**: Text-to-speech for generating natural sounding audio
- **OpenAI GPT-4o Vision**: Computer vision for emotion detection from camera feed
- **Mermaid.js**: Diagram generation for educational visualizations

### Authentication & Data

- **Clerk** (Optional): Authentication and user management
- **Supabase** (Optional): PostgreSQL database for data persistence

### Development Tools

- **ESLint**: Code quality and consistency enforcement
- **Prettier**: Code formatting standardization
- **Vercel**: Deployment platform (recommended)

## Usage Guide

### Getting Started

1. **Navigate to the application** at `http://localhost:3000`
2. **Choose a learning topic** from the available options or create a custom topic
3. **Start a learning session** by clicking "Start Learning"

### Voice Interaction

- **Hold Spacebar**: Press and hold the spacebar key to speak
- **Release Spacebar**: Release to stop recording and send your question
- **Alternative**: Type your questions in the text input field

### Emotion Detection

1. **Enable Camera**: Click the camera icon to activate emotion detection
2. **Position Yourself**: Ensure your face is well-lit and centered
3. **Observe Feedback**: The tutor will adapt based on detected emotions

### Learning Experience

- **Slides Panel**: Educational content appears automatically as you learn
- **Notes Panel**: Key concepts are captured and organized automatically
- **Progress Tracking**: View your learning statistics in real-time
- **Quizzes**: Interactive questions reinforce learning objectives

### Advanced Features

- **Custom Topics**: Create personalized learning paths with specific goals
- **Session History**: Review past learning sessions (requires Supabase)
- **Notes Export**: Download or email session notes for offline review
- **Difficulty Adjustment**: Modify topic difficulty based on your level

## Development Workflow

### Code Structure Guidelines

- **Components**: Reusable UI elements in `components/`
- **Pages**: Route-specific components in `app/[route]/page.tsx`
- **API Routes**: Serverless functions in `app/api/[endpoint]/route.ts`
- **Business Logic**: Shared utilities in `lib/`
- **Styles**: Tailwind classes with custom utilities in `app/globals.css`

### Component Development

1. **Create Component**: Place new components in appropriate directories
2. **Type Safety**: Use TypeScript interfaces for props
3. **Accessibility**: Implement proper ARIA attributes and keyboard navigation
4. **Responsive Design**: Test on mobile, tablet, and desktop viewports
5. **Performance**: Optimize re-renders and bundle size

### API Development

1. **New Endpoint**: Create in `app/api/[endpoint]/route.ts`
2. **Validation**: Implement input validation and error handling
3. **Security**: Sanitize inputs and implement rate limiting
4. **Documentation**: Update this README with new endpoints

### Testing

- **Manual Testing**: Test all user flows in development
- **Browser Compatibility**: Verify functionality across major browsers
- **Responsive Testing**: Check layouts on various screen sizes
- **Accessibility Testing**: Use screen readers and keyboard navigation

### Performance Optimization

- **Bundle Analysis**: Monitor bundle size with `npm run analyze`
- **Image Optimization**: Use Next.js Image component
- **Code Splitting**: Leverage dynamic imports for heavy components
- **Caching**: Implement appropriate caching strategies

## Troubleshooting

### Common Issues

1. **API Key Errors**:
   - Verify `OPENAI_API_KEY` is correctly set
   - Check OpenAI account has sufficient credits
   - Ensure API key has required permissions

2. **Voice Input Not Working**:
   - Check browser microphone permissions
   - Ensure no other applications are using the microphone
   - Test microphone in browser settings

3. **Camera Access Denied**:
   - Grant camera permissions when prompted
   - Check browser settings for camera access
   - Ensure no other applications are using the camera

4. **Build Failures**:
   - Run `npm install` to ensure dependencies are installed
   - Check Node.js version meets requirements (18+)
   - Clear npm cache with `npm cache clean --force`

5. **Slow Responses**:
   - Check internet connection speed
   - Verify OpenAI API is not rate-limited
   - Consider upgrading to faster OpenAI tier

### Debugging Tips

- **Check Browser Console**: Look for JavaScript errors
- **Review Network Tab**: Examine API request/response details
- **Enable Logging**: Set `DEBUG=*` environment variable
- **Test APIs Directly**: Use Postman or curl to test endpoints

### Support

For additional help:

- Check GitHub Issues for known problems
- Review OpenAI API status page
- Consult Next.js documentation for framework issues
- Reach out to community forums for general questions
