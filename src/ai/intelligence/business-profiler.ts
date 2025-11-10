/**
 * Business Intelligence Profiling System
 * 
 * This system creates comprehensive business profiles that understand:
 * - Unique value propositions
 * - Mission and social impact
 * - Target audience segments
 * - Competitive advantages
 * - Cultural context
 * - Marketing angles
 */

export interface BusinessProfile {
  // Core Identity
  businessId: string;
  businessName: string;
  industry: string;
  businessType: string;

  // Brand Visual Identity
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;

  // Contact Information
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };

  // Mission & Purpose
  mission: string;
  socialImpact?: string;
  founderStory?: string;
  coreValues: string[];
  
  // Unique Value Proposition
  uniqueSellingPoints: string[];
  competitiveAdvantages: string[];
  keyDifferentiators: string[];
  
  // Products/Services Deep Dive
  offerings: BusinessOffering[];
  
  // Target Audience Intelligence
  primaryAudience: AudienceSegment;
  secondaryAudiences: AudienceSegment[];
  
  // Market Context
  localContext: LocalContext;
  marketPosition: MarketPosition;
  
  // Marketing Intelligence
  brandPersonality: BrandPersonality;
  messagingFramework: MessagingFramework;
  contentStrategy: ContentStrategy;
  
  // Forbidden Elements (what NOT to include)
  avoidanceList: string[];
  
  // Generated Insights
  generatedAt: Date;
  confidence: number;
}

export interface BusinessOffering {
  name: string;
  type: 'product' | 'service';
  category: string;
  description: string;
  
  // Unique attributes
  keyIngredients?: string[];
  nutritionalBenefits?: string[];
  healthBenefits?: string[];
  functionalBenefits: string[];
  emotionalBenefits: string[];
  
  // Positioning
  pricePoint: 'budget' | 'mid-range' | 'premium' | 'luxury';
  targetUseCase: string[];
  consumptionContext: string[];
  
  // Marketing angles
  primaryAngle: string;
  secondaryAngles: string[];
  proofPoints: string[];
}

export interface AudienceSegment {
  name: string;
  demographics: {
    ageRange: string;
    income: string;
    location: string;
    lifestyle: string[];
  };
  psychographics: {
    values: string[];
    motivations: string[];
    painPoints: string[];
    aspirations: string[];
  };
  behaviors: {
    shoppingHabits: string[];
    mediaConsumption: string[];
    decisionFactors: string[];
  };
  messaging: {
    tone: string;
    keyMessages: string[];
    emotionalTriggers: string[];
    avoidMessages: string[];
  };
}

export interface LocalContext {
  country: string;
  region: string;
  culturalFactors: string[];
  economicContext: string;
  localChallenges: string[];
  communityValues: string[];
  languageNuances: string[];
}

export interface MarketPosition {
  category: string;
  positioning: string;
  competitors: string[];
  marketGap: string;
  opportunitySize: string;
}

export interface BrandPersonality {
  archetype: string; // Hero, Caregiver, Creator, etc.
  traits: string[];
  voice: string;
  visualStyle: string;
  emotionalTone: string;
}

export interface MessagingFramework {
  coreMessage: string;
  supportingMessages: string[];
  proofPoints: string[];
  callToActions: string[];
  valuePropositions: string[];
}

export interface ContentStrategy {
  primaryContentTypes: string[];
  visualApproach: string;
  storytellingAngles: string[];
  seasonalConsiderations: string[];
  channelSpecificAdaptations: Record<string, string>;
}

/**
 * Business Intelligence Profiler
 * Creates comprehensive business profiles for tailored marketing
 */
export class BusinessProfiler {
  
