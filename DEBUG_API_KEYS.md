# API Keys Debugging Guide

## Common Issues & Solutions

### Issue 1: "API key not working" even after adding it

**Solution:**
1. **Restart your dev server** after changing `.env.local`
   ```bash
   # Stop server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

2. **Check file name**: Must be `.env.local` (not `.env` or `.env.example`)
   ```bash
   ls -la .env.local  # Should exist
   ```

3. **Check format** - No quotes, no spaces:
   ```bash
   # ✅ CORRECT:
   OPENAI_API_KEY=sk-proj-abc123...
   
   # ❌ WRONG:
   OPENAI_API_KEY="sk-proj-abc123..."
   OPENAI_API_KEY = sk-proj-abc123...
   ```

### Issue 2: "Rate limited" or "Quota exceeded"

**For OpenAI:**
- Check billing: https://platform.openai.com/account/billing
- Add billing info if needed
- Gemini will auto-fallback if configured

**For Gemini:**
- Get free API key: https://aistudio.google.com/app/apikey
- Add to `.env.local`: `GEMINI_API_KEY=your-key`

### Issue 3: "Authentication failed" (401)

**Check:**
1. API key is correct (no typos)
2. No extra spaces before/after key
3. Key hasn't been revoked
4. Server was restarted

**Verify keys:**
```bash
# Check if keys are loaded (in terminal where server runs)
node -e "require('dotenv').config({path: '.env.local'}); console.log('OpenAI:', process.env.OPENAI_API_KEY?.substring(0,10)); console.log('Gemini:', process.env.GEMINI_API_KEY?.substring(0,10));"
```

### Issue 4: "Model not found" (404) - Gemini

**This is fixed!** The app now only uses valid models:
- `models/gemini-1.5-flash` ✅
- `models/gemini-1.5-pro` ✅

### Quick Test

Test your API keys:

```bash
# Test OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_OPENAI_KEY"

# Test Gemini  
curl "https://generativelanguage.googleapis.com/v1/models/models/gemini-1.5-flash?key=YOUR_GEMINI_KEY"
```

## Step-by-Step Fix

1. **Stop your dev server** (Ctrl+C)

2. **Check your `.env.local` file:**
   ```bash
   cat .env.local
   ```

3. **Verify format:**
   ```bash
   OPENAI_API_KEY=sk-your-key-here
   GEMINI_API_KEY=your-gemini-key-here
   ```

4. **Restart server:**
   ```bash
   npm run dev
   ```

5. **Check console logs** for:
   - `[AIAdapter]` messages
   - Any error messages about API keys

## Still Not Working?

Check server logs for these error messages:
- `"API key is missing or empty"` → Key not in `.env.local`
- `"Authentication failed (401)"` → Invalid key
- `"Rate limited (429)"` → Quota exceeded (use Gemini fallback)

## Need Help?

1. Check server console for detailed error messages
2. Verify API keys at provider dashboards
3. Make sure `.env.local` exists (not `.env`)
4. Restart server after any changes
