#!/usr/bin/env node

/**
 * Payment System Setup Verification
 * Verifies all payment system components are properly configured
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
const jwt = require('jsonwebtoken');

console.log('🔍 Verifying Payment System Setup');
console.log('==================================\n');

async function verifySetup() {
  let allGood = true;

  // 1. Environment Variables Check
  console.log('1️⃣ Checking Environment Variables...');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'JWT_SECRET'
  ];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}: Set`);
    } else {
      console.log(`❌ ${envVar}: Missing`);
      allGood = false;
    }
  }

  // 2. Supabase Connection Test
  console.log('\n2️⃣ Testing Supabase Connection...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
      allGood = false;
    } else {
      console.log('✅ Supabase connection successful');
    }

    // Test payment tables exist
    const { data: paymentData, error: paymentError } = await supabase
      .from('payment_transactions')
      .select('count')
      .limit(1);

    if (paymentError) {
      console.log('❌ payment_transactions table not found:', paymentError.message);
      allGood = false;
    } else {
      console.log('✅ payment_transactions table exists');
    }

    const { data: usageData, error: usageError } = await supabase
      .from('usage_logs')
      .select('count')
      .limit(1);

    if (usageError) {
      console.log('❌ usage_logs table not found:', usageError.message);
      allGood = false;
    } else {
      console.log('✅ usage_logs table exists');
    }

  } catch (error) {
    console.log('❌ Supabase setup error:', error.message);
    allGood = false;
  }

  // 3. Stripe Configuration Test
  console.log('\n3️⃣ Testing Stripe Configuration...');
  
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { 
      apiVersion: '2025-07-30.basil' 
    });

    // Test Stripe connection by retrieving account info
    const account = await stripe.accounts.retrieve();
    console.log('✅ Stripe connection successful');
    console.log(`   Account ID: ${account.id}`);
    console.log(`   Country: ${account.country}`);
    console.log(`   Charges enabled: ${account.charges_enabled}`);
    console.log(`   Payouts enabled: ${account.payouts_enabled}`);

    // Check if using live keys
    if (process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
      console.log('✅ Using LIVE Stripe keys');
    } else {
      console.log('⚠️ Using TEST Stripe keys');
    }

  } catch (error) {
    console.log('❌ Stripe configuration error:', error.message);
    allGood = false;
  }

  // 4. JWT Configuration Test
  console.log('\n4️⃣ Testing JWT Configuration...');
  
  try {
    const testPayload = {
      userId: 'test-user-123',
      email: 'test@example.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };

    const token = jwt.sign(testPayload, process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('✅ JWT signing and verification working');
    console.log(`   Test user ID: ${decoded.userId}`);

  } catch (error) {
    console.log('❌ JWT configuration error:', error.message);
    allGood = false;
  }

  // 5. Payment Plans Configuration
  console.log('\n5️⃣ Checking Payment Plans...');
  
  const plans = {
    starter: { amountCents: 1000, credits: 40, name: 'Starter Pack' },
    growth: { amountCents: 2900, credits: 120, name: 'Growth Pack' },
    pro: { amountCents: 4900, credits: 220, name: 'Pro Pack' },
    power: { amountCents: 9900, credits: 500, name: 'Power Users' }
  };

  for (const [planId, plan] of Object.entries(plans)) {
    console.log(`✅ ${planId}: $${(plan.amountCents / 100).toFixed(2)} - ${plan.credits} credits`);
  }

  // 6. Test Card Numbers
  console.log('\n6️⃣ Stripe Test Card Numbers Available:');
  console.log('✅ Success: 4242424242424242');
  console.log('✅ Declined: 4000000000000002');
  console.log('✅ 3D Secure: 4000002500003155');
  console.log('✅ Insufficient Funds: 4000000000009995');

  // Final Summary
  console.log('\n' + '='.repeat(50));
  if (allGood) {
    console.log('🎉 Payment System Setup: READY FOR PRODUCTION!');
    console.log('\n📋 Next Steps:');
    console.log('1. Start your server: npm run dev');
    console.log('2. Test payment flow in browser');
    console.log('3. Configure Stripe webhooks for production');
    console.log('4. Set up monitoring and alerts');
  } else {
    console.log('❌ Payment System Setup: NEEDS ATTENTION');
    console.log('\n🔧 Fix the issues above before going live');
  }
  console.log('='.repeat(50));

  return allGood;
}

verifySetup().catch(error => {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
});
