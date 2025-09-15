#!/usr/bin/env node

// Database diagnostic script to understand user creation issues
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Environment variables loaded above

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Diagnosing Database Schema and Permissions...\n');

async function checkTableSchema() {
  console.log('📋 Checking table schemas...');
  
  // Check if tables exist and their structure
  const tables = ['users', 'brand_profiles', 'auth.users'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table.replace('auth.', ''))
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: accessible`);
      }
    } catch (err) {
      console.log(`❌ Table ${table}: ${err.message}`);
    }
  }
}

async function checkConstraints() {
  console.log('\n🔗 Checking foreign key constraints...');
  
  try {
    // Check constraints on users table
    const { data, error } = await supabase
      .rpc('get_table_constraints', { table_name: 'users' });
    
    if (error) {
      console.log('❌ Could not fetch constraints:', error.message);
    } else {
      console.log('Users table constraints:', data);
    }
  } catch (err) {
    console.log('❌ Constraint check failed:', err.message);
  }
}

async function checkRLSPolicies() {
  console.log('\n🔒 Checking RLS policies...');
  
  try {
    // This might not work with all Supabase setups, but let's try
    const { data, error } = await supabase
      .from('pg_policies')
      .select('*')
      .in('tablename', ['users', 'brand_profiles']);
    
    if (error) {
      console.log('❌ Could not fetch RLS policies:', error.message);
    } else {
      console.log('RLS policies:', data);
    }
  } catch (err) {
    console.log('❌ RLS policy check failed:', err.message);
  }
}

async function testInsertPermissions() {
  console.log('\n🧪 Testing insert permissions...');
  
  // Test creating a temporary user record
  const testEmail = `test-${Date.now()}@example.com`;
  
  try {
    // First, try to create auth user
    console.log('Testing auth user creation...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true
    });
    
    if (authError) {
      console.log('❌ Auth user creation failed:', authError.message);
      return;
    }
    
    console.log('✅ Auth user created:', authUser.user.id);
    
    // Now try to create user record in users table
    console.log('Testing users table insertion...');
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: testEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (userError) {
      console.log('❌ Users table insertion failed:', userError.message);
    } else {
      console.log('✅ Users table insertion successful:', userRecord);
    }
    
    // Test brand_profiles table insertion
    console.log('Testing brand_profiles table insertion...');
    const { data: brandRecord, error: brandError } = await supabase
      .from('brand_profiles')
      .insert({
        user_id: authUser.user.id,
        business_name: 'Test Business',
        business_type: 'Test Type',
        target_audience: 'Test Audience',
        brand_voice: 'Professional',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (brandError) {
      console.log('❌ Brand profiles insertion failed:', brandError.message);
    } else {
      console.log('✅ Brand profiles insertion successful:', brandRecord);
    }
    
    // Clean up - delete the test user
    console.log('Cleaning up test user...');
    await supabase.auth.admin.deleteUser(authUser.user.id);
    console.log('✅ Test user cleaned up');
    
  } catch (err) {
    console.log('❌ Test failed:', err.message);
  }
}

async function checkTriggers() {
  console.log('\n⚡ Checking database triggers...');
  
  try {
    // Try to get trigger information
    const { data, error } = await supabase
      .rpc('get_table_triggers', { table_name: 'users' });
    
    if (error) {
      console.log('❌ Could not fetch triggers:', error.message);
    } else {
      console.log('Database triggers:', data);
    }
  } catch (err) {
    console.log('❌ Trigger check failed:', err.message);
  }
}

async function main() {
  try {
    await checkTableSchema();
    await checkConstraints();
    await checkRLSPolicies();
    await checkTriggers();
    await testInsertPermissions();
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Review any errors above');
    console.log('2. Check if foreign key constraints need to be updated');
    console.log('3. Verify RLS policies allow user creation');
    console.log('4. Look for conflicting triggers');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
}

main().catch(console.error);