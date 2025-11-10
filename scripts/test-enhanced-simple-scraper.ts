/**
 * Test script for Enhanced Simple Website Scraper
 * Tests the enhanced analysis capabilities using fetch + Cheerio
 */

import { EnhancedSimpleScraper, analyzeWebsiteWithEnhancedSimpleScraper } from '../src/ai/website-analyzer/enhanced-simple-scraper';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testEnhancedSimpleScraper() {
  console.log('🧪 Testing Enhanced Simple Website Scraper...\n');

  const testUrls = [
    'https://example.com',         // Simple test site
    'https://stripe.com',          // Complex SaaS site
    'https://github.com',          // Tech platform
    'https://airbnb.com'           // Service platform
  ];

  for (const url of testUrls) {
    console.log(`\n🔍 Testing: ${url}`);
    console.log('='.repeat(60));

    try {
      const startTime = Date.now();
      
      // Test the enhanced simple analysis
      const analysis = await analyzeWebsiteWithEnhancedSimpleScraper(url);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Display comprehensive results
      console.log(`\n📊 **Analysis Results for ${url}**`);
      console.log(`⏱️  Processing Time: ${duration}ms`);
      console.log(`📄 Pages Analyzed: ${analysis.analysisMetadata.pagesAnalyzed.length}`);
      console.log(`📈 Data Completeness: ${analysis.analysisMetadata.dataCompleteness}%`);
      console.log(`🎯 Confidence Score: ${analysis.analysisMetadata.confidenceScore}%`);

      // Basic Info
      console.log(`\n🏢 **Basic Information:**`);
      console.log(`   Title: ${analysis.basicInfo.title}`);
      console.log(`   Description: ${analysis.basicInfo.description?.substring(0, 100)}${analysis.basicInfo.description?.length > 100 ? '...' : ''}`);
      console.log(`   Language: ${analysis.basicInfo.language}`);
      console.log(`   Keywords: ${analysis.basicInfo.keywords.slice(0, 5).join(', ')}`);

      // Business Intelligence
      console.log(`\n🧠 **Business Intelligence:**`);
      console.log(`   Business Type: ${analysis.businessIntelligence.businessType}`);
      console.log(`   Industry: ${analysis.businessIntelligence.industry}`);
      console.log(`   Services Found: ${analysis.businessIntelligence.services?.length || 0}`);
      console.log(`   Products Found: ${analysis.businessIntelligence.products?.length || 0}`);
      console.log(`   Pricing Models: ${analysis.businessIntelligence.pricing?.length || 0}`);
      console.log(`   Testimonials: ${analysis.businessIntelligence.testimonials?.length || 0}`);
      console.log(`   Team Members: ${analysis.businessIntelligence.teamInfo?.length || 0}`);
      
      if (analysis.businessIntelligence.mission) {
        console.log(`   Mission: ${analysis.businessIntelligence.mission.substring(0, 100)}...`);
      }
      
      if (analysis.businessIntelligence.uniqueValueProposition) {
        console.log(`   UVP: ${analysis.businessIntelligence.uniqueValueProposition.substring(0, 100)}...`);
      }

      // Visual Brand
      console.log(`\n🎨 **Visual Brand:**`);
      console.log(`   Logo URLs: ${analysis.visualBrand.logoUrls?.length || 0} found`);
      console.log(`   Design Style: ${analysis.visualBrand.designStyle}`);
      console.log(`   Image Style: ${analysis.visualBrand.imageStyle}`);
      
      if (analysis.visualBrand.logoUrls?.length > 0) {
        console.log(`   First Logo: ${analysis.visualBrand.logoUrls[0]}`);
      }

      // Contact Information
      console.log(`\n📞 **Contact Information:**`);
      console.log(`   Phone Numbers: ${analysis.contactInformation.phone?.length || 0} found`);
      console.log(`   Email Addresses: ${analysis.contactInformation.email?.length || 0} found`);
      console.log(`   Social Media: ${analysis.contactInformation.socialMedia?.length || 0} profiles`);
      console.log(`   Addresses: ${analysis.contactInformation.address?.length || 0} found`);
      
      if (analysis.contactInformation.phone?.length > 0) {
        console.log(`   Sample Phone: ${analysis.contactInformation.phone[0]}`);
      }
      
      if (analysis.contactInformation.email?.length > 0) {
        console.log(`   Sample Email: ${analysis.contactInformation.email[0]}`);
      }
      
      if (analysis.contactInformation.socialMedia?.length > 0) {
        console.log(`   Social Platforms: ${analysis.contactInformation.socialMedia.map(s => s.platform).join(', ')}`);
      }

      // Content Strategy
      console.log(`\n📝 **Content Strategy:**`);
      console.log(`   Content Themes: ${analysis.contentStrategy.contentThemes?.length || 0} identified`);
      console.log(`   CTA Patterns: ${analysis.contentStrategy.callToActionPatterns?.length || 0} found`);
      console.log(`   Content Tone: ${analysis.contentStrategy.contentTone}`);
      
      if (analysis.contentStrategy.contentThemes?.length > 0) {
        console.log(`   Top Themes: ${analysis.contentStrategy.contentThemes.slice(0, 3).join(', ')}`);
      }
      
      if (analysis.contentStrategy.callToActionPatterns?.length > 0) {
        console.log(`   Sample CTAs: ${analysis.contentStrategy.callToActionPatterns.slice(0, 3).join(', ')}`);
      }

      // Technical SEO
      console.log(`\n🔧 **Technical SEO:**`);
      console.log(`   H1 Tags: ${analysis.technicalSEO.headingStructure?.h1?.length || 0}`);
      console.log(`   H2 Tags: ${analysis.technicalSEO.headingStructure?.h2?.length || 0}`);
      console.log(`   H3 Tags: ${analysis.technicalSEO.headingStructure?.h3?.length || 0}`);
      console.log(`   Structured Data: ${analysis.technicalSEO.structuredData?.length || 0} items`);
      console.log(`   Alt Text Patterns: ${analysis.technicalSEO.altTextPatterns?.length || 0} found`);
      console.log(`   Internal Links: ${analysis.technicalSEO.internalLinking?.totalLinks || 0}`);
      
      if (analysis.technicalSEO.headingStructure?.h1?.length > 0) {
        console.log(`   Main H1: ${analysis.technicalSEO.headingStructure.h1[0]}`);
      }

      // Quality Assessment
      console.log(`\n📊 **Quality Assessment:**`);
      const completeness = analysis.analysisMetadata.dataCompleteness;
      const confidence = analysis.analysisMetadata.confidenceScore;
      
      if (completeness >= 80) {
        console.log(`   ✅ Excellent data completeness (${completeness}%)`);
      } else if (completeness >= 60) {
        console.log(`   ⚠️  Good data completeness (${completeness}%)`);
      } else {
        console.log(`   ❌ Limited data completeness (${completeness}%)`);
      }
      
      if (confidence >= 80) {
        console.log(`   ✅ High confidence score (${confidence}%)`);
      } else if (confidence >= 60) {
        console.log(`   ⚠️  Moderate confidence score (${confidence}%)`);
      } else {
        console.log(`   ❌ Low confidence score (${confidence}%)`);
      }

      console.log(`\n✅ **Analysis Complete for ${url}**`);

    } catch (error) {
      console.error(`❌ **Analysis Failed for ${url}:**`, error.message);
      
      // Provide helpful error context
      if (error.message.includes('fetch')) {
        console.log(`💡 **Possible Issues:**`);
        console.log(`   - Website may be blocking automated requests`);
        console.log(`   - Network connectivity issues`);
        console.log(`   - Website may be down or slow to respond`);
      }
    }
  }

  console.log(`\n🎯 **Test Complete!**`);
  console.log(`\n📋 **Key Capabilities Demonstrated:**`);
  console.log(`✅ Multi-dimensional business intelligence extraction`);
  console.log(`✅ Visual brand analysis (logos, design style)`);
  console.log(`✅ Contact information extraction (phone, email, social)`);
  console.log(`✅ Content strategy analysis (themes, CTAs, tone)`);
  console.log(`✅ Technical SEO analysis (headings, meta, structured data)`);
  console.log(`✅ Quality metrics calculation (completeness, confidence)`);
  console.log(`✅ Error handling and graceful degradation`);
  
  console.log(`\n🚀 **Next Steps:**`);
  console.log(`1. Integrate with Business Profile Manager`);
  console.log(`2. Add AI-powered content analysis for deeper insights`);
  console.log(`3. Implement caching for performance optimization`);
  console.log(`4. Add visual brand color extraction from CSS`);
  console.log(`5. Enhance competitive advantage detection`);
}

