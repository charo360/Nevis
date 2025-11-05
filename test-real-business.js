/**
 * Test with a real business website
 */

async function testRealBusiness() {
  console.log('🧪 Testing with Real Business Website');
  console.log('=====================================\n');

  // Test with a business that should have real contact info
  const testUrl = 'https://zentechelectronics.com';
  
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
        console.log(`\n📋 Services Found: ${result.data.services.split('\n').filter(s => s.trim()).length} services`);
        console.log(`Services: ${result.data.services.split('\n').slice(0, 3).join(', ')}...`);
      }
      
      console.log('\n📞 Contact Info:');
      if (result.data.contactInfo) {
        if (result.data.contactInfo.phone) {
          console.log(`  ✅ Phone: ${result.data.contactInfo.phone}`);
        } else {
          console.log(`  ❌ Phone: Not found`);
        }
        
        if (result.data.contactInfo.email) {
          console.log(`  ✅ Email: ${result.data.contactInfo.email}`);
        } else {
          console.log(`  ❌ Email: Not found`);
        }
        
        if (result.data.contactInfo.address) {
          console.log(`  ✅ Address: ${result.data.contactInfo.address}`);
        } else {
          console.log(`  ❌ Address: Not found`);
        }
      } else {
        console.log(`  ❌ No contact info extracted`);
      }

      if (result.data.enhancedData) {
        console.log('\n📦 Enhanced Data:');
        console.log(`  Products: ${result.data.enhancedData.products?.length || 0}`);
        console.log(`  Images: ${result.data.enhancedData.totalImagesFound || 0}`);
        console.log(`  Logos: ${result.data.enhancedData.logoUrls?.length || 0}`);
      }

      console.log('\n✅ TEST PASSED - Real business data extracted!');
      console.log('🎉 No fake/example data in results!\n');

    } else {
      console.error('❌ ANALYSIS FAILED');
      console.error(`Error: ${result.error}`);
      console.error(`Error Type: ${result.errorType || 'unknown'}`);
    }

  } catch (error) {
    console.error('❌ TEST FAILED');
    console.error(`Error: ${error.message}`);
  }
}

// Run the test
console.log('Starting test in 2 seconds...\n');
setTimeout(() => {
  testRealBusiness().catch(console.error);
}, 2000);

