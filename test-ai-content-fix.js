/**
 * Test AI Content Generation Fix
 * This tests if the new AI-powered content generation produces unique content
 */

// Use built-in fetch (Node.js 18+)

const testBusiness = {
  businessType: 'restaurant',
  businessName: 'Samaki Cookies',
  location: 'Kenya',
  platform: 'Instagram',
  brandProfile: {
    businessName: 'Samaki Cookies',
    businessType: 'restaurant',
    location: 'Kenya',
    services: 'artisan cookies, custom orders, catering',
    keyFeatures: 'handmade, fresh ingredients, unique flavors',
    targetAudience: 'food lovers, families, professionals',
    primaryColor: '#D97706',
    accentColor: '#10B981',
    backgroundColor: '#F8FAFC'
  }
};

async function testContentGeneration() {
  console.log('🧪 Testing AI Content Generation Fix...\n');

  const results = [];

  // Generate 3 posts to check for uniqueness
  for (let i = 1; i <= 3; i++) {
    console.log(`🔄 Generating post ${i}...`);

    try {
      const response = await fetch('http://localhost:3001/api/advanced-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testBusiness)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        results.push({
          post: i,
          headline: result.data.headline,
          subheadline: result.data.subheadline,
          caption: (result.data.caption || '').substring(0, 100) + '...',
          hashtags: (result.data.hashtags || []).slice(0, 5)
        });

        console.log(`✅ Post ${i} generated successfully`);
        console.log(`   Headline: "${result.data.headline}"`);
        console.log(`   Subheadline: "${result.data.subheadline}"`);
        console.log(`   Caption: ${(result.data.caption || '').substring(0, 80)}...`);
        console.log(`   CTA: "${result.data.cta}"`);
        console.log('');
      } else {
        console.error(`❌ Post ${i} failed:`, result.error);
      }

    } catch (error) {
      console.error(`❌ Post ${i} error:`, error.message);
    }

    // Wait 2 seconds between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Analyze results for uniqueness
  console.log('📊 Analyzing Content Uniqueness...\n');

  if (results.length >= 2) {
    const headlines = results.map(r => r.headline);
    const subheadlines = results.map(r => r.subheadline);
    const captions = results.map(r => r.caption);

    const uniqueHeadlines = new Set(headlines).size;
    const uniqueSubheadlines = new Set(subheadlines).size;
    const uniqueCaptions = new Set(captions).size;

    console.log(`📈 Results Summary:`);
    console.log(`   Total Posts Generated: ${results.length}`);
    console.log(`   Unique Headlines: ${uniqueHeadlines}/${results.length} (${uniqueHeadlines === results.length ? '✅ GOOD' : '❌ REPETITIVE'})`);
    console.log(`   Unique Subheadlines: ${uniqueSubheadlines}/${results.length} (${uniqueSubheadlines === results.length ? '✅ GOOD' : '❌ REPETITIVE'})`);
    console.log(`   Unique Captions: ${uniqueCaptions}/${results.length} (${uniqueCaptions === results.length ? '✅ GOOD' : '❌ REPETITIVE'})`);

    if (uniqueHeadlines === results.length && uniqueSubheadlines === results.length && uniqueCaptions === results.length) {
      console.log('\n🎉 SUCCESS: AI Content Generation is producing unique content!');
    } else {
      console.log('\n⚠️  WARNING: Some content is still repetitive. Check the AI generation logic.');
    }

    // Show detailed comparison
    console.log('\n📋 Detailed Content Comparison:');
    results.forEach((result, index) => {
      console.log(`\nPost ${index + 1}:`);
      console.log(`  Headline: "${result.headline}"`);
      console.log(`  Subheadline: "${result.subheadline}"`);
      console.log(`  Caption: ${result.caption}`);
    });

  } else {
    console.log('❌ Not enough results to analyze uniqueness');
  }
}

// Run the test
testContentGeneration().catch(console.error);
