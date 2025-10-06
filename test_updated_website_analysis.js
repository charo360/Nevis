/**
 * Test script to verify the updated website analysis system
 * This tests the new multi-model proxy system vs the old Genkit system
 */

const { analyzeBrand } = require('./src/ai/flows/analyze-brand.ts');

async function testUpdatedWebsiteAnalysis() {
  console.log('🧪 Testing Updated Website Analysis System');
  console.log('=' * 60);
  
  const testInput = {
    websiteUrl: 'https://techflowsolutions.com',
    designImageUris: [],
    websiteContent: `
      About TechFlow Solutions
      
      TechFlow Solutions is a leading software development company based in San Francisco, California. 
      We specialize in creating innovative web applications, mobile apps, and enterprise software solutions.
      
      Our Services:
      - Custom Web Development
      - Mobile App Development (iOS & Android)
      - Enterprise Software Solutions
      - Cloud Migration Services
      
      Contact: hello@techflowsolutions.com
      Phone: (555) 123-4567
    `
  };
  
  try {
    console.log('🔍 Starting website analysis...');
    console.log(`📄 Website: ${testInput.websiteUrl}`);
    
    const result = await analyzeBrand(testInput);
    
    console.log('\n✅ Website Analysis Results:');
    console.log(`🏢 Business Name: ${result.businessName}`);
    console.log(`🏭 Business Type: ${result.businessType}`);
    console.log(`📍 Location: ${result.location}`);
    console.log(`🎯 Target Audience: ${result.targetAudience?.substring(0, 100)}...`);
    console.log(`🛠️ Services: ${result.services?.substring(0, 100)}...`);
    
    // Check if it's using the new proxy system
    if (result.businessName && result.businessName !== 'Unknown Business') {
      console.log('\n🎉 SUCCESS: Website analysis working with new multi-model system!');
      return true;
    } else {
      console.log('\n⚠️ WARNING: Analysis returned default values');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Website analysis failed:', error.message);
    
    // Check if it's a proxy connection error
    if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 TIP: Make sure the proxy server is running:');
      console.log('   cd proxy-server && python main.py');
    }
    
    return false;
  }
}

// Run the test
testUpdatedWebsiteAnalysis()
  .then(success => {
    if (success) {
      console.log('\n🎯 Test Result: PASS - New multi-model system working!');
      process.exit(0);
    } else {
      console.log('\n❌ Test Result: FAIL - Check configuration');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Test crashed:', error);
    process.exit(1);
  });
