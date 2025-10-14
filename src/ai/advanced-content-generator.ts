/**
 * Advanced Content Generator
 * Deep business understanding, cultural awareness, and competitive analysis
 */

import { trendingEnhancer } from './trending-content-enhancer';
import { rssService } from '@/services/rss-feed-service';
import { regionalEngine } from './regional-communication-engine';
import { getVertexAIClient } from '@/lib/services/vertex-ai-client';

export interface BusinessProfile {
  businessName: string;
  businessType: string;
  location: string;
  targetAudience: string;
  brandVoice: string;
  uniqueSellingPoints: string[];
  competitors: string[];
  previousPosts?: SocialMediaPost[];
  businessHours?: string;
  specialOffers?: string[];
  seasonalFocus?: string[];
}

export interface SocialMediaPost {
  headline: string;
  subheadline?: string;
  caption: string;
  cta: string;
  hashtags: string[];
  platform: string;
  imageUrl?: string; // Add imageUrl field
  engagement?: number;
  performance?: 'high' | 'medium' | 'low';
}

export interface ContentAnalysis {
  businessIntelligence: BusinessIntelligence;
  culturalContext: CulturalContext;
  competitiveAnalysis: CompetitiveAnalysis;
  trendingInsights: TrendingInsights;
}

export interface BusinessIntelligence {
  industryKeywords: string[];
  businessStrengths: string[];
  targetEmotions: string[];
  valuePropositions: string[];
  localRelevance: string[];
  seasonalOpportunities: string[];
}

export interface CulturalContext {
  primaryLanguage: string;
  localPhrases: string[];
  culturalValues: string[];
  localEvents: string[];
  communicationStyle: string;
  localInfluencers: string[];
}

export interface CompetitiveAnalysis {
  industryBenchmarks: string[];
  competitorStrategies: string[];
  marketGaps: string[];
  differentiators: string[];
  performanceTargets: string[];
}

export interface TrendingInsights {
  currentTrends: string[];
  viralPatterns: string[];
  platformSpecificTrends: string[];
  seasonalTrends: string[];
  emergingTopics: string[];
}

export class AdvancedContentGenerator {
  private businessIntelligence: Map<string, BusinessIntelligence> = new Map();
  private culturalDatabase: Map<string, CulturalContext> = new Map();
  private performanceHistory: Map<string, SocialMediaPost[]> = new Map();

  constructor() {
    this.initializeCulturalDatabase();
    this.initializeBusinessIntelligence();
  }

  /**
   * Initialize cultural database with local knowledge
   */
  private initializeCulturalDatabase() {
    const cultures = {
      'United States': {
        primaryLanguage: 'English',
        localPhrases: ['awesome', 'amazing', 'game-changer', 'must-have', 'life-changing'],
        culturalValues: ['innovation', 'convenience', 'quality', 'value', 'authenticity'],
        localEvents: ['Black Friday', 'Super Bowl', 'Memorial Day', 'Labor Day'],
        communicationStyle: 'direct, enthusiastic, benefit-focused',
        localInfluencers: ['lifestyle', 'fitness', 'food', 'tech', 'business'],
      },
      'United Kingdom': {
        primaryLanguage: 'English',
        localPhrases: ['brilliant', 'fantastic', 'proper', 'lovely', 'spot on'],
        culturalValues: ['tradition', 'quality', 'reliability', 'heritage', 'craftsmanship'],
        localEvents: ['Boxing Day', 'Bank Holiday', 'Wimbledon', 'Royal events'],
        communicationStyle: 'polite, understated, witty',
        localInfluencers: ['lifestyle', 'fashion', 'food', 'travel', 'culture'],
      },
      'Canada': {
        primaryLanguage: 'English',
        localPhrases: ['eh', 'beauty', 'fantastic', 'wonderful', 'great'],
        culturalValues: ['friendliness', 'inclusivity', 'nature', 'community', 'sustainability'],
        localEvents: ['Canada Day', 'Victoria Day', 'Thanksgiving', 'Winter Olympics'],
        communicationStyle: 'friendly, inclusive, nature-focused',
        localInfluencers: ['outdoor', 'lifestyle', 'food', 'wellness', 'community'],
      },
      'Australia': {
        primaryLanguage: 'English',
        localPhrases: ['mate', 'fair dinkum', 'ripper', 'bonzer', 'ace'],
        culturalValues: ['laid-back', 'outdoor lifestyle', 'mateship', 'adventure', 'authenticity'],
        localEvents: ['Australia Day', 'Melbourne Cup', 'ANZAC Day', 'AFL Grand Final'],
        communicationStyle: 'casual, friendly, straightforward',
        localInfluencers: ['outdoor', 'fitness', 'food', 'travel', 'lifestyle'],
      },
    };

    Object.entries(cultures).forEach(([location, context]) => {
      this.culturalDatabase.set(location, context as CulturalContext);
    });
  }

