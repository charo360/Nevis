#!/usr/bin/env node

// Detailed brand profile creation test
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

console.log('🔬 Detailed brand profile creation test...\n');

async function testBrandCreation() {
  try {
    console.log('1️⃣ Checking brand_profiles table structure...');
    
    // Check table structure using service role
    try {
      const { data: tableInfo, error: tableError } = await supabaseService
        .from('brand_profiles')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.log('❌ Table access failed:', tableError.message);
        if (tableError.message.includes('does not exist')) {
          console.log('🚨 ISSUE: brand_profiles table does not exist!');
          console.log('💡 You need to create the brand_profiles table in your Supabase database');
          return;
        }
      } else {
        console.log('✅ brand_profiles table exists and is accessible');
      }
    } catch (err) {
      console.log('❌ Table check failed:', err.message);
    }
    
    console.log('\n2️⃣ Signing in to get user info...');
    
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD
    });
    
    if (authError) {
      console.log('❌ Login failed:', authError.message);
      return;
    }
    
    console.log('✅ Logged in successfully');
    const userId = authData.user.id;
    console.log('🆔 User ID:', userId);
    
    console.log('\n3️⃣ Testing direct database insertion with service role...');
    
    const testProfileRow = {
      user_id: userId,
      business_name: 'Test Business Direct',
      business_type: 'Technology',
      description: 'A test business created directly',
      location: { country: 'Test Country', city: 'Test City', address: 'Test Address' },
      contact: { email: 'test@test.com', phone: '+1234567890', website: 'https://test.com' },
      social_media: { facebook: '', instagram: '', twitter: '', linkedin: '' },
      brand_colors: { primary: '#3B82F6', accent: '#10B981', secondary: '#F8FAFC' },
      logo_url: '',
      logo_data_url: '',
      design_examples: [],
      target_audience: 'Test Audience',
      brand_voice: 'Professional',
      services: [{ name: 'Test Service 1' }, { name: 'Test Service 2' }],
      is_active: true
    };
    
    try {
      const { data: insertData, error: insertError } = await supabaseService
        .from('brand_profiles')
        .insert(testProfileRow)
        .select('id')
        .single();
      
      if (insertError) {
        console.log('❌ Direct insertion failed:', insertError.message);
        console.log('🔍 Error details:', JSON.stringify(insertError, null, 2));
        
        if (insertError.message.includes('violates check constraint')) {
          console.log('💡 Check constraint violation - some field values may be invalid');
        } else if (insertError.message.includes('not-null')) {
          console.log('💡 Required field is missing');
        } else if (insertError.message.includes('foreign key')) {
          console.log('💡 Foreign key constraint issue');
        }
      } else {
        console.log('✅ Direct insertion successful!');
        console.log('🆔 Profile ID:', insertData.id);
        
        // Clean up - delete the test profile
        await supabaseService.from('brand_profiles').delete().eq('id', insertData.id);
        console.log('🧹 Test profile cleaned up');
      }
    } catch (insertErr) {
      console.log('❌ Direct insertion exception:', insertErr.message);
    }
    
    console.log('\n4️⃣ Testing brandProfileSupabaseService directly...');
    
    // Try to import and test the service directly
    try {
      // We can't easily import ES modules in this Node script, so let's test via API
      console.log('Testing via API call with detailed logging...');
      
      const detailedTestProfile = {
        businessName: 'Test Business API',
        businessType: 'Technology',
        description: 'A test business via API',
        location: 'Test Location',
        city: 'Test City', 
        contactAddress: 'Test Address',
        contactEmail: 'test@api.com',
        contactPhone: '+1234567890',
        websiteUrl: 'https://api-test.com',
        facebookUrl: '',
        instagramUrl: '',
        twitterUrl: '',
        linkedinUrl: '',
        primaryColor: '#3B82F6',
        accentColor: '#10B981',
        backgroundColor: '#F8FAFC',
        logoUrl: '',
        logoDataUrl: '',
        designExamples: [],
        targetAudience: 'Test Audience',
        brandVoice: 'Professional',
        services: ['Service 1', 'Service 2'],
        isActive: true
      };
      
      const response = await fetch('http://localhost:3001/api/brand-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.session.access_token}`,
        },
        body: JSON.stringify(detailedTestProfile)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ API call failed:', errorText);
        
        // Try to parse as JSON to get more details
        try {
          const errorJson = JSON.parse(errorText);
          console.log('🔍 Parsed error:', JSON.stringify(errorJson, null, 2));
        } catch (parseErr) {
          console.log('🔍 Raw error text:', errorText);
        }
      } else {
        const result = await response.json();
        console.log('✅ API call successful:', result);
      }
      
    } catch (serviceErr) {
      console.log('❌ Service test failed:', serviceErr.message);
    }
    
    // Sign out
    await supabaseClient.auth.signOut();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function main() {
  await testBrandCreation();
}

main().catch(console.error);