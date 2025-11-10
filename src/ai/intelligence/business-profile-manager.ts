/**
 * Business Profile Manager
 * 
 * Manages business profiles and generates tailored marketing content
 * based on deep business understanding.
 */

import { BusinessProfile, BusinessProfiler } from './business-profiler';
import { samakiCookiesProfile } from './business-profiles/samaki-cookies-profile';

export interface TailoredMarketingInsights {
  // Core Business Understanding
  businessEssence: string;
  uniqueValueProps: string[];
  missionStatement: string;
  
  // Target Audience Insights
  primaryAudienceProfile: string;
  audienceMotivations: string[];
  audiencePainPoints: string[];
  
  // Marketing Strategy
  recommendedAngles: string[];
  emotionalTriggers: string[];
  proofPoints: string[];
  avoidanceList: string[];
  
  // Content Guidelines
  toneOfVoice: string;
  visualApproach: string;
  messagingFramework: string[];
  
  // Local Context
  culturalConsiderations: string[];
  localRelevance: string[];
  
  // Specific Recommendations
  headlineApproaches: string[];
  contentThemes: string[];
  callToActionStyles: string[];
}

export class BusinessProfileManager {
  private profiles: Map<string, BusinessProfile> = new Map();
  private profiler: BusinessProfiler;
  
  constructor() {
    this.profiler = new BusinessProfiler();
    this.loadPredefinedProfiles();
  }
  
  /**
   * Load predefined business profiles
   */
  private loadPredefinedProfiles() {
    // Load Samaki Cookies profile
    this.profiles.set('samaki-cookies', samakiCookiesProfile);
    this.profiles.set('samaki-cookies-kenya', samakiCookiesProfile);
    this.profiles.set('samaki cookies', samakiCookiesProfile);
    
    console.log('📋 [Profile Manager] Loaded predefined profiles:', this.profiles.size);
  }
  
  /**
   * Get or generate business profile
   */
  async getBusinessProfile(brandProfile: any): Promise<BusinessProfile> {
    const businessName = brandProfile.businessName?.toLowerCase() || '';
    const businessId = brandProfile.id?.toLowerCase() || '';

    // Check for existing profile
    const existingProfile = this.findExistingProfile(businessName, businessId);
    if (existingProfile) {
      console.log('✅ [Profile Manager] Found existing profile for:', businessName);

      // Merge predefined profile with original brand profile data
      // Original brand profile data takes priority for contact info and colors
      const mergedProfile = this.mergeWithOriginalBrandData(existingProfile, brandProfile);
      return mergedProfile;
    }

    // Generate new profile
    console.log('🔄 [Profile Manager] Generating new profile for:', businessName);
    const newProfile = await this.profiler.generateProfile(brandProfile);

    // Cache the profile
    this.profiles.set(businessId || businessName, newProfile);

    return newProfile;
  }

  /**
   * Merge predefined profile with original brand profile data
   * Original brand profile data takes priority for contact info and colors
   */
  private mergeWithOriginalBrandData(predefinedProfile: BusinessProfile, originalBrandProfile: any): BusinessProfile {
    console.log('🔄 [Profile Manager] Merging predefined profile with original brand data');

    // Extract contact info from original brand profile
    const originalContactInfo = originalBrandProfile.contactInfo || {
      phone: originalBrandProfile.phone,
      email: originalBrandProfile.email,
      website: originalBrandProfile.websiteUrl || originalBrandProfile.website,
      address: originalBrandProfile.address || originalBrandProfile.location
    };

    // Extract colors from original brand profile
    const originalColors = {
      primaryColor: originalBrandProfile.primaryColor,
      accentColor: originalBrandProfile.accentColor,
      backgroundColor: originalBrandProfile.backgroundColor
    };

    // Merge with priority to original brand profile data
    const mergedProfile: BusinessProfile = {
      ...predefinedProfile,

      // Use original brand profile's contact info if available, otherwise use predefined
      contactInfo: {
        phone: originalContactInfo.phone || predefinedProfile.contactInfo?.phone,
        email: originalContactInfo.email || predefinedProfile.contactInfo?.email,
        website: originalContactInfo.website || predefinedProfile.contactInfo?.website,
        address: originalContactInfo.address || predefinedProfile.contactInfo?.address
      },

      // Use original brand profile's colors if available, otherwise use predefined
      primaryColor: originalColors.primaryColor || predefinedProfile.primaryColor,
      accentColor: originalColors.accentColor || predefinedProfile.accentColor,
      backgroundColor: originalColors.backgroundColor || predefinedProfile.backgroundColor
    };

    console.log('✅ [Profile Manager] Merged profile with original brand data');
    return mergedProfile;
  }

