#!/usr/bin/env node

/**
 * Database Diagnostic Tool
 * Investigates the disappearing designs issue by checking database state and image URLs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load .env.local file
config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Your actual user ID from the system
const TEST_USER_ID = '58b4d78d-cb90-49ef-9524-7238aea00168';

async function testImageUrl(url) {
  if (!url) return { valid: false, reason: 'No URL provided' };
  
  if (url.startsWith('data:')) {
    return { valid: false, reason: 'Data URL (temporary)' };
  }
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return { 
      valid: response.ok, 
      status: response.status,
      reason: response.ok ? 'Valid' : `HTTP ${response.status}`
    };
  } catch (error) {
    return { valid: false, reason: error.message };
  }
}

async function diagnoseDatabaseIssue() {
  console.log('🔍 Diagnosing Database Issue - Designs Disappearing After Refresh');
  console.log('=' .repeat(70));
  
  try {
    // 1. Check database connection
    console.log('\n📡 Testing Database Connection...');
    const { data: testConnection, error: connectionError } = await supabase
      .from('generated_posts')
      .select('count')
      .limit(1);
      
    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError.message);
      return;
    }
    console.log('✅ Database connection successful');
    
    // 2. Check total posts in database
    console.log('\n📊 Checking Total Posts in Database...');
    const { count, error: countError } = await supabase
      .from('generated_posts')
      .select('*', { count: 'exact' })
      .eq('user_id', TEST_USER_ID);
      
    if (countError) {
      console.error('❌ Count query failed:', countError.message);
      return;
    }
    console.log(`📈 Total posts in database for user: ${count || 0}`);
    
    if (!count || count === 0) {
      console.log('⚠️  No posts found in database. This might be the issue!');
      
      // Check if posts exist with different user ID format
      console.log('\n🔍 Checking for posts with MongoDB user ID format...');
      const { data: mongoIdPosts, error: mongoError } = await supabase
        .from('generated_posts')
        .select('user_id, id, created_at')
        .ilike('user_id', 'user_%');
        
      if (mongoIdPosts && mongoIdPosts.length > 0) {
        console.log(`🎯 Found ${mongoIdPosts.length} posts with MongoDB user ID format:`);
        mongoIdPosts.slice(0, 5).forEach(post => {
          console.log(`   - ${post.user_id} (${post.created_at})`);
        });
        console.log('💡 This could be a user ID mapping issue!');
      }
      
      return;
    }
    
    // 3. Get recent posts
    console.log('\n📝 Getting Recent Posts...');
    const { data: posts, error: postsError } = await supabase
      .from('generated_posts')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (postsError) {
      console.error('❌ Posts query failed:', postsError.message);
      return;
    }
    
    console.log(`📋 Found ${posts?.length || 0} recent posts`);
    
    if (!posts || posts.length === 0) {
      console.log('⚠️  No recent posts found');
      return;
    }
    
    // 4. Analyze posts and their images
    console.log('\n🖼️  Analyzing Post Images...');
    let validImages = 0;
    let invalidImages = 0;
    let dataUrls = 0;
    let emptyUrls = 0;
    
    for (let i = 0; i < Math.min(posts.length, 5); i++) {
      const post = posts[i];
      console.log(`\n📌 Post ${i + 1}: ${post.id}`);
      console.log(`   Created: ${post.created_at}`);
      console.log(`   Platform: ${post.platform || 'Not specified'}`);
      console.log(`   Content: ${post.content?.substring(0, 50) || 'No content'}...`);
      
      if (post.image_url) {
        console.log(`   Image URL: ${post.image_url.substring(0, 100)}...`);
        
        if (post.image_url.startsWith('data:')) {
          dataUrls++;
          console.log('   🔸 Type: Data URL (temporary, will disappear on refresh)');
        } else {
          console.log('   🔍 Testing image URL...');
          const urlTest = await testImageUrl(post.image_url);
          if (urlTest.valid) {
            validImages++;
            console.log('   ✅ Image URL is valid');
          } else {
            invalidImages++;
            console.log(`   ❌ Image URL is invalid: ${urlTest.reason}`);
          }
        }
      } else {
        emptyUrls++;
        console.log('   ⚠️  No image URL found');
      }
    }
    
    // 5. Check storage bucket
    console.log('\n🗄️  Checking Storage Bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.error('❌ Storage bucket check failed:', bucketError.message);
    } else {
      console.log('✅ Storage buckets:', buckets?.map(b => b.name).join(', '));
      
      // Check if nevis-storage bucket exists and has files
      const nevisBucket = buckets?.find(b => b.name === 'nevis-storage');
      if (nevisBucket) {
        console.log('📁 Checking nevis-storage bucket contents...');
        const { data: files, error: filesError } = await supabase.storage
          .from('nevis-storage')
          .list('generated-content', { limit: 10 });
          
        if (!filesError && files) {
          console.log(`📄 Found ${files.length} files in storage`);
        }
      }
    }
    
    // 6. Summary and diagnosis
    console.log('\n' + '='.repeat(70));
    console.log('🎯 DIAGNOSIS SUMMARY');
    console.log('='.repeat(70));
    
    console.log(`📊 Database Stats:`);
    console.log(`   Total posts: ${count}`);
    console.log(`   Posts analyzed: ${Math.min(posts.length, 5)}`);
    
    console.log(`\n🖼️  Image Analysis:`);
    console.log(`   Valid images: ${validImages}`);
    console.log(`   Invalid images: ${invalidImages}`);
    console.log(`   Data URLs (temporary): ${dataUrls}`);
    console.log(`   Empty URLs: ${emptyUrls}`);
    
    // Determine the likely issue
    console.log('\n🔬 LIKELY ISSUES:');
    if (dataUrls > 0) {
      console.log('🚨 CRITICAL: Found temporary data URLs in database');
      console.log('   These will disappear on refresh as they\'re not permanent storage');
      console.log('   Solution: Ensure images are uploaded to Supabase Storage');
    }
    
    if (invalidImages > 0) {
      console.log('🚨 CRITICAL: Found invalid image URLs');
      console.log('   These images may have been deleted or never uploaded properly');
      console.log('   Solution: Fix the image upload process');
    }
    
    if (emptyUrls > 0) {
      console.log('⚠️  WARNING: Found posts without image URLs');
      console.log('   Solution: Ensure image URLs are saved properly during generation');
    }
    
    if (count === 0) {
      console.log('🚨 CRITICAL: No posts found for the current user');
      console.log('   Solution: Check user ID mapping between systems');
    }
    
    // Provide specific recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('1. Run image persistence fix to ensure data URLs are uploaded');
    console.log('2. Update the save process to verify image upload before saving post');
    console.log('3. Add retry logic for failed image uploads');
    console.log('4. Implement image URL validation before displaying');
    console.log('5. Consider caching mechanism for generated images');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the diagnostic
diagnoseDatabaseIssue();