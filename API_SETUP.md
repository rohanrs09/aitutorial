# 🔑 API Setup Instructions

## Current Issue

The application is showing **500 errors** because:
- **OpenAI API quota exceeded** - Your current API key has no available credits

## ✅ Solution

### **Add a Valid OpenAI API Key**

1. **Go to OpenAI Platform**  
   Visit: https://platform.openai.com/api-keys

2. **Create/Get API Key**  
   - Sign in to your account
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)

3. **Check Billing**  
   Visit: https://platform.openai.com/account/billing  
   - Ensure you have credits available
   - Add payment method if needed
   - Minimum $5 recommended for testing

4. **Add Key to .env File**  
   Edit `/Users/paremeshwarshelke/Documents/Rohan/Projects/ai-voice-tutor/.env`:
   
   ```env
   OPENAI_API_KEY=sk-your-actual-key-with-credits-here
   ```

5. **Restart the Server**  
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

---

## 🧪 Test the Application

Once you've added a valid API key:

1. **Type a message** in the chat: "What is binary search?"
2. **Click microphone** and speak a question
3. **Select different topics** from the dropdown
4. **Check emotion detection** - try typing "I'm confused"

---

## 🔍 Error Types Explained

### **429 Rate Limit / Quota Exceeded**
```
You exceeded your current quota
```
**Solution:** Add credits to your OpenAI account or use a different API key

### **401 Unauthorized**
```
Invalid API key
```
**Solution:** Check that your API key is correct and properly formatted

### **ECONNRESET / Network Error**
```
Connection error
```
**Solution:** Check internet connection, try again

---

## 💰 OpenAI Pricing (Approximate)

- **GPT-4o**: $2.50 per 1M input tokens, $10 per 1M output tokens
- **Whisper (STT)**: $0.006 per minute
- **TTS**: $15 per 1M characters

**Estimated cost per conversation:** ~$0.05-0.10

---

## 🆘 Still Having Issues?

### Check API Key Format
```bash
# Your key should look like:
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Verify .env File Location
```bash
# Should be in project root:
/Users/paremeshwarshelke/Documents/Rohan/Projects/ai-voice-tutor/.env
```

### Check Credits
```bash
# Visit: https://platform.openai.com/usage
# Ensure you have available credits
```

### Restart Server
```bash
# Kill current process
# Ctrl+C in terminal

# Restart
npm run dev
```

---

## ✅ Success Indicators

When everything is working:
- ✅ No red error banner at top
- ✅ AI responds to your messages
- ✅ Voice recording transcribes correctly
- ✅ Text-to-speech plays audio responses
- ✅ Diagrams generate when requested

---

## 🎯 Ready to Use

Once you've added your API key with credits:
1. Application will work immediately
2. All features will be functional
3. Error banner won't appear
4. Enjoy learning with your AI tutor!

---

**Current Server:** http://localhost:3000  
**Status:** Waiting for valid API key
