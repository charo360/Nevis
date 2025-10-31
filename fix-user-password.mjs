#!/usr/bin/env node
/**
 * Fix NULL password for sm1761a@american.edu
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nrfceylvtiwpqsoxurrv.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const userId = 'dd9f93dc-08c2-4086-9359-687fa6c5897d';
const email = 'sm1761a@american.edu';
const newPassword = 'Crevo119988';

console.log('🔧 Fixing password for:', email);

try {
  // Update user password using Admin API
  const { data, error } = await supabase.auth.admin.updateUserById(
    userId,
    { 
      password: newPassword,
      email_confirm: true
    }
  );

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  console.log('✅ Password updated successfully!');
  console.log('📧 Email:', email);
  console.log('🔑 Password:', newPassword);
  console.log('\n🎉 You can now login!');

} catch (err) {
  console.error('❌ Failed:', err);
  process.exit(1);
}

















