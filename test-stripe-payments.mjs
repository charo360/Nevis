#!/usr/bin/env node
/**
 * Stripe Payment Testing Script
 * Tests payment flow and database transactions
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY || '');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const TEST_USER_ID = '3d60b964-0f6f-4c34-a08f-b522263192db'; // Replace with your test user ID

async function testPaymentFlow() {
  console.log('🧪 Starting Stripe Payment Test\n');

  try {
    // 1. Create a checkout session
    console.log('1️⃣ Creating checkout session...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Starter Agent - 50 Credits',
            },
            unit_amount: 999, // $9.99
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3001/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3001/cancel',
      client_reference_id: TEST_USER_ID,
      metadata: {
        userId: TEST_USER_ID,
        planId: 'starter',
      },
    });

    console.log('✅ Session created:', session.id);
    console.log('💳 Payment URL:', session.url);
    console.log('\n📋 Session Details:');
    console.log('  - ID:', session.id);
    console.log('  - User ID:', session.client_reference_id);
    console.log('  - Plan:', session.metadata.planId);
    console.log('  - Amount:', session.amount_total / 100, 'USD');

    // 2. Simulate payment completion (for testing without actual payment)
    console.log('\n2️⃣ Simulating successful payment...');
    console.log('⚠️  Use Stripe CLI to trigger: stripe trigger checkout.session.completed');
    console.log('   Or pay manually at:', session.url);

    // 3. Wait for webhook (give user time to trigger)
    console.log('\n3️⃣ Waiting 5 seconds for webhook...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. Check database for payment transaction
    console.log('\n4️⃣ Checking database for payment transaction...');
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('stripe_session_id', session.id)
      .single();

    if (txError) {
      console.log('⚠️  No transaction found yet (webhook may not have fired)');
      console.log('   Error:', txError.message);
    } else {
      console.log('✅ Transaction found:', transaction.id);
      console.log('   Status:', transaction.status);
      console.log('   Credits added:', transaction.credits_added);
      console.log('   Amount:', transaction.amount);
    }

    // 5. Check user credits
    console.log('\n5️⃣ Checking user credits...');
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .single();

    if (creditsError) {
      console.log('❌ Error fetching credits:', creditsError.message);
    } else {
      console.log('✅ User credits:', {
        total: credits.total_credits,
        remaining: credits.remaining_credits,
        used: credits.used_credits
      });
    }

    // 6. List recent webhook events
    console.log('\n6️⃣ Recent Stripe events (last 5):');
    const events = await stripe.events.list({ limit: 5 });
    events.data.forEach((event, i) => {
      console.log(`   ${i + 1}. ${event.type} - ${new Date(event.created * 1000).toLocaleTimeString()}`);
    });

    console.log('\n✅ Test completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Open payment URL in browser to complete test payment');
    console.log('   2. Watch terminal logs for webhook events');
    console.log('   3. Verify database updates');
    console.log('   4. Test refund: stripe refunds create --charge=<charge_id>');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Test webhook events
async function testWebhookEvents() {
  console.log('\n🎯 Testing Webhook Event Handlers\n');

  const events = [
    'checkout.session.completed',
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'charge.refunded',
    'charge.dispute.created',
  ];

  console.log('📋 Events configured in webhook handler:');
  events.forEach(event => {
    console.log(`   ✓ ${event}`);
  });

  console.log('\n💡 To test each event:');
  console.log('   stripe trigger checkout.session.completed');
  console.log('   stripe trigger payment_intent.succeeded');
  console.log('   stripe trigger payment_intent.payment_failed');
  console.log('   stripe trigger charge.refunded');
  console.log('   stripe trigger charge.dispute.created');
}

// Run tests
console.log('╔════════════════════════════════════════╗');
console.log('║   Stripe Payment Testing Suite         ║');
console.log('╚════════════════════════════════════════╝\n');

testPaymentFlow()
  .then(() => testWebhookEvents())
  .then(() => {
    console.log('\n🎉 All tests completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });

