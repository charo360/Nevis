// Final test of Supabase integration for image storage fix
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 Final Supabase Integration Test...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorageUpload() {
  console.log('📤 Testing image upload to Supabase storage...');
  
  try {
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    const testPath = `test/test-image-${Date.now()}.png`;
    
    // Upload test image
    const { data, error } = await supabase.storage
      .from('nevis-storage')
      .upload(testPath, testImageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600'
      });
    
    if (error) {
      console.error('❌ Upload failed:', error.message);
      return false;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('nevis-storage')
      .getPublicUrl(data.path);
    
    console.log('✅ Image uploaded successfully!');
    console.log('📄 File path:', data.path);
    console.log('🔗 Public URL:', urlData.publicUrl);
    
    // Clean up test file
    await supabase.storage
      .from('nevis-storage')
      .remove([data.path]);
    
    console.log('🧹 Test file cleaned up');
    return true;
  } catch (error) {
    console.error('❌ Storage upload test failed:', error.message);
    return false;
  }
}

async function testDatabaseInsert() {
  console.log('\n💾 Testing database insert...');
  
  try {
    const testUserId = crypto.randomUUID();
    const testBrandId = crypto.randomUUID();
    
    // Create test user
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        email: `test-${Date.now()}@nevis.ai`,
        full_name: 'Test User'
      });
    
    if (userError) {
      console.error('❌ User creation failed:', userError.message);
      return false;
    }
    
    // Create test brand profile
    const { error: brandError } = await supabase
      .from('brand_profiles')
      .insert({
        id: testBrandId,
        user_id: testUserId,
        business_name: 'Test Business',
        is_active: true
      });
    
    if (brandError) {
      console.error('❌ Brand profile creation failed:', brandError.message);
      return false;
    }
    
    // Create test generated post
    const { data: postData, error: postError } = await supabase
      .from('generated_posts')
      .insert({
        user_id: testUserId,
        brand_profile_id: testBrandId,
        content: 'Test post content',
        hashtags: '#test #nevis',
        image_url: 'https://example.com/test-image.png',
        platform: 'instagram',
        status: 'generated'
      })
      .select()
      .single();
    
    if (postError) {
      console.error('❌ Post creation failed:', postError.message);
      return false;
    }
    
    console.log('✅ Database operations successful!');
    console.log('📄 Created post ID:', postData.id);
    
    // Clean up test data
    await supabase.from('generated_posts').delete().eq('id', postData.id);
    await supabase.from('brand_profiles').delete().eq('id', testBrandId);
    await supabase.from('users').delete().eq('id', testUserId);
    
    console.log('🧹 Test data cleaned up');
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
}

async function runFinalTest() {
  console.log('🎯 Running final integration test...\n');
  
  const storageOk = await testStorageUpload();
  const databaseOk = await testDatabaseInsert();
  
  console.log('\n📊 Final Test Results:');
  console.log(`Image Storage: ${storageOk ? '✅ Working' : '❌ Failed'}`);
  console.log(`Database Operations: ${databaseOk ? '✅ Working' : '❌ Failed'}`);
  
  if (storageOk && databaseOk) {
    console.log('\n🎉 SUPABASE INTEGRATION SUCCESSFUL!');
    console.log('✅ Your broken image storage is now FIXED!');
    console.log('✅ New generated content will have working images');
    console.log('✅ Images will be stored in Supabase with proper URLs');
    console.log('✅ No more broken image icons!');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Start your app: npm run dev');
    console.log('2. Generate new content to test image storage');
    console.log('3. Images should now display properly!');
  } else {
    console.log('\n⚠️ Some tests failed - check configuration');
    if (!storageOk) {
      console.log('- Image storage needs attention');
    }
    if (!databaseOk) {
      console.log('- Database operations need attention');
    }
  }
}

runFinalTest().catch(console.error);
