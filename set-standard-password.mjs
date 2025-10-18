#!/usr/bin/env node
/**
 * Set standard password (Crevo119988) for test users
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nrfceylvtiwpqsoxurrv.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const standardPassword = 'Crevo119988';
const users = [
  { email: 'sam@crevo.app', id: '4383b697-18ea-437b-9c27-835c7907b973' },
  { email: 'sm1761a@american.edu', id: 'dd9f93dc-08c2-4086-9359-687fa6c5897d' }
];

console.log('🔧 Setting standard password for all test users...\n');

for (const user of users) {
  try {
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { 
        password: standardPassword,
        email_confirm: true
      }
    );

    if (error) {
      console.log(`❌ ${user.email}: ${error.message}`);
    } else {
      console.log(`✅ ${user.email}: Password set successfully`);
    }
  } catch (err) {
    console.log(`❌ ${user.email}: ${err.message}`);
  }
}

console.log('\n🎉 All users updated!');
console.log('🔑 Standard password: Crevo119988');
console.log('\n📋 Test logins:');
users.forEach(u => {
  console.log(`   ${u.email} / Crevo119988`);
});


