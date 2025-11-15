import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_USER_ID = 'dd9f93dc-08c2-4086-9359-687fa6c5897d';

async function testInsert() {
  console.log('🧪 Testing credit_transactions insert...\n');

  const { data, error } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: TEST_USER_ID,
      type: 'deduction',
      amount: 5,
      balance_before: 15750,
      balance_after: 15745,
      reason: 'test_revo_2.0_generation',
      metadata: {
        revoVersion: 'revo-2.0',
        generations: 1,
        creditsCost: 5,
        test: true
      }
    })
    .select();

  if (error) {
    console.error('❌ Insert failed:', error);
  } else {
    console.log('✅ Insert successful!');
    console.log('   Data:', data);
  }
}

testInsert();
