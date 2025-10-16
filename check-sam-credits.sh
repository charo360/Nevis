#!/bin/bash
SUPABASE_SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d= -f2) node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://nrfceylvtiwpqsoxurrv.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);

const samUserId = '4383b697-18ea-437b-9c27-835c7907b973';

const { data: credits } = await supabase.from('user_credits').select('*').eq('user_id', samUserId).single();
const { data: payments } = await supabase.from('payment_transactions').select('*').eq('user_id', samUserId).order('created_at', { ascending: false });

console.log('═══════════════════════════════════════');
console.log('sam@crevo.app Current Status');
console.log('═══════════════════════════════════════');
console.log('Credits:');
console.log('  Total:', credits.total_credits);
console.log('  Remaining:', credits.remaining_credits);
console.log('  Used:', credits.used_credits);
console.log('');
console.log('Payments:', payments?.length || 0);
if (payments && payments.length > 0) {
  payments.forEach((p, i) => {
    console.log(\`  \${i+1}. \${p.plan_id} - $\${p.amount} (+\${p.credits_added} credits)\`);
  });
} else {
  console.log('  ❌ No payments recorded yet');
}
console.log('═══════════════════════════════════════');
"

