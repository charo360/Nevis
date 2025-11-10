/**
 * Business Profile Enricher
 * Integrates enhanced website analysis with the Business Profile Manager
 * to automatically create comprehensive business profiles
 */

import { EnhancedSimpleScraper, EnhancedWebsiteAnalysis } from './enhanced-simple-scraper';
import { BusinessProfileManager } from '../intelligence/business-profile-manager';
import { BusinessProfile } from '../intelligence/business-profiler';

export interface EnrichedBusinessProfile extends BusinessProfile {
  websiteAnalysis?: EnhancedWebsiteAnalysis;
  enrichmentMetadata: {
    enrichedAt: Date;
    websiteAnalyzed: boolean;
    dataSourcesUsed: string[];
    enrichmentVersion: string;
    qualityScore: number;
  };
}

export class BusinessProfileEnricher {
  private websiteScraper: EnhancedSimpleScraper;
  private profileManager: BusinessProfileManager;

  constructor() {
    this.websiteScraper = new EnhancedSimpleScraper();
    this.profileManager = new BusinessProfileManager();
  }

  /**
   * Enrich a business profile with comprehensive website analysis
   */
  async enrichBusinessProfile(
    businessName: string, 
    websiteUrl: string, 
    existingProfile?: Partial<BusinessProfile>
  ): Promise<EnrichedBusinessProfile> {
    console.log(`🔍 Enriching business profile for: ${businessName}`);
    console.log(`🌐 Website: ${websiteUrl}`);

    try {
      // Step 1: Analyze the website comprehensively
      const websiteAnalysis = await this.websiteScraper.analyzeWebsiteComprehensively(websiteUrl);
      
      // Step 2: Convert website analysis to business profile format
      const profileFromWebsite = this.convertWebsiteAnalysisToProfile(websiteAnalysis, businessName);
      
      // Step 3: Merge with existing profile if provided
      const mergedProfile = existingProfile 
        ? this.mergeProfiles(existingProfile, profileFromWebsite)
        : profileFromWebsite;
      
      // Step 4: Calculate quality score
      const qualityScore = this.calculateEnrichmentQuality(websiteAnalysis, mergedProfile);
      
      // Step 5: Create enriched profile
      const enrichedProfile: EnrichedBusinessProfile = {
        ...mergedProfile,
        websiteAnalysis,
        enrichmentMetadata: {
          enrichedAt: new Date(),
          websiteAnalyzed: true,
          dataSourcesUsed: ['website-analysis', existingProfile ? 'existing-profile' : 'none'],
          enrichmentVersion: '2.0.0',
          qualityScore
        }
      };

      console.log(`✅ Business profile enriched successfully`);
      console.log(`📊 Quality Score: ${qualityScore}%`);
      console.log(`🎯 Data Completeness: ${websiteAnalysis.analysisMetadata.dataCompleteness}%`);

      return enrichedProfile;

    } catch (error) {
      console.error(`❌ Failed to enrich business profile for ${businessName}:`, error);
      
      // Return a basic enriched profile with error information
      const fallbackProfile: EnrichedBusinessProfile = {
        businessName,
        businessType: 'unknown',
        industry: 'Unknown',
        websiteUrl,
        description: '',
        services: [],
        targetAudiences: [],
        uniqueValueProposition: '',
        brandPersonality: [],
        competitiveAdvantages: [],
        localContext: {
          location: '',
          community: '',
          culturalFactors: []
        },
        enrichmentMetadata: {
          enrichedAt: new Date(),
          websiteAnalyzed: false,
          dataSourcesUsed: ['error-fallback'],
          enrichmentVersion: '2.0.0',
          qualityScore: 0
        }
      };

      return fallbackProfile;
    }
  }

  /**
   * Convert website analysis data to business profile format
   */
  private convertWebsiteAnalysisToProfile(
    analysis: EnhancedWebsiteAnalysis, 
    businessName: string
  ): BusinessProfile {
    const { basicInfo, businessIntelligence, contactInformation, contentStrategy } = analysis;

    return {
      businessName: businessName || basicInfo.title,
      businessType: businessIntelligence.businessType,
      industry: businessIntelligence.industry,
      websiteUrl: basicInfo.url,
      description: businessIntelligence.mission || basicInfo.description || '',
      
      services: businessIntelligence.services.map(service => ({
        name: service.name,
        description: service.description,
        features: service.features || [],
        category: service.category || 'General'
      })),
      
      targetAudiences: this.inferTargetAudiences(analysis),
      
      uniqueValueProposition: businessIntelligence.uniqueValueProposition || 
                             this.extractUVPFromContent(contentStrategy),
      
      brandPersonality: this.inferBrandPersonality(contentStrategy),
      
      competitiveAdvantages: businessIntelligence.competitiveAdvantages.length > 0
        ? businessIntelligence.competitiveAdvantages
        : this.inferCompetitiveAdvantages(analysis),
      
      localContext: {
        location: this.extractLocation(contactInformation),
        community: '',
        culturalFactors: []
      }
    };
  }

