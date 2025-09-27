#!/bin/bash

# Production API Testing Script
# Run this script to test all payment system endpoints before going live

# Configuration
BASE_URL="https://your-domain.com"  # Replace with your production URL
ADMIN_SECRET="your-admin-secret"    # Replace with your actual admin secret
TEST_JWT_TOKEN="your-test-jwt-token" # Replace with a valid JWT token

echo "🧪 Testing Nevis AI Payment System APIs"
echo "Base URL: $BASE_URL"
echo "=========================================="

# Test 1: Check migration status
echo "1. Testing migration status..."
curl -s -X GET "$BASE_URL/api/admin/migrate-users" \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n✅ Expected: Should show migration status with user counts\n"

# Test 2: Test subscription access check (valid user)
echo "2. Testing subscription access check..."
curl -s -X POST "$BASE_URL/api/subscription/check-access" \
  -H "Authorization: Bearer $TEST_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"feature": "revo-2.0"}' | jq '.'

echo -e "\n✅ Expected: Should return access status and credits remaining\n"

# Test 3: Test subscription access check (invalid token)
echo "3. Testing subscription access with invalid token..."
curl -s -X POST "$BASE_URL/api/subscription/check-access" \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"feature": "revo-2.0"}' | jq '.'

echo -e "\n✅ Expected: Should return 401 unauthorized\n"

# Test 4: Test Revo 2.0 generation with valid token
echo "4. Testing Revo 2.0 generation..."
curl -s -X POST "$BASE_URL/api/generate-revo-2.0" \
  -H "Authorization: Bearer $TEST_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "Restaurant",
    "platform": "Instagram",
    "brandProfile": {
      "businessName": "Test Restaurant",
      "businessType": "Restaurant",
      "location": "New York, NY"
    },
    "visualStyle": "modern",
    "aspectRatio": "1:1"
  }' | jq '.success, .model, .error'

echo -e "\n✅ Expected: Should generate content or return subscription error\n"

# Test 5: Test Revo 2.0 generation without token
echo "5. Testing Revo 2.0 generation without auth..."
curl -s -X POST "$BASE_URL/api/generate-revo-2.0" \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "Restaurant",
    "platform": "Instagram",
    "brandProfile": {"businessName": "Test"}
  }' | jq '.success, .error, .code'

echo -e "\n✅ Expected: Should return AUTH_REQUIRED error\n"

# Test 6: Test Stripe webhook endpoint (GET request for info)
echo "6. Testing Stripe webhook endpoint info..."
curl -s -X GET "$BASE_URL/api/webhooks/stripe" | jq '.'

echo -e "\n✅ Expected: Should return webhook endpoint information\n"

# Test 7: Test payment checkout session creation
echo "7. Testing payment checkout session creation..."
curl -s -X POST "$BASE_URL/api/payments/create-checkout-session" \
  -H "Authorization: Bearer $TEST_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "starter",
    "successUrl": "https://your-domain.com/success",
    "cancelUrl": "https://your-domain.com/cancel"
  }' | jq '.success, .checkoutUrl, .error'

echo -e "\n✅ Expected: Should return Stripe checkout URL or error\n"

# Test 8: Health check endpoints
echo "8. Testing health check endpoints..."
curl -s -X GET "$BASE_URL/api/health" | jq '.'

echo -e "\n✅ Expected: Should return system health status\n"

# Test 9: Test database connection
echo "9. Testing database connectivity..."
curl -s -X POST "$BASE_URL/api/subscription/check-access" \
  -H "Authorization: Bearer $TEST_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"feature": "test"}' | jq '.subscriptionStatus'

echo -e "\n✅ Expected: Should return subscription status (not 'system_error')\n"

echo "=========================================="
echo "🎯 Testing Complete!"
echo ""
echo "Review the results above:"
echo "- All endpoints should respond (no connection errors)"
echo "- Authentication should work correctly"
echo "- Subscription checks should return proper status"
echo "- Payment endpoints should be accessible"
echo ""
echo "If any tests fail, check:"
echo "1. Environment variables are set correctly"
echo "2. Database migration completed successfully"
echo "3. JWT tokens are valid"
echo "4. Stripe keys are configured properly"