  /**
   * Initialize business intelligence database
   */
  private initializeBusinessIntelligence() {
    const businessTypes = {
      restaurant: {
        industryKeywords: ['fresh', 'delicious', 'authentic', 'homemade', 'seasonal', 'local', 'chef-crafted'],
        businessStrengths: ['taste', 'atmosphere', 'service', 'ingredients', 'experience'],
        targetEmotions: ['hunger', 'comfort', 'satisfaction', 'joy', 'nostalgia'],
        valuePropositions: ['quality ingredients', 'unique flavors', 'memorable experience', 'value for money'],
        localRelevance: ['neighborhood favorite', 'local ingredients', 'community gathering'],
        seasonalOpportunities: ['seasonal menu', 'holiday specials', 'summer patio', 'winter comfort'],
      },
      retail: {
        industryKeywords: ['trendy', 'stylish', 'affordable', 'quality', 'exclusive', 'limited', 'new arrival'],
        businessStrengths: ['selection', 'price', 'quality', 'customer service', 'convenience'],
        targetEmotions: ['desire', 'confidence', 'satisfaction', 'excitement', 'belonging'],
        valuePropositions: ['best prices', 'latest trends', 'quality guarantee', 'exclusive access'],
        localRelevance: ['local fashion', 'community style', 'neighborhood store'],
        seasonalOpportunities: ['seasonal collections', 'holiday sales', 'back-to-school', 'summer styles'],
      },
      fitness: {
        industryKeywords: ['strong', 'healthy', 'fit', 'transformation', 'results', 'energy', 'powerful'],
        businessStrengths: ['expertise', 'results', 'community', 'equipment', 'motivation'],
        targetEmotions: ['motivation', 'confidence', 'achievement', 'energy', 'determination'],
        valuePropositions: ['proven results', 'expert guidance', 'supportive community', 'flexible schedules'],
        localRelevance: ['neighborhood gym', 'local fitness community', 'accessible location'],
        seasonalOpportunities: ['New Year resolutions', 'summer body', 'holiday fitness', 'spring training'],
      },
      beauty: {
        industryKeywords: ['glowing', 'radiant', 'beautiful', 'flawless', 'natural', 'luxurious', 'rejuvenating'],
        businessStrengths: ['expertise', 'products', 'results', 'relaxation', 'personalization'],
        targetEmotions: ['confidence', 'relaxation', 'beauty', 'self-care', 'transformation'],
        valuePropositions: ['expert care', 'premium products', 'personalized service', 'lasting results'],
        localRelevance: ['trusted local salon', 'community beauty expert', 'neighborhood favorite'],
        seasonalOpportunities: ['bridal season', 'holiday glam', 'summer skin', 'winter care'],
      },
    };

    Object.entries(businessTypes).forEach(([type, intelligence]) => {
      this.businessIntelligence.set(type, intelligence as BusinessIntelligence);
    });
  }

