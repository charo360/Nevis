#!/usr/bin/env node

// Script to examine all users in the users table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Examining all users in the users table...\n');

async function examineUsers() {
  try {
    console.log('1️⃣ Getting all users from users table...');
    
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.log('❌ Failed to get users:', usersError.message);
      return;
    }
    
    console.log(`✅ Found ${allUsers.length} users in users table:\n`);
    
    allUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Created: ${user.created_at}`);
      console.log(`  ID Format: ${user.id.includes('-') ? 'UUID (Supabase)' : 'Custom (MongoDB)'}`);
      console.log();
    });
    
    console.log('2️⃣ Getting all auth users...');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Failed to get auth users:', authError.message);
      return;
    }
    
    console.log(`✅ Found ${authUsers.users.length} users in auth.users:\n`);
    
    authUsers.users.forEach((user, index) => {
      console.log(`Auth User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Created: ${user.created_at}`);
      
      // Check if this auth user has a corresponding record in users table
      const matchingUser = allUsers.find(u => u.id === user.id);
      console.log(`  In users table: ${matchingUser ? 'YES' : 'NO'}`);
      console.log();
    });
    
    console.log('3️⃣ Checking existing brand profiles and their user IDs...');
    
    const { data: brandProfiles, error: profilesError } = await supabase
      .from('brand_profiles')
      .select('id, business_name, user_id')
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      console.log('❌ Failed to get brand profiles:', profilesError.message);
      return;
    }
    
    console.log(`✅ Found ${brandProfiles.length} brand profiles:\n`);
    
    brandProfiles.forEach((profile, index) => {
      console.log(`Brand Profile ${index + 1}:`);
      console.log(`  ID: ${profile.id}`);
      console.log(`  Business Name: ${profile.business_name}`);
      console.log(`  User ID: ${profile.user_id}`);
      console.log(`  User ID Format: ${profile.user_id?.includes('-') ? 'UUID (Supabase)' : 'Custom (MongoDB)'}`);
      
      // Check if this user_id exists in users table
      const matchingUser = allUsers.find(u => u.id === profile.user_id);
      console.log(`  User exists in users table: ${matchingUser ? 'YES' : 'NO'}`);
      console.log();
    });
    
    console.log('4️⃣ Analysis Summary:');
    console.log('====================');
    
    const supabaseUsers = allUsers.filter(u => u.id.includes('-'));
    const mongoUsers = allUsers.filter(u => !u.id.includes('-'));
    const supabaseProfiles = brandProfiles.filter(p => p.user_id?.includes('-'));
    const mongoProfiles = brandProfiles.filter(p => p.user_id && !p.user_id.includes('-'));
    
    console.log(`📊 Users in users table:`);
    console.log(`   - Supabase format (UUID): ${supabaseUsers.length}`);
    console.log(`   - MongoDB format: ${mongoUsers.length}`);
    
    console.log(`📊 Brand profiles:`);
    console.log(`   - With Supabase user IDs: ${supabaseProfiles.length}`);
    console.log(`   - With MongoDB user IDs: ${mongoProfiles.length}`);
    
    console.log(`📊 Auth users: ${authUsers.users.length} (all Supabase format)`);
    
    if (mongoProfiles.length > 0 && supabaseUsers.length > 0) {
      console.log(`\n💡 ISSUE IDENTIFIED:`);
      console.log(`   The database contains a mix of MongoDB and Supabase user IDs.`);
      console.log(`   Existing brand profiles use MongoDB user IDs, but new auth users have Supabase UUIDs.`);
      console.log(`   This is causing the foreign key constraint violation.`);
      
      console.log(`\n🔧 SOLUTIONS:`);
      console.log(`   1. Update the foreign key constraint to be more flexible`);
      console.log(`   2. Create user records in users table that match the Supabase auth UUIDs`);
      console.log(`   3. Migrate existing brand profiles to use Supabase user IDs`);
    }
    
  } catch (error) {
    console.error('❌ Examination failed:', error);
  }
}

async function main() {
  await examineUsers();
}

main().catch(console.error);