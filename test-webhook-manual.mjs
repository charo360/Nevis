#!/usr/bin/env node

/**
 * Manual Webhook Test
 * Sends a properly formatted checkout.session.completed webhook directly
 */

import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const TEST_USER_ID = process.env.TEST_USER_ID || 'dd9f93dc-08c2-4086-9359-687fa6c5897d';
const WEBHOOK_URL = 'http://localhost:3001/api/webhooks/stripe';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET_TEST || 'whsec_9c23f9f7c1156504b7fb6faa45fe642d92d94ac2c6e697020fadb60681eae301';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 MANUAL WEBHOOK TEST (Simulates Real Payment)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

async function testWebhook() {
  try {
    // Check credits before
    console.log('📊 Checking credits BEFORE webhook...');
    const { data: creditsBefore } = await supabase
      .from('user_credits')
      .select('remaining_credits')
      .eq('user_id', TEST_USER_ID)
      .single();

    const creditsBeforeValue = creditsBefore?.remaining_credits || 0;
    console.log(`✅ Credits BEFORE: ${creditsBeforeValue}`);
    console.log('');

    // Create webhook payload with proper structure
    const payload = {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      api_version: '2024-06-20',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: `cs_test_${Date.now()}`,
          object: 'checkout.session',
          amount_total: 50, // 50 cents in cents
          currency: 'usd',
          client_reference_id: TEST_USER_ID,
          metadata: {
            userId: TEST_USER_ID,
            planId: 'starter',
            credits: '40'
          },
          payment_status: 'paid',
          status: 'complete'
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: null,
        idempotency_key: null
      },
      type: 'checkout.session.completed'
    };

    console.log('📦 Webhook Payload:');
    console.log('   Event Type:', payload.type);
    console.log('   Session ID:', payload.data.object.id);
    console.log('   User ID:', payload.data.object.client_reference_id);
    console.log('   Plan ID:', payload.data.object.metadata.planId);
    console.log('   Amount:', payload.data.object.amount_total / 100, 'USD');
    console.log('');

    // Create Stripe signature
    const timestamp = Math.floor(Date.now() / 1000);
    const payloadString = JSON.stringify(payload);
    const signedPayload = `${timestamp}.${payloadString}`;
    
    // Extract the secret without 'whsec_' prefix for signing
    const secretForSigning = WEBHOOK_SECRET.replace('whsec_', '');
    const signature = crypto
      .createHmac('sha256', secretForSigning)
      .update(signedPayload, 'utf8')
      .digest('hex');
    
    const stripeSignature = `t=${timestamp},v1=${signature}`;

    console.log('🔐 Sending webhook with signature...');
    console.log('   Webhook URL:', WEBHOOK_URL);
    console.log('   Secret prefix:', WEBHOOK_SECRET.substring(0, 12) + '...');
    console.log('');

    // Send webhook
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': stripeSignature
      },
      body: payloadString
    });

    const responseText = await response.text();
    
    console.log('📨 Response:');
    console.log('   Status:', response.status, response.statusText);
    
    if (response.status === 200) {
      console.log('   \x1b[32m✅ Webhook accepted!\x1b[0m');
    } else {
      console.log('   \x1b[31m❌ Webhook failed!\x1b[0m');
    }
    
    console.log('   Body:', responseText);
    console.log('');

    // Wait a moment for processing
    console.log('⏳ Waiting 2 seconds for processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('');

    // Check credits after
    console.log('📊 Checking credits AFTER webhook...');
    const { data: creditsAfter } = await supabase
      .from('user_credits')
      .select('remaining_credits, total_credits')
      .eq('user_id', TEST_USER_ID)
      .single();

    const creditsAfterValue = creditsAfter?.remaining_credits || 0;
    const creditsAdded = creditsAfterValue - creditsBeforeValue;

    console.log(`✅ Credits AFTER:  ${creditsAfterValue}`);
    console.log(`   Total credits:  ${creditsAfter?.total_credits || 0}`);
    console.log(`✅ Credits ADDED:  ${creditsAdded}`);
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESULT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    if (creditsAdded === 40) {
      console.log('\x1b[32m🎉 SUCCESS! Webhook processing works!\x1b[0m');
      console.log('');
      console.log('✅ Webhook signature verified');
      console.log('✅ Credits added correctly (40)');
      console.log('✅ Ready for production!');
      console.log('');
      console.log('Next: Deploy to production and test with real payment');
    } else if (creditsAdded === 0) {
      console.log('\x1b[33m⚠️  WARNING: No credits were added\x1b[0m');
      console.log('');
      console.log('Check Terminal 1 (dev server) for error logs');
      console.log('Webhook might have been received but failed to process');
    } else {
      console.log(`\x1b[33m⚠️  UNEXPECTED: ${creditsAdded} credits added (expected 40)\x1b[0m');
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('');
    console.error('❌ Test failed:', error.message);
    console.error('');
    console.error('Full error:', error);
  }
}

testWebhook();


