/**
 * Quick Test: Website Analysis with Simple Scraper
 * Tests that ScrapingBee removal didn't break anything
 */

async function testSimpleScraper() {
  console.log('🧪 Testing Website Analysis (Simple Scraper Only)');
  console.log('=================================================\n');

  const testUrl = 'https://stripe.com';
  
  try {
    console.log(`🌐 Testing URL: ${testUrl}`);
    console.log('⏳ Analyzing website...\n');

    const response = await fetch('http://localhost:3001/api/analyze-brand', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        websiteUrl: testUrl,
        designImageUris: []
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      console.log('✅ ANALYSIS SUCCESSFUL!\n');
      console.log('📊 Results:');
      console.log('===========');
      console.log(`Business Name: ${result.data.businessName || 'N/A'}`);
      console.log(`Description: ${result.data.description?.substring(0, 100) || 'N/A'}...`);
      console.log(`Business Type: ${result.data.businessType || 'N/A'}`);
      console.log(`Industry: ${result.data.industry || 'N/A'}`);
      
      if (result.data.services) {
        console.log(`\n📋 Services Found: ${result.data.services.split('\n').length} services`);
      }
      
      if (result.data.contactInfo) {
        console.log('\n📞 Contact Info:');
        if (result.data.contactInfo.phone) console.log(`  Phone: ${result.data.contactInfo.phone}`);
        if (result.data.contactInfo.email) console.log(`  Email: ${result.data.contactInfo.email}`);
        if (result.data.contactInfo.address) console.log(`  Address: ${result.data.contactInfo.address}`);
      }

      if (result.data.socialMedia) {
        console.log('\n🔗 Social Media:');
        Object.entries(result.data.socialMedia).forEach(([platform, url]) => {
          if (url) console.log(`  ${platform}: ${url}`);
        });
      }

      if (result.metadata) {
        console.log('\n⏱️ Metadata:');
        console.log(`  Content Length: ${result.metadata.contentLength || 'N/A'} characters`);
        console.log(`  Analyzed At: ${result.metadata.analyzedAt || 'N/A'}`);
      }

      console.log('\n✅ TEST PASSED - Simple scraper is working correctly!');
      console.log('🎉 ScrapingBee removal was successful!\n');

    } else {
      console.error('❌ ANALYSIS FAILED');
      console.error(`Error: ${result.error}`);
      console.error(`Error Type: ${result.errorType || 'unknown'}`);
      
      console.log('\n🔧 Troubleshooting:');
      console.log('• Check if OpenRouter API key is set in .env.local');
      console.log('• Verify the website is accessible');
      console.log('• Check server logs for detailed errors');
    }

  } catch (error) {
    console.error('❌ TEST FAILED');
    console.error(`Error: ${error.message}`);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('• Make sure the dev server is running (npm run dev)');
    console.log('• Check if port 3001 is accessible');
    console.log('• Verify network connectivity');
    console.log('• Check server logs for errors');
  }
}

// Run the test
console.log('Starting test in 2 seconds...\n');
setTimeout(() => {
  testSimpleScraper().catch(console.error);
}, 2000);

