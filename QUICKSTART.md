# 🚀 Quick Start Guide - AI Voice Tutor

## Ready in 3 Minutes! ⚡

### Step 1: Install Dependencies (1 minute)

```bash
npm install
```

This installs all required packages including Next.js, React, OpenAI SDK, Mermaid, and more.

### Step 2: Setup Environment (1 minute)

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Add your OpenAI API key (minimum required):

```env
OPENAI_API_KEY=sk-your-actual-openai-key-here
```

**Get OpenAI Key**:
1. Go to https://platform.openai.com
2. Sign in/Sign up
3. Click "API Keys" in left sidebar
4. Click "Create new secret key"
5. Copy and paste into `.env`

### Step 3: Run the App (30 seconds)

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## 🎉 That's It!

You now have a fully functional AI Voice Tutor running locally.

## First Test

1. **Select a Topic**: Click the "Binary Search" dropdown
2. **Ask a Question**: Type "How does binary search work?" OR click the microphone
3. **Get Response**: AI tutor responds with explanation + voice
4. **See Diagram**: Diagram appears automatically in sidebar
5. **Review Notes**: Key points highlighted in yellow box

## Features You Can Try

### 🎤 Voice Mode
- Click the blue microphone button
- Speak your question (allow mic permissions)
- AI transcribes and responds with voice

### 😊 Emotion Detection
- Try asking: "I don't understand this" (Confused 😕)
- Or: "Got it! Makes sense!" (Confident 😊)
- Watch the emotion badge change

### 📚 Different Topics
- Economics: "Explain diminishing returns"
- DSA: "What is recursion?"
- Aptitude: "How to calculate profit percentage?"
- GRE: "Tips for verbal reasoning?"
- OOP: "What is inheritance?"

### 📊 Diagrams
- Ask: "Can you show me a diagram?"
- Or: "Visualize binary search"
- Mermaid diagrams appear in sidebar

## Optional Enhancements

### Better Text-to-Speech (ElevenLabs)

Add to `.env`:
```env
ELEVENLABS_API_KEY=your-elevenlabs-key
```

Get key from: https://elevenlabs.io

### Better Speech-to-Text (Deepgram)

Add to `.env`:
```env
DEEPGRAM_API_KEY=your-deepgram-key
```

Get key from: https://deepgram.com

### Session Storage (Supabase)

Add to `.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

1. Go to https://supabase.com
2. Create new project
3. Run `supabase-schema.sql` in SQL Editor
4. Copy URL and anon key

## Troubleshooting

### "Cannot find module 'openai'"
```bash
npm install
```

### "Invalid API Key"
- Check `.env` file exists in project root
- Verify key starts with `sk-`
- No extra spaces or quotes

### Microphone Not Working
- Check browser permissions (click lock icon in address bar)
- Use Chrome or Edge (best support)
- Must use HTTPS in production

### Diagrams Not Showing
- Check browser console for errors
- Mermaid syntax might be invalid
- Fallback to text explanation works fine

## Production Build

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push to GitHub
2. Go to vercel.com
3. Import repository
4. Add `OPENAI_API_KEY` in environment variables
5. Deploy

## File Structure Overview

```
ai-voice-tutor/
├── app/
│   ├── api/          # Backend API routes
│   │   ├── stt/      # Speech-to-Text
│   │   ├── tutor/    # AI responses
│   │   ├── tts/      # Text-to-Speech
│   │   ├── emotion/  # Emotion detection
│   │   └── diagram/  # Diagram generation
│   ├── page.tsx      # Main UI
│   └── layout.tsx    # App layout
├── components/       # React components
├── lib/             # Utilities & configs
└── .env             # Your API keys
```

## Next Steps

1. ✅ Run the app locally
2. ✅ Test voice recording
3. ✅ Try different topics
4. ✅ See emotion detection
5. ✅ Generate diagrams
6. 📖 Read full README.md for details
7. 🎨 Customize UI in `app/page.tsx`
8. 🧠 Adjust AI prompts in `lib/tutor-prompts.ts`
9. 🚀 Deploy to Vercel

## Need Help?

1. Check browser console for errors
2. Read README.md (comprehensive guide)
3. Read MERMAID_GUIDE.md (diagram issues)
4. Verify all API keys are correct
5. Check Node.js version (need 18+)

## Have Fun Learning! 🎓

The AI tutor is ready to help you learn Economics, DSA, Aptitude, GRE, and Programming!

---

**Remember**: This is a complete, production-ready app. No TODOs, no placeholders. Just add your API key and run!