  /**
   * Analyze business and context for content generation
   */
  public async analyzeBusinessContext(profile: BusinessProfile): Promise<ContentAnalysis> {

    // Get business intelligence
    const businessIntelligence = this.businessIntelligence.get(profile.businessType) || {
      industryKeywords: [],
      businessStrengths: [],
      targetEmotions: [],
      valuePropositions: [],
      localRelevance: [],
      seasonalOpportunities: [],
    };

    // Get cultural context
    const culturalContext = this.culturalDatabase.get(profile.location) || {
      primaryLanguage: 'English',
      localPhrases: [],
      culturalValues: [],
      localEvents: [],
      communicationStyle: 'friendly, professional',
      localInfluencers: [],
    };

    // Get trending insights
    const trendingData = await trendingEnhancer.getTrendingEnhancement({
      businessType: profile.businessType,
      location: profile.location,
      targetAudience: profile.targetAudience,
    });

    const trendingInsights: TrendingInsights = {
      currentTrends: trendingData.keywords,
      viralPatterns: trendingData.topics,
      platformSpecificTrends: trendingData.hashtags,
      seasonalTrends: trendingData.seasonalThemes,
      emergingTopics: trendingData.industryBuzz,
    };

    // Analyze competitors (simulated for now)
    const competitiveAnalysis: CompetitiveAnalysis = {
      industryBenchmarks: this.generateIndustryBenchmarks(profile.businessType),
      competitorStrategies: this.analyzeCompetitorStrategies(profile.competitors),
      marketGaps: this.identifyMarketGaps(profile.businessType),
      differentiators: profile.uniqueSellingPoints,
      performanceTargets: this.setPerformanceTargets(profile.businessType),
    };


    return {
      businessIntelligence,
      culturalContext,
      competitiveAnalysis,
      trendingInsights,
    };
  }

  /**
   * Generate highly engaging content based on analysis
   */
  public async generateEngagingContent(
    profile: BusinessProfile,
    platform: string,
    contentType: 'promotional' | 'educational' | 'entertaining' | 'seasonal' = 'promotional'
  ): Promise<SocialMediaPost> {

    const analysis = await this.analyzeBusinessContext(profile);

    // Generate content components
    const headline = await this.generateCatchyHeadline(profile, analysis, platform, contentType);
    const subheadline = await this.generateSubheadline(profile, analysis, headline);
    const caption = await this.generateEngagingCaption(profile, analysis, headline, platform);
    const cta = await this.generateCompellingCTA(profile, analysis, platform, contentType);
    const hashtags = await this.generateStrategicHashtags(profile, analysis, platform);

    const post: SocialMediaPost = {
      headline,
      subheadline,
      caption,
      cta,
      hashtags,
      platform,
    };

    // Store for performance tracking
    this.storePostForAnalysis(profile.businessName, post);

    return post;
  }

