/**
 * Test the UI flow by checking what happens in the browser
 */

const testUIFlowDebug = async () => {
  console.log('🔍 Testing UI Flow Debug...\n');

  try {
    console.log('🎯 Step 1: Testing Revo 1.0 service health...');
    
    // Test the Revo 1.0 service
    const healthResponse = await fetch('http://localhost:3001/api/test-revo-1.0');
    
    if (healthResponse.ok) {
      const healthResult = await healthResponse.json();
      console.log('✅ Revo 1.0 service health check passed');
      console.log('Proxy enabled:', healthResult.data?.proxyEnabled);
      console.log('Headline test:', healthResult.data?.headline?.headline || 'No headline');
    } else {
      console.log('❌ Revo 1.0 service health check failed');
    }
    
    console.log('\n🎯 Step 2: Testing generated posts API...');
    
    // Check if there are any existing posts
    const postsResponse = await fetch('http://localhost:3001/api/generated-posts');
    
    if (postsResponse.ok) {
      const postsResult = await postsResponse.json();
      console.log('✅ Generated posts API accessible');
      console.log('Posts count:', postsResult.data?.length || 0);
      
      if (postsResult.data && postsResult.data.length > 0) {
        console.log('\n📝 ANALYZING EXISTING POSTS:');
        console.log('='.repeat(60));
        
        // Analyze the first few posts
        const postsToAnalyze = postsResult.data.slice(0, 3);
        
        postsToAnalyze.forEach((post, index) => {
          console.log(`\n--- Post ${index + 1} ---`);
          console.log('ID:', post.id);
          console.log('Date:', post.date);
          console.log('Content Length:', (post.content || '').length);
          console.log('Has Hashtags:', !!post.hashtags);
          console.log('Variants Count:', post.variants?.length || 0);
          
          if (post.variants && post.variants.length > 0) {
            post.variants.forEach((variant, vIndex) => {
              console.log(`  Variant ${vIndex + 1}:`);
              console.log(`    Platform: ${variant.platform}`);
              console.log(`    Has Image URL: ${!!variant.imageUrl}`);
              console.log(`    Image URL Length: ${(variant.imageUrl || '').length}`);
              
              if (variant.imageUrl) {
                if (variant.imageUrl.startsWith('data:')) {
                  console.log(`    ✅ Image Type: Base64 Data URL`);
                } else if (variant.imageUrl.startsWith('http')) {
                  console.log(`    ✅ Image Type: HTTP URL`);
                  console.log(`    Image URL: ${variant.imageUrl}`);
                } else if (variant.imageUrl.includes('[') && variant.imageUrl.includes(']')) {
                  console.log(`    ⚠️  Image Type: Placeholder/Compressed`);
                  console.log(`    Placeholder: ${variant.imageUrl}`);
                } else {
                  console.log(`    ❓ Image Type: Unknown`);
                  console.log(`    Preview: ${variant.imageUrl.substring(0, 50)}...`);
                }
              } else {
                console.log(`    ❌ Image URL: Missing`);
              }
            });
          } else {
            console.log('  ❌ No variants found');
          }
        });
        
        console.log('\n🔍 POSTS ANALYSIS SUMMARY:');
        console.log('='.repeat(60));
        
        const totalPosts = postsResult.data.length;
        const postsWithContent = postsResult.data.filter(p => p.content && p.content.length > 0).length;
        const postsWithVariants = postsResult.data.filter(p => p.variants && p.variants.length > 0).length;
        const postsWithImages = postsResult.data.filter(p => 
          p.variants && p.variants.some(v => v.imageUrl && v.imageUrl.length > 0)
        ).length;
        const postsWithDataUrls = postsResult.data.filter(p => 
          p.variants && p.variants.some(v => v.imageUrl && v.imageUrl.startsWith('data:'))
        ).length;
        const postsWithHttpUrls = postsResult.data.filter(p => 
          p.variants && p.variants.some(v => v.imageUrl && v.imageUrl.startsWith('http'))
        ).length;
        const postsWithPlaceholders = postsResult.data.filter(p => 
          p.variants && p.variants.some(v => v.imageUrl && v.imageUrl.includes('[') && v.imageUrl.includes(']'))
        ).length;
        
        console.log(`Total Posts: ${totalPosts}`);
        console.log(`Posts with Content: ${postsWithContent} (${Math.round(postsWithContent/totalPosts*100)}%)`);
        console.log(`Posts with Variants: ${postsWithVariants} (${Math.round(postsWithVariants/totalPosts*100)}%)`);
        console.log(`Posts with Images: ${postsWithImages} (${Math.round(postsWithImages/totalPosts*100)}%)`);
        console.log(`Posts with Data URLs: ${postsWithDataUrls} (${Math.round(postsWithDataUrls/totalPosts*100)}%)`);
        console.log(`Posts with HTTP URLs: ${postsWithHttpUrls} (${Math.round(postsWithHttpUrls/totalPosts*100)}%)`);
        console.log(`Posts with Placeholders: ${postsWithPlaceholders} (${Math.round(postsWithPlaceholders/totalPosts*100)}%)`);
        
        console.log('\n💡 DIAGNOSIS:');
        console.log('='.repeat(60));
        
        if (postsWithImages === 0) {
          console.log('❌ CRITICAL ISSUE: No posts have images at all!');
          console.log('🔧 This suggests image generation is completely broken.');
        } else if (postsWithDataUrls > 0 && postsWithHttpUrls === 0) {
          console.log('⚠️  ISSUE: Images are generated as data URLs but not being uploaded to storage.');
          console.log('🔧 Check the image upload/persistence service.');
        } else if (postsWithPlaceholders > 0) {
          console.log('⚠️  ISSUE: Images are being replaced with placeholders after generation.');
          console.log('🔧 Check the image compression/storage logic.');
        } else if (postsWithHttpUrls > 0) {
          console.log('✅ GOOD: Images are being generated and uploaded to storage.');
          console.log('💡 If UI shows no images, check the frontend display logic.');
        }
        
      } else {
        console.log('📝 No existing posts found in database');
        console.log('💡 Generate some content through the UI first, then run this test again');
      }
      
    } else {
      console.log('❌ Generated posts API not accessible');
    }
    
    console.log('\n🎯 Step 3: Testing system health...');
    
    // Check system health
    const systemHealthResponse = await fetch('http://localhost:3001/api/system-health');
    
    if (systemHealthResponse.ok) {
      const systemHealth = await systemHealthResponse.json();
      console.log('✅ System health check passed');
      console.log('Database:', systemHealth.database ? '✅ Connected' : '❌ Disconnected');
      console.log('AI Services:', systemHealth.aiServices ? '✅ Available' : '❌ Unavailable');
    } else {
      console.log('❌ System health check failed');
    }
    
    console.log('\n📋 RECOMMENDATIONS:');
    console.log('='.repeat(60));
    console.log('1. 🌐 Open http://localhost:3001/quick-content in your browser');
    console.log('2. 🎯 Generate a new post and watch the Network tab in DevTools');
    console.log('3. 🔍 Check if the API calls return posts with imageUrl data');
    console.log('4. 🖼️  Inspect the PostCard component to see if images are being displayed');
    console.log('5. 📊 Run this test again after generating content to see the data');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testUIFlowDebug();
