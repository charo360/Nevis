#!/usr/bin/env node

// Script to diagnose and fix the signup issue by checking what's happening in the database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Diagnosing signup issue...\n');

async function checkDatabaseTriggers() {
  console.log('1️⃣ Checking for database triggers that might be causing issues...');
  
  try {
    // Try to check if there are any triggers on auth.users or users table
    const { data, error } = await supabaseAdmin
      .rpc('get_triggers');
    
    if (error) {
      console.log('⚠️ Could not check triggers (this is expected):', error.message);
    } else {
      console.log('Database triggers:', data);
    }
  } catch (err) {
    console.log('⚠️ Trigger check not available');
  }
}

async function checkUsersTableStructure() {
  console.log('\n2️⃣ Checking users table structure...');
  
  try {
    // Check if users table exists and its structure
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Users table issue:', error.message);
      return false;
    } else {
      console.log('✅ Users table accessible');
      console.log('Sample data structure:', data[0] ? Object.keys(data[0]) : 'Empty table');
      return true;
    }
  } catch (err) {
    console.log('❌ Users table check failed:', err.message);
    return false;
  }
}

async function checkRLSPolicies() {
  console.log('\n3️⃣ Checking RLS policies...');
  
  try {
    // Try to insert with anon key to test RLS
    const testEmail = `test-rls-${Date.now()}@example.com`;
    
    const { data, error } = await supabaseClient.auth.signUp({
      email: testEmail,
      password: 'testpassword123'
    });
    
    if (error) {
      console.log('❌ RLS/Signup test failed:', error.message);
      if (error.message.includes('Database error')) {
        console.log('🔍 This is likely the same error you\'re experiencing');
      }
    } else {
      console.log('✅ RLS/Signup test passed');
      
      // Clean up test user
      if (data.user) {
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);
        console.log('🧹 Test user cleaned up');
      }
    }
  } catch (err) {
    console.log('❌ RLS test failed:', err.message);
  }
}

async function checkBrandProfilesConstraints() {
  console.log('\n4️⃣ Checking brand_profiles foreign key constraints...');
  
  try {
    const { data, error } = await supabaseAdmin
      .from('brand_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Brand profiles table issue:', error.message);
    } else {
      console.log('✅ Brand profiles table accessible');
    }
  } catch (err) {
    console.log('❌ Brand profiles check failed:', err.message);
  }
}

async function attemptDirectUserCreation() {
  console.log('\n5️⃣ Attempting direct user creation with admin client...');
  
  const EMAIL = 'test-direct@example.com';
  const PASSWORD = 'testpassword123';
  
  try {
    // Try creating user with admin client first
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true
    });
    
    if (authError) {
      console.log('❌ Direct admin user creation failed:', authError.message);
      if (authError.message.includes('Database error')) {
        console.log('🔍 The issue is in the database triggers/constraints');
        console.log('💡 Recommendation: Disable the automatic user creation trigger temporarily');
      }
    } else {
      console.log('✅ Direct admin user creation succeeded');
      
      // Check if users record was created
      const { data: userRecord, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authUser.user.id)
        .single();
      
      if (userError) {
        console.log('⚠️ Users table record not found:', userError.message);
      } else {
        console.log('✅ Users table record exists');
      }
      
      // Clean up
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      console.log('🧹 Test user cleaned up');
    }
  } catch (err) {
    console.log('❌ Direct creation test failed:', err.message);
  }
}

async function provideSolution() {
  console.log('\n💡 SOLUTION RECOMMENDATIONS:');
  console.log('=====================================');
  
  console.log('\n🔧 Option 1: Fix Database Trigger (Recommended)');
  console.log('- The error suggests a database trigger is failing when creating auth users');
  console.log('- This trigger is trying to create a users table record but failing');
  console.log('- Solution: Check your Supabase dashboard > Database > Triggers');
  console.log('- Look for triggers on auth.users table and fix any constraint violations');
  
  console.log('\n🔧 Option 2: Bypass Frontend Signup');
  console.log('- Use the test account: test@example.com / testpassword123');
  console.log('- Manually create your account in Supabase dashboard');
  console.log('- Go to Authentication > Users > Add user');
  
  console.log('\n🔧 Option 3: Modify Signup Flow');
  console.log('- Update the auth hook to handle database trigger failures gracefully');
  console.log('- Add retry logic for user creation');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Check Supabase dashboard for database triggers');
  console.log('2. Look at the users table constraints and foreign keys');
  console.log('3. Consider using manual user creation as a temporary workaround');
  console.log('4. Test with the existing test@example.com account for now');
}

async function main() {
  try {
    await checkDatabaseTriggers();
    await checkUsersTableStructure();
    await checkRLSPolicies();
    await checkBrandProfilesConstraints();
    await attemptDirectUserCreation();
    await provideSolution();
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
}

main().catch(console.error);