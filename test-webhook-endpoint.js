#!/usr/bin/env node

/**
 * Test Webhook Endpoint
 * Verifies that the webhook endpoint is working correctly
 */

require('dotenv').config({ path: '.env.local' });

const crypto = require('crypto');

const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/stripe`
  : 'http://localhost:3002/api/webhooks/stripe';

console.log('🔗 Testing Stripe Webhook Endpoint');
console.log('==================================');
console.log('Webhook URL:', WEBHOOK_URL);
console.log('');

// Create a test webhook payload
const testPayload = {
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2025-07-30.basil',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_test_checkout_session',
      object: 'checkout.session',
      amount_total: 1000,
      currency: 'usd',
      customer: 'cus_test_customer',
      metadata: {
        userId: 'test-user-123',
        planId: 'starter'
      },
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

async function testWebhook() {
  try {
    const payload = JSON.stringify(testPayload);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';
    
    // Create Stripe signature
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', webhookSecret.replace('whsec_', ''))
      .update(signedPayload, 'utf8')
      .digest('hex');
    
    const stripeSignature = `t=${timestamp},v1=${signature}`;

    console.log('1️⃣ Sending test webhook...');
    console.log('   Event type:', testPayload.type);
    console.log('   Payload size:', payload.length, 'bytes');
    console.log('   Signature:', stripeSignature.substring(0, 50) + '...');
    console.log('');

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': stripeSignature,
        'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)'
      },
      body: payload
    });

    console.log('2️⃣ Response received:');
    console.log('   Status:', response.status, response.statusText);
    console.log('   Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('   Body:', responseText || '(empty)');
    console.log('');

    if (response.ok) {
      console.log('✅ Webhook endpoint is working correctly!');
      console.log('');
      console.log('🎯 Next steps:');
      console.log('1. Configure the webhook in Stripe Dashboard');
      console.log('2. Use this URL: ' + WEBHOOK_URL);
      console.log('3. Select the events you need');
      console.log('4. Copy the webhook secret to your environment');
    } else {
      console.log('❌ Webhook endpoint returned an error');
      console.log('   This might be expected if the server is not running');
    }

  } catch (error) {
    console.log('❌ Failed to test webhook:', error.message);
    console.log('');
    console.log('💡 Make sure your server is running:');
    console.log('   npm run dev');
    console.log('   or');
    console.log('   npm start');
  }
}

testWebhook();
