/**
 * Test script to debug website analysis functionality
 */

async function testWebsiteAnalysis() {
  console.log('🔍 Testing website analysis...');

  // Test with a simple website first
  const testUrl = 'https://shopify.com';

  try {
    console.log(`📄 Testing scraping for: ${testUrl}`);

    // Test the scraping endpoint first
    const scrapeResponse = await fetch('http://localhost:3001/api/scrape-website', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: testUrl })
    });

    const scrapeResult = await scrapeResponse.json();
    console.log('📊 Scrape Response Status:', scrapeResponse.status);
    console.log('📊 Scrape Success:', scrapeResult.success);

    if (scrapeResult.success) {
      console.log('📄 Content Length:', scrapeResult.content?.length || 0);
      console.log('📄 Content Preview:', scrapeResult.content?.substring(0, 500) + '...');
    } else {
      console.log('❌ Scrape Error:', scrapeResult.error);
      console.log('❌ Error Type:', scrapeResult.errorType);
    }

    // If scraping worked, test the full analysis
    if (scrapeResult.success) {
      console.log('\n🧠 Testing full analysis...');

      const analysisResponse = await fetch('http://localhost:3001/api/analyze-brand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl: testUrl,
          designImageUris: []
        })
      });

      const analysisResult = await analysisResponse.json();
      console.log('🧠 Analysis Response Status:', analysisResponse.status);
      console.log('🧠 Analysis Success:', analysisResult.success);

      if (analysisResult.success) {
        console.log('🎯 Business Name:', analysisResult.data?.businessName);
        console.log('🎯 Business Type:', analysisResult.data?.businessType);
        console.log('🎯 Description Length:', analysisResult.data?.description?.length || 0);
        console.log('🎯 Services Count:', analysisResult.data?.keyServices?.length || 0);
        console.log('🎯 Detailed Services Length:', analysisResult.data?.detailedServiceDescriptions?.length || 0);

        // Show the actual analysis result
        console.log('\n📋 Full Analysis Result:');
        console.log(JSON.stringify(analysisResult.data, null, 2));
      } else {
        console.log('❌ Analysis Error:', analysisResult.error);
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Test with a more complex business website
async function testRealWebsite() {
  console.log('\n🏢 Testing with a real business website...');

  const testUrl = 'https://www.shopify.com';

  try {
    const analysisResponse = await fetch('http://localhost:3001/api/analyze-brand', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        websiteUrl: testUrl,
        designImageUris: []
      })
    });

    const analysisResult = await analysisResponse.json();
    console.log('🧠 Real Website Analysis Status:', analysisResponse.status);
    console.log('🧠 Real Website Analysis Success:', analysisResult.success);

    if (analysisResult.success) {
      console.log('🎯 Business Name:', analysisResult.data?.businessName);
      console.log('🎯 Business Type:', analysisResult.data?.businessType);
      console.log('🎯 Description:', analysisResult.data?.description?.substring(0, 200) + '...');
      console.log('🎯 Services:', analysisResult.data?.keyServices?.slice(0, 3));
      console.log('🎯 Detailed Services Preview:', analysisResult.data?.detailedServiceDescriptions?.substring(0, 300) + '...');

      // Show all available fields to debug field mapping
      console.log('\n📋 All Available Fields:');
      Object.keys(analysisResult.data || {}).forEach(key => {
        const value = analysisResult.data[key];
        if (typeof value === 'string') {
          console.log(`  ${key}: "${value.substring(0, 100)}${value.length > 100 ? '...' : ''}"`);
        } else if (Array.isArray(value)) {
          console.log(`  ${key}: [${value.length} items] ${JSON.stringify(value.slice(0, 2))}`);
        } else if (typeof value === 'object' && value !== null) {
          console.log(`  ${key}: {object with ${Object.keys(value).length} keys}`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      });
    } else {
      console.log('❌ Real Website Analysis Error:', analysisResult.error);
    }

  } catch (error) {
    console.error('💥 Real website test failed:', error);
  }
}

// Test with different types of websites
async function testVariousWebsites() {
  console.log('\n🌐 Testing various website types...');

  const testSites = [
    { url: 'https://tesla.com', type: 'Automotive/Tech' },
    { url: 'https://apple.com', type: 'Technology' },
    { url: 'https://mcdonalds.com', type: 'Restaurant Chain' }
  ];

  for (const site of testSites) {
    console.log(`\n🔍 Testing ${site.type}: ${site.url}`);

    try {
      const analysisResponse = await fetch('http://localhost:3001/api/analyze-brand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl: site.url,
          designImageUris: []
        })
      });

      const analysisResult = await analysisResponse.json();

      if (analysisResult.success) {
        console.log(`✅ ${site.type} Analysis Success`);
        console.log(`📊 Business: ${analysisResult.data?.businessName}`);
        console.log(`📊 Type: ${analysisResult.data?.businessType}`);
        console.log(`📊 Description: ${analysisResult.data?.description?.substring(0, 150)}...`);

        // Check if we have service information
        const hasServices = analysisResult.data?.keyServices?.length > 0 ||
          analysisResult.data?.services?.length > 50 ||
          analysisResult.data?.detailedServiceDescriptions?.length > 50;
        console.log(`📊 Service Info: ${hasServices ? '✅ Detailed' : '❌ Limited'}`);
      } else {
        console.log(`❌ ${site.type} Analysis Failed: ${analysisResult.error}`);
      }

    } catch (error) {
      console.error(`💥 ${site.type} test failed:`, error.message);
    }
  }
}

// Run the tests
async function runTests() {
  await testWebsiteAnalysis();
  await testRealWebsite();
  await testVariousWebsites();
}

runTests().catch(console.error);
