#!/usr/bin/env node

/**
 * Create Supabase Storage Policies Programmatically
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createStoragePolicies() {
  console.log('🔧 Creating Supabase Storage Policies...');
  console.log('=' + '='.repeat(50));
  
  try {
    // First, let's try to create policies using RPC calls
    console.log('\n📋 Attempting to create storage policies...');
    
    // Policy 1: Allow service role full access to objects
    const policy1 = `
      CREATE POLICY service_role_all_access ON storage.objects
      FOR ALL 
      TO service_role
      USING (true)
      WITH CHECK (true);
    `;
    
    // Policy 2: Allow uploads to nevis-storage bucket
    const policy2 = `
      CREATE POLICY allow_upload_to_nevis_storage ON storage.objects
      FOR INSERT 
      TO anon, authenticated, service_role
      WITH CHECK (bucket_id = 'nevis-storage');
    `;
    
    // Policy 3: Allow reads from nevis-storage bucket
    const policy3 = `
      CREATE POLICY allow_read_from_nevis_storage ON storage.objects
      FOR SELECT 
      TO anon, authenticated, service_role
      USING (bucket_id = 'nevis-storage');
    `;
    
    // Policy 4: Service role access to buckets
    const policy4 = `
      CREATE POLICY service_role_buckets_access ON storage.buckets
      FOR ALL 
      TO service_role
      USING (true)
      WITH CHECK (true);
    `;
    
    console.log('\n🎯 POLICIES TO CREATE:');
    console.log('You need to manually create these policies in Supabase Dashboard:');
    console.log('\n--- STORAGE.OBJECTS POLICIES ---');
    console.log('1. service_role_all_access (ALL operations, service_role, true)');
    console.log('2. allow_upload_to_nevis_storage (INSERT, anon+authenticated+service_role, bucket_id = \\'nevis-storage\\')');
    console.log('3. allow_read_from_nevis_storage (SELECT, anon+authenticated+service_role, bucket_id = \\'nevis-storage\\')');
    
    console.log('\n--- STORAGE.BUCKETS POLICIES ---');
    console.log('4. service_role_buckets_access (ALL operations, service_role, true)');
    
    // Test current bucket access
    console.log('\n🧪 Testing current bucket access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Cannot list buckets:', bucketsError.message);
    } else {
      console.log('✅ Can list buckets:', buckets.length);
    }
    
    // Test current upload capability
    console.log('\n🧪 Testing upload capability...');
    const testData = Buffer.from('test', 'utf8');
    const { data: uploadTest, error: uploadError } = await supabase.storage
      .from('nevis-storage')
      .upload('test/policy-test.txt', testData, {
        upsert: true
      });
      
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message);
      if (uploadError.message.includes('row-level security policy')) {
        console.log('\n💡 SOLUTION: You need to create the INSERT policy manually!');
        console.log('Go to Supabase Dashboard > Storage > Policies');
        console.log('Add INSERT policy: allow_upload_to_nevis_storage');
        console.log('Target roles: anon, authenticated, service_role');
        console.log('Policy definition: bucket_id = \\'nevis-storage\\'');
      }
    } else {
      console.log('✅ Upload test successful!');
      
      // Clean up test file
      await supabase.storage
        .from('nevis-storage')
        .remove(['test/policy-test.txt']);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createStoragePolicies();