  /**
   * Find existing profile by name or ID
   */
  private findExistingProfile(businessName: string, businessId: string): BusinessProfile | null {
    // Try exact matches first
    if (businessId && this.profiles.has(businessId)) {
      return this.profiles.get(businessId)!;
    }
    
    if (businessName && this.profiles.has(businessName)) {
      return this.profiles.get(businessName)!;
    }
    
    // Try fuzzy matching
    for (const [key, profile] of this.profiles) {
      if (this.fuzzyMatch(businessName, key) || this.fuzzyMatch(businessName, profile.businessName.toLowerCase())) {
        return profile;
      }
    }
    
    return null;
  }
  
  /**
   * Fuzzy match business names
   */
  private fuzzyMatch(name1: string, name2: string): boolean {
    if (!name1 || !name2) return false;
    
    const clean1 = name1.replace(/[^a-z0-9]/g, '');
    const clean2 = name2.replace(/[^a-z0-9]/g, '');
    
    return clean1.includes(clean2) || clean2.includes(clean1);
  }
  
  /**
   * Generate tailored marketing insights from business profile
   */
  generateMarketingInsights(profile: BusinessProfile, targetAudience?: string): TailoredMarketingInsights {
    console.log('🎯 [Profile Manager] Generating marketing insights for:', profile.businessName);
    
    // Select appropriate audience
    const audience = targetAudience 
      ? profile.secondaryAudiences.find(a => a.name.toLowerCase().includes(targetAudience.toLowerCase())) || profile.primaryAudience
      : profile.primaryAudience;
    
    const insights: TailoredMarketingInsights = {
      // Core Business Understanding
      businessEssence: this.generateBusinessEssence(profile),
      uniqueValueProps: profile.uniqueSellingPoints,
      missionStatement: profile.mission,
      
      // Target Audience Insights
      primaryAudienceProfile: this.generateAudienceProfile(audience),
      audienceMotivations: audience.psychographics?.motivations || [],
      audiencePainPoints: audience.psychographics?.painPoints || [],
      
      // Marketing Strategy
      recommendedAngles: this.generateMarketingAngles(profile),
      emotionalTriggers: audience.messaging?.emotionalTriggers || [],
      proofPoints: this.extractProofPoints(profile),
      avoidanceList: profile.avoidanceList,
      
      // Content Guidelines
      toneOfVoice: audience.messaging?.tone || profile.brandPersonality.voice,
      visualApproach: profile.brandPersonality.visualStyle,
      messagingFramework: profile.messagingFramework.supportingMessages,
      
      // Local Context
      culturalConsiderations: profile.localContext.culturalFactors,
      localRelevance: this.generateLocalRelevance(profile),
      
      // Specific Recommendations
      headlineApproaches: this.generateHeadlineApproaches(profile, audience),
      contentThemes: this.generateContentThemes(profile),
      callToActionStyles: profile.messagingFramework.callToActions
    };
    
    return insights;
  }
  
  /**
   * Generate business essence summary
   */
  private generateBusinessEssence(profile: BusinessProfile): string {
    const offering = profile.offerings[0];
    if (!offering) return profile.mission;
    
    return `${profile.businessName} ${offering.primaryAngle}. ${profile.mission}. Key differentiators: ${profile.keyDifferentiators.slice(0, 2).join(', ')}.`;
  }
  
  /**
   * Generate audience profile summary
   */
  private generateAudienceProfile(audience: any): string {
    if (!audience.demographics) return 'General audience';
    
    return `${audience.name}: ${audience.demographics.ageRange} in ${audience.demographics.location}. Values: ${audience.psychographics?.values?.slice(0, 3).join(', ') || 'family, community'}. Key motivations: ${audience.psychographics?.motivations?.slice(0, 2).join(', ') || 'health, value'}.`;
  }
  
  /**
   * Generate marketing angles
   */
  private generateMarketingAngles(profile: BusinessProfile): string[] {
    const angles: string[] = [];
    
    // Mission-driven angle
    if (profile.socialImpact) {
      angles.push(`Social Impact: ${profile.socialImpact}`);
    }
    
    // Product-specific angles
    profile.offerings.forEach(offering => {
      angles.push(`Product Focus: ${offering.primaryAngle}`);
      angles.push(...offering.secondaryAngles);
    });
    
    // Local angle
    if (profile.localContext.region !== 'Unknown') {
      angles.push(`Local Pride: Made in ${profile.localContext.region}`);
    }
    
    // Founder story angle
    if (profile.founderStory) {
      angles.push(`Founder Story: ${profile.founderStory}`);
    }
    
    return angles.slice(0, 5); // Top 5 angles
  }
  
