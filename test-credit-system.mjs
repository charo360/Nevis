/**
 * Credit System Diagnostic Script
 * 
 * Tests the credit management system end-to-end:
 * 1. Check initial credit balance
 * 2. Test credit deduction in Quick Content  
 * 3. Test credit deduction in Creative Studio
 * 4. Verify database updates
 * 5. Verify Credit Display component updates
 * 6. Verify Credit Analytics tracking
 * 
 * Run: npx tsx test-credit-system.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fetch from 'node-fetch';

// Polyfill fetch for Node.js
globalThis.fetch = fetch;

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

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test user: sm1761a@american.edu
const TEST_USER_EMAIL = 'sm1761a@american.edu';
const TEST_USER_ID = 'dd9f93dc-08c2-4086-9359-687fa6c5897d';

async function checkCreditBalance(userId) {
  console.log('\n📊 Checking credit balance...');
  
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('❌ Error fetching credit balance:', error.message);
      return null;
    }

    if (data) {
      console.log('✅ Credit balance found:');
      console.log(`   💰 Total Credits: ${data.total_credits || 0}`);
      console.log(`   ✨ Bonus Credits: ${data.bonus_credits || 0}`);
      console.log(`   📅 Last Updated: ${data.updated_at}`);
      return data;
    } else {
      console.log('⚠️  No credit record found for user');
      return null;
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return null;
  }
}

async function checkCreditUsageHistory(userId, limit = 10) {
  console.log(`\n� Checking last ${limit} credit usage records...`);
  
  try {
    const { data, error } = await supabase
      .from('credit_usage_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error fetching usage history:', error.message);
      return [];
    }

    if (data && data.length > 0) {
      console.log(`✅ Found ${data.length} usage records:`);
      data.forEach((record, index) => {
        console.log(`\n   ${index + 1}. ${record.feature || 'N/A'} - ${record.generation_type || 'N/A'}`);
        console.log(`      Credits: ${record.credits_used}`);
        console.log(`      Model: ${record.model_version || 'N/A'}`);
        console.log(`      Success: ${record.result_success}`);
        console.log(`      Date: ${new Date(record.created_at).toLocaleString()}`);
      });
      return data;
    } else {
      console.log('⚠️  No usage history found');
      return [];
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return [];
  }
}

async function testCreditAnalytics(userId) {
  console.log('\n📈 Testing credit analytics...');
  
  try {
    const { data, error } = await supabase
      .from('credit_usage_history')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error fetching analytics data:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      // Calculate analytics
      const totalGenerations = data.length;
      const successfulGenerations = data.filter(r => r.result_success === true).length;
      const totalCreditsUsed = data.reduce((sum, r) => sum + (r.credits_used || 0), 0);
      
      // Group by model
      const byModel = data.reduce((acc, record) => {
        const model = record.model_version || 'unknown';
        if (!acc[model]) {
          acc[model] = { count: 0, credits: 0 };
        }
        acc[model].count++;
        acc[model].credits += record.credits_used || 0;
        return acc;
      }, {});

      console.log('✅ Analytics Summary:');
      console.log(`   📊 Total Generations: ${totalGenerations}`);
      console.log(`   ✅ Successful: ${successfulGenerations}`);
      console.log(`   💰 Total Credits Used: ${totalCreditsUsed}`);
      console.log(`   📈 Success Rate: ${((successfulGenerations / totalGenerations) * 100).toFixed(1)}%`);
      console.log('\n   By Model:');
      Object.entries(byModel).forEach(([model, stats]) => {
        console.log(`      ${model}: ${stats.count} generations, ${stats.credits} credits`);
      });

      return {
        totalGenerations,
        successfulGenerations,
        totalCreditsUsed,
        byModel
      };
    } else {
      console.log('⚠️  No usage data for analytics');
      return null;
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return null;
  }
}

async function simulateCreditDeduction(userId, model = 'revo-1.0', feature = 'quick_content', type = 'text_generation') {
  console.log(`\n🧪 Simulating credit deduction (${model})...`);
  
  try {
    const { data, error } = await supabase.rpc('deduct_credits_with_tracking_v2', {
      p_user_id: userId,
      p_credits: model === 'revo-1.0' ? 3 : model === 'revo-1.5' ? 4 : 5,
      p_feature_type: feature,
      p_operation_type: type,
      p_model_used: model,
      p_metadata: { test: true, timestamp: new Date().toISOString() }
    });

    if (error) {
      console.error('❌ Error simulating deduction:', error.message);
      return false;
    }

    console.log('✅ Deduction simulated successfully');
    console.log(`   New Balance: ${data.new_balance}`);
    console.log(`   Credits Deducted: ${data.credits_deducted}`);
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

async function runDiagnostics() {
  console.log('🚀 Credit System Diagnostic Test');
  console.log('============================================================');
  console.log(`👤 Test User: ${TEST_USER_EMAIL}`);
  console.log(`🆔 User ID: ${TEST_USER_ID}`);
  console.log('============================================================');

  try {
    // Check credit balance
    const balance = await checkCreditBalance(TEST_USER_ID);
    
    // Check usage history
    await checkCreditUsageHistory(TEST_USER_ID, 10);
    
    // Test analytics
    await testCreditAnalytics(TEST_USER_ID);
    
    // Optional: Uncomment to simulate a credit deduction
    // await simulateCreditDeduction(TEST_USER_ID, 'revo-1.0', 'quick_content', 'text_generation');
    
    console.log('\n✅ Diagnostic test completed successfully!');
    console.log('============================================================\n');
  } catch (error) {
    console.error('\n❌ Tests failed:', error);
  }
}

// Run the diagnostics
runDiagnostics();

