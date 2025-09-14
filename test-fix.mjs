#!/usr/bin/env node

/**
 * Quick Fix Verification Test
 * Run this after applying the fixes to verify everything is working
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFix() {
  console.log('🧪 Testing Fix for Disappearing Designs...');
  console.log('=' + '='.repeat(50));
  
  try {
    // 1. Test database connection
    console.log('\n📡 Testing database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('generated_posts')
      .select('count')
      .limit(1);
      
    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError.message);
      return;
    }
    console.log('✅ Database connection successful');
    
    // 2. Check posts and their image URLs
    console.log('\n📊 Checking posts and image URLs...');
    const { data: posts, error } = await supabase
      .from('generated_posts')
      .select('id, image_url, created_at, platform')
      .eq('user_id', '58b4d78d-cb90-49ef-9524-7238aea00168')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (error) {
      console.error('❌ Error fetching posts:', error);
      return;
    }
    
    console.log(`📋 Found ${posts?.length || 0} recent posts:`);
    
    let validImages = 0;
    let invalidImages = 0;
    let missingImages = 0;
    
    for (const post of posts || []) {
      console.log(`\n📌 Post: ${post.id.substring(0, 8)}...`);
      console.log(`   Date: ${new Date(post.created_at).toLocaleDateString()}`);
      console.log(`   Platform: ${post.platform || 'Not specified'}`);
      
      if (!post.image_url) {
        console.log('   🚨 Status: Missing image URL');
        missingImages++;
      } else if (post.image_url.startsWith('data:')) {
        console.log('   ⚠️  Status: Temporary data URL (will disappear)');
        invalidImages++;
      } else if (post.image_url.includes('supabase.co')) {
        console.log('   ✅ Status: Valid Supabase Storage URL');
        validImages++;
      } else {
        console.log('   🔍 Status: External URL');
        validImages++;
      }
    }
    
    // 3. Check storage bucket
    console.log('\n🗄️  Checking storage bucket...');
    const { data: files, error: storageError } = await supabase.storage
      .from('nevis-storage')
      .list('generated-content', { limit: 100 });
      
    if (storageError) {
      console.error('❌ Storage check failed:', storageError.message);
    } else {
      console.log(`📁 Found ${files?.length || 0} files in storage`);
    }
    
    // 4. Summary and verdict
    console.log('\n' + '='.repeat(50));
    console.log('🎯 FIX VERIFICATION RESULTS');
    console.log('='.repeat(50));
    
    console.log(`📊 Image Status Summary:`);
    console.log(`   ✅ Valid images: ${validImages}`);
    console.log(`   ❌ Invalid/temporary: ${invalidImages}`);
    console.log(`   ⚠️  Missing: ${missingImages}`);
    
    if (validImages > 0 && invalidImages === 0) {
      console.log('\n🎉 SUCCESS: Fix appears to be working correctly!');
      console.log('   All images have valid persistent URLs');
    } else if (invalidImages > 0) {
      console.log('\n⚠️  PARTIAL: Some images still have temporary URLs');
      console.log('   These will disappear on refresh');
      console.log('   Solution: Generate new content to test the fix');
    } else if (missingImages > 0) {
      console.log('\n🔍 INFO: Some posts missing image URLs');
      console.log('   This might be expected for older posts');
    }
    
    console.log('\n💡 Next steps:');
    console.log('1. Generate a new design in your app');
    console.log('2. Refresh the page to verify it persists');
    console.log('3. Check that the new design has a Supabase Storage URL');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFix();