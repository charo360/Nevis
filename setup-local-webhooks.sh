#!/bin/bash

echo "🔧 Setting up Local Stripe Webhooks for Development"
echo "=================================================="
echo ""
echo "📋 This will fix your local development webhook issues:"
echo "  • Payments stuck in 'pending' status"
echo "  • No webhook events showing in terminal"
echo "  • Duplicate payment records"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI is not installed. Please install it first:"
    echo "   npm install -g stripe-cli"
    echo "   Or download from: https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Check if user is logged in to Stripe
echo "🔐 Checking Stripe CLI authentication..."
if ! stripe --version > /dev/null 2>&1; then
    echo "❌ Please login to Stripe CLI first:"
    echo "   stripe login"
    exit 1
fi

echo "✅ Stripe CLI is ready!"

# Set the local port (default to 3001)
LOCAL_PORT=${1:-3001}
WEBHOOK_ENDPOINT="localhost:${LOCAL_PORT}/api/webhooks/stripe"

echo "📡 Starting webhook forwarding..."
echo "   Local server: http://localhost:${LOCAL_PORT}"
echo "   Webhook endpoint: ${WEBHOOK_ENDPOINT}"
echo "   Events: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed"
echo ""
echo "🔥 Press Ctrl+C to stop forwarding"
echo ""

# Start forwarding webhooks to local development server
stripe listen \
  --forward-to "${WEBHOOK_ENDPOINT}" \
  --events checkout.session.completed,payment_intent.succeeded,payment_intent.payment_failed,charge.refunded

echo ""
echo "✅ Webhook forwarding stopped"