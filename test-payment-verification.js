#!/usr/bin/env node

/**
 * Payment Verification Script
 * Verifies that payments are properly recorded and processed in the database
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-123';

console.log('🔍 Verifying Payment Processing');
console.log('Test User ID:', TEST_USER_ID);
console.log('===============================\n');

async function verifyPaymentProcessing() {
  try {
    // 1. Check payment_transactions table
    console.log('1️⃣ Checking payment_transactions table...');
    
    const { data: transactions, error: transError } = await supabase
      .from('payment_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (transError) {
      console.error('❌ Failed to fetch transactions:', transError.message);
      return;
    }

    console.log(`📊 Found ${transactions.length} recent transactions:`);
    
    transactions.forEach((transaction, index) => {
      const status = transaction.status === 'completed' ? '✅' : 
                    transaction.status === 'pending' ? '⏳' : '❌';
      
      console.log(`   ${index + 1}. ${status} ${transaction.plan_id} - $${transaction.amount}`);
      console.log(`      User: ${transaction.user_id.substring(0, 12)}...`);
      console.log(`      Status: ${transaction.status}`);
      console.log(`      Credits: ${transaction.credits_added}`);
      console.log(`      Created: ${new Date(transaction.created_at).toLocaleString()}`);
      
      if (transaction.stripe_session_id) {
        console.log(`      Session: ${transaction.stripe_session_id.substring(0, 20)}...`);
      }
      console.log('');
    });

    // 2. Check specific user's transactions
    console.log('2️⃣ Checking test user transactions...');
    
    const { data: userTransactions, error: userTransError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .order('created_at', { ascending: false });

    if (userTransError) {
      console.error('❌ Failed to fetch user transactions:', userTransError.message);
    } else {
      console.log(`📈 Test user has ${userTransactions.length} transactions:`);
      
      userTransactions.forEach((transaction, index) => {
        const status = transaction.status === 'completed' ? '✅ COMPLETED' : 
                      transaction.status === 'pending' ? '⏳ PENDING' : '❌ FAILED';
        
        console.log(`   ${index + 1}. ${status}`);
        console.log(`      Plan: ${transaction.plan_id}`);
        console.log(`      Amount: $${transaction.amount}`);
        console.log(`      Credits Added: ${transaction.credits_added}`);
        console.log(`      Date: ${new Date(transaction.created_at).toLocaleString()}`);
        console.log('');
      });
    }

    // 3. Check user subscription status
    console.log('3️⃣ Checking user subscription status...');
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id, email, subscription_plan, subscription_status, trial_ends_at, remaining_credits, total_credits, last_payment_at')
      .eq('user_id', TEST_USER_ID)
      .single();

    if (userError) {
      console.error('❌ Failed to fetch user:', userError.message);
    } else if (user) {
      console.log('👤 User subscription details:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Plan: ${user.subscription_plan}`);
      console.log(`   Status: ${user.subscription_status}`);
      console.log(`   Trial Ends: ${user.trial_ends_at ? new Date(user.trial_ends_at).toLocaleString() : 'N/A'}`);
      console.log(`   Credits: ${user.remaining_credits}/${user.total_credits}`);
      console.log(`   Last Payment: ${user.last_payment_at ? new Date(user.last_payment_at).toLocaleString() : 'Never'}`);
    } else {
      console.log('⚠️ Test user not found in database');
    }

    // 4. Test subscription access function
    console.log('\n4️⃣ Testing subscription access function...');
    
    const { data: accessResult, error: accessError } = await supabase
      .rpc('check_subscription_access', {
        p_user_id: TEST_USER_ID,
        p_feature: 'revo-2.0'
      });

    if (accessError) {
      console.error('❌ Access check failed:', accessError.message);
    } else if (accessResult && accessResult.length > 0) {
      const access = accessResult[0];
      const status = access.has_access ? '✅ HAS ACCESS' : '❌ NO ACCESS';
      
      console.log(`   ${status}`);
      console.log(`   Reason: ${access.reason}`);
      console.log(`   Credits Remaining: ${access.credits_remaining}`);
      console.log(`   Subscription Status: ${access.subscription_status}`);
    }

    // 5. Check usage logs
    console.log('\n5️⃣ Checking usage logs...');
    
    const { data: usageLogs, error: usageError } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .order('created_at', { ascending: false })
      .limit(5);

    if (usageError) {
      console.error('❌ Failed to fetch usage logs:', usageError.message);
    } else {
      console.log(`📝 Found ${usageLogs.length} recent usage logs:`);
      
      usageLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.feature} - ${log.credits_used} credits`);
        console.log(`      Date: ${new Date(log.created_at).toLocaleString()}`);
        if (log.metadata) {
          console.log(`      Metadata: ${JSON.stringify(log.metadata)}`);
        }
        console.log('');
      });
    }

    // 6. Summary and recommendations
    console.log('📋 VERIFICATION SUMMARY:');
    console.log('========================');
    
    const completedTransactions = transactions.filter(t => t.status === 'completed').length;
    const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
    
    console.log(`✅ Total Transactions: ${transactions.length}`);
    console.log(`✅ Completed: ${completedTransactions}`);
    console.log(`⏳ Pending: ${pendingTransactions}`);
    console.log(`👤 Test User Transactions: ${userTransactions?.length || 0}`);
    console.log(`🔑 User Access: ${accessResult?.[0]?.has_access ? 'Granted' : 'Denied'}`);
    console.log(`📊 Usage Logs: ${usageLogs?.length || 0} entries`);

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (completedTransactions > 0) {
      console.log('✅ Payment processing is working correctly');
    } else {
      console.log('⚠️ No completed transactions found - test a payment');
    }

    if (userTransactions?.length > 0) {
      console.log('✅ User-specific transaction tracking is working');
    } else {
      console.log('⚠️ No transactions for test user - create a test payment');
    }

    if (accessResult?.[0]?.has_access) {
      console.log('✅ Subscription access control is working');
    } else {
      console.log('⚠️ User access denied - check subscription status');
    }

    console.log('\n🎯 Verification complete!');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Helper function to create a test payment record
async function createTestPayment() {
  console.log('🧪 Creating test payment record...');
  
  try {
    const testPayment = {
      user_id: TEST_USER_ID,
      stripe_session_id: `cs_test_${Date.now()}`,
      plan_id: 'starter',
      amount: 9.99,
      status: 'completed',
      credits_added: 50,
      payment_method: 'test_card',
      metadata: {
        test: true,
        created_by: 'verification_script'
      }
    };

    const { data, error } = await supabase
      .from('payment_transactions')
      .insert(testPayment)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create test payment:', error.message);
    } else {
      console.log('✅ Test payment created:', data.id);
      
      // Update user credits
      await supabase
        .from('users')
        .update({
          remaining_credits: 50,
          total_credits: 50,
          subscription_plan: 'starter',
          subscription_status: 'active',
          last_payment_at: new Date().toISOString()
        })
        .eq('user_id', TEST_USER_ID);
        
      console.log('✅ User credits updated');
    }
  } catch (error) {
    console.error('❌ Test payment creation failed:', error.message);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--create-test')) {
  createTestPayment().then(() => verifyPaymentProcessing());
} else {
  verifyPaymentProcessing();
}
