/**
 * ENHANCED Business Intelligence Gatherer
 * 
 * Deeply understands:
 * 1. What the business actually does (core offering)
 * 2. Who it's for (real target market)
 * 3. Local context (where it operates and cultural nuances)
 * 
 * Uses Smart Business Analyzer for intelligent fallback without external AI dependency
 */

import type { BusinessTypeCategory } from '../adaptive/business-type-detector';
import { smartBusinessAnalyzer } from './smart-business-analyzer';

export interface BusinessIntelligenceRequest {
  brandProfile: any;
  businessType: BusinessTypeCategory;
  platform: string;
  location?: string;
}

export interface CompetitiveAnalysis {
  mainCompetitors: string[];
  marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
  competitiveAdvantages: string[];
  marketGaps: string[];
  differentiationOpportunities: string[];
}

export interface CustomerInsights {
  primaryAudience: string;
  painPoints: string[];
  motivations: string[];
  preferredChannels: string[];
  demographicProfile: string;
  behaviorPatterns: string[];
}

export interface MarketIntelligence {
  marketSize: string;
  growthTrends: string[];
  seasonalPatterns: string[];
  pricingStrategy: string;
  distributionChannels: string[];
  regulatoryFactors: string[];
}

export interface ContentStrategy {
  keyMessages: string[];
  valuePropositions: string[];
  contentPillars: string[];
  toneOfVoice: string;
  contentTypes: string[];
  engagementTactics: string[];
}

export interface BusinessIntelligenceResult {
  competitive: CompetitiveAnalysis;
  customer: CustomerInsights;
  market: MarketIntelligence;
  content: ContentStrategy;
  businessContext: {
    strengths: string[];
    opportunities: string[];
    challenges: string[];
    uniqueSellingPoints: string[];
  };
  recommendations: {
    immediate: string[];
    strategic: string[];
    content: string[];
  };
  // Core business understanding
  coreBusinessUnderstanding: {
    whatTheyDo: string;
    whoItsFor: string;
    howTheyDoIt: string;
    whyItMatters: string;
    localContext: string;
  };
}

/**
 * Enhanced Business Intelligence Gatherer Class
 * Uses Smart Business Analyzer for intelligent, AI-free analysis
 */
export class EnhancedBusinessIntelligenceGatherer {

  /**
   * Main intelligence gathering method with enhanced business understanding
   */
  async gatherBusinessIntelligence(request: BusinessIntelligenceRequest): Promise<BusinessIntelligenceResult> {
    console.log(`🧠 [Enhanced BI] Gathering deep intelligence for ${request.brandProfile.businessName}`);
    console.log(`📊 [Enhanced BI] Business type: ${request.businessType}, Platform: ${request.platform}`);

    const startTime = Date.now();
    const location = request.location || request.brandProfile.location || 'the local area';

    // Use Smart Business Analyzer for intelligent analysis
    const smartAnalysis = smartBusinessAnalyzer.analyzeBusinessProfile(
      request.brandProfile,
      request.businessType,
      location
    );

    // STEP 0: Core Business Understanding
    const coreBusinessUnderstanding = {
      whatTheyDo: smartAnalysis.whatTheyDo,
      whoItsFor: smartAnalysis.whoItsFor,
      howTheyDoIt: smartAnalysis.howTheyDoIt,
      whyItMatters: smartAnalysis.whyItMatters,
      localContext: smartAnalysis.localContext
    };

    console.log(`✅ [Enhanced BI] Core business understanding:`);
    console.log(`   📍 What they do: ${coreBusinessUnderstanding.whatTheyDo}`);
    console.log(`   👥 Who it's for: ${coreBusinessUnderstanding.whoItsFor}`);
    
    // Step 1: Competitive Analysis
    const competitive: CompetitiveAnalysis = {
      mainCompetitors: this.getCompetitors(request.businessType, location),
      marketPosition: 'challenger',
      competitiveAdvantages: smartAnalysis.competitiveAdvantages,
      marketGaps: ['Underserved market segments', 'Need for more personalized service', 'Quality consistency gaps'],
      differentiationOpportunities: ['Unique value proposition', 'Personalized customer experience', 'Quality focus']
    };

    // Step 2: Customer Insights
    const customer: CustomerInsights = {
      primaryAudience: smartAnalysis.whoItsFor,
      painPoints: smartAnalysis.customerPainPoints,
      motivations: smartAnalysis.customerMotivations,
      preferredChannels: this.getPreferredChannels(request.platform, location),
      demographicProfile: this.getDemographicProfile(request.businessType, location),
      behaviorPatterns: this.getBehaviorPatterns(request.businessType, location)
    };

    // Step 3: Market Intelligence
    const market: MarketIntelligence = {
      marketSize: 'Growing market with expansion opportunities',
      growthTrends: this.getGrowthTrends(request.businessType),
      seasonalPatterns: this.getSeasonalPatterns(request.businessType),
      pricingStrategy: 'Competitive pricing with value focus',
      distributionChannels: ['Direct sales', 'Social media', 'Word of mouth', 'Online platforms'],
      regulatoryFactors: ['Business regulations', 'Health and safety standards', 'Quality certifications']
    };

    // Step 4: Content Strategy
    const content: ContentStrategy = {
      keyMessages: [
        smartAnalysis.whyItMatters,
        `Trusted ${request.businessType} business`,
        smartAnalysis.competitiveAdvantages[0] || 'Quality and reliability'
      ],
      valuePropositions: smartAnalysis.competitiveAdvantages,
      contentPillars: ['Quality & Value', 'Customer Success', 'Product Excellence'],
      toneOfVoice: 'Friendly, authentic, customer-focused',
      contentTypes: ['Customer stories', 'Behind-the-scenes', 'Product highlights', 'Value demonstrations'],
      engagementTactics: ['Share customer experiences', 'Showcase product quality', 'Highlight unique benefits']
    };

    // Step 5: Business Context
    const businessContext = {
      strengths: smartAnalysis.competitiveAdvantages,
      opportunities: [
        'Growing market demand',
        'Building strong customer relationships',
        'Opportunity to establish brand leadership',
        'Potential for market expansion'
      ],
      challenges: [
        'Competition from larger businesses',
        'Building brand awareness',
        'Maintaining consistent quality',
        'Scaling operations'
      ],
      uniqueSellingPoints: smartAnalysis.competitiveAdvantages
    };

    // Step 6: Recommendations
    const recommendations = {
      immediate: [
        'Showcase what makes you unique',
        'Use authentic, customer-focused messaging',
        'Highlight specific product/service benefits'
      ],
      strategic: [
        'Build strong customer relationships',
        'Develop loyal customer base',
        'Create word-of-mouth marketing momentum',
        'Expand market reach strategically'
      ],
      content: [
        'Focus on specific product benefits and features',
        'Avoid generic corporate language (e.g., "Fuel Your Dreams")',
        'Use real customer stories and testimonials',
        'Show, don\'t just tell - use visuals and specifics',
        'Vary messaging - don\'t repeat the same themes'
      ]
    };

    const processingTime = Date.now() - startTime;
    console.log(`✅ [Enhanced BI] Deep analysis complete in ${processingTime}ms`);

    return {
      competitive,
      customer,
      market,
      content,
      businessContext,
      recommendations,
      coreBusinessUnderstanding
    };
  }

