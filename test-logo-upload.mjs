#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testLogoUpload() {
  console.log('🧪 Testing Logo Upload Processing...');
  
  try {
    // Create a simple 1x1 logo image (base64 data URL)
    const logoDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    // Convert to buffer (same process as API)
    const base64Data = logoDataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    console.log('📤 Testing direct logo upload to Supabase...');
    
    const uploadPath = `brands/test-user/logos/test-brand-${Date.now()}.png`;
    
    const { data, error } = await supabase.storage
      .from('nevis-storage')
      .upload(uploadPath, buffer, {
        contentType: 'image/png',
        upsert: true
      });
      
    if (error) {
      console.error('❌ Logo upload test failed:', error);
      return;
    }
    
    console.log('✅ Logo upload test successful:', data);
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('nevis-storage')
      .getPublicUrl(uploadPath);
      
    console.log('🌐 Logo public URL:', publicUrl);
    
    // Test if URL is accessible
    try {
      const response = await fetch(publicUrl);
      console.log(`🔍 URL accessibility test: ${response.status} ${response.statusText}`);
    } catch (urlError) {
      console.log('⚠️  URL test failed:', urlError.message);
    }
    
    // Clean up test file
    await supabase.storage.from('nevis-storage').remove([uploadPath]);
    console.log('🧹 Test logo cleaned up');
    
    console.log('\n✅ Logo upload functionality is working correctly!');
    console.log('💡 Now test creating/updating a brand profile with a logo.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLogoUpload();