#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_USER_ID = 'dd9f93dc-08c2-4086-9359-687fa6c5897d'; // sm1761a@american.edu

async function verifyPanthRBrandData() {
  console.log('🔍 Verifying PanthR Brand Data & Image Persistence');
  console.log('User:', 'sm1761a@american.edu');
  console.log('User ID:', TEST_USER_ID);
  console.log('='.repeat(70));

  // 1. Find PanthR brand profile
  console.log('\n1️⃣ Checking Brand Profiles...');
  const { data: brands, error: brandsError } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('user_id', TEST_USER_ID);

  if (brandsError) {
    console.error('❌ Error fetching brands:', brandsError);
    return;
  }

  console.log(`   Found ${brands?.length || 0} brand(s)`);
  
  const panthRBrand = brands?.find(b => 
    b.name?.toLowerCase().includes('panthr') || 
    b.business_name?.toLowerCase().includes('panthr')
  );

  if (!panthRBrand) {
    console.log('   ⚠️  PanthR brand not found. Available brands:');
    brands?.forEach(b => {
      console.log(`      - ${b.name || b.business_name} (ID: ${b.id})`);
    });
    
    // Use first brand if PanthR not found
    if (brands && brands.length > 0) {
      console.log(`\n   Using first brand: ${brands[0].name || brands[0].business_name}`);
      await checkBrandImages(brands[0]);
    }
    return;
  }

  console.log(`   ✅ Found PanthR brand:`);
  console.log(`      ID: ${panthRBrand.id}`);
  console.log(`      Name: ${panthRBrand.name}`);
  console.log(`      Business Name: ${panthRBrand.business_name}`);
  console.log(`      Created: ${new Date(panthRBrand.created_at).toLocaleString()}`);

  await checkBrandImages(panthRBrand);
}

async function checkBrandImages(brand) {
  console.log(`\n2️⃣ Checking Generated Posts for "${brand.name || brand.business_name}"...`);
  
  const { data: posts, error: postsError } = await supabase
    .from('generated_posts')
    .select('*')
    .eq('brand_profile_id', brand.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (postsError) {
    console.error('   ❌ Error fetching posts:', postsError);
    return;
  }

  console.log(`   Found ${posts?.length || 0} generated post(s)`);

  if (!posts || posts.length === 0) {
    console.log('   ⚠️  No posts found for this brand');
    return;
  }

  console.log('\n3️⃣ Analyzing Post Data:');
  console.log('   ' + '='.repeat(66));

  posts.forEach((post, index) => {
    const hasImage = !!(post.image_url || post.imageUrl);
    const imageUrl = post.image_url || post.imageUrl;
    const isSupabaseUrl = imageUrl?.includes('supabase.co');
    const createdAt = new Date(post.created_at).toLocaleString();
    
    console.log(`\n   Post ${index + 1}:`);
    console.log(`      ID: ${post.id}`);
    console.log(`      Created: ${createdAt}`);
    console.log(`      Platform: ${post.platform || 'N/A'}`);
    console.log(`      AI Model: ${post.ai_model || post.aiModel || 'N/A'}`);
    console.log(`      Has Image: ${hasImage ? '✅ YES' : '❌ NO'}`);
    
    if (hasImage) {
      console.log(`      Image URL: ${imageUrl?.substring(0, 80)}...`);
      console.log(`      Storage: ${isSupabaseUrl ? '✅ Supabase Storage' : '⚠️  External URL'}`);
      
      // Check if it's a data URL (not saved to storage)
      if (imageUrl?.startsWith('data:')) {
        console.log(`      ⚠️  WARNING: Image is data URL (not persisted to storage)`);
      }
    }
    
    console.log(`      Content: ${post.content?.substring(0, 50) || 'N/A'}...`);
  });

  // 4. Check for any images in Supabase Storage
  console.log('\n4️⃣ Checking Supabase Storage Buckets...');
  
  const { data: buckets, error: bucketsError } = await supabase
    .storage
    .listBuckets();

  if (bucketsError) {
    console.error('   ❌ Error listing buckets:', bucketsError);
    return;
  }

  console.log(`   Available buckets: ${buckets.map(b => b.name).join(', ')}`);

  // Check images bucket
  for (const bucketName of ['images', 'image', 'nevis-storage']) {
    const { data: files, error: filesError } = await supabase
      .storage
      .from(bucketName)
      .list('', { limit: 100 });

    if (!filesError && files) {
      console.log(`\n   📁 Bucket: ${bucketName}`);
      console.log(`      Total files: ${files.length}`);
      
      // Filter files for this brand/user
      const brandFiles = files.filter(f => 
        f.name.includes(brand.id) || 
        f.name.includes(TEST_USER_ID) ||
        f.name.toLowerCase().includes('panthr')
      );
      
      if (brandFiles.length > 0) {
        console.log(`      Files for this brand: ${brandFiles.length}`);
        brandFiles.slice(0, 5).forEach(file => {
          console.log(`         - ${file.name} (${(file.metadata?.size / 1024).toFixed(2)} KB)`);
        });
      } else {
        console.log(`      ⚠️  No files found for this brand`);
      }
    }
  }

  // 5. Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY:');
  console.log('='.repeat(70));
  
  const postsWithImages = posts.filter(p => p.image_url || p.imageUrl);
  const postsWithSupabaseUrls = postsWithImages.filter(p => 
    (p.image_url || p.imageUrl)?.includes('supabase.co')
  );
  const postsWithDataUrls = postsWithImages.filter(p => 
    (p.image_url || p.imageUrl)?.startsWith('data:')
  );

  console.log(`Total Posts: ${posts.length}`);
  console.log(`Posts with Images: ${postsWithImages.length} (${((postsWithImages.length / posts.length) * 100).toFixed(1)}%)`);
  console.log(`Images in Supabase Storage: ${postsWithSupabaseUrls.length} ✅`);
  console.log(`Images as Data URLs: ${postsWithDataUrls.length} ${postsWithDataUrls.length > 0 ? '⚠️' : ''}`);
  console.log(`Images with External URLs: ${postsWithImages.length - postsWithSupabaseUrls.length - postsWithDataUrls.length}`);

  if (postsWithDataUrls.length > 0) {
    console.log('\n⚠️  WARNING: Some images are stored as data URLs and NOT persisted to Supabase Storage!');
    console.log('   This can cause:');
    console.log('   - Large database size');
    console.log('   - Slow query performance');
    console.log('   - Image not accessible after page refresh');
  }

  if (postsWithSupabaseUrls.length === postsWithImages.length && postsWithImages.length > 0) {
    console.log('\n✅ ALL IMAGES PROPERLY SAVED TO SUPABASE STORAGE!');
  }

  console.log('\n' + '='.repeat(70));
}

verifyPanthRBrandData();
