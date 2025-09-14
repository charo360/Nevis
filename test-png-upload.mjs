#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPngUpload() {
  console.log('🧪 Testing PNG Upload...');
  
  try {
    // Create a simple 1x1 transparent PNG
    const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    
    console.log('📤 Attempting PNG upload to nevis-storage/public/...');
    
    const { data, error } = await supabase.storage
      .from('nevis-storage')
      .upload('public/test-image.png', pngData, {
        upsert: true,
        contentType: 'image/png'
      });
      
    if (error) {
      console.error('❌ PNG Upload failed:', {
        message: error.message,
        name: error.name
      });
      
      if (error.message.includes('row-level security policy')) {
        console.log('\n🚨 RLS POLICY IS STILL BLOCKING!');
        console.log('Your storage policies need to be updated.');
        console.log('\nGo to Supabase Dashboard > Storage > Policies');
        console.log('Make sure you have an INSERT policy that allows PNG files');
      } else if (error.message.includes('mime type') || error.message.includes('not supported')) {
        console.log('\n⚠️  MIME TYPE RESTRICTION');
        console.log('Your policies only allow JPG but app uploads PNG');
        console.log('Update your policies to include PNG files');
      }
    } else {
      console.log('✅ PNG Upload successful!', data);
      
      // Test reading the file
      const { data: files } = await supabase.storage
        .from('nevis-storage')
        .list('public');
        
      console.log('📁 Files in public folder:', files?.map(f => f.name) || []);
      
      // Clean up
      await supabase.storage.from('nevis-storage').remove(['public/test-image.png']);
      console.log('🧹 Test file cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPngUpload();