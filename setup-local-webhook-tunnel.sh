#!/bin/bash

# Setup Local Webhook Testing with HTTPS Tunnel
# This creates an HTTPS tunnel to your local dev server for Stripe webhooks

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 SETUP LOCAL WEBHOOK TESTING (HTTPS)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok not found!"
    echo ""
    echo "📦 Installing ngrok..."
    echo ""
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        echo "Using Homebrew to install ngrok..."
        brew install ngrok
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo "Downloading ngrok for Linux..."
        curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
          sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
          echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
          sudo tee /etc/apt/sources.list.d/ngrok.list && \
          sudo apt update && sudo apt install ngrok
    else
        echo "Please install ngrok manually from: https://ngrok.com/download"
        exit 1
    fi
fi

echo "✅ ngrok is installed"
echo ""

# Check if dev server is running
if ! curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "❌ Dev server not running on http://localhost:3001"
    echo ""
    echo "Start it in another terminal:"
    echo "  npm run dev"
    exit 1
fi

echo "✅ Dev server is running"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Starting HTTPS tunnel..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 INSTRUCTIONS:"
echo ""
echo "1. ngrok will start and show you an HTTPS URL"
echo "2. Copy the https://xxxxx.ngrok.io URL"
echo "3. Go to: https://dashboard.stripe.com/test/webhooks"
echo "4. Click 'Add endpoint'"
echo "5. Paste: https://xxxxx.ngrok.io/api/webhooks/stripe"
echo "6. Select events:"
echo "   - checkout.session.completed"
echo "   - payment_intent.succeeded"
echo "   - payment_intent.payment_failed"
echo "7. Click 'Add endpoint'"
echo "8. Copy the 'Signing secret' (whsec_...)"
echo "9. Add to .env.local:"
echo "   STRIPE_WEBHOOK_SECRET_TEST=whsec_your_secret"
echo "10. Restart dev server (Terminal 1)"
echo "11. Test payment via browser!"
echo ""
echo "Press Ctrl+C to stop the tunnel"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start ngrok tunnel
ngrok http 3001


