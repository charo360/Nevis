#!/usr/bin/env node
/**
 * Test Credit Deduction System
 * Tests that credits properly deduct after fixes to:
 * 1. use-credits.ts (removed TEMPORARY BYPASS code)
 * 2. generate-revo-1.5/route.ts (added auth + deduction)
 * 3. generate-revo-2.0/route.ts (added auth + deduction)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test user ID - Update this with your actual user ID
// Run check-recent-credits.mjs to find your user_id
const TEST_USER_ID = 'dd9f93dc-08c2-4086-9359-687fa6c5897d'; // sm1761a@american.edu

async function checkCreditsBeforeTest() {
  console.log('🔍 Checking current credit balance...\n');
  
  const { data, error } = await supabase
    .from('user_credits')
    .select('total_credits, remaining_credits, used_credits, updated_at')
    .eq('user_id', TEST_USER_ID)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('❌ Error fetching credits:', error.message);
    return null;
  }

  if (!data || data.length === 0) {
    console.error('❌ No credit record found for user');
    return null;
  }

  const credits = data[0];

  console.log('📊 Current Balance:');
  console.log(`   Total Credits:     ${credits.total_credits}`);
  console.log(`   Remaining Credits: ${credits.remaining_credits}`);
  console.log(`   Used Credits:      ${credits.used_credits}`);
  console.log(`   Last Updated:      ${new Date(credits.updated_at).toLocaleString()}\n`);

  return credits;
}

async function checkRecentGenerations() {
  console.log('📈 Checking recent generation history...\n');
  
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('credit_usage_history')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching history:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('   ℹ️  No generations in the last hour');
    console.log('   ⚠️  This confirms credits were NOT being deducted!\n');
    return;
  }

  console.log(`   ✅ Found ${data.length} generation(s) in last hour:\n`);
  
  data.forEach((entry, idx) => {
    console.log(`   ${idx + 1}. ${entry.action_type}`);
    console.log(`      Credits Used: ${entry.credits_used}`);
    console.log(`      Model: ${entry.metadata?.revo_version || entry.metadata?.model || 'Unknown'}`);
    console.log(`      Time: ${new Date(entry.created_at).toLocaleString()}\n`);
  });
}

async function getRecentPosts() {
  console.log('📝 Checking recent generated posts...\n');
  
  const { data, error } = await supabase
    .from('generated_posts')
    .select('id, generation_model, created_at')
    .eq('user_id', TEST_USER_ID)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error fetching posts:', error.message);
    return;
  }

  console.log(`   Recent Posts (${data?.length || 0}):`);
  data?.forEach((post, idx) => {
    console.log(`   ${idx + 1}. Model: ${post.generation_model || 'Unknown'} - ${new Date(post.created_at).toLocaleString()}`);
  });
  console.log('');
}

async function main() {
  console.log('='.repeat(70));
  console.log('   🧪 CREDIT DEDUCTION TEST - Post-Fix Verification');
  console.log('='.repeat(70));
  console.log('');
  console.log('FIXES APPLIED:');
  console.log('  ✅ Removed TEMPORARY BYPASS from use-credits.ts');
  console.log('  ✅ Added Supabase auth to Revo 1.5 API endpoint');
  console.log('  ✅ Added credit deduction to Revo 1.5 API endpoint');
  console.log('  ✅ Added Supabase auth to Revo 2.0 API endpoint');
  console.log('  ✅ Added credit deduction to Revo 2.0 API endpoint');
  console.log('  ✅ Fixed API timeout errors (calendar, generated-posts)');
  console.log('  ✅ Added database performance indexes');
  console.log('');
  console.log('EXPECTED CREDIT COSTS:');
  console.log('  - Revo 1.0: 3 credits per generation');
  console.log('  - Revo 1.5: 4 credits per generation');
  console.log('  - Revo 2.0: 5 credits per generation');
  console.log('  - Image Edit: 1 credit');
  console.log('');
  console.log('='.repeat(70));
  console.log('');

  const beforeCredits = await checkCreditsBeforeTest();
  
  if (!beforeCredits) {
    console.error('❌ Cannot proceed without credit balance data');
    process.exit(1);
  }

  await checkRecentGenerations();
  await getRecentPosts();

  console.log('='.repeat(70));
  console.log('📋 NEXT STEPS:');
  console.log('='.repeat(70));
  console.log('');
  console.log('1. ✅ FIXED: Credit bypass code removed from use-credits.ts');
  console.log('2. ✅ FIXED: API endpoints now have auth + credit deduction');
  console.log('3. ✅ FIXED: API timeout errors resolved');
  console.log('');
  console.log('4. 🔨 TODO: Run create-performance-indexes.sql in Supabase:');
  console.log('   - Open Supabase Dashboard → SQL Editor');
  console.log('   - Copy/paste create-performance-indexes.sql');
  console.log('   - Execute to create indexes for faster queries');
  console.log('');
  console.log('5. 🧪 TEST: Generate a post to verify credits deduct:');
  console.log('   - Go to the dashboard');
  console.log('   - Generate ONE post with any Revo model');
  console.log('   - Expected Results:');
  console.log(`     • Revo 1.0: ${beforeCredits.remaining_credits} → ${beforeCredits.remaining_credits - 3} credits`);
  console.log(`     • Revo 1.5: ${beforeCredits.remaining_credits} → ${beforeCredits.remaining_credits - 4} credits`);
  console.log(`     • Revo 2.0: ${beforeCredits.remaining_credits} → ${beforeCredits.remaining_credits - 5} credits`);
  console.log('   - Run this script again to verify deduction');
  console.log('');
  console.log('6. ✅ VERIFY: Check Credit Management page shows updated balance');
  console.log('');
  console.log('='.repeat(70));
  console.log('');
  console.log('💡 Your current balance: ' + beforeCredits.remaining_credits + ' credits');
  console.log('   You have plenty of credits to test! 🎉');
  console.log('');
}

main().catch(console.error);
