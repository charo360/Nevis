#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDifferentFolders() {
  console.log('🧪 Testing uploads to different folders...');
  
  const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  
  const tests = [
    'brands/test-brand/designs/test.png',
    'generated-content/test-user/test.png', 
    'images/test.png'
  ];
  
  for (const path of tests) {
    const { error } = await supabase.storage
      .from('nevis-storage')
      .upload(path, pngData, { upsert: true, contentType: 'image/png' });
      
    console.log(`📁 ${path}: ${error ? '❌ FAILED - ' + error.message : '✅ SUCCESS'}`);
    
    if (!error) {
      await supabase.storage.from('nevis-storage').remove([path]);
    }
  }
  
  console.log('\n🎉 All folder tests completed!');
}

testDifferentFolders();