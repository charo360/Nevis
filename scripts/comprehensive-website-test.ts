/**
 * Comprehensive Website Scraping Test
 * Tests the enhanced website scraping system with real business websites
 * to verify comprehensive data extraction and integration capabilities
 */

import { BusinessProfileEnricher, enrichBusinessProfileFromWebsite } from '../src/ai/website-analyzer/business-profile-enricher';
import { EnhancedSimpleScraper } from '../src/ai/website-analyzer/enhanced-simple-scraper';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testComprehensiveDataExtraction() {
  console.log('🧪 COMPREHENSIVE WEBSITE SCRAPING TEST\n');
  console.log('Testing enhanced data extraction capabilities with real business websites\n');

  // Test with different types of businesses for comprehensive coverage
  const testBusinesses = [
    {
      name: 'Mailchimp',
      websiteUrl: 'https://mailchimp.com',
      type: 'SaaS Marketing Platform',
      expectedData: {
        services: 'Email marketing, automation, analytics',
        contact: 'Multiple contact methods',
        businessIntel: 'Mission, values, team info',
        visualBrand: 'Strong brand identity',
        contentStrategy: 'Clear CTAs and messaging'
      }
    },
    {
      name: 'Shopify',
      websiteUrl: 'https://shopify.com',
      type: 'E-commerce Platform',
      expectedData: {
        services: 'E-commerce solutions, payments, apps',
        contact: 'Global contact information',
        businessIntel: 'Company history, mission',
        visualBrand: 'Professional design system',
        contentStrategy: 'Conversion-focused content'
      }
    },
    {
      name: 'Slack',
      websiteUrl: 'https://slack.com',
      type: 'Business Communication',
      expectedData: {
        services: 'Team communication, integrations',
        contact: 'Enterprise contact options',
        businessIntel: 'Product benefits, use cases',
        visualBrand: 'Modern, friendly design',
        contentStrategy: 'Productivity-focused messaging'
      }
    }
  ];

  for (const business of testBusinesses) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🏢 TESTING: ${business.name} (${business.type})`);
    console.log(`🌐 URL: ${business.websiteUrl}`);
    console.log(`${'='.repeat(80)}`);

    try {
      const startTime = Date.now();
      
      // Test comprehensive data extraction
      const scraper = new EnhancedSimpleScraper();
      const websiteAnalysis = await scraper.analyzeWebsiteComprehensively(business.websiteUrl);
      
      const endTime = Date.now();
      const scrapingDuration = endTime - startTime;

      // Display detailed extraction results
      console.log(`\n📊 **EXTRACTION RESULTS**`);
      console.log(`⏱️  Scraping Time: ${scrapingDuration}ms`);
      console.log(`📈 Data Completeness: ${websiteAnalysis.analysisMetadata.dataCompleteness}%`);
      console.log(`🎯 Confidence Score: ${websiteAnalysis.analysisMetadata.confidenceScore}%`);

      // 1. BASIC INFORMATION EXTRACTION
      console.log(`\n🏢 **1. BASIC INFORMATION EXTRACTION**`);
      console.log(`   ✅ Title: ${websiteAnalysis.basicInfo.title}`);
      console.log(`   ✅ Description: ${websiteAnalysis.basicInfo.description?.substring(0, 150)}${websiteAnalysis.basicInfo.description?.length > 150 ? '...' : ''}`);
      console.log(`   ✅ Language: ${websiteAnalysis.basicInfo.language}`);
      console.log(`   ✅ Keywords: ${websiteAnalysis.basicInfo.keywords.slice(0, 5).join(', ') || 'None detected'}`);
      console.log(`   ✅ Favicon: ${websiteAnalysis.basicInfo.favicon ? 'Detected' : 'Not found'}`);

      // 2. BUSINESS INTELLIGENCE EXTRACTION
      console.log(`\n🧠 **2. BUSINESS INTELLIGENCE EXTRACTION**`);
      console.log(`   ✅ Business Type: ${websiteAnalysis.businessIntelligence.businessType}`);
      console.log(`   ✅ Industry: ${websiteAnalysis.businessIntelligence.industry}`);
      console.log(`   ✅ Mission: ${websiteAnalysis.businessIntelligence.mission || 'Not detected'}`);
      console.log(`   ✅ Vision: ${websiteAnalysis.businessIntelligence.vision || 'Not detected'}`);
      console.log(`   ✅ Values: ${websiteAnalysis.businessIntelligence.values.length} detected`);
      console.log(`   ✅ Services: ${websiteAnalysis.businessIntelligence.services.length} detected`);
      console.log(`   ✅ Products: ${websiteAnalysis.businessIntelligence.products.length} detected`);
      console.log(`   ✅ Pricing Models: ${websiteAnalysis.businessIntelligence.pricing.length} detected`);
      console.log(`   ✅ Testimonials: ${websiteAnalysis.businessIntelligence.testimonials.length} detected`);
      console.log(`   ✅ Team Members: ${websiteAnalysis.businessIntelligence.teamInfo.length} detected`);
      console.log(`   ✅ UVP: ${websiteAnalysis.businessIntelligence.uniqueValueProposition || 'Not detected'}`);
      console.log(`   ✅ Competitive Advantages: ${websiteAnalysis.businessIntelligence.competitiveAdvantages.length} detected`);

      // Show sample services/products if found
      if (websiteAnalysis.businessIntelligence.services.length > 0) {
        console.log(`\n   📋 **Sample Services:**`);
        websiteAnalysis.businessIntelligence.services.slice(0, 3).forEach((service, index) => {
          console.log(`      ${index + 1}. ${service.name}: ${service.description?.substring(0, 100)}${service.description?.length > 100 ? '...' : ''}`);
        });
      }

      if (websiteAnalysis.businessIntelligence.products.length > 0) {
        console.log(`\n   📦 **Sample Products:**`);
        websiteAnalysis.businessIntelligence.products.slice(0, 3).forEach((product, index) => {
          console.log(`      ${index + 1}. ${product.name}: ${product.description?.substring(0, 100)}${product.description?.length > 100 ? '...' : ''}`);
        });
      }

      // 3. VISUAL BRAND ANALYSIS
      console.log(`\n🎨 **3. VISUAL BRAND ANALYSIS**`);
      console.log(`   ✅ Logo URLs: ${websiteAnalysis.visualBrand.logoUrls.length} detected`);
      console.log(`   ✅ Design Style: ${websiteAnalysis.visualBrand.designStyle}`);
      console.log(`   ✅ Image Style: ${websiteAnalysis.visualBrand.imageStyle}`);
      console.log(`   ✅ Primary Colors: ${websiteAnalysis.visualBrand.colors.primary || 'Not detected'}`);
      console.log(`   ✅ Secondary Colors: ${websiteAnalysis.visualBrand.colors.secondary.length} detected`);
      console.log(`   ✅ Heading Fonts: ${websiteAnalysis.visualBrand.typography.headingFonts.length} detected`);
      console.log(`   ✅ Body Fonts: ${websiteAnalysis.visualBrand.typography.bodyFonts.length} detected`);

      if (websiteAnalysis.visualBrand.logoUrls.length > 0) {
        console.log(`\n   🖼️  **Sample Logo URLs:**`);
        websiteAnalysis.visualBrand.logoUrls.slice(0, 2).forEach((logo, index) => {
          console.log(`      ${index + 1}. ${logo}`);
        });
      }

      // 4. CONTACT INFORMATION EXTRACTION
      console.log(`\n📞 **4. CONTACT INFORMATION EXTRACTION**`);
      console.log(`   ✅ Phone Numbers: ${websiteAnalysis.contactInformation.phone.length} detected`);
      console.log(`   ✅ Email Addresses: ${websiteAnalysis.contactInformation.email.length} detected`);
      console.log(`   ✅ Physical Addresses: ${websiteAnalysis.contactInformation.address.length} detected`);
      console.log(`   ✅ Social Media Profiles: ${websiteAnalysis.contactInformation.socialMedia.length} detected`);
      console.log(`   ✅ Business Hours: ${websiteAnalysis.contactInformation.businessHours || 'Not detected'}`);
      console.log(`   ✅ Locations: ${websiteAnalysis.contactInformation.locations.length} detected`);

      if (websiteAnalysis.contactInformation.phone.length > 0) {
        console.log(`\n   📱 **Sample Phone Numbers:**`);
        websiteAnalysis.contactInformation.phone.slice(0, 2).forEach((phone, index) => {
          console.log(`      ${index + 1}. ${phone}`);
        });
      }

      if (websiteAnalysis.contactInformation.socialMedia.length > 0) {
        console.log(`\n   🌐 **Social Media Platforms:**`);
        websiteAnalysis.contactInformation.socialMedia.forEach((social, index) => {
          console.log(`      ${index + 1}. ${social.platform}: ${social.url}`);
        });
      }

      // 5. CONTENT STRATEGY ANALYSIS
      console.log(`\n📝 **5. CONTENT STRATEGY ANALYSIS**`);
      console.log(`   ✅ Content Themes: ${websiteAnalysis.contentStrategy.contentThemes.length} identified`);
      console.log(`   ✅ CTA Patterns: ${websiteAnalysis.contentStrategy.callToActionPatterns.length} detected`);
      console.log(`   ✅ Content Tone: ${websiteAnalysis.contentStrategy.contentTone}`);
      console.log(`   ✅ Customer Pain Points: ${websiteAnalysis.contentStrategy.customerPainPoints.length} identified`);
      console.log(`   ✅ Messaging Framework: ${websiteAnalysis.contentStrategy.messagingFramework.length} elements`);
      console.log(`   ✅ Blog Topics: ${websiteAnalysis.contentStrategy.blogTopics.length} identified`);
      console.log(`   ✅ Social Proof: ${websiteAnalysis.contentStrategy.socialProof.length} elements`);

      if (websiteAnalysis.contentStrategy.contentThemes.length > 0) {
        console.log(`\n   🎯 **Top Content Themes:**`);
        websiteAnalysis.contentStrategy.contentThemes.slice(0, 5).forEach((theme, index) => {
          console.log(`      ${index + 1}. ${theme}`);
        });
      }

      if (websiteAnalysis.contentStrategy.callToActionPatterns.length > 0) {
        console.log(`\n   🔥 **Sample CTAs:**`);
        websiteAnalysis.contentStrategy.callToActionPatterns.slice(0, 5).forEach((cta, index) => {
          console.log(`      ${index + 1}. "${cta}"`);
        });
      }

      // 6. TECHNICAL SEO ANALYSIS
      console.log(`\n🔧 **6. TECHNICAL SEO ANALYSIS**`);
      console.log(`   ✅ Meta Title: ${websiteAnalysis.technicalSEO.metaData.title ? 'Present' : 'Missing'}`);
      console.log(`   ✅ Meta Description: ${websiteAnalysis.technicalSEO.metaData.description ? 'Present' : 'Missing'}`);
      console.log(`   ✅ Meta Keywords: ${websiteAnalysis.technicalSEO.metaData.keywords.length} detected`);
      console.log(`   ✅ H1 Tags: ${websiteAnalysis.technicalSEO.headingStructure.h1.length} detected`);
      console.log(`   ✅ H2 Tags: ${websiteAnalysis.technicalSEO.headingStructure.h2.length} detected`);
      console.log(`   ✅ H3 Tags: ${websiteAnalysis.technicalSEO.headingStructure.h3.length} detected`);
      console.log(`   ✅ Structured Data: ${websiteAnalysis.technicalSEO.structuredData.length} items`);
      console.log(`   ✅ Alt Text Patterns: ${websiteAnalysis.technicalSEO.altTextPatterns.length} detected`);
      console.log(`   ✅ Internal Links: ${websiteAnalysis.technicalSEO.internalLinking.totalLinks} total`);

      if (websiteAnalysis.technicalSEO.headingStructure.h1.length > 0) {
        console.log(`\n   📋 **Main H1 Tags:**`);
        websiteAnalysis.technicalSEO.headingStructure.h1.slice(0, 3).forEach((h1, index) => {
          console.log(`      ${index + 1}. ${h1.substring(0, 100)}${h1.length > 100 ? '...' : ''}`);
        });
      }

      // 7. DATA QUALITY ASSESSMENT
      console.log(`\n📊 **7. DATA QUALITY ASSESSMENT**`);
      const completeness = websiteAnalysis.analysisMetadata.dataCompleteness;
      const confidence = websiteAnalysis.analysisMetadata.confidenceScore;
      
      console.log(`   📈 Data Completeness: ${completeness}%`);
      console.log(`   🎯 Confidence Score: ${confidence}%`);
      console.log(`   ⏱️  Processing Time: ${websiteAnalysis.analysisMetadata.processingTime}ms`);
      console.log(`   📄 Pages Analyzed: ${websiteAnalysis.analysisMetadata.pagesAnalyzed.length}`);
      console.log(`   ❌ Errors: ${websiteAnalysis.analysisMetadata.errors.length}`);

      // Quality rating
      if (completeness >= 80 && confidence >= 80) {
        console.log(`   ✅ **EXCELLENT** - High-quality data extraction`);
      } else if (completeness >= 60 && confidence >= 60) {
        console.log(`   ⚠️  **GOOD** - Adequate data extraction`);
      } else {
        console.log(`   ❌ **LIMITED** - Low-quality data extraction`);
      }

      // 8. EXPECTED VS ACTUAL DATA COMPARISON
      console.log(`\n🔍 **8. EXPECTED VS ACTUAL DATA COMPARISON**`);
      console.log(`   Expected: ${business.expectedData.services}`);
      console.log(`   Actual Services: ${websiteAnalysis.businessIntelligence.services.length} services detected`);
      console.log(`   Expected: ${business.expectedData.contact}`);
      console.log(`   Actual Contact: ${websiteAnalysis.contactInformation.phone.length + websiteAnalysis.contactInformation.email.length + websiteAnalysis.contactInformation.socialMedia.length} contact methods`);
      console.log(`   Expected: ${business.expectedData.businessIntel}`);
      console.log(`   Actual Business Intel: Mission=${websiteAnalysis.businessIntelligence.mission ? 'Yes' : 'No'}, Values=${websiteAnalysis.businessIntelligence.values.length}, Team=${websiteAnalysis.businessIntelligence.teamInfo.length}`);

      console.log(`\n✅ **EXTRACTION TEST COMPLETE FOR ${business.name}**`);

    } catch (error) {
      console.error(`❌ **EXTRACTION TEST FAILED FOR ${business.name}:**`, error.message);
      
      if (error.message.includes('fetch')) {
        console.log(`💡 **Possible Issues:**`);
        console.log(`   - Website may be blocking automated requests`);
        console.log(`   - Network connectivity issues`);
        console.log(`   - Website may be down or slow to respond`);
      }
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎯 **COMPREHENSIVE DATA EXTRACTION TEST COMPLETE**`);
  console.log(`${'='.repeat(80)}`);
}

// Run the comprehensive test
if (require.main === module) {
  testComprehensiveDataExtraction().catch(console.error);
}

export { testComprehensiveDataExtraction };
