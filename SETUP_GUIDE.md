# 🚀 Setup Guide - AI Voice Tutor

## Quick Setup (3 Steps)

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages. Expected time: 1-2 minutes.

### 2. Configure Environment

```bash
cp .env.example .env
```

Then edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-actual-key-here
```

**How to get OpenAI API Key:**
1. Visit: https://platform.openai.com/api-keys
2. Sign in or create account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Paste into `.env` file

### 3. Run the Application

```bash
npm run dev
```

Open your browser to: **http://localhost:3000**

---

## ✅ Verification

Run the verification script to check everything is set up correctly:

```bash
./verify-installation.sh
```

This checks:
- All files present
- Dependencies installed
- Environment configured
- Node.js version

---

## 🎨 New UI Features

The app now features a modern, production-quality design inspired by EverTutor:

### **Dark Theme**
- Deep navy/black background
- Gradient orbs and glowing elements
- Purple/pink accent colors

### **Glass Morphism**
- Frosted glass effect on cards
- Semi-transparent elements
- Backdrop blur effects

### **Floating Voice Orb**
- Large central gradient orb
- Pulsing animation when speaking
- Smooth floating animation

### **Enhanced Components**
- Redesigned chat bubbles with gradients
- Modern topic selector with categories
- Animated key points display
- Sleek microphone button

### **Smooth Animations**
- Fade-in effects
- Hover transitions
- Gradient shifts
- Pulsing indicators

---

## 🎯 Testing the App

### Test Voice Recording:
1. Click the microphone button (purple/pink gradient)
2. Allow browser permissions
3. Speak your question
4. Watch transcription appear
5. AI responds with voice

### Test Emotion Detection:
- Type: "I don't understand" → Badge shows Confused 😕
- Type: "Got it!" → Badge shows Confident 😊
- Watch the badge change color and emoji

### Test Diagrams:
- Ask: "Can you show me a diagram of binary search?"
- Mermaid flowchart appears in sidebar
- Visual explanation included

### Test Topics:
- Click topic selector (shows current topic + category)
- Browse topics by category
- Select different topic
- AI adapts responses

---

## 🔧 Troubleshooting

### TypeScript Errors in IDE

If you see TypeScript errors before running `npm install`, this is normal. They will disappear after installing dependencies.

### Microphone Not Working

1. Check browser permissions (click lock icon in address bar)
2. Allow microphone access
3. Use Chrome or Edge (best compatibility)
4. Ensure you're on HTTPS in production

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

---

## 🎨 UI Customization

### Change Color Scheme

Edit `app/globals.css`:

```css
:root {
  --background: #0a0e27;     /* Main dark background */
  --foreground: #ffffff;     /* Text color */
  --primary: #8b5cf6;        /* Purple */
  --secondary: #6366f1;      /* Indigo */
  --accent: #ec4899;         /* Pink */
}
```

### Adjust Animations

Edit animation speeds in `app/globals.css`:

```css
@keyframes float {
  /* Adjust duration here */
}
```

### Modify Orb Colors

Edit `app/page.tsx`:

```typescript
// Find .gradient-orb class usage
className="gradient-orb"  // Change gradient in CSS
```

---

## 📦 Optional Enhancements

### Better Text-to-Speech (ElevenLabs)

Add to `.env`:
```env
ELEVENLABS_API_KEY=your-key
```

More natural voice, better expression.

### Database (Supabase)

Add to `.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

Enables session storage and history.

---

## 🚀 Production Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git push

# 2. Import in Vercel
# 3. Add OPENAI_API_KEY environment variable
# 4. Deploy
```

### Docker

```bash
docker build -t ai-voice-tutor .
docker run -p 3000:3000 --env-file .env ai-voice-tutor
```

---

## 📊 Performance Tips

### Optimize Loading Speed
- Use production build: `npm run build && npm start`
- Enable Vercel Edge Functions
- Configure CDN for static assets

### Reduce API Costs
- Cache common responses
- Limit context history (already set to 5 messages)
- Use shorter prompts for simple questions

---

## 🆘 Support

### Quick Checklist
- ✅ Node.js 18+ installed
- ✅ `npm install` completed successfully
- ✅ `.env` file created with OPENAI_API_KEY
- ✅ No error messages in terminal
- ✅ Browser at http://localhost:3000

### Common Issues

**"Cannot find module"**
→ Run `npm install`

**"Invalid API Key"**
→ Check `.env` file, ensure key starts with `sk-`

**TypeScript errors in editor**
→ Normal before npm install, restart editor after install

**Dark theme not showing**
→ Clear browser cache, hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

---

## 🎓 Ready to Learn!

Your AI Voice Tutor is now ready with a beautiful, modern interface. Enjoy the enhanced learning experience!

**Key Features:**
- 🎙️ Voice-first interaction
- 😊 Emotion-aware teaching
- 📊 Auto-generated diagrams
- 🎨 Modern, professional UI
- ⚡ Fast and responsive

**Start learning now!** 🚀
