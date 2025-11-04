import { BusinessProfileResolver } from '../business-profile/resolver';
import { analyzeWebsiteWithAI } from './business-intelligence-analyzer';
import { ComprehensiveAnalysis, BusinessIntelligenceReport } from './business-intelligence-analyzer';

export interface EnhancedBusinessProfile {
  // Original business profile data
  originalProfile: any;
  
  // Comprehensive website data
  websiteAnalysis: ComprehensiveAnalysis;
  
  // AI-powered business intelligence
  businessIntelligence: BusinessIntelligenceReport;
  
  // Enhanced profile data
  enhancedData: {
    services: Array<{ name: string; description: string; }>;
    keyFeatures: string[];
    competitiveAdvantages: string[];
    targetAudience: string;
    customerPainPoints: string[];
    valuePropositions: string[];
    pricingStrategy: string;
    marketPosition: string;
    brandPersonality: string[];
    contentStrategy: string[];
    seoKeywords: string[];
  };
  
  // Analysis metadata
  metadata: {
    analyzedAt: string;
    websiteUrl: string;
    analysisVersion: string;
    dataCompleteness: number; // 0-100%
    confidenceScore: number; // 0-100%
  };
}

export class EnhancedBusinessProfileResolver extends BusinessProfileResolver {
  
  /**
   * Enhanced analyze command that scrapes everything and provides deep insights
   */
  async analyzeWebsiteComprehensively(websiteUrl: string): Promise<EnhancedBusinessProfile> {
    console.log(`🔍 ANALYZE COMMAND: Starting comprehensive analysis of ${websiteUrl}`);
    
    try {
      // Step 1: Get original business profile (if exists)
      const originalProfile = await this.resolveBusinessProfile({
        websiteUrl,
        businessName: '',
        businessType: '',
        location: ''
      });
      
      // Step 2: Comprehensive website scraping + AI analysis
      const { websiteData, businessIntelligence } = await analyzeWebsiteWithAI(websiteUrl);
      
      // Step 3: Enhance business profile with scraped data
      const enhancedData = this.mergeAnalysisData(originalProfile, websiteData, businessIntelligence);
      
      // Step 4: Calculate completeness and confidence scores
      const metadata = this.calculateAnalysisMetadata(websiteUrl, websiteData, businessIntelligence);
      
      const enhancedProfile: EnhancedBusinessProfile = {
        originalProfile,
        websiteAnalysis: websiteData,
        businessIntelligence,
        enhancedData,
        metadata
      };
      
      console.log(`✅ ANALYZE COMPLETE: ${websiteUrl}`);
      console.log(`📊 Data Completeness: ${metadata.dataCompleteness}%`);
      console.log(`🎯 Confidence Score: ${metadata.confidenceScore}%`);
      console.log(`🏢 Business Type: ${businessIntelligence.businessProfile.businessType}`);
      console.log(`📱 Products Found: ${websiteData.businessIntel.products.length}`);
      console.log(`🖼️ Images Found: ${websiteData.mediaAssets.images.length}`);
      console.log(`💡 USPs Identified: ${businessIntelligence.competitiveAnalysis.uniqueSellingPropositions.length}`);
      
      return enhancedProfile;
      
    } catch (error) {
      console.error(`❌ ANALYZE FAILED for ${websiteUrl}:`, error);
      throw error;
    }
  }
  
  private mergeAnalysisData(
    originalProfile: any,
    websiteData: ComprehensiveAnalysis,
    businessIntel: BusinessIntelligenceReport
  ) {
    // Merge services from multiple sources
    const services = [
      ...businessIntel.offeringAnalysis.coreOfferings.map(offering => ({
        name: offering,
        description: `${offering} service based on website analysis`
      })),
      ...(websiteData.businessIntel.services || []).map(service => ({
        name: service,
        description: `${service} identified from website content`
      }))
    ];
    
    // Remove duplicates
    const uniqueServices = services.filter((service, index, self) => 
      index === self.findIndex(s => s.name.toLowerCase() === service.name.toLowerCase())
    );
    
    return {
      services: uniqueServices.slice(0, 10), // Limit to top 10
      keyFeatures: [
        ...businessIntel.offeringAnalysis.keyFeatures,
        ...websiteData.contentAnalysis.features.slice(0, 5)
      ].slice(0, 15),
      
      competitiveAdvantages: [
        ...businessIntel.competitiveAnalysis.competitiveAdvantages,
        ...businessIntel.competitiveAnalysis.uniqueSellingPropositions
      ].slice(0, 10),
      
      targetAudience: businessIntel.businessProfile.targetAudience || 'General audience',
      
      customerPainPoints: businessIntel.marketingIntel.customerPainPoints.slice(0, 8),
      
      valuePropositions: businessIntel.marketingIntel.valuePropositions.slice(0, 8),
      
      pricingStrategy: businessIntel.competitiveAnalysis.pricingStrategy,
      
      marketPosition: businessIntel.businessProfile.marketPosition,
      
      brandPersonality: businessIntel.marketingIntel.brandPersonality.slice(0, 6),
      
      contentStrategy: [
        ...businessIntel.contentRecommendations.contentPillars,
        ...businessIntel.contentRecommendations.adCampaignAngles.slice(0, 3)
      ].slice(0, 8),
      
      seoKeywords: businessIntel.contentRecommendations.seoKeywords.slice(0, 20)
    };
  }
  
