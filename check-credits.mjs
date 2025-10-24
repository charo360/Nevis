#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const TEST_USER_ID = process.env.TEST_USER_ID || 'dd9f93dc-08c2-4086-9359-687fa6c5897d';

async function checkCredits() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 CHECKING USER CREDITS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('User ID:', TEST_USER_ID);
  console.log('');

  // Get credits
  const { data: credits, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .single();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log('✅ Current Credits:');
  console.log('   Remaining:  ', credits.remaining_credits);
  console.log('   Total:      ', credits.total_credits);
  console.log('   Used:       ', credits.used_credits);
  console.log('   Last Payment:', credits.last_payment_at || 'Never');
  console.log('');

  // Get recent transactions
  const { data: transactions } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .order('created_at', { ascending: false })
    .limit(3);

  if (transactions && transactions.length > 0) {
    console.log('📋 Recent Transactions:');
    console.log('');
    transactions.forEach((tx, i) => {
      console.log(`   ${i + 1}. ${tx.plan_id} - $${tx.amount}`);
      console.log(`      Credits: ${tx.credits_added}`);
      console.log(`      Status: ${tx.status}`);
      console.log(`      Date: ${tx.created_at}`);
      console.log('');
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

checkCredits();


