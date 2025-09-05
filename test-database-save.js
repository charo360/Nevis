/**
 * Test script to verify database saving of multiple posts
 * This simulates the issue where only the first post is saved to database
 */

const testPosts = [
  {
    id: 'temp-id-1',
    content: 'Test post 1 content',
    hashtags: ['#test1', '#cookies'],
    platform: 'instagram',
    postType: 'post',
    catchyWords: 'Delicious Cookies',
    subheadline: 'Fresh baked daily',
    callToAction: 'Order now!'
  },
  {
    id: 'temp-id-2', 
    content: 'Test post 2 content',
    hashtags: ['#test2', '#bakery'],
    platform: 'instagram',
    postType: 'post',
    catchyWords: 'Sweet Treats',
    subheadline: 'Made with love',
    callToAction: 'Visit us today!'
  },
  {
    id: 'temp-id-3',
    content: 'Test post 3 content', 
    hashtags: ['#test3', '#desserts'],
    platform: 'instagram',
    postType: 'post',
    catchyWords: 'Amazing Desserts',
    subheadline: 'Perfect for any occasion',
    callToAction: 'Try them now!'
  }
];

async function testDatabaseSaving() {
  console.log('🔄 Testing database saving of multiple posts...');
  
  const userId = 'user_1756957152418_ckxml80fg';
  const brandProfileId = '68b90a62584b3e1311db4317';
  
  const results = [];
  
  for (let i = 0; i < testPosts.length; i++) {
    const post = testPosts[i];
    console.log(`\n📝 Saving post ${i + 1}/${testPosts.length}: ${post.catchyWords}`);
    
    try {
      const response = await fetch('http://localhost:3001/api/generated-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post: {
            ...post,
            userId,
            brandProfileId,
            content: {
              text: post.content,
              hashtags: post.hashtags,
            },
            metadata: {
              businessType: 'bakery',
              aiModel: 'test',
            },
            status: 'generated',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          userId,
          brandProfileId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Post ${i + 1} saved successfully with ID: ${result.id}`);
        results.push({ success: true, id: result.id, post: post.catchyWords });
      } else {
        const error = await response.text();
        console.log(`❌ Post ${i + 1} failed to save: ${response.status} - ${error}`);
        results.push({ success: false, error: `${response.status} - ${error}`, post: post.catchyWords });
      }
    } catch (error) {
      console.log(`❌ Post ${i + 1} error: ${error.message}`);
      results.push({ success: false, error: error.message, post: post.catchyWords });
    }
    
    // Small delay between saves
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Results Summary:');
  console.log('==================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful saves: ${successful.length}/${results.length}`);
  console.log(`❌ Failed saves: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Successfully saved posts:');
    successful.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.post} (ID: ${result.id})`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed posts:');
    failed.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.post} - ${result.error}`);
    });
  }
  
  // Now test loading the posts back
  console.log('\n🔄 Testing post loading...');
  try {
    const loadResponse = await fetch(`http://localhost:3001/api/generated-posts/brand/${brandProfileId}?userId=${userId}&limit=50`);
    if (loadResponse.ok) {
      const loadedPosts = await loadResponse.json();
      console.log(`✅ Loaded ${loadedPosts.length} posts from database`);
      
      // Check if our test posts are there
      const testPostIds = successful.map(r => r.id);
      const foundPosts = loadedPosts.filter(p => testPostIds.includes(p.id));
      console.log(`🔍 Found ${foundPosts.length}/${successful.length} of our test posts in database`);
      
      if (foundPosts.length < successful.length) {
        console.log('⚠️  Some posts were saved but not loaded back - this indicates the loading issue!');
      }
    } else {
      console.log(`❌ Failed to load posts: ${loadResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Error loading posts: ${error.message}`);
  }
}

// Run the test
testDatabaseSaving().catch(console.error);