  /**
   * Generate catchy, business-specific headlines with regional authenticity
   */
  private async generateCatchyHeadline(
    profile: BusinessProfile,
    analysis: ContentAnalysis,
    platform: string,
    contentType: string
  ): Promise<string> {
    const { businessIntelligence, culturalContext, trendingInsights } = analysis;

    // Try regional communication first for authentic local content
    const regionalProfile = regionalEngine.getRegionalProfile(profile.location);
    if (regionalProfile) {
      const regionalHeadline = regionalEngine.generateRegionalContent(
        profile.businessType,
        profile.businessName,
        profile.location,
        'headline'
      );

      // Enhance with trending elements if available
      if (trendingInsights.currentTrends.length > 0) {
        const trendingElement = this.getRandomElement(trendingInsights.currentTrends);
        return `${regionalHeadline} - ${trendingElement}`;
      }

      return regionalHeadline;
    }

    // Fallback to original method for unsupported regions
    // Combine business strengths with trending topics
    const powerWords = [...businessIntelligence.industryKeywords, ...culturalContext.localPhrases];
    const trendingWords = trendingInsights.currentTrends.slice(0, 5);

    // Create headline templates based on content type - AVOID "CompanyName: FAST, EASY, BETTER" patterns
    const templates = {
      promotional: [
        // Creative, engaging headlines without company name prefix
        `${this.getRandomElement(powerWords)} ${this.getRandomElement(businessIntelligence.valuePropositions)}`,
        `${this.getRandomElement(businessIntelligence.businessStrengths)} That ${this.getRandomElement(businessIntelligence.targetEmotions)}`,
        `${this.getRandomElement(trendingWords)} ${this.getRandomElement(businessIntelligence.valuePropositions)}`,
        `${this.getRandomElement(culturalContext.localPhrases)} ${this.getRandomElement(businessIntelligence.businessStrengths)}`,
        `${this.getRandomElement(businessIntelligence.targetEmotions)} ${this.getRandomElement(trendingWords)}`,
        `Revolutionary ${this.getRandomElement(businessIntelligence.valuePropositions)}`,
        `Experience ${this.getRandomElement(businessIntelligence.businessStrengths)}`,
        `Discover ${this.getRandomElement(powerWords)} Solutions`,
      ],
      educational: [
        `${this.getRandomElement(trendingWords)} Secrets Revealed`,
        `Why ${this.getRandomElement(businessIntelligence.businessStrengths)} Matters`,
        `The Ultimate ${this.getRandomElement(businessIntelligence.industryKeywords)} Guide`,
        `${this.getRandomElement(powerWords)} ${this.getRandomElement(businessIntelligence.industryKeywords)} Insights`,
        `${this.getRandomElement(businessIntelligence.businessStrengths)} Explained Simply`,
        `Master ${this.getRandomElement(businessIntelligence.industryKeywords)} Today`,
      ],
      entertaining: [
        `${this.getRandomElement(culturalContext.localPhrases)}! ${this.getRandomElement(trendingWords)} Magic`,
        `${this.getRandomElement(trendingWords)} + ${this.getRandomElement(businessIntelligence.businessStrengths)} = Amazing`,
        `When ${this.getRandomElement(businessIntelligence.targetEmotions)} Meets Innovation`,
        `${this.getRandomElement(powerWords)} ${this.getRandomElement(businessIntelligence.targetEmotions)} Awaits`,
        `${this.getRandomElement(culturalContext.localPhrases)} Excellence`,
        `Pure ${this.getRandomElement(businessIntelligence.valuePropositions)} Energy`,
      ],
      seasonal: [
        `${this.getRandomElement(trendingInsights.seasonalTrends)} Special Edition`,
        `Limited Time ${this.getRandomElement(businessIntelligence.seasonalOpportunities)}`,
        `${this.getRandomElement(culturalContext.localEvents)} Celebration`,
        `Seasonal ${this.getRandomElement(businessIntelligence.valuePropositions)} Magic`,
      ],
    };

    const selectedTemplate = this.getRandomElement(templates[contentType as keyof typeof templates]);
    return this.capitalizeWords(selectedTemplate);
  }

  /**
   * Generate supporting subheadlines
   */
  private async generateSubheadline(
    profile: BusinessProfile,
    analysis: ContentAnalysis,
    headline: string
  ): Promise<string> {
    const { businessIntelligence, culturalContext } = analysis;

    const supportingElements = [
      ...businessIntelligence.valuePropositions,
      ...businessIntelligence.localRelevance,
      ...culturalContext.culturalValues,
    ];

    const templates = [
      `${this.getRandomElement(supportingElements)} in ${profile.location}`,
      `${this.getRandomElement(businessIntelligence.businessStrengths)} you can trust`,
      `${this.getRandomElement(culturalContext.localPhrases)} experience awaits`,
    ];

    return this.getRandomElement(templates);
  }

