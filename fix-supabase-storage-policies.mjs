#!/usr/bin/env node

/**
 * Fix Supabase Storage RLS Policy Issues
 * This script will help fix the row-level security policy errors in Supabase storage
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixStoragePolicies() {
  console.log('🔧 Fixing Supabase Storage RLS Policies...');
  console.log('=' + '='.repeat(50));
  
  try {
    // First, let's check existing buckets
    console.log('\n📊 Checking existing storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return;
    }
    
    console.log(`✅ Found ${buckets?.length || 0} existing buckets:`);
    buckets?.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    // Check if our main bucket exists
    const nevisStorageBucket = buckets?.find(b => b.name === 'nevis-storage');
    
    if (!nevisStorageBucket) {
      console.log('\n📦 Creating nevis-storage bucket...');
      
      // Create the bucket using the service role client
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('nevis-storage', {
        public: true,
        allowedMimeTypes: ['image/*', 'application/pdf'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError.message);
        
        // If it's an RLS policy error, we need to check the policies
        if (createError.message.includes('row-level security policy')) {
          console.log('\n🔍 RLS Policy issue detected. Let me check the current policies...');
          
          // Try to get storage policies (this might fail if we don't have access)
          try {
            const { data: policies, error: policyError } = await supabase
              .from('storage.buckets')
              .select('*')
              .limit(1);
              
            if (policyError) {
              console.log('⚠️  Cannot access storage.buckets table directly.');
              console.log('\n💡 SOLUTION NEEDED:');
              console.log('You need to update your Supabase storage policies. Here\'s what to do:');
              console.log('\n1. Go to your Supabase dashboard');
              console.log('2. Navigate to Storage > Policies');
              console.log('3. Add these policies for the storage.buckets table:');
              console.log('\n   Policy 1: Allow service role to create buckets');
              console.log('   - Name: service_role_create_buckets');
              console.log('   - Operation: INSERT');
              console.log('   - Target roles: service_role');
              console.log('   - Policy: ((auth.role() = \'service_role\'::text))');
              console.log('\n   Policy 2: Allow service role to read buckets');
              console.log('   - Name: service_role_read_buckets');
              console.log('   - Operation: SELECT');
              console.log('   - Target roles: service_role');
              console.log('   - Policy: ((auth.role() = \'service_role\'::text))');
            } else {
              console.log('✅ Can access storage.buckets table');
            }
          } catch (e) {
            console.log('⚠️  Storage policies need to be configured manually in Supabase dashboard');
          }
        }
      } else {
        console.log('✅ Successfully created nevis-storage bucket');
      }
    } else {
      console.log('✅ nevis-storage bucket already exists');
    }
    
    // Test basic storage operations
    console.log('\n🧪 Testing storage operations...');
    
    // Try to list files in the nevis-storage bucket
    const { data: files, error: listError } = await supabase.storage
      .from('nevis-storage')
      .list('', { limit: 1 });
      
    if (listError) {
      console.error('❌ Error listing files:', listError.message);
      
      if (listError.message.includes('row-level security policy')) {
        console.log('\n💡 STORAGE OBJECT POLICIES NEEDED:');
        console.log('You also need to configure storage object policies:');
        console.log('\n1. Go to Supabase dashboard > Storage > Policies');
        console.log('2. Click on "storage.objects" tab');
        console.log('3. Add these policies:');
        console.log('\n   Policy 1: Allow service role full access');
        console.log('   - Name: service_role_objects_access');
        console.log('   - Operations: ALL');
        console.log('   - Target roles: service_role');
        console.log('   - Policy: ((auth.role() = \'service_role\'::text))');
        console.log('\n   Policy 2: Allow authenticated users to upload');
        console.log('   - Name: authenticated_upload');
        console.log('   - Operation: INSERT');
        console.log('   - Target roles: authenticated');
        console.log('   - Policy: ((auth.role() = \'authenticated\'::text))');
        console.log('\n   Policy 3: Allow public read access');
        console.log('   - Name: public_read');
        console.log('   - Operation: SELECT');
        console.log('   - Target roles: anon, authenticated');
        console.log('   - Policy: (bucket_id = \'nevis-storage\'::text)');
      }
    } else {
      console.log('✅ Can list files in storage');
      console.log(`📁 Found ${files?.length || 0} files in nevis-storage bucket`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 SUMMARY AND NEXT STEPS');
    console.log('='.repeat(50));
    
    console.log('\nTo fix the storage RLS policy error, you need to:');
    console.log('\n1. Open your Supabase dashboard');
    console.log('2. Go to Storage > Policies');
    console.log('3. Make sure you have the policies mentioned above');
    console.log('4. Restart your development server');
    console.log('\nAlternatively, you can disable RLS for storage temporarily:');
    console.log('- Go to SQL Editor in Supabase dashboard');
    console.log('- Run: ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;');
    console.log('- Run: ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;');
    console.log('- ⚠️  WARNING: This removes security, only do this for development!');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    console.log('\n💡 Make sure your SUPABASE_SERVICE_ROLE_KEY is correctly set in .env.local');
  }
}

fixStoragePolicies();