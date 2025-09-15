#!/usr/bin/env node

// Script to investigate specific user ID issue
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

const EMAIL = 'test@example.com';
const PASSWORD = 'testpassword123';

console.log('🔍 Investigating specific user ID issue...\n');

async function investigateUserId() {
  try {
    console.log('1️⃣ Getting current session user ID...');
    
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD
    });
    
    if (authError) {
      console.log('❌ Login failed:', authError.message);
      return;
    }
    
    const sessionUserId = authData.user.id;
    console.log('🆔 Session User ID:', sessionUserId);
    console.log('📧 Email:', authData.user.email);
    
    console.log('\n2️⃣ Checking if this user ID exists in users table...');
    
    const { data: userRecord, error: userError } = await supabaseService
      .from('users')
      .select('*')
      .eq('id', sessionUserId)
      .single();
    
    if (userError) {
      console.log('❌ User not found in users table:', userError.message);
      console.log('🔍 Error code:', userError.code);
      
      if (userError.code === 'PGRST116') {
        console.log('💡 User definitely does not exist in users table');
        
        console.log('\n3️⃣ Creating missing user record...');
        
        const { error: insertError } = await supabaseService
          .from('users')
          .insert({
            id: sessionUserId,
            email: authData.user.email,
            created_at: authData.user.created_at,
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.log('❌ Failed to create user record:', insertError.message);
        } else {
          console.log('✅ User record created successfully');
        }
      }
    } else {
      console.log('✅ User found in users table:', userRecord);
    }
    
    console.log('\n4️⃣ Double-checking users table search...');
    
    // Let's check all users with similar email or ID
    const { data: allUsers, error: allUsersError } = await supabaseService
      .from('users')
      .select('*')
      .or(`id.eq.${sessionUserId},email.eq.${EMAIL}`);
    
    if (allUsersError) {
      console.log('❌ Failed to get all users:', allUsersError.message);
    } else {
      console.log('📋 All users matching ID or email:', allUsers);
    }
    
    console.log('\n5️⃣ Checking auth.users table directly...');
    
    const { data: authUsers, error: authUsersError } = await supabaseService.auth.admin.listUsers();
    
    if (authUsersError) {
      console.log('❌ Failed to get auth users:', authUsersError.message);
    } else {
      const matchingAuthUser = authUsers.users.find(u => u.email === EMAIL);
      if (matchingAuthUser) {
        console.log('✅ Found in auth.users:', {
          id: matchingAuthUser.id,
          email: matchingAuthUser.email,
          created_at: matchingAuthUser.created_at
        });
        
        console.log('🔍 ID comparison:');
        console.log('  Session ID:', sessionUserId);
        console.log('  Auth ID:   ', matchingAuthUser.id);
        console.log('  Match:     ', sessionUserId === matchingAuthUser.id);
      } else {
        console.log('❌ Not found in auth.users');
      }
    }
    
    console.log('\n6️⃣ Testing brand profile creation after fix...');
    
    const testProfile = {
      user_id: sessionUserId,
      business_name: 'Test Business Fixed',
      business_type: 'Technology',
      description: 'Test after user fix',
      location: { country: 'Test', city: 'Test', address: 'Test' },
      contact: { email: 'test@test.com', phone: '123', website: 'test.com' },
      social_media: { facebook: '', instagram: '', twitter: '', linkedin: '' },
      brand_colors: { primary: '#000', accent: '#111', secondary: '#222' },
      logo_url: '',
      logo_data_url: '',
      design_examples: [],
      target_audience: 'Test',
      brand_voice: 'Test',
      services: [],
      is_active: true
    };
    
    const { data: testInsert, error: testError } = await supabaseService
      .from('brand_profiles')
      .insert(testProfile)
      .select('id')
      .single();
    
    if (testError) {
      console.log('❌ Test insertion still failed:', testError.message);
    } else {
      console.log('✅ Test insertion successful! ID:', testInsert.id);
      
      // Clean up
      await supabaseService.from('brand_profiles').delete().eq('id', testInsert.id);
      console.log('🧹 Test profile cleaned up');
    }
    
    await supabaseClient.auth.signOut();
    
  } catch (error) {
    console.error('❌ Investigation failed:', error);
  }
}

async function main() {
  await investigateUserId();
}

main().catch(console.error);