#!/bin/bash

echo "🧪 Testing Local Webhook with Existing Payment Session"
echo "====================================================="
echo ""

SESSION_ID="${1:-cs_test_b11cmiTpxUnxLZ4JWYDZvIhcixPPnha9ByzPSExjiaRFGxWQto4eWzt7fa}"

echo "📋 Testing webhook with session ID: $SESSION_ID"
echo ""

# Create a test checkout.session.completed event payload
TEST_PAYLOAD='{
  "id": "evt_test_webhook_' $(date +%s) '",
  "object": "event",
  "api_version": "2025-08-27.basil",
  "created": ' $(date +%s) ',
  "data": {
    "object": {
      "id": "' $SESSION_ID '",
      "object": "checkout.session",
      "amount_subtotal": 19999,
      "amount_total": 19999,
      "currency": "usd",
      "customer_details": {
        "email": "test@example.com",
        "name": "Test User"
      },
      "metadata": {
        "planId": "enterprise",
        "userId": "7a151a69-cd3d-4976-918d-6e6eb6548b71"
      },
      "payment_intent": "pi_test_' $(date +%s) '",
      "payment_status": "paid",
      "status": "complete",
      "client_reference_id": "7a151a69-cd3d-4976-918d-6e6eb6548b71"
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": null,
    "idempotency_key": null
  },
  "type": "checkout.session.completed"
}'

echo "🚀 Sending test webhook event to local server..."
echo ""

# Send the test event to local webhook
curl -X POST http://localhost:3001/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1234567890,v1=test_signature_ignore_verification" \
  -d "$TEST_PAYLOAD" \
  -v

echo ""
echo "✅ Test webhook event sent!"
echo ""
echo "📋 Check your database to see if the payment status changed to 'completed'"
echo "📋 Check your Next.js terminal for webhook processing logs"