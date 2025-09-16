// Test RSS hashtags endpoint
import fetch from 'node-fetch';

async function testRSSHashtags() {
  console.log('🔄 Testing RSS hashtags endpoint...\n');

  try {
    // Test general category
    console.log('📰 Testing general news hashtags:');
    const generalResponse = await fetch('http://localhost:3001/api/rss-data?category=general&limit=20');
    
    if (generalResponse.ok) {
      const generalData = await generalResponse.json();
      console.log('✅ General RSS response received');
      console.log('📊 Sample data structure:');
      console.log(`   - Articles: ${generalData.articles?.length || 0}`);
      console.log(`   - Keywords: ${generalData.keywords?.length || 0}`);
      console.log(`   - Hashtags: ${generalData.hashtags?.length || 0}`);
      
      if (generalData.hashtags && generalData.hashtags.length > 0) {
        console.log('🏷️  Sample hashtags:', generalData.hashtags.slice(0, 8));
      }
      
      if (generalData.hashtagAnalytics?.trending) {
        console.log('📈 Trending hashtags with analytics:', generalData.hashtagAnalytics.trending.slice(0, 5));
      }
    } else {
      console.log('❌ General RSS request failed:', generalResponse.status, generalResponse.statusText);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test tech category
    console.log('💻 Testing tech news hashtags:');
    const techResponse = await fetch('http://localhost:3001/api/rss-data?category=tech&limit=20');
    
    if (techResponse.ok) {
      const techData = await techResponse.json();
      console.log('✅ Tech RSS response received');
      console.log('📊 Sample data structure:');
      console.log(`   - Articles: ${techData.articles?.length || 0}`);
      console.log(`   - Keywords: ${techData.keywords?.length || 0}`);
      console.log(`   - Hashtags: ${techData.hashtags?.length || 0}`);
      
      if (techData.hashtags && techData.hashtags.length > 0) {
        console.log('🏷️  Sample tech hashtags:', techData.hashtags.slice(0, 8));
      }
      
      if (techData.hashtagAnalytics?.trending) {
        console.log('📈 Trending tech hashtags:', techData.hashtagAnalytics.trending.slice(0, 5));
      }
    } else {
      console.log('❌ Tech RSS request failed:', techResponse.status, techResponse.statusText);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test business category
    console.log('💼 Testing business news hashtags:');
    const businessResponse = await fetch('http://localhost:3001/api/rss-data?category=business&limit=20');
    
    if (businessResponse.ok) {
      const businessData = await businessResponse.json();
      console.log('✅ Business RSS response received');
      console.log('📊 Sample data structure:');
      console.log(`   - Articles: ${businessData.articles?.length || 0}`);
      console.log(`   - Keywords: ${businessData.keywords?.length || 0}`);
      console.log(`   - Hashtags: ${businessData.hashtags?.length || 0}`);
      
      if (businessData.hashtags && businessData.hashtags.length > 0) {
        console.log('🏷️  Sample business hashtags:', businessData.hashtags.slice(0, 8));
      }
    } else {
      console.log('❌ Business RSS request failed:', businessResponse.status, businessResponse.statusText);
    }

  } catch (error) {
    console.error('🚨 Test failed:', error.message);
    console.log('\n💡 Make sure your Next.js development server is running on port 3001');
    console.log('   Run: npm run dev');
  }
}

testRSSHashtags();
