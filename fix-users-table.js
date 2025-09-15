#!/usr/bin/env node

// Script to fix missing users table records
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔧 Fixing missing users table records...\n');

async function syncUsersTable() {
  try {
    console.log('1️⃣ Getting all auth users...');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Failed to get auth users:', authError.message);
      return;
    }
    
    console.log(`✅ Found ${authUsers.users.length} auth users`);
    
    console.log('\n2️⃣ Checking which users are missing from users table...');
    
    const missingUsers = [];
    
    for (const authUser of authUsers.users) {
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single();
      
      if (userError && userError.code === 'PGRST116') {
        // User not found in users table
        missingUsers.push(authUser);
        console.log(`❌ Missing: ${authUser.email} (${authUser.id})`);
      } else if (userError) {
        console.log(`⚠️ Error checking ${authUser.email}: ${userError.message}`);
      } else {
        console.log(`✅ Exists: ${authUser.email}`);
      }
    }
    
    if (missingUsers.length === 0) {
      console.log('\n🎉 All auth users already have records in users table!');
      return;
    }
    
    console.log(`\n3️⃣ Creating ${missingUsers.length} missing user records...`);
    
    for (const authUser of missingUsers) {
      try {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            created_at: authUser.created_at,
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.log(`❌ Failed to create user record for ${authUser.email}:`, insertError.message);
        } else {
          console.log(`✅ Created user record for ${authUser.email}`);
        }
      } catch (err) {
        console.log(`❌ Exception creating user record for ${authUser.email}:`, err.message);
      }
    }
    
    console.log('\n4️⃣ Verification - checking users table again...');
    
    let fixedCount = 0;
    for (const authUser of authUsers.users) {
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single();
      
      if (!userError && userRecord) {
        fixedCount++;
      }
    }
    
    console.log(`✅ ${fixedCount}/${authUsers.users.length} auth users now have users table records`);
    
    if (fixedCount === authUsers.users.length) {
      console.log('\n🎉 All users are now properly synced!');
      console.log('💡 Brand profile creation should now work correctly.');
    } else {
      console.log('\n⚠️ Some users still need attention. Check the errors above.');
    }
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

async function main() {
  await syncUsersTable();
}

main().catch(console.error);