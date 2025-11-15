import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_USER_ID = 'dd9f93dc-08c2-4086-9359-687fa6c5897d';

async function compareTables() {
  console.log('📊 Comparing credit tables for user sm1761a@american.edu\n');

  // Check credit_transactions
  const { data: txData, error: txError } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('1️⃣ credit_transactions table:');
  if (txError) {
    console.error('   Error:', txError);
  } else {
    console.log(`   Records: ${txData?.length || 0}`);
    if (txData && txData.length > 0) {
      console.log('   Latest:', txData[0]);
    }
  }

  // Check credit_usage_history
  const { data: historyData, error: historyError } = await supabase
    .from('credit_usage_history')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\n2️⃣ credit_usage_history table:');
  if (historyError) {
    console.error('   Error:', historyError);
  } else {
    console.log(`   Records: ${historyData?.length || 0}`);
    if (historyData && historyData.length > 0) {
      console.log('   Latest entries:');
      historyData.slice(0, 3).forEach((entry, i) => {
        console.log(`   ${i + 1}. ${entry.feature} - ${entry.credits_used} credits at ${new Date(entry.created_at).toLocaleString()}`);
      });
    }
  }
}

compareTables();