  private getCompetitors(businessType: string, location: string): string[] {
    const competitorMap: Record<string, string[]> = {
      food: ['Other restaurants and cafes', 'Food vendors', 'Supermarket prepared foods', 'Online food delivery'],
      retail: ['Other shops', 'Market vendors', 'Online retailers', 'Big box stores'],
      service: ['Other service providers', 'Freelancers', 'Larger companies', 'Online platforms'],
      finance: ['Banks', 'Mobile money services', 'Microfinance institutions', 'Fintech apps'],
      healthcare: ['Clinics', 'Hospitals', 'Telehealth services', 'Alternative medicine']
    };

    return competitorMap[businessType] || ['Competitors', 'Established businesses', 'New entrants'];
  }

  private getPreferredChannels(platform: string, location: string): string[] {
    return [
      `${platform.charAt(0).toUpperCase() + platform.slice(1)} (primary platform)`,
      'Word of mouth',
      'WhatsApp and messaging apps',
      'Social media',
      'Online search'
    ];
  }

  private getDemographicProfile(businessType: string, location: string): string {
    const profileMap: Record<string, string> = {
      food: 'Mix of ages 18-55, families, workers, students, middle to lower-middle income',
      retail: 'Ages 25-50, shoppers and consumers, varied income levels',
      service: 'Ages 30-60, homeowners and businesses, middle income',
      finance: 'Ages 25-55, working professionals and business owners',
      healthcare: 'All ages, families and individuals seeking healthcare'
    };

    return profileMap[businessType] || 'Varied demographics seeking quality solutions';
  }

  private getBehaviorPatterns(businessType: string, location: string): string[] {
    const patternMap: Record<string, string[]> = {
      food: [
        'Regular food purchases for daily needs',
        'Prefer familiar, trusted vendors',
        'Make frequent small purchases',
        'Influenced by taste and quality'
      ],
      retail: [
        'Research before purchasing',
        'Value quality and good service',
        'Influenced by recommendations and reviews'
      ],
      service: [
        'Seek trustworthy service providers',
        'Value reliability and professionalism',
        'Prefer long-term relationships'
      ]
    };

    return patternMap[businessType] || [
      'Research options before deciding',
      'Value quality and reliability',
      'Influenced by word of mouth and reviews'
    ];
  }

  private getGrowthTrends(businessType: string): string[] {
    const trendMap: Record<string, string[]> = {
      food: ['Growing demand for fresh, local food', 'Increased focus on food quality', 'Support for local businesses'],
      retail: ['Shift to local shopping', 'Demand for quality products', 'Community-focused retail'],
      service: ['Preference for local providers', 'Demand for personalized service', 'Trust in local expertise']
    };
    
    return trendMap[businessType] || ['Growing local market', 'Increased demand for quality', 'Community focus'];
  }

  private getSeasonalPatterns(businessType: string): string[] {
    const patternMap: Record<string, string[]> = {
      food: ['Higher demand during holidays and weekends', 'Seasonal ingredient availability', 'Weather-dependent patterns'],
      retail: ['Holiday shopping peaks', 'Back-to-school season', 'End-of-month purchasing'],
      service: ['Seasonal maintenance needs', 'Holiday preparation', 'Weather-related demand']
    };
    
    return patternMap[businessType] || ['Seasonal variations', 'Holiday peaks', 'Weather impacts'];
  }
}

// Export singleton instance
export const enhancedBusinessIntelligenceGatherer = new EnhancedBusinessIntelligenceGatherer();

