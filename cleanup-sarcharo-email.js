#!/usr/bin/env node

// Script to check and clean up existing sarcharo@gmail.com records
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EMAIL = 'sarcharo@gmail.com';

console.log('🔍 Checking for existing records for sarcharo@gmail.com...\n');

async function checkExistingRecords() {
  console.log('1️⃣ Checking auth.users table...');
  
  try {
    // Check auth users
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const existingAuthUser = authUsers?.users?.find(u => u.email === EMAIL);
    
    if (existingAuthUser) {
      console.log('✅ Found existing auth user:', existingAuthUser.id);
      console.log('   - Email:', existingAuthUser.email);
      console.log('   - Created:', existingAuthUser.created_at);
      console.log('   - Email confirmed:', existingAuthUser.email_confirmed_at ? 'Yes' : 'No');
      console.log('   - Status:', existingAuthUser.banned_until ? 'Banned' : 'Active');
      
      // Check if user exists in users table
      console.log('\n2️⃣ Checking users table for this user...');
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', existingAuthUser.id)
        .single();
      
      if (userError && userError.code !== 'PGRST116') {
        console.log('❌ Error checking users table:', userError.message);
      } else if (!userRecord) {
        console.log('⚠️ Auth user exists but NO record in users table');
        console.log('💡 This could be causing the database error');
      } else {
        console.log('✅ Found users table record');
        console.log('   - ID:', userRecord.id);
        console.log('   - Email:', userRecord.email);
        console.log('   - Created:', userRecord.created_at);
      }
      
      // Check for brand profiles
      console.log('\n3️⃣ Checking brand_profiles table...');
      const { data: brandProfiles, error: brandError } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', existingAuthUser.id);
      
      if (brandError) {
        console.log('❌ Error checking brand profiles:', brandError.message);
      } else {
        console.log(`✅ Found ${brandProfiles?.length || 0} brand profiles`);
        if (brandProfiles && brandProfiles.length > 0) {
          brandProfiles.forEach((profile, index) => {
            console.log(`   - Profile ${index + 1}: ${profile.business_name || 'Unnamed'}`);
          });
        }
      }
      
      return existingAuthUser;
    } else {
      console.log('❌ No existing auth user found');
    }
    
    // Also check if there are orphaned users table records
    console.log('\n4️⃣ Checking for orphaned users table records...');
    const { data: orphanedUsers, error: orphanError } = await supabase
      .from('users')
      .select('*')
      .eq('email', EMAIL);
    
    if (orphanError) {
      console.log('❌ Error checking for orphaned users:', orphanError.message);
    } else if (orphanedUsers && orphanedUsers.length > 0) {
      console.log(`⚠️ Found ${orphanedUsers.length} orphaned users table records:`);
      orphanedUsers.forEach((user, index) => {
        console.log(`   - Record ${index + 1}: ID ${user.id}, Email: ${user.email}`);
      });
      return { orphanedUsers };
    } else {
      console.log('✅ No orphaned users table records');
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Error checking records:', error);
    return null;
  }
}

async function cleanupRecords(existingData) {
  console.log('\n🧹 CLEANUP OPTIONS:');
  console.log('==================');
  
  if (!existingData) {
    console.log('✅ No existing records found - the email should be clean to use');
    return;
  }
  
  if (existingData.id) {
    // Full auth user exists
    console.log('\n🔧 Option 1: Delete the existing auth user completely');
    console.log('   This will remove all associated data');
    console.log('   Command: node cleanup-sarcharo-email.js --delete-auth-user');
    
    console.log('\n🔧 Option 2: Try to repair the existing user');
    console.log('   This will try to fix any missing database records');
    console.log('   Command: node cleanup-sarcharo-email.js --repair-user');
    
    console.log('\n🔧 Option 3: Use a different email (Recommended)');
    console.log('   Create your account with a different email like:');
    console.log('   - sarcharo+nevis@gmail.com');
    console.log('   - your.name@gmail.com');
    console.log('   - etc.');
    
  } else if (existingData.orphanedUsers) {
    // Orphaned users table records
    console.log('\n🔧 Cleanup orphaned users table records');
    console.log('   Command: node cleanup-sarcharo-email.js --cleanup-orphaned');
  }
}

async function performCleanup(action) {
  if (action === '--delete-auth-user') {
    console.log('🗑️ Deleting existing auth user...');
    
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const existingAuthUser = authUsers?.users?.find(u => u.email === EMAIL);
    
    if (existingAuthUser) {
      const { error } = await supabase.auth.admin.deleteUser(existingAuthUser.id);
      if (error) {
        console.log('❌ Failed to delete auth user:', error.message);
      } else {
        console.log('✅ Auth user deleted successfully');
        console.log('💡 You should now be able to create the account');
      }
    }
    
  } else if (action === '--repair-user') {
    console.log('🔧 Repairing existing user...');
    
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const existingAuthUser = authUsers?.users?.find(u => u.email === EMAIL);
    
    if (existingAuthUser) {
      // Check if users record exists
      const { data: userRecord } = await supabase
        .from('users')
        .select('*')
        .eq('id', existingAuthUser.id)
        .single();
      
      if (!userRecord) {
        console.log('Creating missing users table record...');
        const { error } = await supabase
          .from('users')
          .insert({
            id: existingAuthUser.id,
            email: existingAuthUser.email,
            created_at: existingAuthUser.created_at,
            updated_at: new Date().toISOString()
          });
        
        if (error) {
          console.log('❌ Failed to create users record:', error.message);
        } else {
          console.log('✅ Users record created successfully');
        }
      }
      
      // Check if brand profile exists
      const { data: brandProfile } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', existingAuthUser.id)
        .single();
      
      if (!brandProfile) {
        console.log('Creating initial brand profile...');
        const { error } = await supabase
          .from('brand_profiles')
          .insert({
            user_id: existingAuthUser.id,
            business_name: 'My Business',
            business_type: 'General',
            target_audience: 'General audience',
            brand_voice: 'Professional',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (error) {
          console.log('❌ Failed to create brand profile:', error.message);
        } else {
          console.log('✅ Brand profile created successfully');
        }
      }
      
      console.log('✅ User repair completed');
      console.log('🎯 Try logging in with email:', EMAIL);
      console.log('💡 If you don\'t know the password, reset it in Supabase dashboard');
    }
    
  } else if (action === '--cleanup-orphaned') {
    console.log('🧹 Cleaning up orphaned records...');
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('email', EMAIL);
    
    if (error) {
      console.log('❌ Failed to cleanup orphaned records:', error.message);
    } else {
      console.log('✅ Orphaned records cleaned up');
      console.log('💡 You should now be able to create the account');
    }
  }
}

async function main() {
  const action = process.argv[2];
  
  if (action && action.startsWith('--')) {
    await performCleanup(action);
  } else {
    const existingData = await checkExistingRecords();
    await cleanupRecords(existingData);
  }
}

main().catch(console.error);