#!/bin/bash

# SUPABASE INTEGRATION - COMPLETE CHECKLIST
# Run this to verify everything is set up correctly

echo "=========================================="
echo "SUPABASE INTEGRATION CHECKLIST"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
PASSED=0
FAILED=0

# Function to check
check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((FAILED++))
  fi
}

# 1. Check files exist
echo "📁 CHECKING FILES..."
[ -f "migrations/001_create_tables.sql" ]
check "Migration file exists"

[ -f "lib/supabase.ts" ]
check "Supabase client exists"

[ -f "lib/user-data.ts" ]
check "User data manager exists"

[ -f "lib/debug-supabase.ts" ]
check "Debug utility exists"

[ -f ".env.local" ] || [ -f ".env.example" ]
check "Environment file exists"

echo ""
echo "📚 CHECKING DOCUMENTATION..."
[ -f "FINAL_SUMMARY.md" ]
check "Final summary exists"

[ -f "SUPABASE_SETUP.md" ]
check "Setup guide exists"

[ -f "SUPABASE_TROUBLESHOOTING.md" ]
check "Troubleshooting guide exists"

[ -f "POLICY_CONFLICT_RESOLUTION.md" ]
check "Policy conflict guide exists"

[ -f "RLS_VISUAL_GUIDE.md" ]
check "Visual guide exists"

echo ""
echo "🔍 CHECKING CODE QUALITY..."

# Check if migrations file has DROP POLICY statements
grep -q "DROP POLICY IF EXISTS" migrations/001_create_tables.sql
check "Migration has DROP POLICY statements"

# Check if supabase.ts exports required functions
grep -q "export.*validateSupabaseConnection" lib/supabase.ts
check "supabase.ts exports validateSupabaseConnection"

grep -q "export.*checkSupabaseHealth" lib/supabase.ts
check "supabase.ts exports checkSupabaseHealth"

# Check if user-data.ts has logging
grep -q "\[Session\]" lib/user-data.ts
check "user-data.ts has session logging"

grep -q "\[Supabase\]" lib/user-data.ts
check "user-data.ts has Supabase logging"

# Check if debug file exists and has required function
grep -q "export.*debugSupabase" lib/debug-supabase.ts 2>/dev/null
check "debug-supabase.ts exports debugSupabase function"

echo ""
echo "📦 CHECKING DEPENDENCIES..."

grep -q "@supabase/supabase-js" package.json
check "Supabase JS client in dependencies"

grep -q "next" package.json
check "Next.js in dependencies"

echo ""
echo "=========================================="
echo "SUMMARY"
echo "=========================================="
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL CHECKS PASSED!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Add environment variables to .env.local"
  echo "2. Run: npm run dev"
  echo "3. Go to Supabase SQL Editor"
  echo "4. Copy and run migrations/001_create_tables.sql"
  echo "5. Verify tables in Supabase Table Editor"
  echo "6. Create a learning session in the app"
  echo "7. Check console for [Supabase] success message"
  echo ""
else
  echo -e "${RED}⚠️  SOME CHECKS FAILED${NC}"
  echo ""
  echo "Failed items:"
  echo "- Check that all files are present"
  echo "- Verify file permissions"
  echo "- Check that package.json has all dependencies"
  echo ""
fi

echo "=========================================="
