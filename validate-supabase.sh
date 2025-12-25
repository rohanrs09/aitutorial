#!/bin/bash

# ==========================================
# SUPABASE INTEGRATION VALIDATION SCRIPT
# ==========================================

echo "=========================================="
echo "SUPABASE INTEGRATION VALIDATION"
echo "=========================================="
echo ""

# 1. Check if .env.local exists
echo "📋 CHECKING CONFIGURATION..."
if [ -f ".env.local" ]; then
  echo "✅ .env.local exists"
  
  if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
    URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | cut -d'=' -f2)
    if [ -z "$URL" ]; then
      echo "❌ NEXT_PUBLIC_SUPABASE_URL is empty"
    else
      echo "✅ NEXT_PUBLIC_SUPABASE_URL is set"
    fi
  else
    echo "❌ NEXT_PUBLIC_SUPABASE_URL not in .env.local"
  fi
  
  if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
    KEY=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local | cut -d'=' -f2)
    if [ -z "$KEY" ]; then
      echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is empty"
    else
      echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
    fi
  else
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not in .env.local"
  fi
else
  echo "❌ .env.local not found"
  echo "   Create it with: cp .env.example .env.local"
fi

echo ""
echo "📁 CHECKING SUPABASE FILES..."

# Check if required files exist
if [ -f "lib/supabase.ts" ]; then
  echo "✅ lib/supabase.ts exists"
else
  echo "❌ lib/supabase.ts missing"
fi

if [ -f "lib/user-data.ts" ]; then
  echo "✅ lib/user-data.ts exists"
else
  echo "❌ lib/user-data.ts missing"
fi

if [ -f "migrations/001_create_tables.sql" ]; then
  echo "✅ migrations/001_create_tables.sql exists"
else
  echo "❌ migrations/001_create_tables.sql missing"
fi

if [ -f "lib/debug-supabase.ts" ]; then
  echo "✅ lib/debug-supabase.ts (debugging utility) exists"
else
  echo "⚠️  lib/debug-supabase.ts (debugging utility) missing"
fi

echo ""
echo "📦 CHECKING DEPENDENCIES..."

if grep -q '"@supabase/supabase-js"' package.json; then
  echo "✅ @supabase/supabase-js in package.json"
else
  echo "❌ @supabase/supabase-js not in package.json"
fi

echo ""
echo "=========================================="
echo "NEXT STEPS:"
echo "=========================================="
echo ""
echo "1. If .env.local is missing or incomplete:"
echo "   - Create .env.local with Supabase credentials"
echo "   - Get URL from: https://supabase.com > Project Settings > API"
echo "   - Get Key from: Same location > anon public key"
echo ""
echo "2. If tables don't exist (test after step 1):"
echo "   - Go to: https://supabase.com > SQL Editor"
echo "   - Create new query"
echo "   - Copy content from: migrations/001_create_tables.sql"
echo "   - Run the query"
echo ""
echo "3. Start dev server:"
echo "   npm run dev"
echo ""
echo "4. Test in browser:"
echo "   - Open DevTools (F12)"
echo "   - Go to Console tab"
echo "   - Create a learning session"
echo "   - Should see '[Supabase] ✅ Session saved successfully'"
echo ""
echo "5. For detailed debugging:"
echo "   - In browser console, run: await debugSupabase()"
echo "   - This shows full connection status and recommendations"
echo ""
echo "=========================================="
