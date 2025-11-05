/**
 * Test Real Data Extraction with AI Analysis
 * Verify that we're getting actual business information, not generic data
 */

async function testRealDataExtraction() {
  console.log('🧪 Testing Real Data Extraction with AI Analysis');
  console.log('===============================================\n');

  try {
    // Import the enhanced analysis action
    const { analyzeBrandAction } = require('./src/app/actions');

    const testUrl = 'https://zentechelectronics.com/';
    console.log(`🔍 Testing real data extraction with: ${testUrl}`);
    console.log('⏳ This should extract ACTUAL business information, not generic data...\n');

    const result = await analyzeBrandAction(testUrl, []);

    if (!result.success) {
      console.error('❌ Analysis failed:', result.error);
      return;
    }

    const data = result.data;

    console.log('✅ REAL DATA EXTRACTION SUCCESSFUL!');
    console.log('===================================\n');

    // Check for real vs generic data
    console.log('📋 BUSINESS INFORMATION QUALITY CHECK:');
    console.log('======================================');

    console.log(`🏢 Business Name: "${data.businessName}"`);
    console.log(`   ✅ Real business name: ${!data.businessName.includes('Business') ? 'YES' : 'NO'}`);

    console.log(`📝 Description: "${data.description}"`);
    console.log(`   ✅ Specific description: ${!data.description.includes('Professional services') ? 'YES' : 'NO'}`);

    console.log(`🏭 Business Type: "${data.businessType}"`);
    console.log(`   ✅ Specific type: ${data.businessType !== 'General Business' ? 'YES' : 'NO'}`);

    console.log(`🛍️ Services: "${data.services}"`);
    console.log(`   ✅ Real services: ${!data.services.includes('Professional service delivery') ? 'YES' : 'NO'}`);

    console.log('');

    // Check enhanced data quality
    if (data.enhancedData) {
      console.log('🚀 ENHANCED DATA QUALITY CHECK:');
      console.log('===============================');

      console.log(`📦 Products Found: ${data.enhancedData.products?.length || 0}`);
      if (data.enhancedData.products?.length > 0) {
        console.log('   Sample Products:');
        data.enhancedData.products.slice(0, 3).forEach(product => {
          const isReal = !product.name.includes('Product') && !product.name.includes('Featured');
          console.log(`     • ${product.name} - ${product.price || 'No price'} ${isReal ? '✅' : '❌'}`);
        });
      }

      console.log(`💡 USPs Found: ${data.enhancedData.uniqueSellingPropositions?.length || 0}`);
      if (data.enhancedData.uniqueSellingPropositions?.length > 0) {
        console.log('   Sample USPs:');
        data.enhancedData.uniqueSellingPropositions.slice(0, 3).forEach(usp => {
          const isReal = !usp.includes('Professional service delivery') && !usp.includes('Quality service');
          console.log(`     • ${usp} ${isReal ? '✅' : '❌'}`);
        });
      }

      console.log(`🖼️ Images Found: ${data.enhancedData.totalImagesFound || 0}`);
      console.log(`📊 Analysis Version: ${data.enhancedData.analysisMetadata?.analysisVersion || 'Unknown'}`);
    }

    console.log('');

    // Overall quality assessment
    const qualityChecks = [
      !data.businessName.includes('Business'),
      !data.description.includes('Professional services'),
      data.businessType !== 'General Business',
      !data.services.includes('Professional service delivery'),
      (data.enhancedData?.products?.length || 0) > 0,
      (data.enhancedData?.uniqueSellingPropositions?.length || 0) > 0
    ];

    const qualityScore = qualityChecks.filter(Boolean).length;
    const totalChecks = qualityChecks.length;

    console.log('🎯 OVERALL QUALITY ASSESSMENT:');
    console.log('=============================');
    console.log(`Quality Score: ${qualityScore}/${totalChecks} (${Math.round(qualityScore / totalChecks * 100)}%)`);

    if (qualityScore >= 4) {
      console.log('✅ EXCELLENT: Real business data extracted successfully!');
      console.log('✅ ScrapingBee + AI analysis is working properly');
      console.log('✅ No more generic "Professional service delivery" data');
    } else if (qualityScore >= 2) {
      console.log('⚠️ PARTIAL: Some real data extracted, but still some generic content');
      console.log('⚠️ May need to improve AI prompts or scraping');
    } else {
      console.log('❌ POOR: Still getting mostly generic data');
      console.log('❌ AI analysis or scraping needs improvement');
    }

    console.log('');
    console.log('🔍 WHAT TO LOOK FOR IN UI:');
    console.log('==========================');
    console.log('✅ Real business name (not "Business")');
    console.log('✅ Specific business description');
    console.log('✅ Actual services (not generic ones)');
    console.log('✅ Real product names with prices');
    console.log('✅ Specific USPs (not "Professional service delivery")');
    console.log('✅ Enhanced data section with real counts');

    return data;

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('==================');
    console.log('• Verify AI analysis is running properly');
    console.log('• Ensure website is accessible');
    console.log('• Check if simple scraper is working');
    console.log('• Check console logs for detailed errors\n');
  }
}

// Run the test
if (require.main === module) {
  testRealDataExtraction().catch(console.error);
}

module.exports = { testRealDataExtraction };