  /**
   * Generate engaging, culturally-aware captions with regional authenticity
   */
  private async generateEngagingCaption(
    profile: BusinessProfile,
    analysis: ContentAnalysis,
    headline: string,
    platform: string
  ): Promise<string> {
    const { businessIntelligence, culturalContext, trendingInsights } = analysis;

    // Try regional communication first for authentic local content
    const regionalProfile = regionalEngine.getRegionalProfile(profile.location);
    if (regionalProfile) {
      return regionalEngine.generateRegionalContent(
        profile.businessType,
        profile.businessName,
        profile.location,
        'caption'
      );
    }

    // Fallback to original method for unsupported regions
    // Platform-specific caption styles
    const platformStyles = {
      instagram: 'visual, lifestyle-focused, emoji-rich',
      facebook: 'community-focused, conversational, story-driven',
      twitter: 'concise, witty, trending-aware',
      linkedin: 'professional, value-driven, industry-focused',
      tiktok: 'trendy, fun, challenge-oriented',
    };

    // Strategic location mention - only 30% of the time for captions
    const shouldMentionLocation = Math.random() < 0.30; // 30% chance

    const captionElements = shouldMentionLocation ? [
      `At ${profile.businessName}, we believe ${this.getRandomElement(businessIntelligence.valuePropositions)}.`,
      `Our ${this.getRandomElement(businessIntelligence.businessStrengths)} brings ${this.getRandomElement(businessIntelligence.targetEmotions)} to ${profile.location}.`,
      `${this.getRandomElement(culturalContext.localPhrases)}! ${this.getRandomElement(trendingInsights.currentTrends)} meets ${this.getRandomElement(businessIntelligence.industryKeywords)}.`,
      `Join our ${profile.location} community for ${this.getRandomElement(businessIntelligence.localRelevance)}.`,
    ] : [
      `At ${profile.businessName}, we believe ${this.getRandomElement(businessIntelligence.valuePropositions)}.`,
      `Our ${this.getRandomElement(businessIntelligence.businessStrengths)} brings ${this.getRandomElement(businessIntelligence.targetEmotions)} to every customer.`,
      `${this.getRandomElement(culturalContext.localPhrases)}! ${this.getRandomElement(trendingInsights.currentTrends)} meets ${this.getRandomElement(businessIntelligence.industryKeywords)}.`,
      `Join our community for ${this.getRandomElement(businessIntelligence.localRelevance)}.`,
    ];

    return captionElements.slice(0, 2).join(' ');
  }

  /**
   * Generate compelling CTAs with regional authenticity
   */
  private async generateCompellingCTA(
    profile: BusinessProfile,
    analysis: ContentAnalysis,
    platform: string,
    contentType: string
  ): Promise<string> {
    const { businessIntelligence, culturalContext } = analysis;

    // Try regional communication first for authentic local CTAs
    const regionalProfile = regionalEngine.getRegionalProfile(profile.location);
    if (regionalProfile) {
      return regionalEngine.generateRegionalContent(
        profile.businessType,
        profile.businessName,
        profile.location,
        'cta'
      );
    }

    // Fallback to original method for unsupported regions
    const ctaTemplates = {
      promotional: [
        `Visit ${profile.businessName} today!`,
        `Experience ${this.getRandomElement(businessIntelligence.businessStrengths)} now`,
        `Book your ${this.getRandomElement(businessIntelligence.targetEmotions)} experience`,
      ],
      educational: [
        `Learn more at ${profile.businessName}`,
        `Discover the ${this.getRandomElement(businessIntelligence.industryKeywords)} difference`,
        `Get expert advice from ${profile.businessName}`,
      ],
      entertaining: [
        `Join the fun at ${profile.businessName}!`,
        `Share your ${profile.businessName} experience`,
        `Tag a friend who needs this!`,
      ],
      seasonal: [
        `Don't miss our ${this.getRandomElement(businessIntelligence.seasonalOpportunities)}`,
        `Limited time at ${profile.businessName}`,
        `Celebrate with ${profile.businessName}`,
      ],
    };

    return this.getRandomElement(ctaTemplates[contentType as keyof typeof ctaTemplates]);
  }

