// Test business relevance filtering logic
function isHashtagRelevantToBusiness(hashtag, businessType) {
  const businessKeywords = {
    restaurant: ['food', 'eat', 'chef', 'recipe', 'cook', 'dining', 'fresh', 'local', 'organic'],
    fitness: ['fitness', 'workout', 'gym', 'health', 'strong', 'training', 'exercise', 'wellness'],
    technology: ['tech', 'ai', 'digital', 'innovation', 'software', 'app', 'data', 'automation'],
    healthcare: ['health', 'medical', 'wellness', 'care', 'treatment', 'medicine', 'therapy'],
    retail: ['shopping', 'fashion', 'style', 'deals', 'sale', 'brand', 'quality', 'design']
  };
  
  const keywords = businessKeywords[businessType.toLowerCase()] || [];
  const hashtagLower = hashtag.toLowerCase().replace('#', '');
  
  return keywords.some(keyword => 
    hashtagLower.includes(keyword) || keyword.includes(hashtagLower)
  );
}

function getplatformOptimizedHashtags(hashtags, platform) {
  const platformLimits = {
    instagram: 10,
    twitter: 2,
    linkedin: 5,
    facebook: 3,
  };
  
  const limit = platformLimits[platform.toLowerCase()] || 5;
  return hashtags.slice(0, limit);
}

async function testFullIntegration() {
  console.log('🧪 Testing Complete Trending Hashtags Integration\n');
  
  try {
    // Test different RSS categories
    const categories = ['tech', 'business', 'general'];
    const businessTypes = ['technology', 'restaurant', 'fitness', 'healthcare'];
    
    for (const category of categories) {
      console.log(`📰 Testing ${category} news category:`);
      
      const response = await fetch(`http://localhost:3001/api/rss-data?category=${category}&limit=20`);
      if (!response.ok) {
        console.log(`   ❌ Failed to fetch ${category} data`);
        continue;
      }
      
      const rssData = await response.json();
      console.log(`   ✅ Got ${rssData.hashtags?.length || 0} raw hashtags`);
      
      // Test business relevance filtering
      businessTypes.forEach(businessType => {
        const relevantHashtags = rssData.hashtags?.filter(hashtag => 
          isHashtagRelevantToBusiness(hashtag, businessType)
        ) || [];
        
        if (relevantHashtags.length > 0) {
          console.log(`   🏢 ${businessType}: Found ${relevantHashtags.length} relevant hashtags:`, relevantHashtags.slice(0, 5));
          
          // Test platform optimization
          const instagramTags = getplatformOptimizedHashtags(relevantHashtags, 'instagram');
          const twitterTags = getplatformOptimizedHashtags(relevantHashtags, 'twitter');
          const linkedinTags = getplatformOptimizedHashtags(relevantHashtags, 'linkedin');
          
          console.log(`      📱 Instagram (${instagramTags.length}):`, instagramTags);
          console.log(`      🐦 Twitter (${twitterTags.length}):`, twitterTags);
          console.log(`      💼 LinkedIn (${linkedinTags.length}):`, linkedinTags);
        } else {
          console.log(`   🏢 ${businessType}: No relevant hashtags found, would use fallback`);
        }
      });
      
      console.log(''); // Empty line
    }
    
    // Test fallback scenarios
    console.log('🔄 Testing fallback scenario (simulated API failure):');
    console.log('   📋 Would return curated hashtags for each business type:');
    
    const fallbackExamples = {
      restaurant: ['#foodie', '#delicious', '#freshfood', '#localeats', '#yummy'],
      fitness: ['#fitness', '#workout', '#healthylifestyle', '#motivation', '#strong'],
      technology: ['#tech', '#innovation', '#digital', '#future', '#ai'],
      healthcare: ['#health', '#wellness', '#care', '#medical', '#healthy']
    };
    
    Object.entries(fallbackExamples).forEach(([businessType, hashtags]) => {
      const instagramTags = getplatformOptimizedHashtags(hashtags, 'instagram');
      const twitterTags = getplatformOptimizedHashtags(hashtags, 'twitter');
      
      console.log(`   🏢 ${businessType}:`);
      console.log(`      📱 Instagram: ${instagramTags}`);
      console.log(`      🐦 Twitter: ${twitterTags}`);
    });
    
  } catch (error) {
    console.error('🚨 Integration test failed:', error.message);
    console.log('\n💡 Make sure your Next.js development server is running on port 3001');
  }
}

// Run the complete test
testFullIntegration();
