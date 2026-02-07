# Supabase Database Setup Guide

## Quick Setup (5 minutes)

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization
4. Enter project name: `ai-voice-tutor`
5. Set database password (save it!)
6. Choose region closest to your users
7. Click "Create new project"

### 2. Get Your Credentials
From your Supabase project dashboard:
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **anon public** key
   - **service_role** key (reveal with eye icon)

### 3. Update Environment Variables
Add these to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 4. Run Database Migration
1. In Supabase dashboard, go to **SQL Editor**
2. Copy the entire content of `migrations/001_setup_database.sql`
3. Paste into the SQL Editor
4. Click **Run** to execute

### 5. Verify Setup
Your database should now have these tables:
- ✅ user_profiles
- ✅ user_preferences  
- ✅ learning_sessions
- ✅ conversation_messages
- ✅ learning_progress
- ✅ user_notes
- ✅ user_subscriptions
- ✅ user_credits
- ✅ credit_transactions
- ✅ achievement_definitions
- ✅ user_achievements

### 6. Test Your App
1. Restart your development server:
   ```bash
   npm run dev
   ```
2. Login with Clerk
3. Check browser console - should see:
   - `[Supabase] Configuration Status: {isConfigured: true}`
   - No `ERR_NAME_NOT_RESOLVED` errors

## What This Migration Does

- ✅ **Safe to run multiple times** (uses IF NOT EXISTS)
- ✅ **No DROP commands** (won't delete existing data)
- ✅ **Creates all necessary tables** for AI Voice Tutor
- ✅ **Sets up Row Level Security** (RLS) policies
- ✅ **Adds performance indexes**
- ✅ **Inserts default achievements**
- ✅ **Creates helper functions** for timestamps

## Important Notes

- **Never run the old `001_initial_schema.sql`** - it has DROP commands
- **Always use `001_setup_database.sql`** for new installations
- **Clerk handles authentication** - RLS policies are permissive
- **Default subscription** is 'starter' with 50 credits
- **All tables use `clerk_user_id`** as the primary identifier

## Troubleshooting

### Error: "relation does not exist"
- Run the migration SQL file
- Check table names in Supabase dashboard

### Error: "permission denied"
- Check RLS policies are enabled
- Verify API keys are correct

### Error: "ERR_NAME_NOT_RESOLVED"
- Check NEXT_PUBLIC_SUPABASE_URL is correct
- Verify project exists in Supabase dashboard

## Need Help?

If you encounter issues:
1. Check the SQL execution results in Supabase
2. Verify all environment variables are set
3. Ensure Clerk authentication is working
4. Check browser console for specific errors
