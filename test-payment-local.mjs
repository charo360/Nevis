#!/usr/bin/env node

/**
 * Complete Local Payment Test
 * Creates a test payment and verifies credit addition
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20'
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 LOCAL PAYMENT TEST WITH CREDIT VERIFICATION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

// Test user ID (replace with actual user ID from your database)
const TEST_USER_ID = process.env.TEST_USER_ID || 'dd9f93dc-08c2-4086-9359-687fa6c5897d';

async function testPaymentFlow() {
  try {
    console.log('📋 Step 1: Check user credits BEFORE payment');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Check user_credits table (not users table)
    let { data: creditsBefore, error: creditsError } = await supabase
      .from('user_credits')
      .select('remaining_credits')
      .eq('user_id', TEST_USER_ID)
      .single();

    // If no record exists, create one
    if (creditsError && creditsError.code === 'PGRST116') {
      console.log('⚠️  No credit record found, creating one...');
      const { data: newRecord } = await supabase
        .from('user_credits')
        .insert({
          user_id: TEST_USER_ID,
          total_credits: 0,
          remaining_credits: 0,
          used_credits: 0
        })
        .select()
        .single();
      creditsBefore = newRecord;
    } else if (creditsError) {
      console.error('❌ Failed to fetch credits:', creditsError);
      console.log('');
      console.log('Make sure TEST_USER_ID is set correctly in .env.local');
      console.log('Current TEST_USER_ID:', TEST_USER_ID);
      return;
    }

    const creditsBeforeValue = creditsBefore?.remaining_credits || 0;
    console.log(`✅ User credits BEFORE: ${creditsBeforeValue}`);
    console.log('');

    console.log('📋 Step 2: Create test checkout session');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Starter Pack (40 credits) - TEST',
            },
            unit_amount: 50, // $0.50
          },
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:3001/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3001/cancel',
      client_reference_id: TEST_USER_ID,
      metadata: {
        userId: TEST_USER_ID,
        planId: 'starter',
        credits: '40'
      }
    });

    console.log('✅ Checkout session created:', session.id);
    console.log('');
    console.log('📊 Session Details:');
    console.log('   Session ID:', session.id);
    console.log('   Amount:', (session.amount_total || 0) / 100, 'USD');
    console.log('   Client Reference:', session.client_reference_id);
    console.log('   Metadata:');
    console.log('      - userId:', session.metadata.userId);
    console.log('      - planId:', session.metadata.planId);
    console.log('      - credits:', session.metadata.credits);
    console.log('');

    console.log('📋 Step 3: Complete the checkout in browser');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('');
    console.log('🌐 OPEN THIS URL IN YOUR BROWSER:');
    console.log('━'.repeat(80));
    console.log('\x1b[36m%s\x1b[0m', session.url);  // Cyan color
    console.log('━'.repeat(80));
    console.log('');
    console.log('📝 INSTRUCTIONS:');
    console.log('');
    console.log('1️⃣  Copy the cyan URL above');
    console.log('2️⃣  Open it in your browser (Cmd+Click or Ctrl+Click)');
    console.log('3️⃣  Fill in the checkout form:');
    console.log('    • Email: test@example.com (or any email)');
    console.log('    • Card: \x1b[33m4242 4242 4242 4242\x1b[0m');
    console.log('    • Expiry: 12/34 (or any future date)');
    console.log('    • CVC: 123 (or any 3 digits)');
    console.log('    • Name: Test User');
    console.log('4️⃣  Click "Pay"');
    console.log('');
    console.log('👀 WHAT TO WATCH:');
    console.log('   Terminal 2 (Webhook Listener) - will show:');
    console.log('   \x1b[32m✓\x1b[0m checkout.session.completed event');
    console.log('   \x1b[32m✓\x1b[0m [200] POST response');
    console.log('');
    console.log('   Terminal 1 (Dev Server) - will show:');
    console.log('   \x1b[32m✓\x1b[0m 🎯 Received Stripe webhook');
    console.log('   \x1b[32m✓\x1b[0m ✅ Payment processed successfully');
    console.log('   \x1b[32m✓\x1b[0m Credits added: 40');
    console.log('');
    console.log('⏳ Waiting 30 seconds for you to complete checkout...');
    console.log('   (Press Ctrl+C to cancel if needed)');
    console.log('');
    
    await new Promise(resolve => setTimeout(resolve, 30000));

    console.log('📋 Step 5: Check user credits AFTER payment');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const { data: creditsAfter } = await supabase
      .from('user_credits')
      .select('remaining_credits, total_credits, used_credits')
      .eq('user_id', TEST_USER_ID)
      .single();

    const creditsAfterValue = creditsAfter?.remaining_credits || 0;
    const creditsAdded = creditsAfterValue - creditsBeforeValue;

    console.log(`✅ User credits AFTER:  ${creditsAfterValue}`);
    console.log(`   Total credits:       ${creditsAfter?.total_credits || 0}`);
    console.log(`   Used credits:        ${creditsAfter?.used_credits || 0}`);
    console.log(`✅ Credits ADDED:       ${creditsAdded}`);
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESULT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    if (creditsAdded === 40) {
      console.log('🎉 SUCCESS! Credits were added correctly!');
      console.log('   Expected: 40 credits');
      console.log('   Actual:   ' + creditsAdded + ' credits');
      console.log('');
      console.log('✅ Payment flow is working correctly!');
    } else if (creditsAdded === 0) {
      console.log('⚠️  WARNING: No credits were added!');
      console.log('');
      console.log('Possible issues:');
      console.log('  - Webhook listener not running');
      console.log('  - Webhook processing failed');
      console.log('  - Database RPC function error');
      console.log('');
      console.log('Check:');
      console.log('  1. Webhook listener terminal for errors');
      console.log('  2. Dev server console for webhook logs');
      console.log('  3. Supabase logs for RPC errors');
    } else {
      console.log('⚠️  UNEXPECTED: Wrong number of credits added!');
      console.log('   Expected: 40 credits');
      console.log('   Actual:   ' + creditsAdded + ' credits');
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Step 6: Check payment transaction record');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const { data: payments } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .order('created_at', { ascending: false })
      .limit(5);

    if (payments && payments.length > 0) {
      console.log('✅ Recent payment transactions:');
      console.log('');
      payments.forEach((payment, i) => {
        const isNew = new Date(payment.created_at) > new Date(Date.now() - 60000); // Last minute
        const marker = isNew ? '\x1b[32m[NEW]\x1b[0m' : '      ';
        console.log(`${marker} ${i + 1}. ${payment.plan_id} - $${payment.amount}`);
        console.log(`         Transaction ID: ${payment.id}`);
        console.log(`         Credits Added: ${payment.credits_added}`);
        console.log(`         Status: ${payment.status}`);
        console.log(`         Created: ${payment.created_at}`);
        console.log('');
      });

      const latestPayment = payments[0];
      const isRecent = new Date(latestPayment.created_at) > new Date(Date.now() - 60000);
      
      if (isRecent && latestPayment.plan_id === 'starter') {
        console.log('\x1b[32m🎉 NEW PAYMENT DETECTED!\x1b[0m');
        console.log('   This payment was just created by the webhook!');
      }
    } else {
      console.log('⚠️  No payment transaction records found');
      console.log('   Webhook might not have processed correctly');
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

// Run the test
testPaymentFlow();

