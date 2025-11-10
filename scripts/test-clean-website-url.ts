import { IntegratedPromptGenerator } from '../src/ai/image/integrated-prompt-generator.js';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testCleanWebsiteUrl() {
  console.log('🌐 Testing Clean Website URL Functionality...\n');

  try {
    const generator = new IntegratedPromptGenerator();

    // Test brand profile with different website URL formats
    const testBrandProfile = {
      businessName: 'Samaki Cookies',
      websiteUrl: 'https://www.realsamakicookies.co.ke',
      contactInfo: {
        phone: '+254 701 234 567',
        email: 'hello@realsamakicookies.co.ke',
      },
      primaryColor: '#FF5722',
      accentColor: '#4CAF50',
      backgroundColor: '#FAFAFA'
    };

    // Test different URL formats
    const testUrls = [
      'https://www.realsamakicookies.co.ke',
      'http://www.realsamakicookies.co.ke', 
      'www.realsamakicookies.co.ke',
      'realsamakicookies.co.ke',
      'https://samakicookies.com',
      'http://example.org',
      ''
    ];

    console.log('🧪 **Testing URL Cleaning:**');
    testUrls.forEach(url => {
      // Access the private method through reflection for testing
      const cleanedUrl = (generator as any).cleanWebsiteUrl(url);
      console.log(`  Input:  "${url}"`);
      console.log(`  Output: "${cleanedUrl}"`);
      console.log('');
    });

    // Test with actual brand profile
    console.log('📋 **Testing with Brand Profile:**');
    
    // Test buildContactSection
    const contactSection = (generator as any).buildContactSection(testBrandProfile);
    console.log('Contact Section Output:');
    console.log(contactSection);

    // Test buildContactInstructions  
    const contactInstructions = (generator as any).buildContactInstructions(testBrandProfile);
    console.log('Contact Instructions Output:');
    console.log(`"${contactInstructions}"`);

    console.log('\n✅ **Expected Results:**');
    console.log('  ✅ Website should show: "www.realsamakicookies.co.ke"');
    console.log('  ✅ No "https://" prefix in output');
    console.log('  ✅ Clean, readable domain format');

  } catch (error) {
    console.error('❌ Error testing clean website URL:', error);
    process.exit(1);
  }
}

testCleanWebsiteUrl();
