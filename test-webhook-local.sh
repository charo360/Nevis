#!/bin/bash

# Test Stripe Webhooks Locally
# This script helps test webhook delivery before production deployment

echo "🔗 Testing Stripe Webhooks Locally"
echo "=================================="

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Install it first:"
    echo "   Windows: Download from https://stripe.com/docs/stripe-cli"
    echo "   macOS: brew install stripe/stripe-cli/stripe"
    echo "   Linux: See https://stripe.com/docs/stripe-cli#install"
    exit 1
fi

echo "✅ Stripe CLI found"

# Login to Stripe (if not already logged in)
echo "🔐 Logging into Stripe..."
stripe login

# Forward webhooks to local server
echo "🚀 Starting webhook forwarding to http://localhost:3002/api/webhooks/stripe"
echo "   This will show you the webhook secret to use in your .env.local"
echo "   Press Ctrl+C to stop"
echo ""

stripe listen --forward-to localhost:3002/api/webhooks/stripe

echo "✅ Webhook testing complete"