  /**
   * Generate strategic hashtags with AI-powered contextual generation
   */
  private async generateStrategicHashtags(
    profile: BusinessProfile,
    analysis: ContentAnalysis,
    platform: string
  ): Promise<string[]> {
    try {
      // Use AI to generate contextual hashtags
      const aiHashtags = await this.generateAIHashtags(profile, platform);
      if (aiHashtags.length > 0) {
        // Apply platform-specific limits to AI-generated hashtags
        const hashtagLimit = platform.toLowerCase() === 'instagram' ? 5 : 3;
        return aiHashtags.slice(0, hashtagLimit);
      }
    } catch (error) {
      console.warn('AI hashtag generation failed, using fallback:', error);
    }

    // Try regional hashtags as fallback
    try {
      const regionalHashtags = await regionalEngine.getRegionalHashtags(
        profile.location,
        profile.businessType,
        profile.businessName
      );

      if (regionalHashtags.length > 0) {
        // Apply platform-specific limits to regional hashtags
        const hashtagLimit = platform.toLowerCase() === 'instagram' ? 5 : 3;
        return regionalHashtags.slice(0, hashtagLimit);
      }
    } catch (error) {
      console.warn('Regional hashtag generation failed:', error);
    }

    // Final fallback - generate contextual hashtags without hardcoded values
    return this.generateContextualFallbackHashtags(profile, platform);
  }

