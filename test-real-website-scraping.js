/**
 * Real Website Scraping Test
 * 
 * This tests the enhanced brand scraper against real websites
 * to confirm it actually extracts more services and data
 */

const { EnhancedBrandScraper } = require('./src/ai/website-analyzer/enhanced-brand-scraper.ts');

console.log('🧪 Real Website Scraping Test\n');

async function testRealWebsiteScraping() {
  console.log('='.repeat(70));
  console.log('TESTING ENHANCED SCRAPER WITH REAL WEBSITES');
  console.log('='.repeat(70));

  // Test websites
  const testWebsites = [
    {
      name: 'Mailchimp (SaaS)',
      url: 'https://mailchimp.com',
      expectedServices: 20,
      businessType: 'saas'
    },
    {
      name: 'Shopify (E-commerce Platform)',
      url: 'https://www.shopify.com',
      expectedServices: 15,
      businessType: 'saas'
    },
    {
      name: 'Local Restaurant Example',
      url: 'https://www.olivegarden.com',
      expectedServices: 10,
      businessType: 'restaurant'
    }
  ];

  const scraper = new EnhancedBrandScraper();

  for (const website of testWebsites) {
    console.log(`\n🔍 Testing: ${website.name}`);
    console.log(`URL: ${website.url}`);
    console.log(`Expected Business Type: ${website.businessType}`);
    console.log(`Expected Services: ${website.expectedServices}+`);
    console.log('-'.repeat(50));

    try {
      const startTime = Date.now();
      const result = await scraper.scrapeForBrandCreation(website.url);
      const endTime = Date.now();

      console.log(`✅ Scraping completed in ${endTime - startTime}ms`);
      console.log('');

      // Test Results
      console.log('📊 RESULTS:');
      console.log(`Business Type: ${result.businessType} ${result.businessType === website.businessType ? '✅' : '❌'}`);
      console.log(`Services Found: ${result.aggregatedServices.length} ${result.aggregatedServices.length >= website.expectedServices ? '✅' : '❌'}`);
      console.log(`Data Completeness: ${result.dataCompleteness}%`);
      console.log(`Pages Analyzed: ${result.pagesAnalyzed}`);
      console.log('');

      // Basic Information
      console.log('📋 BASIC INFORMATION:');
      console.log(`Title: ${result.title}`);
      console.log(`Meta Description: ${result.metaDescription.substring(0, 100)}...`);
      console.log('');

      // Services Found
      console.log('🔧 SERVICES FOUND:');
      if (result.aggregatedServices.length > 0) {
        result.aggregatedServices.slice(0, 10).forEach((service, index) => {
          console.log(`${index + 1}. ${service.name}`);
          if (service.description) {
            console.log(`   Description: ${service.description.substring(0, 100)}...`);
          }
        });
        if (result.aggregatedServices.length > 10) {
          console.log(`   ... and ${result.aggregatedServices.length - 10} more services`);
        }
      } else {
        console.log('❌ No services found');
      }
      console.log('');

      // Contact Information
      console.log('📞 CONTACT INFORMATION:');
      console.log(`Phone Numbers: ${result.phoneNumbers.length} found`);
      if (result.phoneNumbers.length > 0) {
        console.log(`   ${result.phoneNumbers.slice(0, 3).join(', ')}`);
      }
      console.log(`Email Addresses: ${result.emailAddresses.length} found`);
      if (result.emailAddresses.length > 0) {
        console.log(`   ${result.emailAddresses.slice(0, 3).join(', ')}`);
      }
      console.log(`Addresses: ${result.addresses.length} found`);
      console.log('');

      // Business Intelligence
      console.log('💼 BUSINESS INTELLIGENCE:');
      console.log(`Competitive Advantages: ${result.competitiveAdvantages.length} found`);
      if (result.competitiveAdvantages.length > 0) {
        result.competitiveAdvantages.slice(0, 3).forEach((advantage, index) => {
          console.log(`${index + 1}. ${advantage.substring(0, 80)}...`);
        });
      }
      console.log(`Content Themes: ${result.contentThemes.length} found`);
      if (result.contentThemes.length > 0) {
        console.log(`   ${result.contentThemes.slice(0, 10).join(', ')}`);
      }
      console.log('');

      // Additional Data (if available)
      if (result.pricingInfo && result.pricingInfo.length > 0) {
        console.log('💰 PRICING INFORMATION:');
        console.log(`${result.pricingInfo.length} pricing items found`);
        result.pricingInfo.slice(0, 3).forEach(price => {
          console.log(`   ${price}`);
        });
        console.log('');
      }

      if (result.testimonials && result.testimonials.length > 0) {
        console.log('⭐ TESTIMONIALS:');
        console.log(`${result.testimonials.length} testimonials found`);
        result.testimonials.slice(0, 2).forEach((testimonial, index) => {
          console.log(`${index + 1}. ${testimonial.substring(0, 100)}...`);
        });
        console.log('');
      }

      // Content Sections
      console.log('📄 CONTENT SECTIONS:');
      console.log(`About Section: ${result.aboutSection.length} characters`);
      console.log(`Services Section: ${result.servicesSection.length} characters`);
      console.log(`Detailed Services: ${result.detailedServicesContent.length} characters`);
      console.log('');

      // Success/Failure Assessment
      const businessTypeCorrect = result.businessType === website.businessType;
      const servicesAdequate = result.aggregatedServices.length >= website.expectedServices;
      const dataComplete = result.dataCompleteness >= 80;

      console.log('🎯 ASSESSMENT:');
      console.log(`Business Type Classification: ${businessTypeCorrect ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`Service Extraction: ${servicesAdequate ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`Data Completeness: ${dataComplete ? '✅ PASS' : '❌ FAIL'}`);
      
      const overallPass = businessTypeCorrect && servicesAdequate && dataComplete;
      console.log(`Overall Result: ${overallPass ? '✅ PASS' : '❌ FAIL'}`);

    } catch (error) {
      console.error(`❌ Error testing ${website.name}:`, error.message);
      console.log('This might be due to:');
      console.log('- Network connectivity issues');
      console.log('- Website blocking automated requests');
      console.log('- CORS restrictions');
      console.log('- Rate limiting');
    }

    console.log('='.repeat(70));
  }

  console.log('\n📊 TEST SUMMARY:');
  console.log('This test validates:');
  console.log('✅ Enhanced scraper can handle real websites');
  console.log('✅ Business type classification accuracy');
  console.log('✅ Service extraction quantity and quality');
  console.log('✅ Data completeness and coverage');
  console.log('✅ Multi-page crawling functionality');
  console.log('✅ Contact information extraction');
  console.log('✅ Business intelligence gathering');
  console.log('');
  console.log('If tests pass, the enhanced scraper is ready for production!');
}

// Run the test
testRealWebsiteScraping().catch(console.error);
