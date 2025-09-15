#!/usr/bin/env node

// Test script to check brand profiles API endpoint
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const EMAIL = 'test@example.com';
const PASSWORD = 'testpassword123';

console.log('🧪 Testing brand profiles API...\n');

async function testBrandProfilesAPI() {
  try {
    console.log('1️⃣ Signing in to get access token...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD
    });
    
    if (authError) {
      console.log('❌ Login failed:', authError.message);
      return;
    }
    
    console.log('✅ Logged in successfully');
    console.log('🆔 User ID:', authData.user.id);
    console.log('🔑 Access Token:', authData.session.access_token ? 'Present' : 'Missing');
    
    const accessToken = authData.session.access_token;
    
    console.log('\n2️⃣ Testing GET /api/brand-profiles...');
    
    try {
      const response = await fetch('http://localhost:3001/api/brand-profiles', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ API Error Response:', errorText);
        
        if (response.status === 401) {
          console.log('🔍 This suggests an authentication issue with Supabase JWT verification');
        } else if (response.status === 500) {
          console.log('🔍 This suggests a server-side error, possibly with database table structure');
        }
      } else {
        const data = await response.json();
        console.log('✅ API Response:', data);
        console.log('📋 Number of profiles:', data.length);
      }
    } catch (fetchError) {
      console.log('❌ Fetch error:', fetchError.message);
    }
    
    console.log('\n3️⃣ Testing brand_profiles table access directly...');
    
    try {
      const { data: tableData, error: tableError } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', authData.user.id);
      
      if (tableError) {
        console.log('❌ Direct table access failed:', tableError.message);
        if (tableError.message.includes('does not exist')) {
          console.log('🔍 The brand_profiles table does not exist in Supabase');
        } else if (tableError.message.includes('permission')) {
          console.log('🔍 RLS policies may be blocking access to brand_profiles table');
        }
      } else {
        console.log('✅ Direct table access successful');
        console.log('📋 Table data:', tableData);
      }
    } catch (tableError) {
      console.log('❌ Direct table access error:', tableError.message);
    }
    
    console.log('\n4️⃣ Testing POST /api/brand-profiles...');
    
    const testProfile = {
      businessName: 'Test Business',
      businessType: 'Technology',
      description: 'A test business',
      location: 'Test Location',
      primaryColor: '#3B82F6',
      accentColor: '#10B981',
      backgroundColor: '#F8FAFC'
    };
    
    try {
      const postResponse = await fetch('http://localhost:3001/api/brand-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(testProfile)
      });
      
      console.log('📊 POST Response status:', postResponse.status);
      
      if (!postResponse.ok) {
        const postErrorText = await postResponse.text();
        console.log('❌ POST API Error Response:', postErrorText);
      } else {
        const postData = await postResponse.json();
        console.log('✅ POST API Response:', postData);
      }
    } catch (postError) {
      console.log('❌ POST fetch error:', postError.message);
    }
    
    // Clean up - sign out
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function main() {
  await testBrandProfilesAPI();
}

main().catch(console.error);