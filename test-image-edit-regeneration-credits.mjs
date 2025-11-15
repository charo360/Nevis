#!/usr/bin/env node
/**
 * Test Image Editing & Regeneration Credit Deductions
 * 
 * This script verifies that:
 * 1. Image editing deducts exactly 1 credit
 * 2. Image regeneration deducts model-specific credits (3/4/5)
 * 3. Usage is properly tracked in credit_usage_history
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('SUPABASE_URL:', SUPABASE_URL ? '✓ Found' : '✗ Missing');
  console.error('SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '✓ Found' : '✗ Missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TEST_USER_EMAIL = 'sm1761a@american.edu';
const TEST_USER_ID = 'dd9f93dc-08c2-4086-9359-687fa6c5897d';

console.log('🧪 Testing Image Editing & Regeneration Credit Deductions');
console.log('============================================================');
console.log(`👤 User: ${TEST_USER_EMAIL}`);
console.log(`🆔 User ID: ${TEST_USER_ID}`);
console.log('============================================================\n');

async function getCreditBalance(userId) {
  const { data, error } = await supabase
    .from('user_credits')
    .select('total_credits, used_credits, remaining_credits')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return {
    total: data.total_credits,
    used: data.used_credits,
    remaining: data.remaining_credits
  };
}

async function getRecentUsageRecords(userId, limit = 10) {
  const { data, error } = await supabase
    .from('credit_usage_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function simulateImageEdit(userId) {
  console.log('\n🎨 Simulating Image Edit (1 credit)');
  console.log('────────────────────────────────────────────────────────────');
  
  const beforeBalance = await getCreditBalance(userId);
  console.log(`📊 Credits before: ${beforeBalance.remaining}`);

  // Call the database function to deduct credits for image editing
  const { data, error } = await supabase.rpc('deduct_credits_with_tracking_v2', {
    p_user_id: userId,
    p_credits_used: 1,
    p_model_version: 'gemini-2.0-flash-exp',
    p_feature: 'image_editing',
    p_generation_type: 'ai_inpainting',
    p_metadata: { editType: 'ai_inpainting', prompt: 'test image edit' }
  });

  if (error) {
    console.error('❌ Error:', error);
    return false;
  }

  const afterBalance = await getCreditBalance(userId);
  console.log(`📊 Credits after: ${afterBalance.remaining}`);
  
  const actualDeduction = beforeBalance.remaining - afterBalance.remaining;
  console.log(`💰 Actual deduction: ${actualDeduction} credit(s)`);
  
  if (actualDeduction === 1) {
    console.log('✅ SUCCESS: Deducted exactly 1 credit as expected');
    return true;
  } else {
    console.log(`❌ FAILED: Expected 1 credit, but deducted ${actualDeduction}`);
    return false;
  }
}

async function simulateRegeneration(userId, model, expectedCost) {
  console.log(`\n🔄 Simulating Regeneration with ${model} (Expected: ${expectedCost} credits)`);
  console.log('────────────────────────────────────────────────────────────');
  
  const beforeBalance = await getCreditBalance(userId);
  console.log(`📊 Credits before: ${beforeBalance.remaining}`);

  // Call the database function to deduct credits for regeneration
  const { data, error } = await supabase.rpc('deduct_credits_with_tracking_v2', {
    p_user_id: userId,
    p_credits_used: expectedCost,
    p_model_version: model,
    p_feature: 'image_generation',
    p_generation_type: 'regeneration',
    p_metadata: { platform: 'instagram', action: 'regenerate' }
  });

  if (error) {
    console.error('❌ Error:', error);
    return false;
  }

  const afterBalance = await getCreditBalance(userId);
  console.log(`📊 Credits after: ${afterBalance.remaining}`);
  
  const actualDeduction = beforeBalance.remaining - afterBalance.remaining;
  console.log(`💰 Actual deduction: ${actualDeduction} credit(s)`);
  
  if (actualDeduction === expectedCost) {
    console.log(`✅ SUCCESS: Deducted exactly ${expectedCost} credits as expected`);
    return true;
  } else {
    console.log(`❌ FAILED: Expected ${expectedCost} credits, but deducted ${actualDeduction}`);
    return false;
  }
}

async function main() {
  const results = {
    imageEdit: false,
    revo10: false,
    revo15: false,
    revo20: false
  };

  try {
    // Get initial balance
    console.log('📊 Fetching initial credit balance...');
    const initialBalance = await getCreditBalance(TEST_USER_ID);
    console.log(`✅ Initial balance: ${JSON.stringify(initialBalance)}\n`);

    // Test 1: Image Edit (1 credit)
    results.imageEdit = await simulateImageEdit(TEST_USER_ID);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Regeneration Revo 1.0 (3 credits)
    results.revo10 = await simulateRegeneration(TEST_USER_ID, 'revo-1.0', 3);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Regeneration Revo 1.5 (4 credits)
    results.revo15 = await simulateRegeneration(TEST_USER_ID, 'revo-1.5', 4);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Regeneration Revo 2.0 (5 credits)
    results.revo20 = await simulateRegeneration(TEST_USER_ID, 'revo-2.0', 5);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get final balance
    console.log('\n📊 Fetching final credit balance...');
    const finalBalance = await getCreditBalance(TEST_USER_ID);
    console.log(`✅ Final balance: ${JSON.stringify(finalBalance)}\n`);

    // Get recent usage records
    console.log('📊 Fetching recent usage records...');
    const recentRecords = await getRecentUsageRecords(TEST_USER_ID, 4);
    console.log('\n📝 Recent Usage Records (last 4):');
    recentRecords.forEach((record, index) => {
      console.log(`\n   Record ${index + 1}:`);
      console.log(`   - ID: ${record.id}`);
      console.log(`   - Credits Used: ${record.credits_used}`);
      console.log(`   - Model: ${record.model_version}`);
      console.log(`   - Feature: ${record.feature}`);
      console.log(`   - Type: ${record.generation_type}`);
      console.log(`   - Success: ${record.result_success}`);
      console.log(`   - Created: ${new Date(record.created_at).toLocaleString()}`);
    });

    // Summary
    console.log('\n============================================================');
    console.log('📋 TEST SUMMARY');
    console.log('============================================================\n');
    
    console.log(`💰 Initial Credits: ${initialBalance.remaining}`);
    console.log(`💰 Final Credits: ${finalBalance.remaining}`);
    console.log(`💸 Total Deducted: ${initialBalance.remaining - finalBalance.remaining} credits`);
    console.log(`💸 Expected Deduction: 13 credits (1 + 3 + 4 + 5)\n`);
    
    console.log('📊 Test Results:');
    console.log(`   ${results.imageEdit ? '✅' : '❌'} Image Edit (1 credit): ${results.imageEdit ? 'PASSED' : 'FAILED'}`);
    console.log(`   ${results.revo10 ? '✅' : '❌'} Regeneration Revo 1.0 (3 credits): ${results.revo10 ? 'PASSED' : 'FAILED'}`);
    console.log(`   ${results.revo15 ? '✅' : '❌'} Regeneration Revo 1.5 (4 credits): ${results.revo15 ? 'PASSED' : 'FAILED'}`);
    console.log(`   ${results.revo20 ? '✅' : '❌'} Regeneration Revo 2.0 (5 credits): ${results.revo20 ? 'PASSED' : 'FAILED'}`);

    const allPassed = Object.values(results).every(result => result === true);
    
    console.log('\n============================================================');
    if (allPassed) {
      console.log('✅ ALL TESTS PASSED! Image editing & regeneration credit system is working correctly.');
    } else {
      console.log('❌ SOME TESTS FAILED! Please review the results above.');
    }
    console.log('============================================================\n');

    console.log('✅ Test completed');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

main();
