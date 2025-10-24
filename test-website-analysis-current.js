/**
 * Test current website analysis functionality
 * Check what APIs are needed and what happens without proxy server
 */

// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

async function testWebsiteAnalysis() {
  console.log('🔍 Testing Website Analysis System...\n');

  const testUrl = 'https://example.com';

  try {
    console.log('📋 Step 1: Testing website scraping...');

    // Test the scraping endpoint
    const scrapeResponse = await fetch('http://localhost:3001/api/scrape-website', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: testUrl }),
    });

    const scrapeResult = await scrapeResponse.json();
    console.log(`📄 Scraping result: ${scrapeResult.success ? 'SUCCESS' : 'FAILED'}`);

    if (!scrapeResponse.ok) {
      console.log(`❌ Scraping failed: ${scrapeResult.error}`);
      return;
    }

    console.log(`✅ Content extracted: ${scrapeResult.content?.length || 0} characters`);
    console.log(`📝 Content preview: ${scrapeResult.content?.substring(0, 200)}...`);

    console.log('\n📋 Step 2: Testing AI analysis...');

    // Test the analysis endpoint
    const analysisResponse = await fetch('http://localhost:3001/api/test-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: testUrl }),
    });

    const analysisResult = await analysisResponse.json();
    console.log(`🤖 Analysis result: ${analysisResult.success ? 'SUCCESS' : 'FAILED'}`);

    if (!analysisResponse.ok) {
      console.log(`❌ Analysis failed: ${analysisResult.error}`);

      // Check if it's a proxy-related error
      if (analysisResult.error?.includes('proxy') || analysisResult.error?.includes('8000')) {
        console.log('\n💡 DIAGNOSIS: This appears to be a proxy server dependency');
        console.log('   The system is trying to connect to a proxy server that no longer exists');
        console.log('   This needs to be fixed to use direct API calls instead');
      }

      return;
    }

    console.log('✅ Analysis completed successfully!');
    console.log(`📊 Business Name: ${analysisResult.analysisResult?.businessName}`);
    console.log(`📊 Business Type: ${analysisResult.analysisResult?.businessType}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);

    // Check for specific error types
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
      if (error.message.includes('3001')) {
        console.log('\n💡 DIAGNOSIS: Development server is not running');
        console.log('   Please start the dev server: npm run dev');
      } else if (error.message.includes('8000')) {
        console.log('\n💡 DIAGNOSIS: Proxy server dependency detected');
        console.log('   The system is trying to connect to a proxy server on port 8000');
        console.log('   This needs to be updated to use direct API calls');
      }
    }
  }
}

// Run the test
testWebsiteAnalysis();
