'use server';

import { analyzeWebsiteWithAI } from '@/ai/website-analyzer/business-intelligence-analyzer';
import { analyzeCommand } from '@/ai/website-analyzer/enhanced-business-resolver';

export interface EnhancedAnalysisResult {
  success: boolean;
  data?: {
    // Basic brand info
    businessName: string;
    description: string;
    businessType: string;
    industry: string;
    location: string;
    
    // Enhanced product/service data
    products: Array<{
      name: string;
      price?: string;
      category: string;
      inStock: boolean;
      description?: string;
    }>;
    
    services: Array<{
      name: string;
      description: string;
    }>;
    
    // Complete feature analysis
    keyFeatures: string[];
    competitiveAdvantages: string[];
    uniqueSellingPropositions: string[];
    
    // Customer intelligence
    targetAudience: string;
    customerPainPoints: string[];
    valuePropositions: string[];
    
    // Marketing intelligence
    brandPersonality: string[];
    contentStrategy: string[];
    adCampaignAngles: string[];
    seoKeywords: string[];
    
    // Media assets
    productImages: string[];
    logoUrls: string[];
    totalImagesFound: number;
    
    // Contact information
    contactInfo: {
      phone?: string;
      email?: string;
      address?: string;
      website?: string;
      socialMedia: Array<{
        platform: string;
        url: string;
      }>;
    };
    
    // Business opportunities
    marketGaps: string[];
    contentOpportunities: string[];
    improvementAreas: string[];
    
    // Analysis metadata
    analysisMetadata: {
      dataCompleteness: number;
      confidenceScore: number;
      productsFound: number;
      imagesDownloaded: number;
      analysisVersion: string;
    };
  };
  error?: string;
  errorType?: 'blocked' | 'timeout' | 'error';
}

/**
 * Enhanced analyze action that scrapes EVERYTHING from a website
 * and provides comprehensive business intelligence
 */
export async function enhancedAnalyzeBrandAction(
  websiteUrl: string,
  designImageUris: string[] = []
): Promise<EnhancedAnalysisResult> {
  try {
    console.log(`🚀 Starting enhanced analysis for: ${websiteUrl}`);
    
    // Step 1: URL Validation
    if (!websiteUrl || !websiteUrl.trim()) {
      return {
        success: false,
        error: "Website URL is required",
        errorType: 'error'
      };
    }

    let normalizedUrl = websiteUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      return {
        success: false,
        error: "Invalid URL format. Please enter a valid website URL.",
        errorType: 'error'
      };
    }

    // Step 2: Run comprehensive analysis
    console.log(`🔍 Running comprehensive website analysis...`);
    const enhancedProfile = await analyzeCommand(normalizedUrl);
    
    // Step 3: Extract and format the data
    const { websiteAnalysis, businessIntelligence, enhancedData } = enhancedProfile;
    
    console.log(`✅ Enhanced analysis complete!`);
    console.log(`📊 Products found: ${websiteAnalysis.businessIntel.products.length}`);
    console.log(`🖼️ Images found: ${websiteAnalysis.mediaAssets.images.length}`);
    console.log(`💡 USPs identified: ${businessIntelligence.competitiveAnalysis.uniqueSellingPropositions.length}`);
    
    return {
      success: true,
      data: {
        // Basic brand info
        businessName: websiteAnalysis.basicInfo.title.split(' ')[0] || 'Business',
        description: websiteAnalysis.basicInfo.description,
        businessType: businessIntelligence.businessProfile.businessType,
        industry: businessIntelligence.businessProfile.industry,
        location: websiteAnalysis.basicInfo.language === 'sw' ? 'Kenya' : 'Global',
        
        // Enhanced product data
        products: websiteAnalysis.businessIntel.products.map(product => ({
          name: product.name,
          price: product.price,
          category: product.category || 'General',
          inStock: product.inStock !== false,
          description: product.description || ''
        })),
        
        // Enhanced services
        services: enhancedData.services,
        
        // Complete feature analysis
        keyFeatures: enhancedData.keyFeatures,
        competitiveAdvantages: enhancedData.competitiveAdvantages,
        uniqueSellingPropositions: businessIntelligence.competitiveAnalysis.uniqueSellingPropositions,
        
        // Customer intelligence
        targetAudience: enhancedData.targetAudience,
        customerPainPoints: enhancedData.customerPainPoints,
        valuePropositions: enhancedData.valuePropositions,
        
        // Marketing intelligence
        brandPersonality: enhancedData.brandPersonality,
        contentStrategy: enhancedData.contentStrategy,
        adCampaignAngles: businessIntelligence.contentRecommendations.adCampaignAngles,
        seoKeywords: enhancedData.seoKeywords,
        
        // Media assets
        productImages: websiteAnalysis.mediaAssets.images
          .filter(img => img.type === 'product')
          .map(img => img.url),
        logoUrls: websiteAnalysis.mediaAssets.logos,
        totalImagesFound: websiteAnalysis.mediaAssets.images.length,
        
        // Contact information
        contactInfo: {
          phone: websiteAnalysis.businessIntel.contactInfo.phone,
          email: websiteAnalysis.businessIntel.contactInfo.email,
          address: websiteAnalysis.businessIntel.contactInfo.address,
          website: websiteAnalysis.basicInfo.url,
          socialMedia: websiteAnalysis.businessIntel.socialMedia.map(social => ({
            platform: social.platform,
            url: social.url
          }))
        },
        
        // Business opportunities
        marketGaps: businessIntelligence.opportunities.marketGaps,
        contentOpportunities: businessIntelligence.opportunities.contentOpportunities,
        improvementAreas: businessIntelligence.opportunities.improvementAreas,
        
        // Analysis metadata
        analysisMetadata: {
          dataCompleteness: enhancedProfile.metadata.dataCompleteness,
          confidenceScore: enhancedProfile.metadata.confidenceScore,
          productsFound: websiteAnalysis.businessIntel.products.length,
          imagesDownloaded: websiteAnalysis.mediaAssets.images.length,
          analysisVersion: enhancedProfile.metadata.analysisVersion
        }
      }
    };

  } catch (error: any) {
    console.error('❌ Enhanced analysis failed:', error);
    return {
      success: false,
      error: error.message || "Enhanced analysis failed",
      errorType: 'error'
    };
  }
}

