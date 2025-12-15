#!/bin/bash

# AI Voice Tutor - Installation Verification Script
# This script checks if all required files and dependencies are properly set up

echo "🔍 AI Voice Tutor - Installation Verification"
echo "=============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1 (MISSING)"
        ((FAIL++))
    fi
}

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1/ (MISSING)"
        ((FAIL++))
    fi
}

echo "📁 Checking Directory Structure..."
echo ""

# Check main directories
check_dir "app"
check_dir "app/api"
check_dir "app/api/stt"
check_dir "app/api/tutor"
check_dir "app/api/tts"
check_dir "app/api/emotion"
check_dir "app/api/diagram"
check_dir "components"
check_dir "lib"

echo ""
echo "📄 Checking Core Files..."
echo ""

# Check app files
check_file "app/page.tsx"
check_file "app/layout.tsx"
check_file "app/globals.css"

# Check API routes
check_file "app/api/stt/route.ts"
check_file "app/api/tutor/route.ts"
check_file "app/api/tts/route.ts"
check_file "app/api/emotion/route.ts"
check_file "app/api/diagram/route.ts"

# Check components
check_file "components/VoiceRecorder.tsx"
check_file "components/ChatMessage.tsx"
check_file "components/EmotionBadge.tsx"
check_file "components/TopicSelector.tsx"
check_file "components/NotesDisplay.tsx"
check_file "components/MermaidDiagram.tsx"

# Check lib files
check_file "lib/supabase.ts"
check_file "lib/utils.ts"
check_file "lib/tutor-prompts.ts"

# Check config files
check_file "package.json"
check_file "tsconfig.json"
check_file "tailwind.config.ts"
check_file "next.config.js"
check_file "postcss.config.js"
check_file ".eslintrc.js"
check_file ".gitignore"

# Check documentation
check_file "README.md"
check_file "QUICKSTART.md"
check_file "MERMAID_GUIDE.md"
check_file "PROJECT_STRUCTURE.md"
check_file "COMPLETION_SUMMARY.md"

# Check environment
check_file ".env.example"

echo ""
echo "🔧 Checking Configuration..."
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    
    # Check if OPENAI_API_KEY is set
    if grep -q "OPENAI_API_KEY=sk-" .env; then
        echo -e "${GREEN}✓${NC} OPENAI_API_KEY is configured"
        ((PASS++))
    else
        echo -e "${YELLOW}⚠${NC} OPENAI_API_KEY needs to be set in .env"
        ((FAIL++))
    fi
else
    echo -e "${YELLOW}⚠${NC} .env file not found (copy from .env.example)"
    echo "   Run: cp .env.example .env"
    ((FAIL++))
fi

echo ""
echo "📦 Checking Dependencies..."
echo ""

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules directory exists"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} node_modules not found"
    echo "   Run: npm install"
    ((FAIL++))
fi

# Check if package-lock.json exists
if [ -f "package-lock.json" ]; then
    echo -e "${GREEN}✓${NC} package-lock.json exists"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} package-lock.json not found"
    echo "   Run: npm install"
    ((FAIL++))
fi

echo ""
echo "=============================================="
echo "📊 Verification Summary"
echo "=============================================="
echo ""
echo -e "${GREEN}Passed:${NC} $PASS checks"
echo -e "${RED}Failed:${NC} $FAIL checks"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Your project is ready.${NC}"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Make sure your .env file has OPENAI_API_KEY set"
    echo "   2. Run: npm run dev"
    echo "   3. Open: http://localhost:3000"
    echo ""
else
    echo -e "${YELLOW}⚠️  Some checks failed. Please review the output above.${NC}"
    echo ""
    if [ ! -f ".env" ]; then
        echo "Quick fix:"
        echo "   cp .env.example .env"
        echo "   # Then edit .env and add your OPENAI_API_KEY"
    fi
    if [ ! -d "node_modules" ]; then
        echo "Quick fix:"
        echo "   npm install"
    fi
    echo ""
fi

# Check Node.js version
echo "🔍 System Information:"
echo ""
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "   Node.js: $NODE_VERSION"
    
    # Check if Node version is >= 18
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ $NODE_MAJOR -ge 18 ]; then
        echo -e "   ${GREEN}✓${NC} Node.js version is compatible (18+)"
    else
        echo -e "   ${RED}✗${NC} Node.js version should be 18 or higher"
        echo "   Current: $NODE_VERSION"
        echo "   Please upgrade Node.js"
    fi
else
    echo -e "   ${RED}✗${NC} Node.js not found"
    echo "   Please install Node.js 18+ from https://nodejs.org"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "   npm: v$NPM_VERSION"
else
    echo -e "   ${RED}✗${NC} npm not found"
fi

echo ""
echo "=============================================="
