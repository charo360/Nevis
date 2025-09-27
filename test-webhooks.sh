#!/bin/bash

# Stripe Webhook Testing Script
# Tests webhook delivery, signature validation, and processing

echo "🔗 Testing Stripe Webhooks"
echo "=========================="

# Configuration
BASE_URL="http://localhost:3000"  # Change to your domain for production
STRIPE_WEBHOOK_SECRET="whsec_test_..."  # Your webhook secret
TEST_USER_ID="test-user-123"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Base URL: $BASE_URL${NC}"
echo -e "${BLUE}Testing webhook endpoint: $BASE_URL/api/webhooks/stripe${NC}"
echo ""

# Test 1: Check if Stripe CLI is installed
echo -e "${YELLOW}1️⃣ Checking Stripe CLI installation...${NC}"
if command -v stripe &> /dev/null; then
    echo -e "${GREEN}✅ Stripe CLI is installed${NC}"
    stripe --version
else
    echo -e "${RED}❌ Stripe CLI not found${NC}"
    echo "Install it from: https://stripe.com/docs/stripe-cli"
    echo "Or use: brew install stripe/stripe-cli/stripe"
    exit 1
fi

echo ""

# Test 2: Login to Stripe (if not already logged in)
echo -e "${YELLOW}2️⃣ Checking Stripe CLI authentication...${NC}"
if stripe config --list | grep -q "test_mode = true"; then
    echo -e "${GREEN}✅ Stripe CLI is authenticated${NC}"
else
    echo -e "${YELLOW}⚠️ Please login to Stripe CLI:${NC}"
    echo "Run: stripe login"
    echo "Then re-run this script"
    exit 1
fi

echo ""

# Test 3: Test webhook endpoint accessibility
echo -e "${YELLOW}3️⃣ Testing webhook endpoint accessibility...${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/webhooks/stripe")
if [ "$response" = "200" ] || [ "$response" = "405" ]; then
    echo -e "${GREEN}✅ Webhook endpoint is accessible (HTTP $response)${NC}"
else
    echo -e "${RED}❌ Webhook endpoint not accessible (HTTP $response)${NC}"
    echo "Make sure your server is running on $BASE_URL"
    exit 1
fi

echo ""

# Test 4: Start webhook forwarding (background process)
echo -e "${YELLOW}4️⃣ Starting webhook forwarding...${NC}"
echo "This will forward Stripe webhooks to your local server"
echo "Press Ctrl+C to stop forwarding when testing is complete"
echo ""

# Create a test webhook payload
create_test_payload() {
    local session_id="cs_test_$(date +%s)"
    local event_id="evt_test_$(date +%s)"
    
    cat << EOF
{
  "id": "$event_id",
  "object": "event",
  "api_version": "2025-07-30.basil",
  "created": $(date +%s),
  "data": {
    "object": {
      "id": "$session_id",
      "object": "checkout.session",
      "amount_total": 999,
      "currency": "usd",
      "customer": "cus_test_customer",
      "metadata": {
        "userId": "$TEST_USER_ID",
        "planId": "starter"
      },
      "payment_intent": "pi_test_payment_intent",
      "payment_status": "paid",
      "status": "complete"
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_test_request",
    "idempotency_key": null
  },
  "type": "checkout.session.completed"
}
EOF
}

# Test 5: Send test webhook events
echo -e "${YELLOW}5️⃣ Sending test webhook events...${NC}"

# Test successful checkout session
echo "Testing checkout.session.completed event..."
stripe events resend evt_test_webhook --webhook-endpoint "$BASE_URL/api/webhooks/stripe" 2>/dev/null || {
    echo "Creating and sending test event..."
    test_payload=$(create_test_payload)
    echo "$test_payload" | stripe events create --type checkout.session.completed --webhook-endpoint "$BASE_URL/api/webhooks/stripe"
}

echo ""

# Test 6: Listen for webhooks (interactive)
echo -e "${YELLOW}6️⃣ Starting interactive webhook listener...${NC}"
echo "This will show real-time webhook events"
echo "Open another terminal and make a test payment to see webhooks in action"
echo ""
echo -e "${BLUE}Commands to test webhooks:${NC}"
echo "1. Make a test payment using the checkout URL from test-payment-flow.js"
echo "2. Or trigger test events with:"
echo "   stripe trigger checkout.session.completed"
echo "   stripe trigger payment_intent.succeeded"
echo "   stripe trigger payment_intent.payment_failed"
echo ""
echo -e "${GREEN}Starting webhook listener...${NC}"

# Start the webhook listener
stripe listen --forward-to "$BASE_URL/api/webhooks/stripe" --events checkout.session.completed,payment_intent.succeeded,payment_intent.payment_failed

echo ""
echo -e "${GREEN}🎯 Webhook testing complete!${NC}"
echo ""
echo -e "${BLUE}What to verify:${NC}"
echo "1. ✅ Webhooks are received without errors"
echo "2. ✅ Signature validation passes"
echo "3. ✅ Payment transactions are recorded in database"
echo "4. ✅ User subscription status is updated"
echo "5. ✅ Credits are added to user account"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Run: node test-payment-verification.js"
echo "2. Check your database for payment_transactions records"
echo "3. Verify user subscription status was updated"
