/**
 * Test script to verify hashtag generation fix
 */

async function testHashtagGeneration() {
  try {
    console.log('Testing hashtag generation fix...\n');

    // Test the advanced content API
    const response = await fetch('http://localhost:3001/api/advanced-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessType: 'restaurant',
        location: 'New York, NY',
        platform: 'instagram'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data && data.data.hashtags) {
      console.log('\n=== HASHTAG ANALYSIS ===');
      console.log('Generated hashtags:', data.data.hashtags);
      
      // Check for placeholder hashtags
      const placeholderHashtags = [
        '#Food Production', '#LocalBusiness', '#CommunityFavorite', 
        '#SamakiCookies', '#your', '#2025', '#trending', '#viral', 
        '#socialmedia', '#marketing', '#professional', '#local', '#quality'
      ];
      
      const foundPlaceholders = data.data.hashtags.filter(hashtag => 
        placeholderHashtags.includes(hashtag)
      );
      
      if (foundPlaceholders.length > 0) {
        console.log('❌ STILL USING PLACEHOLDER HASHTAGS:', foundPlaceholders);
      } else {
        console.log('✅ NO PLACEHOLDER HASHTAGS FOUND - Fix appears to be working!');
      }
      
      console.log('Total hashtags generated:', data.data.hashtags.length);
    } else {
      console.log('❌ No hashtags found in response');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testHashtagGeneration();
