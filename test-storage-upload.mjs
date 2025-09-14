#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testStorageUpload() {
  console.log('🧪 Testing Storage Upload...');
  
  try {
    // Test 1: List buckets
    console.log('\n1. Testing bucket access...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Bucket access failed:', bucketError);
    } else {
      console.log('✅ Can access buckets:', buckets.map(b => b.name));
    }
    
    // Test 2: Test upload
    console.log('\n2. Testing file upload...');
    const testData = Buffer.from('test file content', 'utf8');
    
    const { data, error } = await supabase.storage
      .from('nevis-storage')
      .upload('public/test-upload.txt', testData, {
        upsert: true,
        contentType: 'text/plain'
      });
      
    if (error) {
      console.error('❌ Upload failed:', {
        message: error.message,
        name: error.name,
        cause: error.cause
      });
      
      if (error.message.includes('row-level security policy')) {
        console.log('\n💡 RLS POLICY BLOCKING UPLOAD!');
        console.log('Run this SQL in Supabase Dashboard > SQL Editor:');
        console.log('');
        console.log('CREATE POLICY "allow_all_operations" ON storage.objects');
        console.log('FOR ALL TO anon, authenticated, service_role');
        console.log('USING (true) WITH CHECK (true);');
      }
    } else {
      console.log('✅ Upload successful!', data);
      
      // Clean up
      await supabase.storage.from('nevis-storage').remove(['public/test-upload.txt']);
      console.log('✅ Test file cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testStorageUpload();