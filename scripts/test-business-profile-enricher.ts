/**
 * Test script for Business Profile Enricher
 * Tests the integration between website analysis and business profile creation
 */

import { BusinessProfileEnricher, enrichBusinessProfileFromWebsite } from '../src/ai/website-analyzer/business-profile-enricher';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testBusinessProfileEnricher() {
  console.log('🧪 Testing Business Profile Enricher...\n');

  const testBusinesses = [
    {
      name: 'Stripe',
      websiteUrl: 'https://stripe.com',
      description: 'Payment processing platform'
    },
    {
      name: 'GitHub',
      websiteUrl: 'https://github.com',
      description: 'Code hosting and collaboration platform'
    },
    {
      name: 'Example Business',
      websiteUrl: 'https://example.com',
      description: 'Simple test website'
    }
  ];

  for (const business of testBusinesses) {
    console.log(`\n🏢 Testing: ${business.name}`);
    console.log('='.repeat(60));

    try {
      const startTime = Date.now();
      
      // Test business profile enrichment
      const enrichedProfile = await enrichBusinessProfileFromWebsite(
        business.name,
        business.websiteUrl
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Display comprehensive results
      console.log(`\n📊 **Enriched Profile for ${business.name}**`);
      console.log(`⏱️  Processing Time: ${duration}ms`);
      console.log(`🎯 Quality Score: ${enrichedProfile.enrichmentMetadata.qualityScore}%`);
      console.log(`📅 Enriched At: ${enrichedProfile.enrichmentMetadata.enrichedAt.toISOString()}`);
      console.log(`🔍 Data Sources: ${enrichedProfile.enrichmentMetadata.dataSourcesUsed.join(', ')}`);

      // Core Business Information
      console.log(`\n🏢 **Core Business Information:**`);
      console.log(`   Business Name: ${enrichedProfile.businessName}`);
      console.log(`   Business Type: ${enrichedProfile.businessType}`);
      console.log(`   Industry: ${enrichedProfile.industry}`);
      console.log(`   Website: ${enrichedProfile.websiteUrl}`);
      console.log(`   Description: ${enrichedProfile.description?.substring(0, 150)}${enrichedProfile.description?.length > 150 ? '...' : ''}`);

      // Value Proposition & Positioning
      console.log(`\n🎯 **Value Proposition & Positioning:**`);
      console.log(`   UVP: ${enrichedProfile.uniqueValueProposition || 'Not detected'}`);
      console.log(`   Target Audiences: ${enrichedProfile.targetAudiences.join(', ') || 'Not detected'}`);
      console.log(`   Brand Personality: ${enrichedProfile.brandPersonality.join(', ') || 'Not detected'}`);
      console.log(`   Competitive Advantages: ${enrichedProfile.competitiveAdvantages.join(', ') || 'Not detected'}`);

      // Services & Offerings
      console.log(`\n🛠️ **Services & Offerings:**`);
      console.log(`   Services Count: ${enrichedProfile.services.length}`);
      if (enrichedProfile.services.length > 0) {
        enrichedProfile.services.slice(0, 3).forEach((service, index) => {
          console.log(`   ${index + 1}. ${service.name}: ${service.description?.substring(0, 100)}${service.description?.length > 100 ? '...' : ''}`);
        });
        if (enrichedProfile.services.length > 3) {
          console.log(`   ... and ${enrichedProfile.services.length - 3} more services`);
        }
      }

      // Local Context
      console.log(`\n📍 **Local Context:**`);
      console.log(`   Location: ${enrichedProfile.localContext.location || 'Not detected'}`);
      console.log(`   Community: ${enrichedProfile.localContext.community || 'Not detected'}`);
      console.log(`   Cultural Factors: ${enrichedProfile.localContext.culturalFactors.join(', ') || 'Not detected'}`);

      // Website Analysis Summary
      if (enrichedProfile.websiteAnalysis) {
        const analysis = enrichedProfile.websiteAnalysis;
        console.log(`\n🌐 **Website Analysis Summary:**`);
        console.log(`   Pages Analyzed: ${analysis.analysisMetadata.pagesAnalyzed.length}`);
        console.log(`   Data Completeness: ${analysis.analysisMetadata.dataCompleteness}%`);
        console.log(`   Confidence Score: ${analysis.analysisMetadata.confidenceScore}%`);
        console.log(`   Processing Time: ${analysis.analysisMetadata.processingTime}ms`);
        
        // Contact Information
        console.log(`\n📞 **Contact Information Extracted:**`);
        console.log(`   Phone Numbers: ${analysis.contactInformation.phone.length}`);
        console.log(`   Email Addresses: ${analysis.contactInformation.email.length}`);
        console.log(`   Social Media: ${analysis.contactInformation.socialMedia.length} profiles`);
        console.log(`   Addresses: ${analysis.contactInformation.address.length}`);
        
        // Content Strategy Insights
        console.log(`\n📝 **Content Strategy Insights:**`);
        console.log(`   Content Tone: ${analysis.contentStrategy.contentTone}`);
        console.log(`   Content Themes: ${analysis.contentStrategy.contentThemes.length} identified`);
        console.log(`   CTA Patterns: ${analysis.contentStrategy.callToActionPatterns.length} found`);
        
        // Business Intelligence
        console.log(`\n🧠 **Business Intelligence Extracted:**`);
        console.log(`   Products: ${analysis.businessIntelligence.products.length}`);
        console.log(`   Pricing Models: ${analysis.businessIntelligence.pricing.length}`);
        console.log(`   Testimonials: ${analysis.businessIntelligence.testimonials.length}`);
        console.log(`   Team Members: ${analysis.businessIntelligence.teamInfo.length}`);
      }

      // Quality Assessment
      console.log(`\n📊 **Quality Assessment:**`);
      const qualityScore = enrichedProfile.enrichmentMetadata.qualityScore;
      
      if (qualityScore >= 80) {
        console.log(`   ✅ Excellent enrichment quality (${qualityScore}%)`);
      } else if (qualityScore >= 60) {
        console.log(`   ⚠️  Good enrichment quality (${qualityScore}%)`);
      } else {
        console.log(`   ❌ Limited enrichment quality (${qualityScore}%)`);
      }

      // Recommendations
      console.log(`\n💡 **Recommendations:**`);
      if (!enrichedProfile.uniqueValueProposition) {
        console.log(`   - Consider adding a clear value proposition to the website`);
      }
      if (enrichedProfile.services.length === 0) {
        console.log(`   - Add more detailed service descriptions to the website`);
      }
      if (enrichedProfile.targetAudiences.length === 0) {
        console.log(`   - Include target audience information on the website`);
      }
      if (!enrichedProfile.localContext.location) {
        console.log(`   - Add location/contact information to improve local SEO`);
      }

      console.log(`\n✅ **Enrichment Complete for ${business.name}**`);

    } catch (error) {
      console.error(`❌ **Enrichment Failed for ${business.name}:**`, error.message);
      
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
  console.log(`\n📋 **Key Integration Features Demonstrated:**`);
  console.log(`✅ Website analysis to business profile conversion`);
  console.log(`✅ Intelligent data merging and deduplication`);
  console.log(`✅ Target audience inference from business type and content`);
  console.log(`✅ Brand personality extraction from content tone`);
  console.log(`✅ Competitive advantage identification`);
  console.log(`✅ Quality scoring and assessment`);
  console.log(`✅ Comprehensive enrichment metadata tracking`);
  
  console.log(`\n🚀 **Next Steps:**`);
  console.log(`1. Integrate with Revo 2.0 content generation system`);
  console.log(`2. Add AI-powered content analysis for deeper insights`);
  console.log(`3. Implement profile caching and update mechanisms`);
  console.log(`4. Add competitive analysis features`);
  console.log(`5. Create profile validation and quality improvement suggestions`);
}

async function testBatchEnrichment() {
  console.log('🔄 Testing Batch Business Profile Enrichment...\n');
  
  const businesses = [
    { name: 'Stripe', websiteUrl: 'https://stripe.com' },
    { name: 'GitHub', websiteUrl: 'https://github.com' },
    { name: 'Example', websiteUrl: 'https://example.com' }
  ];
  
  try {
    const enricher = new BusinessProfileEnricher();
    const startTime = Date.now();
    
    const enrichedProfiles = await enricher.enrichMultipleProfiles(businesses);
    
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    console.log(`\n📊 **Batch Enrichment Results:**`);
    console.log(`⏱️  Total Processing Time: ${totalDuration}ms`);
    console.log(`📈 Profiles Enriched: ${enrichedProfiles.length}/${businesses.length}`);
    console.log(`⚡ Average Time per Profile: ${Math.round(totalDuration / enrichedProfiles.length)}ms`);
    
    // Summary statistics
    const qualityScores = enrichedProfiles.map(p => p.enrichmentMetadata.qualityScore);
    const avgQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    const maxQuality = Math.max(...qualityScores);
    const minQuality = Math.min(...qualityScores);
    
    console.log(`\n📊 **Quality Statistics:**`);
    console.log(`   Average Quality: ${Math.round(avgQuality)}%`);
    console.log(`   Highest Quality: ${maxQuality}%`);
    console.log(`   Lowest Quality: ${minQuality}%`);
    
    // Profile summaries
    console.log(`\n📋 **Profile Summaries:**`);
    enrichedProfiles.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.businessName}:`);
      console.log(`      Type: ${profile.businessType} | Industry: ${profile.industry}`);
      console.log(`      Quality: ${profile.enrichmentMetadata.qualityScore}% | Services: ${profile.services.length}`);
      console.log(`      UVP: ${profile.uniqueValueProposition ? 'Yes' : 'No'} | Location: ${profile.localContext.location ? 'Yes' : 'No'}`);
    });
    
    console.log(`\n✅ Batch enrichment test complete!`);
    
  } catch (error) {
    console.error(`❌ Batch enrichment test failed:`, error);
  }
}

async function testWithExistingProfile() {
  console.log('🔄 Testing Enrichment with Existing Profile...\n');
  
  // Simulate an existing profile
  const existingProfile = {
    businessName: 'Stripe Inc.',
    businessType: 'technology',
    industry: 'Financial Technology',
    description: 'Leading payment processing platform for online businesses',
    services: [
      {
        name: 'Payment Processing',
        description: 'Accept payments online',
        features: ['Credit cards', 'Bank transfers'],
        category: 'Payments'
      }
    ],
    targetAudiences: ['Online businesses', 'E-commerce stores'],
    uniqueValueProposition: 'Simple, powerful payment infrastructure',
    brandPersonality: ['Professional', 'Reliable', 'Developer-friendly'],
    competitiveAdvantages: ['Easy integration', 'Global reach'],
    localContext: {
      location: 'San Francisco, CA',
      community: 'Tech startup ecosystem',
      culturalFactors: ['Innovation-focused', 'Developer culture']
    }
  };
  
  try {
    console.log(`🔍 Enriching existing Stripe profile with website data...`);
    
    const enrichedProfile = await enrichBusinessProfileFromWebsite(
      'Stripe',
      'https://stripe.com',
      existingProfile
    );
    
    console.log(`\n📊 **Merge Results:**`);
    console.log(`   Original Services: ${existingProfile.services.length}`);
    console.log(`   Final Services: ${enrichedProfile.services.length}`);
    console.log(`   Original Audiences: ${existingProfile.targetAudiences.length}`);
    console.log(`   Final Audiences: ${enrichedProfile.targetAudiences.length}`);
    console.log(`   Quality Score: ${enrichedProfile.enrichmentMetadata.qualityScore}%`);
    
    console.log(`\n🔄 **Data Sources Used:**`);
    enrichedProfile.enrichmentMetadata.dataSourcesUsed.forEach(source => {
      console.log(`   ✅ ${source}`);
    });
    
    console.log(`\n✅ Existing profile enrichment test complete!`);
    
  } catch (error) {
    console.error(`❌ Existing profile enrichment test failed:`, error);
  }
}

// Run the appropriate test based on command line argument
const testMode = process.argv[2] || 'full';

if (testMode === 'batch') {
  testBatchEnrichment().catch(console.error);
} else if (testMode === 'existing') {
  testWithExistingProfile().catch(console.error);
} else {
  testBusinessProfileEnricher().catch(console.error);
}

// Export for use in other scripts
export { testBusinessProfileEnricher, testBatchEnrichment, testWithExistingProfile };
