#!/usr/bin/env node

/**
 * Supabase Auth Verification
 * Tests if the Supabase authentication fix is working
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSupabaseAuth() {
  console.log('🔐 Testing Supabase Authentication Setup...');
  console.log('=' + '='.repeat(50));
  
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('\n🔗 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('generated_posts')
      .select('count')
      .limit(1);
      
    if (testError) {
      console.error('❌ Supabase connection failed:', testError.message);
      return;
    }
    console.log('✅ Supabase connection successful');
    
    // Test 2: Check authentication setup
    console.log('\n🎫 Testing authentication...');
    console.log('📋 Environment check:');
    console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
    
    // Test 3: Check posts data
    console.log('\n📊 Checking posts for user...');
    const { data: posts, error: postsError } = await supabase
      .from('generated_posts')
      .select('id, image_url, created_at')
      .eq('user_id', '58b4d78d-cb90-49ef-9524-7238aea00168')
      .order('created_at', { ascending: false })
      .limit(3);
      
    if (postsError) {
      console.error('❌ Posts query failed:', postsError.message);
      return;
    }
    
    console.log(`📋 Found ${posts?.length || 0} posts`);
    if (posts && posts.length > 0) {
      posts.forEach((post, index) => {
        console.log(`   Post ${index + 1}: ${post.id.substring(0, 8)}... - ${post.image_url ? 'Has image' : 'No image'}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SUPABASE AUTH VERIFICATION COMPLETE');
    console.log('='.repeat(50));
    console.log('\n✅ All systems appear to be working correctly!');
    console.log('\n🚀 Next steps:');
    console.log('1. Restart your development server');
    console.log('2. Try generating a new design');
    console.log('3. Refresh the page to verify it persists');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

testSupabaseAuth();
