#!/usr/bin/env node

/**
 * Test Duplicate Payment Prevention
 * Simulates duplicate webhook calls to verify idempotency
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 Testing Duplicate Payment Prevention');
console.log('=====================================\n');

async function testIdempotentPayment() {
  const testUserId = 'test-user-' + Date.now();
  const testSessionId = 'cs_test_' + Date.now();
  const testPaymentIntentId = 'pi_test_' + Date.now();
  
  try {
    // Step 1: Create a test user first
    console.log('1️⃣ Creating test user...');
    
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: `test${Date.now()}@test.com`,
      password: 'test123456',
      user_metadata: { test_user: true }
    });

    if (userError) {
      console.error('❌ Failed to create test user:', userError);
      return;
    }

    const actualUserId = userData.user.id;
    console.log('✅ Test user created:', actualUserId);

    // Step 2: Test first payment (should succeed)
    console.log('\n2️⃣ Processing first payment...');
    
    const { data: firstResult, error: firstError } = await supabase.rpc('process_payment_with_idempotency', {
      p_stripe_session_id: testSessionId,
      p_user_id: actualUserId,
      p_plan_id: 'starter',
      p_amount: 29.99,
      p_currency: 'usd',
      p_credits_to_add: 500,
      p_payment_method: 'card',
      p_source: 'test'
    });

    if (firstError) {
      console.error('❌ First payment failed:', firstError);
      return;
    }

    const firstPayment = firstResult[0];
    console.log('✅ First payment processed:', {
      payment_id: firstPayment.payment_id,
      was_duplicate: firstPayment.was_duplicate,
      credits_added: firstPayment.credits_added,
      new_total_credits: firstPayment.new_total_credits
    });

    // Step 3: Test duplicate payment (should be detected and ignored)
    console.log('\n3️⃣ Processing duplicate payment (same session ID)...');
    
    const { data: duplicateResult, error: duplicateError } = await supabase.rpc('process_payment_with_idempotency', {
      p_stripe_session_id: testSessionId,
      p_user_id: actualUserId,
      p_plan_id: 'starter',
      p_amount: 29.99,
      p_currency: 'usd',
      p_credits_to_add: 500,
      p_payment_method: 'card',
      p_source: 'test'
    });

    if (duplicateError) {
      console.error('❌ Duplicate payment handling failed:', duplicateError);
      return;
    }

    const duplicatePayment = duplicateResult[0];
    console.log('✅ Duplicate payment handled:', {
      payment_id: duplicatePayment.payment_id,
      was_duplicate: duplicatePayment.was_duplicate,
      credits_added: duplicatePayment.credits_added,
      new_total_credits: duplicatePayment.new_total_credits
    });

    // Step 4: Verify user credits (should only have credits from first payment)
    console.log('\n4️⃣ Verifying user credits...');
    
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', actualUserId)
      .single();

    if (creditsError) {
      console.error('❌ Failed to fetch user credits:', creditsError);
      return;
    }

    console.log('✅ User credits verified:', {
      total_credits: userCredits.total_credits,
      remaining_credits: userCredits.remaining_credits,
      used_credits: userCredits.used_credits
    });

    // Step 5: Check payment transactions count
    console.log('\n5️⃣ Checking payment transactions...');
    
    const { data: transactions, error: transError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('stripe_session_id', testSessionId);

    if (transError) {
      console.error('❌ Failed to fetch transactions:', transError);
      return;
    }

    console.log(`✅ Found ${transactions.length} payment transaction(s):`);
    transactions.forEach((tx, index) => {
      console.log(`   Transaction ${index + 1}:`, {
        id: tx.id,
        status: tx.status,
        amount: tx.amount,
        credits_purchased: tx.credits_purchased,
        created_at: tx.created_at
      });
    });

    // Test Results Summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const isFirstPaymentProcessed = !firstPayment.was_duplicate;
    const isDuplicateDetected = duplicatePayment.was_duplicate;
    const hasCorrectCredits = userCredits.total_credits === 500;
    const hasSingleTransaction = transactions.length === 1;
    
    console.log(`✅ First payment processed: ${isFirstPaymentProcessed ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Duplicate detected: ${isDuplicateDetected ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Correct credit amount: ${hasCorrectCredits ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Single transaction record: ${hasSingleTransaction ? 'PASS' : 'FAIL'}`);
    
    const allTestsPassed = isFirstPaymentProcessed && isDuplicateDetected && hasCorrectCredits && hasSingleTransaction;
    
    console.log(`\n🎯 Overall Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allTestsPassed) {
      console.log('🎉 Duplicate payment prevention is working correctly!');
    } else {
      console.log('⚠️ There may be issues with the idempotency implementation.');
    }

    // Cleanup: Delete test user
    console.log('\n🧹 Cleaning up test user...');
    await supabase.auth.admin.deleteUser(actualUserId);
    console.log('✅ Test user cleaned up');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    throw error;
  }
}

async function testEdgeCases() {
  console.log('\n🔬 Testing Edge Cases...');
  console.log('========================');

  try {
    // Test with invalid user ID
    console.log('\n1️⃣ Testing with invalid user ID...');
    
    const { data: invalidUserResult, error: invalidUserError } = await supabase.rpc('process_payment_with_idempotency', {
      p_stripe_session_id: 'cs_invalid_test',
      p_user_id: 'invalid-user-id',
      p_plan_id: 'starter',
      p_amount: 29.99,
      p_currency: 'usd',
      p_credits_to_add: 500,
      p_payment_method: 'card',
      p_source: 'test'
    });

    if (invalidUserError) {
      console.log('✅ Invalid user ID properly rejected:', invalidUserError.message);
    } else {
      console.log('⚠️ Invalid user ID was not rejected - this might be an issue');
    }

    // Test with invalid plan ID
    console.log('\n2️⃣ Testing with invalid plan ID...');
    
    const testUserId = 'test-edge-user-' + Date.now();
    
    // Create test user for edge cases
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: `edge${Date.now()}@test.com`,
      password: 'test123456',
      user_metadata: { test_user: true }
    });

    if (!userError && userData.user) {
      const { data: invalidPlanResult, error: invalidPlanError } = await supabase.rpc('process_payment_with_idempotency', {
        p_stripe_session_id: 'cs_invalid_plan_test',
        p_user_id: userData.user.id,
        p_plan_id: 'nonexistent-plan',
        p_amount: 29.99,
        p_currency: 'usd',
        p_credits_to_add: 500,
        p_payment_method: 'card',
        p_source: 'test'
      });

      if (invalidPlanError) {
        console.log('✅ Invalid plan ID properly handled:', invalidPlanError.message);
      } else {
        console.log('✅ Invalid plan ID processed (function may handle gracefully)');
      }

      // Cleanup edge case user
      await supabase.auth.admin.deleteUser(userData.user.id);
    }

    console.log('\n🎯 Edge case testing completed');

  } catch (error) {
    console.error('❌ Edge case testing failed:', error);
  }
}

async function runAllTests() {
  try {
    await testIdempotentPayment();
    await testEdgeCases();
    
    console.log('\n🏁 All Tests Completed');
    console.log('======================');
    console.log('The duplicate payment prevention system has been tested.');
    console.log('You can now test the actual payment flow on your website!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run the tests
runAllTests();