  /**
   * Generate hashtags using AI for maximum relevance and engagement
   */
  private async generateAIHashtags(profile: BusinessProfile, platform: string): Promise<string[]> {
    // Import Vertex AI client instead of Google Generative AI
    const { vertexAIClient } = await import('@/lib/services/vertex-ai-client');

    // Platform-specific hashtag count
    const hashtagCount = platform.toLowerCase() === 'instagram' ? 5 : 3;

    const prompt = `Generate ${hashtagCount} highly relevant, engaging hashtags for a ${profile.businessType} business on ${platform}.

Business Details:
- Name: ${profile.businessName}
- Type: ${profile.businessType}
- Location: ${profile.location}
- Target Audience: ${profile.targetAudience || 'local customers'}
- Brand Voice: ${profile.brandVoice || 'professional and friendly'}

Requirements:
1. Create hashtags that are specific to this business and location
2. Include a mix of: business-specific, location-based, industry-relevant, and platform-optimized hashtags
3. Avoid generic hashtags like #business, #professional, #quality, #local
4. Make hashtags discoverable and relevant to the target audience
5. Consider current trends and seasonal relevance
6. Ensure hashtags are appropriate for ${platform}

Return ONLY a JSON array of hashtags (including the # symbol):
["#hashtag1", "#hashtag2", "#hashtag3", ...]`;

    try {
      // Use Vertex AI with gemini-2.5-flash model
      const result = await getVertexAIClient().generateText(prompt, 'gemini-2.5-flash', {
        temperature: 0.7,
        maxOutputTokens: 1000
      });

      let response = result.text;

      // Remove markdown code blocks if present
      response = response.replace(/```json\s*|\s*```/g, '').trim();

      // Platform-specific hashtag limits
      const hashtagLimit = platform.toLowerCase() === 'instagram' ? 5 : 3;

      // Try to parse as complete JSON first
      try {
        const parsed = JSON.parse(response);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, hashtagLimit);
        }
      } catch {
        // Fallback: extract JSON array from response
        const hashtagsMatch = response.match(/\[.*?\]/);
        if (hashtagsMatch) {
          const hashtags = JSON.parse(hashtagsMatch[0]);
          if (Array.isArray(hashtags) && hashtags.length > 0) {
            return hashtags.slice(0, hashtagLimit);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to parse AI hashtag response:', error);
    }

    return [];
  }

  /**
   * Generate contextual fallback hashtags without hardcoded placeholders
   */
  private generateContextualFallbackHashtags(profile: BusinessProfile, platform: string): string[] {
    const hashtags: string[] = [];

    // Business-specific hashtags (always include)
    hashtags.push(`#${profile.businessName.replace(/\s+/g, '')}`);

    // Varied business type hashtags
    const businessTypeVariations = [
      `#${profile.businessType.replace(/\s+/g, '')}Business`,
      `#${profile.businessType.replace(/\s+/g, '')}Life`,
      `#${profile.businessType.replace(/\s+/g, '')}Experience`,
      `#${profile.businessType.replace(/\s+/g, '')}Excellence`,
      `#${profile.businessType.replace(/\s+/g, '')}Quality`,
      `#${profile.businessType.replace(/\s+/g, '')}Expert`
    ];
    hashtags.push(this.getRandomElement(businessTypeVariations));

    // Location-based hashtags with variations
    const locationParts = profile.location.split(',').map(part => part.trim());
    locationParts.forEach(part => {
      if (part.length > 2) {
        const locationVariations = [
          `#${part.replace(/\s+/g, '')}`,
          `#${part.replace(/\s+/g, '')}Business`,
          `#${part.replace(/\s+/g, '')}Local`,
          `#${part.replace(/\s+/g, '')}Community`,
          `#${part.replace(/\s+/g, '')}Life`
        ];
        hashtags.push(this.getRandomElement(locationVariations));
      }
    });

    // Dynamic contextual hashtags
    const contextualHashtags = this.getDynamicContextualHashtags(profile.businessType, platform);
    hashtags.push(...contextualHashtags);

    // Time-based hashtags with variation
    const timeBasedHashtags = this.getVariedTimeBasedHashtags();
    hashtags.push(...timeBasedHashtags);

    // Industry-specific dynamic hashtags
    const industryHashtags = this.getVariedIndustryHashtags(profile.businessType);
    hashtags.push(...industryHashtags);

    // Platform-specific hashtag limits: 5 for Instagram, 3 for others
    const hashtagLimit = platform.toLowerCase() === 'instagram' ? 5 : 3;
    return [...new Set(hashtags)].slice(0, hashtagLimit); // Remove duplicates and apply platform-specific limit
  }

  /**
   * Get a random element from an array
   */
  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Get multiple random elements from an array
   */
  private getRandomElements<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Get dynamic contextual hashtags with variation
   */
  private getDynamicContextualHashtags(businessType: string, platform: string): string[] {
    const hashtags: string[] = [];

    // Platform-specific hashtags with variation
    const platformHashtags = {
      instagram: ['#InstagramContent', '#VisualStory', '#InstaGood', '#PhotoOfTheDay', '#InstagramBusiness'],
      facebook: ['#FacebookPost', '#CommunityFirst', '#SocialConnection', '#FacebookBusiness', '#CommunityLove'],
      linkedin: ['#LinkedInContent', '#ProfessionalNetwork', '#BusinessGrowth', '#LinkedInPost', '#ProfessionalLife'],
      tiktok: ['#TikTokContent', '#CreativeVideo', '#TikTokBusiness', '#VideoContent', '#CreativeExpression']
    };

    if (platformHashtags[platform as keyof typeof platformHashtags]) {
      const options = platformHashtags[platform as keyof typeof platformHashtags];
      hashtags.push(...this.getRandomElements(options, 2));
    }

    return hashtags;
  }

  /**
   * Get varied time-based hashtags
   */
  private getVariedTimeBasedHashtags(): string[] {
    const today = new Date();
    const timeOptions = [
      // Day-based
      [`#${today.toLocaleDateString('en-US', { weekday: 'long' })}Vibes`, `#${today.toLocaleDateString('en-US', { weekday: 'long' })}Motivation`],
      // Month-based
      [`#${today.toLocaleDateString('en-US', { month: 'long' })}${today.getFullYear()}`, `#${today.toLocaleDateString('en-US', { month: 'long' })}Goals`],
      // Season-based
      this.getSeasonalHashtags(),
      // Time of day
      this.getTimeOfDayHashtags()
    ];

    const selectedOptions = this.getRandomElements(timeOptions.flat(), 2);
    return selectedOptions;
  }

  /**
   * Get seasonal hashtags
   */
  private getSeasonalHashtags(): string[] {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return ['#SpringVibes', '#FreshStart', '#SpringEnergy'];
    else if (month >= 5 && month <= 7) return ['#SummerVibes', '#SummerEnergy', '#SunnyDays'];
    else if (month >= 8 && month <= 10) return ['#AutumnVibes', '#FallFlavors', '#HarvestSeason'];
    else return ['#WinterVibes', '#CozyMoments', '#WarmthInWinter'];
  }

  /**
   * Get time of day hashtags
   */
  private getTimeOfDayHashtags(): string[] {
    const hour = new Date().getHours();
    if (hour < 12) return ['#MorningMotivation', '#FreshStart', '#MorningEnergy'];
    else if (hour < 17) return ['#AfternoonBoost', '#MidDayMoments', '#AfternoonVibes'];
    else return ['#EveningVibes', '#NightTime', '#EveningEnergy'];
  }

  /**
   * Get varied industry-specific hashtags
   */
  private getVariedIndustryHashtags(businessType: string): string[] {
    const industryVariations = {
      restaurant: ['#FoodieLife', '#CulinaryExperience', '#TasteOfExcellence', '#DiningExperience', '#FlavorJourney'],
      retail: ['#ShoppingExperience', '#RetailTherapy', '#StyleStatement', '#QualityProducts', '#ShopLocal'],
      service: ['#ServiceExcellence', '#CustomerFirst', '#ProfessionalService', '#TrustedService', '#QualityService'],
      healthcare: ['#HealthAndWellness', '#CareYouCanTrust', '#HealthFirst', '#WellnessJourney', '#HealthcareExcellence'],
      technology: ['#TechInnovation', '#DigitalSolutions', '#TechExcellence', '#InnovativeApproach', '#TechLeadership']
    };

    const businessKey = businessType.toLowerCase();
    const matchingVariations = Object.keys(industryVariations).find(key => businessKey.includes(key));

    if (matchingVariations) {
      return this.getRandomElements(industryVariations[matchingVariations as keyof typeof industryVariations], 2);
    }

    // Generic business hashtags with variation
    const genericOptions = ['#BusinessExcellence', '#QualityFirst', '#CustomerSatisfaction', '#ProfessionalService', '#TrustedBrand'];
    return this.getRandomElements(genericOptions, 2);
  }

  /**
   * Generate regional subheadlines
   */
  private generateRegionalSubheadline(
    profile: BusinessProfile,
    regionalProfile: any,
    context: ContentAnalysis
  ): string {
    const { businessCommunication, localSlang } = regionalProfile;

    const templates = [
      `${this.getRandomElement(businessCommunication.valuePropositions)} in ${profile.location}`,
      `${this.getRandomElement(businessCommunication.trustBuilders)} - ${this.getRandomElement(localSlang.approval)}`,
      `${this.getRandomElement(businessCommunication.communityConnection)} ${this.getRandomElement(localSlang.emphasis)}`,
    ];

    return this.getRandomElement(templates);
  }

  // Helper methods
  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)] || array[0];
  }

  private capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, l => l.toUpperCase());
  }

  private generateIndustryBenchmarks(businessType: string): string[] {
    return [`${businessType} industry standard`, 'market leader performance', 'customer satisfaction benchmark'];
  }

  private analyzeCompetitorStrategies(competitors: string[]): string[] {
    return competitors.map(comp => `${comp} strategy analysis`);
  }

  private identifyMarketGaps(businessType: string): string[] {
    return [`${businessType} market opportunity`, 'underserved customer segment', 'innovation gap'];
  }

  private setPerformanceTargets(businessType: string): string[] {
    return ['high engagement rate', 'increased brand awareness', 'customer acquisition'];
  }

  private storePostForAnalysis(businessName: string, post: SocialMediaPost): void {
    const existing = this.performanceHistory.get(businessName) || [];
    existing.push(post);
    this.performanceHistory.set(businessName, existing.slice(-50)); // Keep last 50 posts
  }
}

// Export singleton instance
export const advancedContentGenerator = new AdvancedContentGenerator();