  /**
   * Merge existing profile with website-derived profile
   */
  private mergeProfiles(
    existing: Partial<BusinessProfile>, 
    fromWebsite: BusinessProfile
  ): BusinessProfile {
    return {
      businessName: existing.businessName || fromWebsite.businessName,
      businessType: existing.businessType || fromWebsite.businessType,
      industry: existing.industry || fromWebsite.industry,
      websiteUrl: existing.websiteUrl || fromWebsite.websiteUrl,
      
      // Prefer existing description, fallback to website
      description: existing.description || fromWebsite.description,
      
      // Merge services (existing takes priority, add new from website)
      services: this.mergeServices(existing.services || [], fromWebsite.services),
      
      // Merge target audiences
      targetAudiences: this.mergeArrays(existing.targetAudiences || [], fromWebsite.targetAudiences),
      
      // Prefer existing UVP
      uniqueValueProposition: existing.uniqueValueProposition || fromWebsite.uniqueValueProposition,
      
      // Merge brand personality traits
      brandPersonality: this.mergeArrays(existing.brandPersonality || [], fromWebsite.brandPersonality),
      
      // Merge competitive advantages
      competitiveAdvantages: this.mergeArrays(existing.competitiveAdvantages || [], fromWebsite.competitiveAdvantages),
      
      // Merge local context
      localContext: {
        location: existing.localContext?.location || fromWebsite.localContext.location,
        community: existing.localContext?.community || fromWebsite.localContext.community,
        culturalFactors: this.mergeArrays(
          existing.localContext?.culturalFactors || [], 
          fromWebsite.localContext.culturalFactors
        )
      }
    };
  }

  /**
   * Merge two arrays, removing duplicates and prioritizing first array
   */
  private mergeArrays<T>(existing: T[], fromWebsite: T[]): T[] {
    const combined = [...existing, ...fromWebsite];
    return [...new Set(combined)]; // Remove duplicates
  }

  /**
   * Merge services arrays, avoiding duplicates by name
   */
  private mergeServices(existing: any[], fromWebsite: any[]): any[] {
    const existingNames = new Set(existing.map(s => s.name.toLowerCase()));
    const newServices = fromWebsite.filter(s => !existingNames.has(s.name.toLowerCase()));
    return [...existing, ...newServices];
  }

  /**
   * Infer target audiences from website analysis
   */
  private inferTargetAudiences(analysis: EnhancedWebsiteAnalysis): string[] {
    const audiences: string[] = [];
    
    // Infer from business type
    const businessType = analysis.businessIntelligence.businessType;
    const audienceMap: Record<string, string[]> = {
      'restaurant': ['Food enthusiasts', 'Local diners', 'Families'],
      'retail': ['Consumers', 'Online shoppers', 'Brand enthusiasts'],
      'service': ['Business owners', 'Professionals', 'Service seekers'],
      'healthcare': ['Patients', 'Health-conscious individuals', 'Medical professionals'],
      'technology': ['Tech users', 'Businesses', 'Developers'],
      'education': ['Students', 'Professionals', 'Lifelong learners']
    };
    
    if (audienceMap[businessType]) {
      audiences.push(...audienceMap[businessType]);
    }
    
    // Infer from content themes
    const themes = analysis.contentStrategy.contentThemes;
    if (themes.some(theme => theme.toLowerCase().includes('small business'))) {
      audiences.push('Small business owners');
    }
    if (themes.some(theme => theme.toLowerCase().includes('enterprise'))) {
      audiences.push('Enterprise clients');
    }
    
    return audiences.slice(0, 5); // Limit to 5 audiences
  }

  /**
   * Extract UVP from content strategy if not found in business intelligence
   */
  private extractUVPFromContent(contentStrategy: any): string {
    // Look for value-oriented themes
    const valueThemes = contentStrategy.contentThemes.filter((theme: string) => 
      theme.toLowerCase().includes('value') || 
      theme.toLowerCase().includes('benefit') ||
      theme.toLowerCase().includes('advantage')
    );
    
    return valueThemes.length > 0 ? valueThemes[0] : '';
  }

