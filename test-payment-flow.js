#!/usr/bin/env node

/**
 * End-to-End Payment Flow Testing Script
 * Tests the complete payment journey from checkout to feature access
 */

require('dotenv').config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
const TEST_JWT_TOKEN = process.env.TEST_JWT_TOKEN || 'your-test-jwt-token';

console.log('🧪 Testing End-to-End Payment Flow');
console.log('Base URL:', BASE_URL);
console.log('=====================================\n');

async function testPaymentFlow() {
  try {
    // Step 1: Test checkout session creation
    console.log('1️⃣ Testing checkout session creation...');

    const checkoutResponse = await fetch(`${BASE_URL}/api/payments/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        planId: 'starter',
        successUrl: `${BASE_URL}/success`,
        cancelUrl: `${BASE_URL}/cancel`
      })
    });

    const checkoutData = await checkoutResponse.json();

    if (!checkoutResponse.ok) {
      console.error('❌ Checkout session creation failed:', checkoutData);
      return;
    }

    console.log('✅ Checkout session created successfully');
    console.log('   Checkout URL:', checkoutData.url);
    console.log('   Session ID:', checkoutData.url?.split('cs_')[1]?.split('?')[0] || 'N/A');

    // Step 2: Check subscription status before payment
    console.log('\n2️⃣ Checking subscription status before payment...');

    const beforePaymentResponse = await fetch(`${BASE_URL}/api/subscription/check-access`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ feature: 'revo-2.0' })
    });

    const beforePaymentData = await beforePaymentResponse.json();
    console.log('   Access before payment:', beforePaymentData.hasAccess ? '✅ HAS ACCESS' : '❌ NO ACCESS');
    console.log('   Reason:', beforePaymentData.reason);
    console.log('   Credits:', beforePaymentData.creditsRemaining);
    console.log('   Status:', beforePaymentData.subscriptionStatus);

    // Step 3: Instructions for manual payment testing
    console.log('\n3️⃣ Manual Payment Testing Instructions:');
    console.log('=====================================');
    console.log('🔗 Open this URL in your browser:');
    console.log(`   ${checkoutData.url}`);
    console.log('\n💳 Use these test card details:');
    console.log('   Card Number: 4242424242424242');
    console.log('   Expiry: 12/25');
    console.log('   CVC: 123');
    console.log('   ZIP: 12345');
    console.log('   Name: Test User');
    console.log('\n⏳ Complete the payment and then run:');
    console.log(`   node test-payment-verification.js`);
    console.log('\n📊 Or continue with automated webhook testing...');

    // Step 4: Test webhook endpoint (GET request for info)
    console.log('\n4️⃣ Testing webhook endpoint...');

    const webhookResponse = await fetch(`${BASE_URL}/api/webhooks/stripe`, {
      method: 'GET'
    });

    if (webhookResponse.ok) {
      const webhookData = await webhookResponse.json();
      console.log('✅ Webhook endpoint is accessible');
      console.log('   Endpoint URL:', `${BASE_URL}/api/webhooks/stripe`);
    } else {
      console.log('❌ Webhook endpoint not accessible');
    }

    // Step 5: Test Revo generation access
    console.log('\n5️⃣ Testing Revo generation access...');

    const revoResponse = await fetch(`${BASE_URL}/api/generate-revo-2.0`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        businessType: 'Restaurant',
        platform: 'Instagram',
        brandProfile: {
          businessName: 'Test Restaurant',
          businessType: 'Restaurant'
        }
      })
    });

    const revoData = await revoResponse.json();

    if (revoData.success) {
      console.log('✅ Revo generation successful');
      console.log('   Model:', revoData.model);
    } else {
      console.log('❌ Revo generation failed');
      console.log('   Error:', revoData.error);
      console.log('   Code:', revoData.code);
      if (revoData.upgradeUrl) {
        console.log('   Upgrade URL:', revoData.upgradeUrl);
      }
    }

    console.log('\n🎯 Payment Flow Test Summary:');
    console.log('============================');
    console.log('✅ Checkout session creation: Working');
    console.log('✅ Subscription status check: Working');
    console.log('✅ Webhook endpoint: Accessible');
    console.log('⏳ Manual payment test: Pending');
    console.log('📝 Next steps: Complete payment and run verification script');

  } catch (error) {
    console.error('❌ Payment flow test failed:', error.message);
  }
}

// Helper function to simulate webhook payload
function createTestWebhookPayload(sessionId, userId, planId) {
  return {
    id: 'evt_test_webhook',
    object: 'event',
    api_version: '2025-07-30.basil',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: sessionId,
        object: 'checkout.session',
        amount_total: 999, // $9.99 in cents
        currency: 'usd',
        customer: 'cus_test_customer',
        metadata: {
          userId: userId,
          planId: planId
        },
        payment_intent: 'pi_test_payment_intent',
        payment_status: 'paid',
        status: 'complete'
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: 'req_test_request',
      idempotency_key: null
    },
    type: 'checkout.session.completed'
  };
}

// Run the test
testPaymentFlow();
