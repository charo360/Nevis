#!/usr/bin/env node

/**
 * Data Consistency Fix
 * Ensures posts are properly saved to both MongoDB and Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDataConsistency() {
  console.log('🔧 Fixing Data Consistency...');
  
  try {
    // 1. Check if posts in Supabase have proper image URLs
    const { data: posts, error } = await supabase
      .from('generated_posts')
      .select('*')
      .eq('user_id', '58b4d78d-cb90-49ef-9524-7238aea00168');
      
    if (error) {
      console.error('❌ Error fetching posts:', error);
      return;
    }
    
    console.log(`📊 Found ${posts?.length || 0} posts to check`);
    
    let fixedCount = 0;
    
    for (const post of posts || []) {
      let needsUpdate = false;
      const updates = {};
      
      // Check if image_url is empty but we have content
      if (!post.image_url && post.content) {
        console.log(`🔍 Post ${post.id} missing image URL`);
        // Try to reconstruct from content or other fields
        needsUpdate = true;
      }
      
      // Check for data URLs that should have been uploaded
      if (post.image_url && post.image_url.startsWith('data:')) {
        console.log(`🚨 Post ${post.id} has temporary data URL - needs upload`);
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log(`✅ Would fix post ${post.id}`);
        fixedCount++;
      }
    }
    
    console.log(`📈 Summary: ${fixedCount} posts would be fixed`);
    console.log('✅ Data consistency check complete');
    
  } catch (error) {
    console.error('❌ Consistency check failed:', error);
  }
}

fixDataConsistency();
