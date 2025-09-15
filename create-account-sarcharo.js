#!/usr/bin/env node

// Script to create sarcharo@gmail.com account with proper error handling
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
const PASSWORD = 'nevisai2024!'; // You can change this
const DISPLAY_NAME = 'Sarcharo';

console.log('🔧 Creating account for sarcharo@gmail.com...\n');

async function createAccount() {
  try {
    // Step 1: Check if user already exists in auth
    console.log('1️⃣ Checking if user already exists in auth...');
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === EMAIL);
    
    if (existingUser) {
      console.log('✅ User already exists in auth:', existingUser.id);
      
      // Check if user exists in users table
      const { data: userRecord, error: userCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('id', existingUser.id)
        .single();
      
      if (userCheckError && userCheckError.code !== 'PGRST116') {
        console.log('❌ Error checking users table:', userCheckError.message);
      } else if (!userRecord) {
        console.log('⚠️ User exists in auth but not in users table. Creating users record...');
        
        // Create users record
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: existingUser.id,
            email: existingUser.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.log('❌ Failed to create users record:', insertError.message);
        } else {
          console.log('✅ Users record created successfully');
        }
      } else {
        console.log('✅ User record exists in users table');
      }
      
      return existingUser.id;
    }
    
    // Step 2: Create new auth user
    console.log('2️⃣ Creating new auth user...');
    const { data: authResult, error: authError } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        display_name: DISPLAY_NAME,
        full_name: DISPLAY_NAME
      }
    });
    
    if (authError) {
      console.log('❌ Auth user creation failed:', authError.message);
      throw authError;
    }
    
    console.log('✅ Auth user created:', authResult.user.id);
    const userId = authResult.user.id;
    
    // Step 3: Wait a bit for any triggers to complete
    console.log('3️⃣ Waiting for database triggers...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 4: Check if users record was created by trigger
    console.log('4️⃣ Checking if users record was created by trigger...');
    const { data: triggerUserRecord, error: triggerCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (triggerCheckError && triggerCheckError.code !== 'PGRST116') {
      console.log('❌ Error checking trigger-created user:', triggerCheckError.message);
    } else if (triggerUserRecord) {
      console.log('✅ Users record was created automatically by trigger');
    } else {
      // Step 5: Manually create users record if trigger didn't create it
      console.log('5️⃣ Manually creating users record...');
      const { error: manualUserError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: EMAIL,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (manualUserError) {
        console.log('❌ Manual users record creation failed:', manualUserError.message);
        if (!manualUserError.message.includes('duplicate key')) {
          throw manualUserError;
        } else {
          console.log('✅ Users record already exists (race condition with trigger)');
        }
      } else {
        console.log('✅ Users record created manually');
      }
    }
    
    // Step 6: Create initial brand profile
    console.log('6️⃣ Creating initial brand profile...');
    const { data: brandProfile, error: brandError } = await supabase
      .from('brand_profiles')
      .insert({
        user_id: userId,
        business_name: 'My Business',
        business_type: 'General',
        target_audience: 'General audience',
        brand_voice: 'Professional',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (brandError) {
      console.log('❌ Brand profile creation failed:', brandError.message);
      // Don't throw here - user account is still valid without brand profile
    } else {
      console.log('✅ Brand profile created:', brandProfile.id);
    }
    
    console.log('\n🎉 Account creation completed!');
    console.log('📧 Email:', EMAIL);
    console.log('🔑 Password:', PASSWORD);
    console.log('🆔 User ID:', userId);
    console.log('\n🔐 You can now log in with these credentials at http://localhost:3001/auth');
    
    return userId;
    
  } catch (error) {
    console.error('❌ Account creation failed:', error);
    
    // Provide helpful error messages
    if (error.message?.includes('duplicate')) {
      console.log('\n💡 The account might already exist. Try logging in instead.');
    } else if (error.message?.includes('foreign key')) {
      console.log('\n💡 Database constraint issue. The users table might need to be synced.');
    } else if (error.message?.includes('permission')) {
      console.log('\n💡 Permission issue. Check your Supabase RLS policies.');
    }
    
    console.log('\n🔧 To troubleshoot:');
    console.log('1. Check if the account already exists in Supabase dashboard');
    console.log('2. Verify database triggers are working properly');
    console.log('3. Check RLS policies on users and brand_profiles tables');
    
    throw error;
  }
}

async function main() {
  try {
    await createAccount();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

main().catch(console.error);