  /**
   * Generate a comprehensive business profile
   */
  async generateProfile(brandProfile: any): Promise<BusinessProfile> {
    console.log('🧠 [Business Profiler] Generating comprehensive business profile...');
    
    // Extract basic information
    const basicInfo = this.extractBasicInfo(brandProfile);
    
    // Analyze business mission and purpose
    const missionAnalysis = await this.analyzeMissionAndPurpose(brandProfile);
    
    // Deep dive into offerings
    const offeringsAnalysis = await this.analyzeOfferings(brandProfile);
    
    // Understand target audiences
    const audienceAnalysis = await this.analyzeTargetAudiences(brandProfile);
    
    // Analyze local context
    const localAnalysis = await this.analyzeLocalContext(brandProfile);
    
    // Generate marketing intelligence
    const marketingIntelligence = await this.generateMarketingIntelligence(
      basicInfo, 
      missionAnalysis, 
      offeringsAnalysis, 
      audienceAnalysis, 
      localAnalysis
    );
    
    const profile: BusinessProfile = {
      ...basicInfo,
      ...missionAnalysis,
      offerings: offeringsAnalysis,
      ...audienceAnalysis,
      localContext: localAnalysis,
      marketPosition: marketingIntelligence.marketPosition,
      brandPersonality: marketingIntelligence.brandPersonality,
      messagingFramework: marketingIntelligence.messagingFramework,
      contentStrategy: marketingIntelligence.contentStrategy,
      uniqueSellingPoints: marketingIntelligence.uniqueSellingPoints,
      competitiveAdvantages: marketingIntelligence.competitiveAdvantages,
      keyDifferentiators: marketingIntelligence.keyDifferentiators,
      avoidanceList: marketingIntelligence.avoidanceList,
      generatedAt: new Date(),
      confidence: this.calculateConfidence(brandProfile)
    };
    
    console.log('✅ [Business Profiler] Profile generated with confidence:', profile.confidence);
    return profile;
  }
  
  private extractBasicInfo(brandProfile: any) {
    return {
      businessId: brandProfile.id || 'unknown',
      businessName: brandProfile.businessName || 'Unknown Business',
      industry: brandProfile.industry || 'Unknown',
      businessType: this.detectBusinessType(brandProfile),

      // Preserve original brand profile's visual identity
      primaryColor: brandProfile.primaryColor,
      accentColor: brandProfile.accentColor,
      backgroundColor: brandProfile.backgroundColor,

      // Preserve original brand profile's contact information
      contactInfo: brandProfile.contactInfo || {
        phone: brandProfile.phone,
        email: brandProfile.email,
        website: brandProfile.websiteUrl || brandProfile.website,
        address: brandProfile.address || brandProfile.location
      }
    };
  }
  
  private detectBusinessType(brandProfile: any): string {
    // Enhanced business type detection
    const description = (brandProfile.description || '').toLowerCase();
    const services = (brandProfile.services || []).join(' ').toLowerCase();
    const products = (brandProfile.products || []).join(' ').toLowerCase();
    const combined = `${description} ${services} ${products}`;
    
    // Food & Beverage patterns
    if (this.matchesPatterns(combined, [
      'cookies', 'bakery', 'food', 'restaurant', 'cafe', 'nutrition',
      'snacks', 'meals', 'ingredients', 'recipes', 'cooking'
    ])) {
      return 'food';
    }
    
    // Add more sophisticated detection logic here
    return brandProfile.businessType || 'general';
  }
  