  /**
   * Infer brand personality from content tone and themes
   */
  private inferBrandPersonality(contentStrategy: any): string[] {
    const personality: string[] = [];
    
    // Map content tone to personality traits
    const toneMap: Record<string, string[]> = {
      'professional': ['Professional', 'Trustworthy', 'Reliable'],
      'friendly': ['Friendly', 'Approachable', 'Warm'],
      'casual': ['Casual', 'Relaxed', 'Down-to-earth'],
      'technical': ['Expert', 'Precise', 'Innovative'],
      'conversational': ['Conversational', 'Engaging', 'Personal']
    };
    
    const tone = contentStrategy.contentTone;
    if (toneMap[tone]) {
      personality.push(...toneMap[tone]);
    }
    
    // Infer from CTA patterns
    const ctas = contentStrategy.callToActionPatterns;
    if (ctas.some((cta: string) => cta.toLowerCase().includes('free'))) {
      personality.push('Generous');
    }
    if (ctas.some((cta: string) => cta.toLowerCase().includes('now') || cta.toLowerCase().includes('today'))) {
      personality.push('Urgent', 'Action-oriented');
    }
    
    return [...new Set(personality)].slice(0, 5); // Remove duplicates, limit to 5
  }

  /**
   * Infer competitive advantages from analysis
   */
  private inferCompetitiveAdvantages(analysis: EnhancedWebsiteAnalysis): string[] {
    const advantages: string[] = [];
    
    // Check for quality indicators
    if (analysis.analysisMetadata.dataCompleteness > 80) {
      advantages.push('Comprehensive online presence');
    }
    
    // Check for social proof
    if (analysis.businessIntelligence.testimonials.length > 0) {
      advantages.push('Strong customer testimonials');
    }
    
    // Check for team information
    if (analysis.businessIntelligence.teamInfo.length > 0) {
      advantages.push('Experienced team');
    }
    
    // Check for multiple services/products
    const totalOfferings = analysis.businessIntelligence.services.length + 
                          analysis.businessIntelligence.products.length;
    if (totalOfferings > 5) {
      advantages.push('Comprehensive service offering');
    }
    
    return advantages.slice(0, 3); // Limit to 3 advantages
  }

  /**
   * Extract location from contact information
   */
  private extractLocation(contactInfo: any): string {
    if (contactInfo.address && contactInfo.address.length > 0) {
      return contactInfo.address[0];
    }
    
    // Try to infer from business locations
    if (contactInfo.locations && contactInfo.locations.length > 0) {
      const location = contactInfo.locations[0];
      return `${location.city}, ${location.state || location.country}`;
    }
    
    return '';
  }

  /**
   * Calculate overall enrichment quality score
   */
  private calculateEnrichmentQuality(
    websiteAnalysis: EnhancedWebsiteAnalysis, 
    profile: BusinessProfile
  ): number {
    let score = 0;
    let maxScore = 0;

    // Website analysis quality (40% of total)
    score += websiteAnalysis.analysisMetadata.dataCompleteness * 0.4;
    maxScore += 40;

    // Profile completeness (60% of total)
    const profileFields = [
      'businessName', 'businessType', 'industry', 'description', 
      'uniqueValueProposition', 'services', 'targetAudiences'
    ];
    
    let completedFields = 0;
    profileFields.forEach(field => {
      const value = (profile as any)[field];
      if (value && (typeof value === 'string' ? value.trim() : value.length > 0)) {
        completedFields++;
      }
    });
    
    score += (completedFields / profileFields.length) * 60;
    maxScore += 60;

    return Math.round(score);
  }

  /**
   * Batch enrich multiple business profiles
   */
  async enrichMultipleProfiles(
    businesses: Array<{ name: string; websiteUrl: string; existingProfile?: Partial<BusinessProfile> }>
  ): Promise<EnrichedBusinessProfile[]> {
    console.log(`🔄 Batch enriching ${businesses.length} business profiles...`);
    
    const enrichedProfiles: EnrichedBusinessProfile[] = [];
    
    for (const business of businesses) {
      try {
        const enriched = await this.enrichBusinessProfile(
          business.name, 
          business.websiteUrl, 
          business.existingProfile
        );
        enrichedProfiles.push(enriched);
        
        // Respectful delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Failed to enrich ${business.name}:`, error);
      }
    }
    
    console.log(`✅ Batch enrichment complete. ${enrichedProfiles.length}/${businesses.length} profiles enriched.`);
    
    return enrichedProfiles;
  }
}

// Usage example
export async function enrichBusinessProfileFromWebsite(
  businessName: string, 
  websiteUrl: string, 
  existingProfile?: Partial<BusinessProfile>
): Promise<EnrichedBusinessProfile> {
  const enricher = new BusinessProfileEnricher();
  return await enricher.enrichBusinessProfile(businessName, websiteUrl, existingProfile);
}
