#!/bin/bash

# Complete Local Webhook Testing Script
# Tests Stripe webhook locally and verifies credit addition

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 COMPLETE LOCAL WEBHOOK TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found!"
    echo ""
    echo "Install it with:"
    echo "  brew install stripe/stripe-cli/stripe  (macOS)"
    echo "  Or visit: https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local with your environment variables"
    exit 1
fi

# Load environment variables
source .env.local

echo "✅ Stripe CLI found"
echo "✅ Environment loaded"
echo ""

# Check if development server is running
echo "📡 Checking if Next.js dev server is running..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Dev server is running on http://localhost:3001"
else
    echo "⚠️  Dev server not detected on http://localhost:3001"
    echo ""
    echo "Please start it in another terminal:"
    echo "  npm run dev"
    echo ""
    read -p "Press Enter when dev server is running..."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 STEP 1: Test Webhook Endpoint Health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

HEALTH=$(curl -s http://localhost:3001/api/webhooks/stripe)
echo "$HEALTH" | jq '.' 2>/dev/null || echo "$HEALTH"

WEBHOOK_CONFIGURED=$(echo "$HEALTH" | jq -r '.webhook_configured' 2>/dev/null)
if [ "$WEBHOOK_CONFIGURED" = "true" ]; then
    echo ""
    echo "✅ Webhook endpoint is healthy"
else
    echo ""
    echo "❌ Webhook not properly configured"
    echo "Check .env.local for STRIPE_WEBHOOK_SECRET_TEST"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 STEP 2: Login to Stripe CLI"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Checking Stripe CLI authentication..."
if stripe config --list > /dev/null 2>&1; then
    echo "✅ Already logged in to Stripe CLI"
else
    echo "Logging in to Stripe CLI..."
    stripe login
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 STEP 3: Start Webhook Listener"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will forward Stripe webhook events to your local server"
echo "Keep this terminal open and watch for webhook events"
echo ""
echo "In another terminal, trigger a test payment:"
echo "  cd $(pwd)"
echo "  node test-payment-local.mjs"
echo ""
echo "Press Ctrl+C to stop the listener"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Starting listener..."
echo ""

# Forward webhooks to local endpoint
stripe listen --forward-to http://localhost:3001/api/webhooks/stripe \
  --events checkout.session.completed,payment_intent.succeeded,payment_intent.payment_failed


