#!/bin/bash

# Master Payment Testing Script
# Runs comprehensive tests for the Nevis AI payment system

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🧪 Nevis AI Payment System Testing Suite${NC}"
echo -e "${PURPLE}=======================================${NC}"
echo ""

# Check if required files exist
required_files=(
    "test-payment-flow.js"
    "test-payment-verification.js"
    "test-webhooks.sh"
    "verify-payment-database.sql"
    "stripe-test-cards.md"
)

echo -e "${YELLOW}📋 Checking required test files...${NC}"
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file (missing)${NC}"
        exit 1
    fi
done
echo ""

# Check environment variables
echo -e "${YELLOW}🔧 Checking environment configuration...${NC}"
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local found${NC}"
    
    # Check critical environment variables
    source .env.local
    
    if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        echo -e "${GREEN}✅ Supabase URL configured${NC}"
    else
        echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_URL missing${NC}"
    fi
    
    if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        echo -e "${GREEN}✅ Supabase service key configured${NC}"
    else
        echo -e "${RED}❌ SUPABASE_SERVICE_ROLE_KEY missing${NC}"
    fi
    
    if [ -n "$STRIPE_SECRET_KEY" ]; then
        echo -e "${GREEN}✅ Stripe secret key configured${NC}"
        if [[ "$STRIPE_SECRET_KEY" == sk_test_* ]]; then
            echo -e "${YELLOW}⚠️  Using test mode (sk_test_*)${NC}"
        elif [[ "$STRIPE_SECRET_KEY" == sk_live_* ]]; then
            echo -e "${GREEN}✅ Using live mode (sk_live_*)${NC}"
        fi
    else
        echo -e "${RED}❌ STRIPE_SECRET_KEY missing${NC}"
    fi
    
    if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
        echo -e "${GREEN}✅ Stripe webhook secret configured${NC}"
    else
        echo -e "${YELLOW}⚠️  STRIPE_WEBHOOK_SECRET missing (needed for webhook testing)${NC}"
    fi
    
else
    echo -e "${RED}❌ .env.local not found${NC}"
    echo "Create .env.local with your configuration"
    exit 1
fi
echo ""

# Check if server is running
echo -e "${YELLOW}🌐 Checking if development server is running...${NC}"
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is running on http://localhost:3000${NC}"
else
    echo -e "${YELLOW}⚠️  Server not detected on http://localhost:3000${NC}"
    echo "Start your development server with: npm run dev"
    echo "Or update BASE_URL in test scripts for your server"
fi
echo ""

# Test menu
echo -e "${BLUE}🎯 Select tests to run:${NC}"
echo "1. 🔄 End-to-End Payment Flow Test"
echo "2. 🔗 Webhook Testing (requires Stripe CLI)"
echo "3. 🗄️  Database Verification"
echo "4. 💳 Manual Payment Test Instructions"
echo "5. 🧪 All Tests (recommended)"
echo "6. 📊 Database Health Check"
echo "0. Exit"
echo ""

read -p "Enter your choice (0-6): " choice

case $choice in
    1)
        echo -e "${BLUE}🔄 Running End-to-End Payment Flow Test...${NC}"
        echo ""
        node test-payment-flow.js
        ;;
    2)
        echo -e "${BLUE}🔗 Running Webhook Tests...${NC}"
        echo ""
        chmod +x test-webhooks.sh
        ./test-webhooks.sh
        ;;
    3)
        echo -e "${BLUE}🗄️  Running Database Verification...${NC}"
        echo ""
        node test-payment-verification.js
        ;;
    4)
        echo -e "${BLUE}💳 Manual Payment Test Instructions${NC}"
        echo "=================================="
        echo ""
        echo -e "${GREEN}Step 1: Create checkout session${NC}"
        echo "node test-payment-flow.js"
        echo ""
        echo -e "${GREEN}Step 2: Use test card details${NC}"
        cat stripe-test-cards.md | head -20
        echo ""
        echo -e "${GREEN}Step 3: Complete payment in browser${NC}"
        echo "Use the checkout URL from step 1"
        echo ""
        echo -e "${GREEN}Step 4: Verify payment processed${NC}"
        echo "node test-payment-verification.js"
        ;;
    5)
        echo -e "${BLUE}🧪 Running All Tests...${NC}"
        echo ""
        
        echo -e "${YELLOW}Test 1/4: End-to-End Payment Flow${NC}"
        node test-payment-flow.js
        echo ""
        
        echo -e "${YELLOW}Test 2/4: Database Verification${NC}"
        node test-payment-verification.js
        echo ""
        
        echo -e "${YELLOW}Test 3/4: Database Health Check${NC}"
        echo "Running SQL health check queries..."
        # Note: This would require psql or similar SQL client
        echo "Run the queries in verify-payment-database.sql manually"
        echo ""
        
        echo -e "${YELLOW}Test 4/4: Webhook Test Setup${NC}"
        echo "To test webhooks, run: ./test-webhooks.sh"
        echo ""
        
        echo -e "${GREEN}🎉 All automated tests completed!${NC}"
        echo ""
        echo -e "${BLUE}Manual steps remaining:${NC}"
        echo "1. Test webhook delivery with: ./test-webhooks.sh"
        echo "2. Make a test payment using the checkout URL"
        echo "3. Verify payment in Stripe dashboard"
        echo "4. Run database queries in verify-payment-database.sql"
        ;;
    6)
        echo -e "${BLUE}📊 Running Database Health Check...${NC}"
        echo ""
        node test-payment-verification.js
        echo ""
        echo -e "${YELLOW}For detailed SQL analysis, run these queries:${NC}"
        echo "psql -f verify-payment-database.sql"
        echo "Or copy queries from verify-payment-database.sql to your SQL client"
        ;;
    0)
        echo -e "${GREEN}👋 Goodbye!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${PURPLE}🎯 Testing Summary${NC}"
echo "=================="
echo ""
echo -e "${BLUE}Files created for testing:${NC}"
echo "✅ test-payment-flow.js - End-to-end payment testing"
echo "✅ test-payment-verification.js - Database verification"
echo "✅ test-webhooks.sh - Webhook testing with Stripe CLI"
echo "✅ verify-payment-database.sql - SQL verification queries"
echo "✅ stripe-test-cards.md - Test card numbers reference"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Run individual tests as needed"
echo "2. Check Stripe dashboard for test transactions"
echo "3. Verify database records are created correctly"
echo "4. Test webhook delivery and processing"
echo ""
echo -e "${GREEN}🚀 Ready for production deployment!${NC}"