  private calculateAnalysisMetadata(
    websiteUrl: string,
    websiteData: ComprehensiveAnalysis,
    businessIntel: BusinessIntelligenceReport
  ) {
    // Calculate data completeness (0-100%)
    const dataPoints = [
      websiteData.basicInfo.title,
      websiteData.basicInfo.description,
      websiteData.businessIntel.businessType,
      websiteData.businessIntel.contactInfo.email,
      websiteData.businessIntel.contactInfo.phone,
      businessIntel.businessProfile.targetAudience,
      businessIntel.competitiveAnalysis.uniqueSellingPropositions.length > 0,
      businessIntel.marketingIntel.valuePropositions.length > 0,
      businessIntel.offeringAnalysis.coreOfferings.length > 0,
      websiteData.mediaAssets.images.length > 0
    ];
    
    const completedPoints = dataPoints.filter(point => 
      point && point !== 'Unknown' && point !== ''
    ).length;
    
    const dataCompleteness = Math.round((completedPoints / dataPoints.length) * 100);
    
    // Calculate confidence score based on data quality
    let confidenceScore = 50; // Base score
    
    // Boost confidence for rich data
    if (websiteData.businessIntel.products.length > 0) confidenceScore += 10;
    if (websiteData.contentAnalysis.testimonials.length > 0) confidenceScore += 10;
    if (businessIntel.competitiveAnalysis.uniqueSellingPropositions.length >= 3) confidenceScore += 10;
    if (businessIntel.marketingIntel.customerPainPoints.length >= 3) confidenceScore += 10;
    if (websiteData.mediaAssets.images.length >= 10) confidenceScore += 5;
    if (websiteData.businessIntel.socialMedia.length > 0) confidenceScore += 5;
    
    confidenceScore = Math.min(confidenceScore, 100);
    
    return {
      analyzedAt: new Date().toISOString(),
      websiteUrl,
      analysisVersion: '1.0',
      dataCompleteness,
      confidenceScore
    };
  }
  
  /**
   * Generate enhanced business profile for content generation
   */
  generateEnhancedProfileForContent(enhancedProfile: EnhancedBusinessProfile) {
    const { businessIntelligence, enhancedData, websiteAnalysis } = enhancedProfile;
    
    return {
      // Core business info
      businessName: websiteAnalysis.basicInfo.title.split(' ')[0] || 'Business',
      businessType: businessIntelligence.businessProfile.businessType,
      industry: businessIntelligence.businessProfile.industry,
      location: websiteAnalysis.basicInfo.language === 'sw' ? 'Kenya' : 'Global',
      
      // Enhanced services and features
      services: enhancedData.services,
      keyFeatures: enhancedData.keyFeatures,
      competitiveAdvantages: enhancedData.competitiveAdvantages,
      
      // Marketing intelligence
      targetAudience: enhancedData.targetAudience,
      customerPainPoints: enhancedData.customerPainPoints,
      valuePropositions: enhancedData.valuePropositions,
      
      // Brand and positioning
      brandPersonality: enhancedData.brandPersonality,
      marketPosition: enhancedData.marketPosition,
      pricingStrategy: enhancedData.pricingStrategy,
      
      // Content recommendations
      contentStrategy: enhancedData.contentStrategy,
      seoKeywords: enhancedData.seoKeywords,
      
      // Media assets
      productImages: websiteAnalysis.mediaAssets.images
        .filter(img => img.type === 'product')
        .map(img => img.url)
        .slice(0, 10),
      
      logoUrl: websiteAnalysis.mediaAssets.logos[0] || '',
      
      // Contact information
      contact: {
        phone: websiteAnalysis.businessIntel.contactInfo.phone,
        email: websiteAnalysis.businessIntel.contactInfo.email,
        website: websiteAnalysis.basicInfo.url
      },
      
      // Analysis metadata
      analysisMetadata: enhancedProfile.metadata
    };
  }
}

// Usage example function
export async function analyzeCommand(websiteUrl: string): Promise<EnhancedBusinessProfile> {
  const resolver = new EnhancedBusinessProfileResolver();
  
  console.log(`🚀 ANALYZE: ${websiteUrl}`);
  console.log(`📋 This will scrape EVERYTHING and provide deep business intelligence...`);
  
  const enhancedProfile = await resolver.analyzeWebsiteComprehensively(websiteUrl);
  
  // Generate summary report
  console.log(`\n📊 ANALYSIS SUMMARY:`);
  console.log(`🏢 Business: ${enhancedProfile.businessIntelligence.businessProfile.businessType}`);
  console.log(`🎯 Target: ${enhancedProfile.enhancedData.targetAudience}`);
  console.log(`🛍️ Products: ${enhancedProfile.websiteAnalysis.businessIntel.products.length}`);
  console.log(`🖼️ Images: ${enhancedProfile.websiteAnalysis.mediaAssets.images.length}`);
  console.log(`💡 USPs: ${enhancedProfile.businessIntelligence.competitiveAnalysis.uniqueSellingPropositions.length}`);
  console.log(`📈 Opportunities: ${enhancedProfile.businessIntelligence.opportunities.marketGaps.length}`);
  console.log(`✅ Completeness: ${enhancedProfile.metadata.dataCompleteness}%`);
  console.log(`🎯 Confidence: ${enhancedProfile.metadata.confidenceScore}%`);
  
  return enhancedProfile;
}
