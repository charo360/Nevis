/**
 * Enhanced API Scraping Test
 * 
 * This tests the enhanced scraping via the API endpoint
 * to confirm it actually extracts more services and data
 */

const fetch = require('node-fetch');

console.log('🧪 Enhanced API Scraping Test\n');

async function testEnhancedAPIScraping() {
  console.log('='.repeat(70));
  console.log('TESTING ENHANCED SCRAPER VIA API WITH REAL WEBSITES');
  console.log('='.repeat(70));

  // Test websites
  const testWebsites = [
    {
      name: 'Mailchimp (SaaS)',
      url: 'https://mailchimp.com',
      expectedServices: 15,
      businessType: 'saas'
    },
    {
      name: 'Shopify (E-commerce Platform)', 
      url: 'https://www.shopify.com',
      expectedServices: 12,
      businessType: 'saas'
    },
    {
      name: 'HubSpot (Marketing Platform)',
      url: 'https://www.hubspot.com',
      expectedServices: 10,
      businessType: 'saas'
    }
  ];

  const apiUrl = 'http://localhost:3001/api/scrape-website';

  for (const website of testWebsites) {
    console.log(`\n🔍 Testing: ${website.name}`);
    console.log(`URL: ${website.url}`);
    console.log(`Expected Business Type: ${website.businessType}`);
    console.log(`Expected Services: ${website.expectedServices}+`);
    console.log('-'.repeat(50));

    try {
      // Test STANDARD scraping first
      console.log('📊 STANDARD SCRAPING (enhanced=false):');
      const standardStartTime = Date.now();
      const standardResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: website.url,
          enhanced: false 
        }),
      });

      if (!standardResponse.ok) {
        throw new Error(`Standard API request failed: ${standardResponse.status}`);
      }

      const standardResult = await standardResponse.json();
      const standardEndTime = Date.now();

      console.log(`✅ Standard scraping completed in ${standardEndTime - standardStartTime}ms`);
      
      // Count services in standard result (rough estimate from content)
      const standardContent = standardResult.data?.content || '';
      const standardServiceCount = (standardContent.match(/service|solution|product|offering/gi) || []).length;
      
      console.log(`Services mentioned: ~${Math.min(standardServiceCount, 10)} (estimated from content)`);
      console.log(`Content length: ${standardContent.length} characters`);
      console.log(`Phone numbers: ${standardResult.data?.phoneNumbers?.length || 0}`);
      console.log(`Email addresses: ${standardResult.data?.emailAddresses?.length || 0}`);
      console.log('');

      // Test ENHANCED scraping
      console.log('🚀 ENHANCED SCRAPING (enhanced=true):');
      const enhancedStartTime = Date.now();
      const enhancedResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: website.url,
          enhanced: true 
        }),
      });

      if (!enhancedResponse.ok) {
        throw new Error(`Enhanced API request failed: ${enhancedResponse.status}`);
      }

      const enhancedResult = await enhancedResponse.json();
      const enhancedEndTime = Date.now();

      console.log(`✅ Enhanced scraping completed in ${enhancedEndTime - enhancedStartTime}ms`);
      
      // Extract enhanced data
      const enhancedData = enhancedResult.data?.enhancedData || {};
      const aggregatedServices = enhancedData.aggregatedServices || [];
      const businessType = enhancedResult.data?.businessType || 'unknown';
      const dataCompleteness = enhancedData.dataCompleteness || 0;
      const pagesAnalyzed = enhancedData.pagesAnalyzed || 1;

      console.log('');
      console.log('📊 ENHANCED RESULTS:');
      console.log(`Business Type: ${businessType} ${businessType === website.businessType ? '✅' : '❌'}`);
      console.log(`Services Found: ${aggregatedServices.length} ${aggregatedServices.length >= website.expectedServices ? '✅' : '❌'}`);
      console.log(`Data Completeness: ${dataCompleteness}%`);
      console.log(`Pages Analyzed: ${pagesAnalyzed}`);
      console.log(`Content length: ${enhancedResult.data?.content?.length || 0} characters`);
      console.log(`Phone numbers: ${enhancedResult.data?.phoneNumbers?.length || 0}`);
      console.log(`Email addresses: ${enhancedResult.data?.emailAddresses?.length || 0}`);
      console.log(`Competitive advantages: ${enhancedResult.data?.competitiveAdvantages?.length || 0}`);
      console.log(`Content themes: ${enhancedResult.data?.contentThemes?.length || 0}`);
      console.log('');

      // Show services found
      if (aggregatedServices.length > 0) {
        console.log('🔧 SERVICES FOUND:');
        aggregatedServices.slice(0, 10).forEach((service, index) => {
          console.log(`${index + 1}. ${service.name}`);
          if (service.description && service.description.length > 10) {
            console.log(`   Description: ${service.description.substring(0, 80)}...`);
          }
        });
        if (aggregatedServices.length > 10) {
          console.log(`   ... and ${aggregatedServices.length - 10} more services`);
        }
      } else {
        console.log('❌ No services found in enhanced data');
      }
      console.log('');

      // Comparison
      console.log('📈 IMPROVEMENT COMPARISON:');
      const serviceImprovement = aggregatedServices.length > standardServiceCount ? 
        `${Math.round((aggregatedServices.length / Math.max(standardServiceCount, 1)) * 100)}% more services` : 
        'No improvement in service count';
      
      const contentImprovement = enhancedResult.data?.content?.length > standardContent.length ?
        `${Math.round(((enhancedResult.data.content.length - standardContent.length) / standardContent.length) * 100)}% more content` :
        'No improvement in content length';

      console.log(`Service Discovery: ${serviceImprovement}`);
      console.log(`Content Extraction: ${contentImprovement}`);
      console.log(`Processing Time: Enhanced took ${enhancedEndTime - enhancedStartTime}ms vs Standard ${standardEndTime - standardStartTime}ms`);
      console.log('');

      // Success/Failure Assessment
      const businessTypeCorrect = businessType === website.businessType;
      const servicesAdequate = aggregatedServices.length >= website.expectedServices;
      const dataComplete = dataCompleteness >= 70;
      const hasImprovement = aggregatedServices.length > Math.max(standardServiceCount, 5);

      console.log('🎯 ASSESSMENT:');
      console.log(`Business Type Classification: ${businessTypeCorrect ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`Service Extraction Quantity: ${servicesAdequate ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`Data Completeness: ${dataComplete ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`Improvement over Standard: ${hasImprovement ? '✅ PASS' : '❌ FAIL'}`);
      
      const overallPass = businessTypeCorrect && servicesAdequate && dataComplete && hasImprovement;
      console.log(`Overall Result: ${overallPass ? '✅ PASS' : '❌ FAIL'}`);

    } catch (error) {
      console.error(`❌ Error testing ${website.name}:`, error.message);
      console.log('This might be due to:');
      console.log('- Local server not running (npm run dev)');
      console.log('- Network connectivity issues');
      console.log('- Website blocking automated requests');
      console.log('- CORS restrictions');
      console.log('- Rate limiting');
      console.log('');
      console.log('💡 To run this test:');
      console.log('1. Start the development server: npm run dev');
      console.log('2. Run this test: node test-enhanced-api-scraping.js');
    }

    console.log('='.repeat(70));
  }

  console.log('\n📊 TEST SUMMARY:');
  console.log('This test validates:');
  console.log('✅ Enhanced scraper works via API endpoint');
  console.log('✅ Business type classification accuracy');
  console.log('✅ Service extraction improvement over standard');
  console.log('✅ Data completeness and coverage');
  console.log('✅ Multi-page crawling functionality');
  console.log('✅ Contact information extraction');
  console.log('✅ Performance comparison');
  console.log('');
  console.log('If tests pass, the enhanced scraper is ready for production!');
  console.log('');
  console.log('🚀 To test manually:');
  console.log('1. Start dev server: npm run dev');
  console.log('2. Go to brand creation wizard');
  console.log('3. Enter a website URL');
  console.log('4. Observe much more detailed results');
}

// Check if we're running this directly
if (require.main === module) {
  testEnhancedAPIScraping().catch(console.error);
}

module.exports = { testEnhancedAPIScraping };