/**
 * Test function to demonstrate the enhanced analysis
 */
export async function testEnhancedAnalysis(websiteUrl: string = 'https://zentechelectronics.com/') {
  console.log(`🧪 Testing enhanced analysis with: ${websiteUrl}`);
  
  const result = await enhancedAnalyzeBrandAction(websiteUrl);
  
  if (result.success && result.data) {
    console.log(`\n✅ ENHANCED ANALYSIS RESULTS:`);
    console.log(`🏢 Business: ${result.data.businessName}`);
    console.log(`📊 Business Type: ${result.data.businessType}`);
    console.log(`🛍️ Products Found: ${result.data.products.length}`);
    console.log(`🖼️ Images Found: ${result.data.totalImagesFound}`);
    console.log(`💡 USPs: ${result.data.uniqueSellingPropositions.length}`);
    console.log(`🎯 Pain Points: ${result.data.customerPainPoints.length}`);
    console.log(`📈 Opportunities: ${result.data.marketGaps.length}`);
    console.log(`📊 Data Completeness: ${result.data.analysisMetadata.dataCompleteness}%`);
    console.log(`🎯 Confidence: ${result.data.analysisMetadata.confidenceScore}%`);
    
    // Show sample products
    if (result.data.products.length > 0) {
      console.log(`\n🛍️ SAMPLE PRODUCTS:`);
      result.data.products.slice(0, 3).forEach(product => {
        console.log(`   • ${product.name} - ${product.price || 'Price not found'} (${product.category})`);
      });
    }
    
    // Show sample USPs
    if (result.data.uniqueSellingPropositions.length > 0) {
      console.log(`\n💡 UNIQUE SELLING POINTS:`);
      result.data.uniqueSellingPropositions.slice(0, 3).forEach(usp => {
        console.log(`   • ${usp}`);
      });
    }
    
    // Show contact info
    console.log(`\n📞 CONTACT INFO:`);
    console.log(`   Phone: ${result.data.contactInfo.phone || 'Not found'}`);
    console.log(`   Email: ${result.data.contactInfo.email || 'Not found'}`);
    console.log(`   Social Media: ${result.data.contactInfo.socialMedia.length} platforms`);
    
  } else {
    console.log(`❌ Analysis failed: ${result.error}`);
  }
  
  return result;
}