  /**
   * Extract proof points
   */
  private extractProofPoints(profile: BusinessProfile): string[] {
    const proofPoints: string[] = [];
    
    // Add offering proof points
    profile.offerings.forEach(offering => {
      proofPoints.push(...offering.proofPoints);
    });
    
    // Add competitive advantages as proof
    proofPoints.push(...profile.competitiveAdvantages);
    
    return [...new Set(proofPoints)]; // Remove duplicates
  }
  
  /**
   * Generate local relevance points
   */
  private generateLocalRelevance(profile: BusinessProfile): string[] {
    const relevance: string[] = [];
    
    if (profile.localContext.region !== 'Unknown') {
      relevance.push(`Based in ${profile.localContext.region}`);
    }
    
    relevance.push(...profile.localContext.communityValues);
    relevance.push(...profile.localContext.culturalFactors.slice(0, 3));
    
    return relevance;
  }
  
  /**
   * Generate headline approaches
   */
  private generateHeadlineApproaches(profile: BusinessProfile, audience: any): string[] {
    const approaches: string[] = [];
    
    // Mission-driven headlines
    if (profile.socialImpact) {
      approaches.push(`Impact-focused: Reference ${profile.socialImpact.toLowerCase()}`);
    }
    
    // Benefit-driven headlines
    const offering = profile.offerings[0];
    if (offering) {
      approaches.push(`Benefit-driven: Highlight ${offering.functionalBenefits[0] || 'key benefit'}`);
      approaches.push(`Emotional: Focus on ${offering.emotionalBenefits[0] || 'family care'}`);
    }
    
    // Local pride headlines
    if (profile.localContext.region !== 'Unknown') {
      approaches.push(`Local Pride: Emphasize ${profile.localContext.region} connection`);
    }
    
    // Audience-specific headlines
    if (audience.messaging?.keyMessages) {
      approaches.push(`Audience-specific: Use "${audience.messaging.keyMessages[0]}"`);
    }
    
    return approaches;
  }
  
  /**
   * Generate content themes
   */
  private generateContentThemes(profile: BusinessProfile): string[] {
    const themes: string[] = [];
    
    // Add content strategy themes
    if (profile.contentStrategy?.storytellingAngles) {
      themes.push(...profile.contentStrategy.storytellingAngles);
    }
    
    // Add offering-specific themes
    profile.offerings.forEach(offering => {
      themes.push(`Product showcase: ${offering.name} benefits`);
      themes.push(`Usage context: ${offering.consumptionContext[0] || 'daily use'}`);
    });
    
    // Add mission themes
    if (profile.socialImpact) {
      themes.push(`Community impact: ${profile.socialImpact}`);
    }
    
    return [...new Set(themes)].slice(0, 6);
  }
  
  /**
   * Generate formatted insights for AI prompt
   */
  generatePromptInsights(profile: BusinessProfile, targetAudience?: string): string {
    const insights = this.generateMarketingInsights(profile, targetAudience);
    
    return `
🏢 BUSINESS INTELLIGENCE PROFILE:

BUSINESS ESSENCE:
${insights.businessEssence}

UNIQUE VALUE PROPOSITIONS:
${insights.uniqueValueProps.map(prop => `• ${prop}`).join('\n')}

TARGET AUDIENCE:
${insights.primaryAudienceProfile}

AUDIENCE MOTIVATIONS:
${insights.audienceMotivations.map(motivation => `• ${motivation}`).join('\n')}

AUDIENCE PAIN POINTS:
${insights.audiencePainPoints.map(pain => `• ${pain}`).join('\n')}

RECOMMENDED MARKETING ANGLES:
${insights.recommendedAngles.map(angle => `• ${angle}`).join('\n')}

EMOTIONAL TRIGGERS:
${insights.emotionalTriggers.map(trigger => `• ${trigger}`).join('\n')}

PROOF POINTS:
${insights.proofPoints.slice(0, 5).map(proof => `• ${proof}`).join('\n')}

TONE OF VOICE: ${insights.toneOfVoice}

CULTURAL CONSIDERATIONS:
${insights.culturalConsiderations.map(factor => `• ${factor}`).join('\n')}

CONTENT THEMES:
${insights.contentThemes.map(theme => `• ${theme}`).join('\n')}

❌ AVOID THESE ELEMENTS:
${insights.avoidanceList.map(avoid => `• ${avoid}`).join('\n')}

🎯 HEADLINE APPROACHES:
${insights.headlineApproaches.map(approach => `• ${approach}`).join('\n')}
`;
  }
}
