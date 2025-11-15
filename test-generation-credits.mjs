/**
 * Test Content Generation Credit Deduction
 * 
 * This script tests credit deduction for all three Revo models
 * User: sm1761a@american.edu
 * Brand: Paya Finance
 * 
 * Run: npx tsx test-generation-credits.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test user: sm1761a@american.edu
const TEST_USER_EMAIL = 'sm1761a@american.edu';
const TEST_USER_ID = 'dd9f93dc-08c2-4086-9359-687fa6c5897d';
const TEST_BRAND_NAME = 'Paya Finance';

const MODEL_COSTS = {
  'revo-1.0': 3,
  'revo-1.5': 4,
  'revo-2.0': 5
};

async function getInitialBalance() {
  console.log('\n📊 Fetching initial credit balance...');
  
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .single();

  if (error) {
    console.error('❌ Error fetching balance:', error.message);
    return null;
  }

  console.log('✅ Initial balance:', {
    total: data.total_credits,
    used: data.used_credits,
    remaining: data.remaining_credits
  });

  return data;
}

async function testCreditDeduction(modelVersion) {
  const expectedCost = MODEL_COSTS[modelVersion];
  console.log(`\n🧪 Testing ${modelVersion} (Expected cost: ${expectedCost} credits)`);
  console.log('─'.repeat(60));

  // Get balance before
  const { data: before, error: beforeError } = await supabase
    .from('user_credits')
    .select('remaining_credits')
    .eq('user_id', TEST_USER_ID)
    .single();

  if (beforeError) {
    console.error('❌ Error fetching balance before:', beforeError.message);
    return false;
  }

  console.log(`📊 Credits before: ${before.remaining_credits}`);

  // Simulate credit deduction using the database function
  console.log('🔄 Calling deduct_credits_with_tracking_v2...');
  
  const { data: result, error: deductError } = await supabase.rpc(
    'deduct_credits_with_tracking_v2',
    {
      p_user_id: TEST_USER_ID,
      p_credits_used: expectedCost,
      p_model_version: modelVersion,
      p_feature: 'content_generation',
      p_generation_type: 'test_generation',
      p_metadata: {
        test: true,
        brand: TEST_BRAND_NAME,
        timestamp: new Date().toISOString(),
        source: 'test_script'
      }
    }
  );

  if (deductError) {
    console.error('❌ Error deducting credits:', deductError.message);
    return false;
  }

  const deductResult = result[0];
  console.log('📝 Deduction result:', {
    success: deductResult.success,
    message: deductResult.message
  });

  if (!deductResult.success) {
    console.error('❌ Credit deduction failed');
    return false;
  }

  // Get balance after
  const { data: after, error: afterError } = await supabase
    .from('user_credits')
    .select('remaining_credits')
    .eq('user_id', TEST_USER_ID)
    .single();

  if (afterError) {
    console.error('❌ Error fetching balance after:', afterError.message);
    return false;
  }

  console.log(`📊 Credits after: ${after.remaining_credits}`);

  // Calculate actual deduction
  const actualDeduction = before.remaining_credits - after.remaining_credits;
  console.log(`💰 Actual deduction: ${actualDeduction} credits`);

  // Verify deduction
  const isCorrect = actualDeduction === expectedCost;
  if (isCorrect) {
    console.log(`✅ SUCCESS: Deducted exactly ${expectedCost} credits as expected`);
  } else {
    console.log(`❌ FAILED: Expected ${expectedCost} credits but deducted ${actualDeduction}`);
  }

  // Get the latest usage record
  const { data: usageRecord, error: usageError } = await supabase
    .from('credit_usage_history')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .eq('model_version', modelVersion)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!usageError && usageRecord) {
    console.log('📝 Usage record created:', {
      id: usageRecord.id,
      credits_used: usageRecord.credits_used,
      model_version: usageRecord.model_version,
      feature: usageRecord.feature,
      generation_type: usageRecord.generation_type,
      result_success: usageRecord.result_success,
      created_at: new Date(usageRecord.created_at).toLocaleString()
    });
  }

  return isCorrect;
}

async function runTests() {
  console.log('🚀 Credit Deduction Test for All Models');
  console.log('='.repeat(60));
  console.log(`👤 User: ${TEST_USER_EMAIL}`);
  console.log(`🆔 User ID: ${TEST_USER_ID}`);
  console.log(`🏢 Brand: ${TEST_BRAND_NAME}`);
  console.log('='.repeat(60));

  try {
    // Get initial balance
    const initialBalance = await getInitialBalance();
    if (!initialBalance) {
      console.error('❌ Cannot proceed without initial balance');
      return;
    }

    // Test all three models
    const results = {
      'revo-1.0': false,
      'revo-1.5': false,
      'revo-2.0': false
    };

    for (const model of Object.keys(MODEL_COSTS)) {
      results[model] = await testCreditDeduction(model);
      
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Get final balance
    console.log('\n📊 Fetching final credit balance...');
    const finalBalance = await getInitialBalance();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(60));

    const totalExpectedDeduction = Object.values(MODEL_COSTS).reduce((a, b) => a + b, 0);
    const actualDeduction = initialBalance.remaining_credits - finalBalance.remaining_credits;

    console.log(`\n💰 Initial Credits: ${initialBalance.remaining_credits}`);
    console.log(`💰 Final Credits: ${finalBalance.remaining_credits}`);
    console.log(`💸 Total Deducted: ${actualDeduction} credits`);
    console.log(`💸 Expected Deduction: ${totalExpectedDeduction} credits (3 + 4 + 5)`);

    console.log('\n📊 Model Test Results:');
    Object.entries(results).forEach(([model, passed]) => {
      const cost = MODEL_COSTS[model];
      console.log(`   ${passed ? '✅' : '❌'} ${model}: ${cost} credits ${passed ? 'PASSED' : 'FAILED'}`);
    });

    const allPassed = Object.values(results).every(r => r === true);
    const correctTotal = actualDeduction === totalExpectedDeduction;

    console.log('\n' + '='.repeat(60));
    if (allPassed && correctTotal) {
      console.log('✅ ALL TESTS PASSED! Credit system is working correctly.');
    } else {
      console.log('❌ SOME TESTS FAILED! Please review the results above.');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run the tests
runTests()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
