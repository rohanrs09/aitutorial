# Supabase Schema Migration Guide

This guide explains how to apply the necessary database schema updates to fix the CORS, schema cache, and authentication issues in the AI Voice Tutor application.

## Issues Fixed

- **RLS Policy Violations**: Updated policies to allow operations with Clerk authentication
- **Schema Cache Mismatch**: Added missing columns like `concepts_covered`
- **401 Unauthorized Errors**: Fixed row-level security policy restrictions
- **Network Errors**: Improved error handling and fallbacks

## Required Database Changes

### 1. learning_progress Table
- Added `clerk_user_id` column for Clerk user ID support
- Added `concepts_covered`, `primary_emotion`, `quiz_score`, `total_time_minutes`, `mastery_level` columns
- Updated RLS policies to work with both UUID and Clerk user IDs

### 2. learning_sessions Table
- Updated RLS policies to support Clerk user IDs
- Maintained backward compatibility with UUID-based users

### 3. conversation_messages Table
- Added `clerk_user_id`, `emotion`, `audio_url`, `timestamp` columns
- Updated RLS policies for proper access control

## How to Apply Migrations

### Option 1: Using Supabase SQL Editor (Recommended)

1. Run the migration script:
   ```bash
   chmod +x apply-migrations.sh
   ./apply-migrations.sh
   ```

2. Copy each SQL block from the output and run it in your Supabase SQL Editor:
   - Go to your [Supabase Dashboard](https://app.supabase.com/)
   - Navigate to "Database" → "SQL Editor"
   - Paste and execute each SQL block in order

### Option 2: Direct SQL Execution

If you have psql access, you can run the SQL directly:

```sql
-- Run each block in order in your Supabase SQL Editor
-- Block 1: learning_progress updates
-- Block 2: learning_sessions updates  
-- Block 3: conversation_messages updates
```

## After Migration

1. **Clear Schema Cache**: Supabase may need a moment to refresh its schema cache
2. **Test the Application**: The CORS errors and schema cache issues should now be resolved
3. **Verify Authentication**: Both Clerk user IDs and UUIDs should work properly

## Troubleshooting

If you still see errors after applying the migrations:

1. **Schema Cache**: Wait 1-2 minutes for Supabase to refresh the schema cache
2. **RLS Policies**: Ensure Row Level Security is properly configured
3. **API Keys**: Verify your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct

## Verification

After applying the changes, you should see:
- ✅ No more "conceptsCovered column not found" errors
- ✅ PATCH requests working properly (no CORS errors)
- ✅ Successful session updates
- ✅ Proper Clerk user ID handling
- ✅ Stable network connections to Supabase