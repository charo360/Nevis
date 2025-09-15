#!/usr/bin/env node

// Test direct insertion now that user_id is mirrored
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const testUserId = '54879fcb-77e0-4db4-be10-57d3e988b026'; // test@example.com
  const { data, error } = await supabase
    .from('brand_profiles')
    .insert({
      user_id: testUserId,
      business_name: 'FK Fix Test',
      business_type: 'Tech',
      is_active: true
    })
    .select('id')
    .single();
  if (error) {
    console.error('❌ Insert failed:', error.message);
  } else {
    console.log('✅ Insert succeeded, id =', data.id);
    await supabase.from('brand_profiles').delete().eq('id', data.id);
    console.log('🧹 Cleaned up');
  }
})().catch(console.error);
