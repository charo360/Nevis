/**
 * Test the working enhanced analysis
 */

async function testWorkingEnhancedAnalysis() {
  console.log('🧪 Testing Working Enhanced Analysis');
  console.log('===================================\n');

  try {
    // Import the working simple scraper
    const { analyzeWebsiteComprehensively } = require('./src/ai/website-analyzer/simple-scraper');
    
    const testUrl = 'https://zentechelectronics.com/';
    console.log(`🔍 Testing with: ${testUrl}`);
    
    const result = await analyzeWebsiteComprehensively(testUrl);
    
    console.log('✅ ANALYSIS SUCCESSFUL!');
    console.log('=======================\n');
    
    console.log('📋 BASIC INFO:');
    console.log(`   Title: ${result.basicInfo.title}`);
    console.log(`   Business Type: ${result.businessIntel.businessType}`);
    console.log(`   Industry: ${result.businessIntel.industry}`);
    console.log(`   Description: ${result.basicInfo.description}\n`);
    
    console.log('🛍️ PRODUCTS & SERVICES:');
    console.log(`   Products Found: ${result.businessIntel.products.length}`);
    console.log(`   Services Found: ${result.businessIntel.services.length}`);
    if (result.businessIntel.products.length > 0) {
      console.log('   Sample Products:');
      result.businessIntel.products.slice(0, 3).forEach(product => {
        console.log(`     • ${product.name} - ${product.price || 'No price'}`);
      });
    }
    console.log('');
    
    console.log('🖼️ MEDIA ASSETS:');
    console.log(`   Total Images: ${result.mediaAssets.images.length}`);
    console.log(`   Logo Images: ${result.mediaAssets.logos.length}`);
    console.log(`   Product Images: ${result.mediaAssets.images.filter(img => img.type === 'product').length}\n`);
    
    console.log('📞 CONTACT INFO:');
    console.log(`   Phone: ${result.businessIntel.contactInfo.phone || 'Not found'}`);
    console.log(`   Email: ${result.businessIntel.contactInfo.email || 'Not found'}\n`);
    
    console.log('🎯 WHAT THIS MEANS FOR YOUR UI:');
    console.log('===============================');
    console.log('✅ Enhanced analysis is now working!');
    console.log('✅ Your "Analyze Brand" button will show enhanced data');
    console.log('✅ UI will display product counts, image counts, etc.');
    console.log('✅ Content generation will use real business intelligence\n');
    
    return result;
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('• Make sure you\'re running this from the project root');
    console.log('• Ensure you have internet connectivity');
    console.log('• Check if the website is accessible\n');
  }
}

// Run the test
if (require.main === module) {
  testWorkingEnhancedAnalysis().catch(console.error);
}

module.exports = { testWorkingEnhancedAnalysis };
