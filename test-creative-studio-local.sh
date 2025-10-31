#!/bin/bash

# Creative Studio Local Test Script
# Tests authentication, model mapping, and credit deduction

echo "🧪 Testing Creative Studio on localhost:3001..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001"

echo "📋 Test Plan:"
echo "  1. Check if server is running"
echo "  2. Test authentication endpoint"
echo "  3. Test Creative Studio with different models"
echo ""

# Check server
echo "1️⃣  Checking server status..."
if curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server not responding. Make sure 'npm run dev' is running.${NC}"
    exit 1
fi

echo ""
echo "2️⃣  Testing authentication..."
AUTH_RESPONSE=$(curl -s -X GET "$BASE_URL/api/debug/auth" \
    -H "Content-Type: application/json" \
    -b cookies.txt -c cookies.txt 2>&1)

if echo "$AUTH_RESPONSE" | grep -q "user"; then
    echo -e "${GREEN}✅ Authentication check passed${NC}"
    echo "   Response: $(echo "$AUTH_RESPONSE" | head -c 200)..."
else
    echo -e "${YELLOW}⚠️  Authentication requires browser session${NC}"
    echo "   For full testing, you need to:"
    echo "   1. Open http://localhost:3001/creative-studio in browser"
    echo "   2. Log in"
    echo "   3. Open browser console and run: testCreativeStudio()"
fi

echo ""
echo "3️⃣  Testing Creative Studio endpoint structure..."
TEST_RESPONSE=$(curl -s -X POST "$BASE_URL/api/test-creative-studio-fixed" \
    -H "Content-Type: application/json" \
    -d '{"prompt": "test"}' \
    -b cookies.txt -c cookies.txt 2>&1)

if echo "$TEST_RESPONSE" | grep -q "Unauthorized"; then
    echo -e "${YELLOW}⚠️  Endpoint requires authentication (expected)${NC}"
    echo -e "${GREEN}✅ Endpoint is accessible${NC}"
elif echo "$TEST_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Endpoint working with authentication${NC}"
    echo "   Model mapping: $(echo "$TEST_RESPONSE" | grep -o '"modelVersion":"[^"]*"' | head -1)"
    echo "   Credits used: $(echo "$TEST_RESPONSE" | grep -o '"used":[0-9]*' | head -1)"
else
    echo -e "${RED}❌ Unexpected response${NC}"
    echo "$TEST_RESPONSE" | head -10
fi

echo ""
echo "📝 To test with full authentication:"
echo "   1. Open http://localhost:3001/creative-studio in your browser"
echo "   2. Make sure you're logged in"
echo "   3. Open browser console (F12)"
echo "   4. Copy and paste the test script from test-creative-studio-script.js"
echo "   5. Run: testCreativeStudio()"
echo ""
echo "🧪 Test script completed!"

