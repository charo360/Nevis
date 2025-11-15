#!/usr/bin/env node

/**
 * Migration Script: Convert Data URLs to Supabase Storage
 * 
 * This script finds all posts with data URLs and migrates them to Supabase Storage.
 * Specifically targets the 2 PanthR brand posts identified in the audit.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Convert data URL to Buffer
 */
function dataUrlToBuffer(dataUrl) {
  try {
    const base64Data = dataUrl.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid data URL format');
    }
    return Buffer.from(base64Data, 'base64');
  } catch (error) {
    console.error('❌ Error converting data URL to buffer:', error.message);
    return null;
  }
}

/**
 * Upload buffer to Supabase Storage with retry logic
 */
async function uploadToSupabase(buffer, postId, retryCount = 3) {
  const fileName = `migrated-${postId}-${Date.now()}.png`;
  const uploadPath = `public/${fileName}`;

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`   📤 Upload attempt ${attempt}/${retryCount}...`);

      const { data, error } = await supabase.storage
        .from('nevis-storage')
        .upload(uploadPath, buffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) {
        console.error(`   ⚠️ Attempt ${attempt} failed:`, error.message);
        
        if (attempt < retryCount) {
          const waitTime = attempt * 1000;
          console.log(`   ⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('nevis-storage')
        .getPublicUrl(uploadPath);

      console.log(`   ✅ Upload successful on attempt ${attempt}`);
      return { success: true, url: publicUrl, path: uploadPath };
      
    } catch (error) {
      console.error(`   ⚠️ Exception on attempt ${attempt}:`, error.message);
      
      if (attempt < retryCount) {
        const waitTime = attempt * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      return { success: false, error: error.message };
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

/**
 * Main migration function
 */
async function migrateDataUrls() {
  console.log('\n🔄 Starting Data URL Migration to Supabase Storage\n');
  console.log('=' .repeat(60));

  // Step 1: Find all posts with data URLs
  console.log('\n📊 Step 1: Finding posts with data URLs...\n');

  const { data: posts, error: fetchError } = await supabase
    .from('generated_posts')
    .select('id, image_url, user_id, brand_profile_id, platform, created_at')
    .like('image_url', 'data:%')
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('❌ Error fetching posts:', fetchError.message);
    process.exit(1);
  }

  if (!posts || posts.length === 0) {
    console.log('✅ No posts with data URLs found! Database is clean.');
    process.exit(0);
  }

  console.log(`📋 Found ${posts.length} post(s) with data URLs:\n`);

  // Display posts
  posts.forEach((post, index) => {
    console.log(`${index + 1}. Post ID: ${post.id}`);
    console.log(`   Platform: ${post.platform || 'unknown'}`);
    console.log(`   Created: ${new Date(post.created_at).toLocaleString()}`);
    console.log(`   Data URL size: ${post.image_url.length.toLocaleString()} characters`);
    console.log();
  });

  // Step 2: Migrate each post
  console.log('=' .repeat(60));
  console.log('\n🔄 Step 2: Migrating posts to Supabase Storage...\n');

  let successCount = 0;
  let failCount = 0;
  const results = [];

  for (const post of posts) {
    console.log(`\n🔸 Migrating Post ${post.id}...`);
    
    try {
      // Convert data URL to buffer
      const buffer = dataUrlToBuffer(post.image_url);
      
      if (!buffer) {
        console.error('   ❌ Failed to convert data URL to buffer');
        failCount++;
        results.push({ id: post.id, success: false, error: 'Buffer conversion failed' });
        continue;
      }

      console.log(`   📦 Buffer size: ${buffer.length.toLocaleString()} bytes`);

      // Upload to Supabase Storage
      const uploadResult = await uploadToSupabase(buffer, post.id);

      if (!uploadResult.success) {
        console.error(`   ❌ Upload failed: ${uploadResult.error}`);
        failCount++;
        results.push({ id: post.id, success: false, error: uploadResult.error });
        continue;
      }

      // Update database record
      console.log('   💾 Updating database record...');
      
      const { error: updateError } = await supabase
        .from('generated_posts')
        .update({ 
          image_url: uploadResult.url,
          image_path: uploadResult.path,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);

      if (updateError) {
        console.error(`   ❌ Database update failed: ${updateError.message}`);
        failCount++;
        results.push({ id: post.id, success: false, error: updateError.message });
        continue;
      }

      console.log(`   ✅ Migration complete!`);
      console.log(`   🔗 New URL: ${uploadResult.url}`);
      successCount++;
      results.push({ 
        id: post.id, 
        success: true, 
        url: uploadResult.url,
        platform: post.platform 
      });

    } catch (error) {
      console.error(`   ❌ Unexpected error:`, error.message);
      failCount++;
      results.push({ id: post.id, success: false, error: error.message });
    }
  }

  // Step 3: Summary
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 Migration Summary\n');
  console.log(`Total posts processed: ${posts.length}`);
  console.log(`✅ Successful migrations: ${successCount}`);
  console.log(`❌ Failed migrations: ${failCount}`);

  if (successCount > 0) {
    console.log('\n✅ Successfully migrated posts:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   - ${r.id} (${r.platform || 'unknown'})`);
      console.log(`     ${r.url}`);
    });
  }

  if (failCount > 0) {
    console.log('\n❌ Failed migrations:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.id}: ${r.error}`);
    });
  }

  // Step 4: Verify
  if (successCount > 0) {
    console.log('\n' + '=' .repeat(60));
    console.log('\n🔍 Step 3: Verifying migration...\n');

    const { data: remainingDataUrls, error: verifyError } = await supabase
      .from('generated_posts')
      .select('id')
      .like('image_url', 'data:%');

    if (verifyError) {
      console.error('⚠️ Verification failed:', verifyError.message);
    } else {
      const remaining = remainingDataUrls?.length || 0;
      if (remaining === 0) {
        console.log('✅ SUCCESS! No data URLs remaining in database.');
        console.log('✅ All images are now stored in Supabase Storage.');
      } else {
        console.log(`⚠️ ${remaining} data URL(s) still remaining in database.`);
        console.log('   Some migrations may have failed. Check errors above.');
      }
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('\n🎉 Migration complete!\n');
}

// Run migration
migrateDataUrls().catch(error => {
  console.error('\n❌ Fatal error during migration:', error);
  process.exit(1);
});
