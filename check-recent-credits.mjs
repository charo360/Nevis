import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_USER_ID = 'dd9f93dc-08c2-4086-9359-687fa6c5897d';
const TEST_USER_EMAIL = 'sm1761a@american.edu';

async function checkRecentCredits() {
  console.log('\n📊 Checking Recent Credit Activity');
  console.log('User:', TEST_USER_EMAIL);
  console.log('='.repeat(60));

  // Get current credit balance
  const { data: creditData, error: creditError } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .single();

  if (creditError) {
    console.error('❌ Error fetching credits:', creditError);
    return;
  }

  console.log('\n💰 Current Credit Balance:');
  console.log('  Raw data:', creditData);
  console.log('  Total Credits:', creditData.total_credits || creditData.credits_total);
  console.log('  Credits Remaining:', creditData.credits_remaining || creditData.remaining_credits);

  // Query credit_transactions table (has metadata with model info)
  const { data: transactionData, error: transactionError } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .eq('type', 'deduction')
    .order('created_at', { ascending: false })
    .limit(10);

  if (transactionError) {
    console.error('❌ Error fetching transactions:', transactionError);
    return;
  }

  console.log('\n📋 Last 10 Credit Deductions:');
  console.log(`   Source: credit_transactions (has model metadata)`);
  console.log('-'.repeat(60));
  
  if (!transactionData || transactionData.length === 0) {
    console.log('\n   No recent credit activity found');
  } else {
    transactionData.forEach((entry, index) => {
      const date = new Date(entry.created_at).toLocaleString();
      const credits = entry.amount;
      const model = entry.metadata?.revoVersion || 'N/A';
      const reason = entry.reason || 'Unknown';
      const balanceChange = `${entry.balance_before} → ${entry.balance_after}`;
      
      console.log(`\n${index + 1}. ${reason}`);
      console.log(`   Credits: ${credits}`);
      console.log(`   Model: ${model}`);
      console.log(`   Balance: ${balanceChange}`);
      console.log(`   Time: ${date}`);
    });
  }

  // Count generations in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recentGenerations = transactionData?.filter(entry => 
    entry.created_at > oneHourAgo && 
    entry.reason?.includes('generation')
  ) || [];
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n🕐 Generations in last hour: ${recentGenerations.length}`);
  if (recentGenerations.length > 0) {
    const totalCredits = recentGenerations.reduce((sum, entry) => 
      sum + (entry.amount || 0), 0
    );
    console.log(`   Total credits used: ${totalCredits}`);
  }
}

checkRecentCredits();