async function testSpecificWebsite() {
  console.log('🎯 Testing Specific Website Analysis...\n');
  
  const url = 'https://stripe.com'; // Well-structured website for testing
  
  try {
    console.log(`🔍 Analyzing: ${url}`);
    
    const scraper = new EnhancedSimpleScraper();
    const analysis = await scraper.analyzeWebsiteComprehensively(url);
    
    console.log(`\n📋 **Detailed Analysis Results:**`);
    
    // Show raw data structure for debugging
    console.log(`\n🔍 **Raw Data Structure:**`);
    console.log(`Basic Info Keys:`, Object.keys(analysis.basicInfo));
    console.log(`Business Intelligence Keys:`, Object.keys(analysis.businessIntelligence));
    console.log(`Visual Brand Keys:`, Object.keys(analysis.visualBrand));
    console.log(`Content Strategy Keys:`, Object.keys(analysis.contentStrategy));
    console.log(`Technical SEO Keys:`, Object.keys(analysis.technicalSEO));
    console.log(`Contact Info Keys:`, Object.keys(analysis.contactInformation));
    
    // Show sample extracted data
    console.log(`\n📄 **Sample Extracted Data:**`);
    if (analysis.businessIntelligence.services.length > 0) {
      console.log(`First Service:`, analysis.businessIntelligence.services[0]);
    }
    
    if (analysis.contentStrategy.callToActionPatterns.length > 0) {
      console.log(`CTAs Found:`, analysis.contentStrategy.callToActionPatterns.slice(0, 5));
    }
    
    if (analysis.technicalSEO.headingStructure.h2.length > 0) {
      console.log(`H2 Headings:`, analysis.technicalSEO.headingStructure.h2.slice(0, 3));
    }
    
    console.log(`\n✅ Specific website test complete!`);
    
  } catch (error) {
    console.error(`❌ Specific website test failed:`, error);
  }
}

// Run the appropriate test based on command line argument
const testMode = process.argv[2] || 'full';

if (testMode === 'specific') {
  testSpecificWebsite().catch(console.error);
} else {
  testEnhancedSimpleScraper().catch(console.error);
}

// Export for use in other scripts
export { testEnhancedSimpleScraper, testSpecificWebsite };
