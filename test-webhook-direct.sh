#!/bin/bash

# Direct Webhook Test - Triggers checkout.session.completed webhook
# This tests if credits are added when webhook is received

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 DIRECT WEBHOOK TEST (Credits Addition)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Load environment
source .env.local

# Get user ID from .env.local or use default
TEST_USER_ID=${TEST_USER_ID:-dd9f93dc-08c2-4086-9359-687fa6c5897d}

echo "📋 Test Configuration:"
echo "   User ID: $TEST_USER_ID"
echo "   Webhook: http://localhost:3001/api/webhooks/stripe"
echo ""

# Check if webhook listener is running
echo "🔍 Checking webhook listener..."
if ! pgrep -f "stripe listen" > /dev/null; then
    echo "❌ Webhook listener not running!"
    echo ""
    echo "Start it in another terminal:"
    echo "  ./test-webhook-local-complete.sh"
    exit 1
fi
echo "✅ Webhook listener is running"
echo ""

# Check current credits
echo "📊 Checking credits BEFORE webhook..."
CREDITS_BEFORE=$(node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data } = await supabase
    .from('user_credits')
    .select('remaining_credits')
    .eq('user_id', '$TEST_USER_ID')
    .single();
  console.log(data?.remaining_credits || 0);
})();
" 2>/dev/null | tail -1)

echo "✅ Credits BEFORE: $CREDITS_BEFORE"
echo ""

# Trigger the webhook
echo "🚀 Triggering checkout.session.completed webhook..."
echo ""

stripe trigger checkout.session.completed \
  --override checkout_session:client_reference_id=$TEST_USER_ID \
  --override checkout_session:metadata[userId]=$TEST_USER_ID \
  --override checkout_session:metadata[planId]=starter \
  --override checkout_session:metadata[credits]=40 \
  --override checkout_session:amount_total=50

echo ""
echo "⏳ Waiting 3 seconds for webhook to process..."
sleep 3
echo ""

# Check credits after
echo "📊 Checking credits AFTER webhook..."
CREDITS_AFTER=$(node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data } = await supabase
    .from('user_credits')
    .select('remaining_credits')
    .eq('user_id', '$TEST_USER_ID')
    .single();
  console.log(data?.remaining_credits || 0);
})();
" 2>/dev/null | tail -1)

echo "✅ Credits AFTER:  $CREDITS_AFTER"
echo ""

# Calculate difference
CREDITS_ADDED=$((CREDITS_AFTER - CREDITS_BEFORE))

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESULT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Credits BEFORE:  $CREDITS_BEFORE"
echo "Credits AFTER:   $CREDITS_AFTER"
echo "Credits ADDED:   $CREDITS_ADDED"
echo ""

if [ "$CREDITS_ADDED" -eq 40 ]; then
    echo "🎉 SUCCESS! Credits were added correctly!"
    echo ""
    echo "✅ Webhook is working"
    echo "✅ Credits are being added"
    echo "✅ Ready for production!"
elif [ "$CREDITS_ADDED" -eq 0 ]; then
    echo "⚠️  FAILED: No credits were added"
    echo ""
    echo "Check:"
    echo "  1. Webhook listener terminal for errors"
    echo "  2. Dev server console (Terminal 1) for logs"
    echo "  3. Supabase logs for RPC errors"
else
    echo "⚠️  UNEXPECTED: Wrong number of credits added"
    echo "   Expected: 40"
    echo "   Got: $CREDITS_ADDED"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"


