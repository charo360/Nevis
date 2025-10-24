#!/bin/bash

# Diagnose Stripe Webhook Configuration in Production
# This script checks your production webhook endpoint

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 STRIPE WEBHOOK PRODUCTION DIAGNOSTICS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

WEBHOOK_URL="https://crevo.app/api/webhooks/stripe"

echo "📍 Testing endpoint: $WEBHOOK_URL"
echo ""

# Test the GET endpoint for health check
echo "🧪 Running health check..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" "$WEBHOOK_URL" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESPONSE (HTTP $HTTP_CODE)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Parse the response and provide diagnosis
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Endpoint is reachable"
    
    # Check specific fields
    WEBHOOK_CONFIGURED=$(echo "$BODY" | jq -r '.webhook_configured' 2>/dev/null)
    HAS_LIVE_SECRET=$(echo "$BODY" | jq -r '.diagnostics.has_STRIPE_WEBHOOK_SECRET_LIVE' 2>/dev/null)
    SECRET_LENGTH=$(echo "$BODY" | jq -r '.diagnostics.webhook_secret_length' 2>/dev/null)
    SECRET_VALID=$(echo "$BODY" | jq -r '.diagnostics.webhook_secret_format_valid' 2>/dev/null)
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔧 CONFIGURATION STATUS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ "$WEBHOOK_CONFIGURED" = "true" ] && [ "$HAS_LIVE_SECRET" = "true" ] && [ "$SECRET_LENGTH" != "0" ] && [ "$SECRET_VALID" = "true" ]; then
        echo "✅ Webhook is PROPERLY CONFIGURED"
        echo "✅ STRIPE_WEBHOOK_SECRET_LIVE is set"
        echo "✅ Secret format is valid (whsec_...)"
        echo "✅ Secret length: $SECRET_LENGTH characters"
        echo ""
        echo "🎉 Your webhook should be working now!"
        echo "   Test with a real payment to confirm."
    else
        echo "❌ WEBHOOK IS NOT PROPERLY CONFIGURED"
        echo ""
        
        if [ "$WEBHOOK_CONFIGURED" != "true" ]; then
            echo "   ❌ webhook_configured: $WEBHOOK_CONFIGURED"
        else
            echo "   ✅ webhook_configured: $WEBHOOK_CONFIGURED"
        fi
        
        if [ "$HAS_LIVE_SECRET" != "true" ]; then
            echo "   ❌ has_STRIPE_WEBHOOK_SECRET_LIVE: $HAS_LIVE_SECRET"
            echo "      → Missing environment variable in Vercel!"
        else
            echo "   ✅ has_STRIPE_WEBHOOK_SECRET_LIVE: $HAS_LIVE_SECRET"
        fi
        
        if [ "$SECRET_LENGTH" = "0" ] || [ "$SECRET_LENGTH" = "null" ]; then
            echo "   ❌ webhook_secret_length: $SECRET_LENGTH"
            echo "      → Secret is empty!"
        else
            echo "   ✅ webhook_secret_length: $SECRET_LENGTH"
        fi
        
        if [ "$SECRET_VALID" != "true" ]; then
            echo "   ❌ webhook_secret_format_valid: $SECRET_VALID"
            echo "      → Secret doesn't start with 'whsec_'"
        else
            echo "   ✅ webhook_secret_format_valid: $SECRET_VALID"
        fi
        
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🔧 REQUIRED ACTION"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. Go to Vercel Dashboard → Settings → Environment Variables"
        echo "2. Add this variable for PRODUCTION environment:"
        echo ""
        echo "   Name:  STRIPE_WEBHOOK_SECRET_LIVE"
        echo "   Value: whsec_pud3vY1pfsT97COt1qGNasP4O8yMIRBR"
        echo ""
        echo "3. Redeploy your application"
        echo "4. Run this script again to verify"
        echo ""
        echo "📖 See VERCEL_STRIPE_SETUP.md for detailed instructions"
    fi
else
    echo "❌ Endpoint returned HTTP $HTTP_CODE"
    echo "   This might indicate a deployment issue or server error."
    echo ""
    echo "   Check Vercel deployment logs for errors."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 NEXT STEPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "If webhook is configured:"
echo "  → Test a payment on https://crevo.app"
echo "  → Check Stripe Dashboard for webhook delivery status"
echo "  → Resend failed webhooks from Stripe Dashboard"
echo ""
echo "If webhook is NOT configured:"
echo "  → Follow instructions in VERCEL_STRIPE_SETUP.md"
echo "  → Add STRIPE_WEBHOOK_SECRET_LIVE to Vercel"
echo "  → Redeploy and run this script again"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