  private matchesPatterns(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern));
  }
  
  private calculateConfidence(brandProfile: any): number {
    let score = 0;
    const maxScore = 100;
    
    // Check completeness of profile data
    if (brandProfile.description) score += 20;
    if (brandProfile.services?.length > 0) score += 15;
    if (brandProfile.products?.length > 0) score += 15;
    if (brandProfile.targetAudience) score += 15;
    if (brandProfile.valueProposition) score += 15;
    if (brandProfile.location) score += 10;
    if (brandProfile.keyFeatures?.length > 0) score += 10;
    
    return Math.min(score, maxScore);
  }
  
  // Implementation methods
  private async analyzeMissionAndPurpose(brandProfile: any) {
    return {
      mission: brandProfile.valueProposition || brandProfile.description || 'To serve our customers',
      socialImpact: undefined,
      founderStory: undefined,
      coreValues: brandProfile.keyFeatures || []
    };
  }

  private async analyzeOfferings(brandProfile: any): Promise<BusinessOffering[]> {
    const offerings: BusinessOffering[] = [];

    // Create offerings from products/services
    const products = brandProfile.products || [];
    const services = brandProfile.services || [];

    if (products.length > 0) {
      offerings.push({
        name: products[0] || 'Main Product',
        type: 'product',
        category: brandProfile.industry || 'General',
        description: brandProfile.description || 'Quality product',
        functionalBenefits: brandProfile.keyFeatures || ['Quality', 'Reliability'],
        emotionalBenefits: ['Satisfaction', 'Trust'],
        pricePoint: this.detectPricePoint(brandProfile.priceRange),
        targetUseCase: ['Daily use'],
        consumptionContext: ['Home', 'Work'],
        primaryAngle: 'Quality and value',
        secondaryAngles: ['Customer satisfaction'],
        proofPoints: brandProfile.keyFeatures || ['Quality assured']
      });
    }

    return offerings;
  }

  private detectPricePoint(priceRange?: string): 'budget' | 'mid-range' | 'premium' | 'luxury' {
    if (!priceRange) return 'mid-range';
    const lower = priceRange.toLowerCase();
    if (lower.includes('budget') || lower.includes('affordable')) return 'budget';
    if (lower.includes('premium') || lower.includes('luxury')) return 'premium';
    return 'mid-range';
  }

  private async analyzeTargetAudiences(brandProfile: any) {
    const audience: AudienceSegment = {
      name: brandProfile.targetAudience || 'General Customers',
      demographics: {
        ageRange: '25-55',
        income: 'Middle income',
        location: brandProfile.location || 'Local area',
        lifestyle: ['Quality-focused', 'Value-conscious']
      },
      psychographics: {
        values: ['Quality', 'Value', 'Reliability'],
        motivations: ['Getting good value', 'Quality products'],
        painPoints: ['Finding reliable options', 'Budget constraints'],
        aspirations: ['Quality lifestyle', 'Good value']
      },
      behaviors: {
        shoppingHabits: ['Local shopping', 'Research before buying'],
        mediaConsumption: ['Social media', 'Local recommendations'],
        decisionFactors: ['Price', 'Quality', 'Reviews']
      },
      messaging: {
        tone: 'Friendly and trustworthy',
        keyMessages: ['Quality you can trust', 'Great value'],
        emotionalTriggers: ['Trust', 'Value', 'Quality'],
        avoidMessages: ['Generic claims']
      }
    };

    return {
      primaryAudience: audience,
      secondaryAudiences: []
    };
  }

  private async analyzeLocalContext(brandProfile: any): Promise<LocalContext> {
    const location = brandProfile.location || '';
    const country = location.includes('Kenya') ? 'Kenya' : 'Unknown';
    const region = location.split(',')[0] || 'Unknown';

    return {
      country,
      region,
      culturalFactors: country === 'Kenya' ? ['Community-focused', 'Family values'] : [],
      economicContext: 'Developing market',
      localChallenges: ['Economic constraints', 'Quality access'],
      communityValues: ['Community support', 'Family care'],
      languageNuances: country === 'Kenya' ? ['Swahili cultural context'] : []
    };
  }

  private async generateMarketingIntelligence(
    basicInfo: any,
    missionAnalysis: any,
    offeringsAnalysis: any,
    audienceAnalysis: any,
    localAnalysis: any
  ) {
    return {
      marketPosition: {
        category: basicInfo.industry || 'General',
        positioning: 'Quality provider',
        competitors: ['Local competitors'],
        marketGap: 'Quality service gap',
        opportunitySize: 'Medium'
      } as MarketPosition,
      brandPersonality: {
        archetype: 'Everyman',
        traits: ['Reliable', 'Trustworthy', 'Accessible'],
        voice: 'Friendly and professional',
        visualStyle: 'Clean and approachable',
        emotionalTone: 'Trustworthy and caring'
      } as BrandPersonality,
      messagingFramework: {
        coreMessage: missionAnalysis.mission,
        supportingMessages: ['Quality service', 'Customer focused'],
        proofPoints: missionAnalysis.coreValues,
        callToActions: ['Try us today', 'Contact us'],
        valuePropositions: ['Quality', 'Value', 'Service']
      } as MessagingFramework,
      contentStrategy: {
        primaryContentTypes: ['Product showcase', 'Customer testimonials'],
        visualApproach: 'Clean product photography',
        storytellingAngles: ['Customer success', 'Quality focus'],
        seasonalConsiderations: ['Holiday promotions'],
        channelSpecificAdaptations: {
          'social_media': 'Visual content',
          'local': 'Community focus'
        }
      } as ContentStrategy,
      uniqueSellingPoints: offeringsAnalysis.length > 0 ? [offeringsAnalysis[0].primaryAngle] : ['Quality service'],
      competitiveAdvantages: missionAnalysis.coreValues.length > 0 ? missionAnalysis.coreValues : ['Quality focus'],
      keyDifferentiators: ['Local presence', 'Customer focus'],
      avoidanceList: ['Generic motivational language', 'Unrealistic claims']
    };
  }
}
