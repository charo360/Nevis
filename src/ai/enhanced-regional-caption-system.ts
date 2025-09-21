// src/ai/enhanced-regional-caption-system.ts
/**
 * Enhanced Regional Caption System
 * Creates captions that feel written by local experts with current regional trends
 */

import { RegionalCommunicationEngine } from './regional-communication-engine';
import { TrendingHashtagsService } from '../services/trending-hashtags-service';
import type { BrandProfile, Platform } from '@/lib/types';

export interface RegionalTrendData {
  currentEvents: string[];
  culturalMoments: string[];
  seasonalReferences: string[];
  localSlang: string[];
  regionalHashtags: string[];
  weatherContext?: string;
  economicContext?: string;
}

export interface EnhancedCaptionComponents {
  headline: string;        // 4-8 words, punchy, local-aware
  subheadline: string;     // 15-25 words, compelling value prop
  caption: string;         // Full engaging caption with local flavor
  callToAction: string;    // Action-oriented, culturally appropriate
  hashtags: string[];      // Platform-optimized, trending + evergreen
  localFlavor: {
    language: string;
    culturalRef: string;
    regionalTrend: string;
  };
}

export interface RegionalCaptionContext {
  businessType: string;
  businessName: string;
  location: string;
  platform: Platform;
  targetAudience?: string;
  brandProfile: BrandProfile;
  useLocalLanguage?: boolean;
}

/**
 * Enhanced Regional Caption System
 * Generates content that feels authentically local with current regional trends
 */
export class EnhancedRegionalCaptionSystem {
  private regionEngine: RegionalCommunicationEngine;
  private regionalTrendsCache: Map<string, { data: RegionalTrendData; timestamp: number }> = new Map();
  private readonly cacheTimeout = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.regionEngine = new RegionalCommunicationEngine();
  }

  /**
   * Generate comprehensive caption components with regional intelligence
   */
  async generateRegionalCaption(context: RegionalCaptionContext): Promise<EnhancedCaptionComponents> {
    try {
      // Get regional trend data
      const regionalData = await this.getRegionalTrendData(context.location, context.businessType);
      
      // Get trending hashtags - use services from brand profile if available
      const trendingContext = context.brandProfile.services || context.businessType;
      console.log('🔍 [Enhanced Regional] Using trending context:', {
        services: context.brandProfile.services,
        businessType: context.businessType,
        finalContext: trendingContext
      });
      
      const trendingHashtags = await TrendingHashtagsService.getTrendingHashtags(
        trendingContext,
        context.location,
        12
      );

      // Generate base content using AI
      const baseContent = await this.generateBaseContent(context, regionalData);
      
      // Enhance with regional flavor
      const enhancedContent = await this.addRegionalFlavor(baseContent, context, regionalData);
      
      // Optimize for platform
      const optimizedContent = this.optimizeForPlatform(enhancedContent, context.platform);
      
      // Add trending hashtags
      optimizedContent.hashtags = [
        ...optimizedContent.hashtags,
        ...trendingHashtags.slice(0, this.getHashtagLimit(context.platform))
      ]
      .filter((tag, index, arr) => arr.indexOf(tag) === index) // Remove duplicates
      .slice(0, this.getHashtagLimit(context.platform));

      return optimizedContent;
      
    } catch (error) {
      console.error('Enhanced regional caption generation failed:', error);
      return this.getFallbackCaption(context);
    }
  }

  /**
   * Get regional trend data from multiple sources
   */
  private async getRegionalTrendData(location: string, businessType: string): Promise<RegionalTrendData> {
    const cacheKey = `${location}-${businessType}`;
    const cached = this.regionalTrendsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Get regional trends from multiple sources
      const trendData = await this.fetchRegionalTrends(location, businessType);
      
      this.regionalTrendsCache.set(cacheKey, {
        data: trendData,
        timestamp: Date.now()
      });
      
      return trendData;
      
    } catch (error) {
      console.warn('Failed to fetch regional trends:', error);
      return this.getDefaultRegionalData(location);
    }
  }

  /**
   * Fetch real regional trends from multiple sources
   */
  private async fetchRegionalTrends(location: string, businessType: string): Promise<RegionalTrendData> {
    const country = this.extractCountry(location);
    const region = this.getRegion(country);

    try {
      // Fetch regional news and trends
      const [newsData, weatherData, economicData] = await Promise.all([
        this.fetchRegionalNews(country),
        this.fetchWeatherContext(location),
        this.fetchEconomicContext(country)
      ]);

      return {
        currentEvents: newsData.events || [],
        culturalMoments: newsData.cultural || [],
        seasonalReferences: this.getSeasonalReferences(location),
        localSlang: this.getLocalSlang(country),
        regionalHashtags: newsData.hashtags || [],
        weatherContext: weatherData,
        economicContext: economicData
      };
      
    } catch (error) {
      console.warn('Regional trends fetch failed:', error);
      return this.getDefaultRegionalData(location);
    }
  }

  /**
   * Fetch regional news for current events context
   */
  private async fetchRegionalNews(country: string): Promise<any> {
    try {
      // Map countries to news sources
      const newsSources: Record<string, string> = {
        'kenya': 'https://www.nation.co.ke/kenya/rss',
        'nigeria': 'https://punchng.com/feed/',
        'south africa': 'https://www.news24.com/feeds/rss/News24/News24/SouthAfrica',
        'ghana': 'https://www.ghanaweb.com/GhanaHomePage/rss/news.xml',
        'usa': 'https://feeds.reuters.com/reuters/domesticNews',
        'canada': 'https://www.cbc.ca/cmlink/rss-canada',
        'india': 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
        'uk': 'https://feeds.bbci.co.uk/news/uk/rss.xml'
      };

      const rssUrl = newsSources[country.toLowerCase()];
      if (!rssUrl) return { events: [], cultural: [], hashtags: [] };

      // Fetch and parse regional news
      const response = await fetch(`/api/rss-data?customUrl=${encodeURIComponent(rssUrl)}&limit=20`);
      if (!response.ok) return { events: [], cultural: [], hashtags: [] };

      const newsData = await response.json();
      
      // Extract relevant events and cultural moments
      const events = newsData.keywords?.filter((keyword: string) => 
        this.isCurrentEvent(keyword)
      ).slice(0, 5) || [];

      const cultural = newsData.keywords?.filter((keyword: string) => 
        this.isCulturalMoment(keyword, country)
      ).slice(0, 3) || [];

      const hashtags = newsData.hashtags?.filter((hashtag: string) => 
        this.isRegionallyRelevant(hashtag, country)
      ).slice(0, 8) || [];

      return { events, cultural, hashtags };
      
    } catch (error) {
      console.warn('Regional news fetch failed:', error);
      return { events: [], cultural: [], hashtags: [] };
    }
  }

  /**
   * Get weather context for location-aware content
   */
  private async fetchWeatherContext(location: string): Promise<string> {
    try {
      // Simplified weather context - in production, use weather API
      const season = this.getCurrentSeason(location);
      const weatherContexts: Record<string, string> = {
        'summer': 'perfect weather for outdoor activities',
        'winter': 'cozy indoor season perfect for comfort',
        'spring': 'fresh start season with new energy',
        'fall': 'harvest season with warm community vibes'
      };
      
      return weatherContexts[season] || '';
    } catch (error) {
      return '';
    }
  }

  /**
   * Generate base content with AI
   */
  private async generateBaseContent(
    context: RegionalCaptionContext, 
    regionalData: RegionalTrendData
  ): Promise<EnhancedCaptionComponents> {
    const currentEvents = regionalData.currentEvents.slice(0, 2).join(', ');
    const culturalContext = regionalData.culturalMoments.slice(0, 1)[0] || '';
    const weatherContext = regionalData.weatherContext || '';

    const prompt = `You are a local ${context.businessType} marketing expert in ${context.location}. Create authentic content that feels written by someone who lives and works in this area.

BUSINESS CONTEXT:
- Business: ${context.businessName || context.businessType}
- Industry: ${context.businessType}
- Location: ${context.location}
- Platform: ${context.platform}
- Target: ${context.targetAudience || 'Local community'}

CURRENT REGIONAL CONTEXT:
- Current events: ${currentEvents || 'General business trends'}
- Cultural moment: ${culturalContext || 'Community focus'}
- Season context: ${weatherContext || 'Current season'}

GENERATE THESE COMPONENTS:

1. HEADLINE (4-8 words): Catchy, local-relevant headline
2. SUBHEADLINE (15-25 words): Compelling value proposition with local flavor
3. CAPTION: Full engaging caption (150-300 words) that includes:
   - Strong hook with local relevance
   - Current regional context subtly woven in
   - Authentic local voice (not tourist-like)
   - Call to action appropriate for the region
   - ${context.useLocalLanguage ? 'Use simple local phrases ONLY if 100% certain of accuracy' : 'Use English with local cultural references'}
4. CALL_TO_ACTION: Specific, culturally appropriate action

LANGUAGE GUIDELINES:
- Write as a LOCAL expert, not an outsider
- Include cultural references naturally (not forced)
- Use conversational tone appropriate for the region
- ${context.useLocalLanguage ? 'Add simple local language ONLY when certain of accuracy' : 'Focus on local cultural understanding in English'}

Return JSON format:
{
  "headline": "4-8 word headline",
  "subheadline": "15-25 word compelling subheadline",
  "caption": "Full engaging caption with local expertise",
  "callToAction": "Specific actionable CTA",
  "localReferences": ["ref1", "ref2", "ref3"],
  "culturalElements": ["element1", "element2"]
}`;

    const openai = await import('openai').then(m => new m.default({ apiKey: process.env.OPENAI_API_KEY }));
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content generated');

    try {
      const parsedContent = JSON.parse(content);
      return {
        headline: parsedContent.headline || `Great ${context.businessType}`,
        subheadline: parsedContent.subheadline || `Quality ${context.businessType} services in ${context.location}`,
        caption: parsedContent.caption || `Check out our amazing ${context.businessType} business!`,
        callToAction: parsedContent.callToAction || 'Contact us today!',
        hashtags: [], // Will be filled later
        localFlavor: {
          language: context.useLocalLanguage ? 'mixed' : 'english',
          culturalRef: parsedContent.localReferences?.[0] || '',
          regionalTrend: regionalData.currentEvents[0] || ''
        }
      };
    } catch (parseError) {
      console.warn('Failed to parse AI response, using fallback');
      return this.getFallbackCaption(context);
    }
  }

  /**
   * Add authentic regional flavor to content
   */
  private async addRegionalFlavor(
    content: EnhancedCaptionComponents,
    context: RegionalCaptionContext,
    regionalData: RegionalTrendData
  ): Promise<EnhancedCaptionComponents> {
    const country = this.extractCountry(context.location);
    
    // Get regional communication style
    const regionalProfile = this.regionEngine.getRegionalProfile(country);
    
    if (!regionalProfile) return content;

    // Enhance with local communication patterns
    let enhancedCaption = content.caption;
    
    // Add regional greeting/attention grabber (if appropriate)
    if (regionalProfile.localSlang.greetings.length > 0 && context.useLocalLanguage) {
      const greeting = regionalProfile.localSlang.greetings[0];
      if (!enhancedCaption.toLowerCase().includes(greeting.toLowerCase())) {
        enhancedCaption = `${greeting}! ${enhancedCaption}`;
      }
    }

    // Add current regional trend reference if relevant
    if (regionalData.currentEvents.length > 0) {
      const currentEvent = regionalData.currentEvents[0];
      if (this.isBusinessRelevant(currentEvent, context.businessType)) {
        enhancedCaption = this.weaveInRegionalTrend(enhancedCaption, currentEvent, context);
      }
    }

    // Enhance CTA with regional communication style
    const enhancedCTA = this.enhanceCTAWithRegionalStyle(
      content.callToAction,
      regionalProfile,
      context
    );

    return {
      ...content,
      caption: enhancedCaption,
      callToAction: enhancedCTA,
      localFlavor: {
        ...content.localFlavor,
        regionalTrend: regionalData.currentEvents[0] || '',
        culturalRef: regionalProfile.businessCommunication.localReferences[0] || ''
      }
    };
  }

  /**
   * Optimize content for specific platform
   */
  private optimizeForPlatform(
    content: EnhancedCaptionComponents,
    platform: Platform
  ): EnhancedCaptionComponents {
    const platformOptimizations = {
      'Instagram': {
        maxCaptionLength: 300,
        emojiCount: '8-12',
        tone: 'visual storytelling, lifestyle-focused',
        hashtagCount: 10
      },
      'Facebook': {
        maxCaptionLength: 400,
        emojiCount: '4-8',
        tone: 'community discussion, conversational',
        hashtagCount: 3
      },
      'Twitter': {
        maxCaptionLength: 200,
        emojiCount: '2-4',
        tone: 'witty, concise, engaging',
        hashtagCount: 2
      },
      'LinkedIn': {
        maxCaptionLength: 250,
        emojiCount: '1-3',
        tone: 'professional insights, thought leadership',
        hashtagCount: 5
      }
    };

    const optimization = platformOptimizations[platform];
    if (!optimization) return content;

    // Optimize caption length
    if (content.caption.length > optimization.maxCaptionLength) {
      content.caption = this.truncateIntelligently(content.caption, optimization.maxCaptionLength);
    }

    return content;
  }

  /**
   * Weave regional trend into caption naturally
   */
  private weaveInRegionalTrend(caption: string, trend: string, context: RegionalCaptionContext): string {
    // Business-relevant trend integration patterns
    const integrationPatterns = {
      restaurant: {
        food_festival: `With ${trend} happening this week, it's the perfect time to experience authentic flavors at ${context.businessName}.`,
        harvest_season: `As ${trend} brings fresh ingredients to market, we're excited to share what's new in our kitchen.`,
        celebration: `Celebrating ${trend} the way it should be - with great food and community at ${context.businessName}.`
      },
      fitness: {
        health_awareness: `With ${trend} reminding us about wellness, now's the perfect time to prioritize your health journey.`,
        sports_event: `Inspired by ${trend}? Channel that energy into your fitness goals with us.`,
        new_year: `As ${trend} motivates everyone to get healthier, we're here to support your transformation.`
      },
      technology: {
        innovation_news: `Just like ${trend} is changing the industry, we're transforming how businesses succeed.`,
        tech_event: `The excitement around ${trend} shows how technology shapes our future - let us shape yours.`,
        digital_trend: `While ${trend} makes headlines, we're making real impact for businesses like yours.`
      }
    };

    const businessPatterns = integrationPatterns[context.businessType as keyof typeof integrationPatterns];
    if (!businessPatterns) return caption;

    // Find the most relevant pattern
    const patternKey = this.findRelevantPattern(trend, Object.keys(businessPatterns));
    if (!patternKey) return caption;

    const trendSentence = businessPatterns[patternKey as keyof typeof businessPatterns]?.replace('{trend}', trend);
    
    // Insert trend reference naturally into caption
    const sentences = caption.split('. ');
    if (sentences.length >= 2) {
      // Insert after first sentence
      sentences.splice(1, 0, trendSentence);
      return sentences.join('. ').replace('..', '.');
    }
    
    return `${trendSentence} ${caption}`;
  }

  /**
   * Enhance CTA with regional communication style
   */
  private enhanceCTAWithRegionalStyle(
    cta: string,
    regionalProfile: any,
    context: RegionalCaptionContext
  ): string {
    if (!regionalProfile?.localSlang?.callToAction) return cta;

    const regionalCTAStyles = regionalProfile.localSlang.callToAction;
    
    // Regional CTA patterns
    const countryPatterns: Record<string, string[]> = {
      'kenya': [
        'Karibu (welcome) - let\'s talk!',
        'Ready to start? Tuko ready pia (we\'re ready too)!',
        'Don\'t miss out - contact us leo (today)!'
      ],
      'nigeria': [
        'Oya now - let\'s get started!',
        'No wahala (no problem) - reach out today!',
        'Ready to begin? We dey wait for you!'
      ],
      'south africa': [
        'Come through and let\'s chat!',
        'Sharp sharp - get in touch now!',
        'Ready when you are, friend!'
      ],
      'ghana': [
        'Akwaaba (welcome)! Let\'s connect today!',
        'Ready to start? Medaase (thank you) for considering us!',
        'Let\'s make it happen - reach out now!'
      ],
      'usa': [
        'Ready to level up? Let\'s chat!',
        'Game changer awaits - contact us today!',
        'Let\'s make this happen together!'
      ],
      'canada': [
        'Ready to get started, eh? Let\'s talk!',
        'Beauty opportunity awaits - reach out today!',
        'Let\'s make something great together!'
      ],
      'india': [
        'Namaste! Ready to begin this journey?',
        'Accha (good)! Let\'s connect and discuss!',
        'Dhanyawad (thank you) for your interest - let\'s talk!'
      ]
    };

    const country = this.extractCountry(context.location);
    const localPatterns = countryPatterns[country.toLowerCase()];
    
    if (localPatterns && context.useLocalLanguage && Math.random() > 0.7) {
      // 30% chance to use local CTA if local language is enabled
      return localPatterns[Math.floor(Math.random() * localPatterns.length)];
    }

    return cta;
  }

  /**
   * Helper methods
   */
  private extractCountry(location: string): string {
    // Extract country from location string
    const locationLower = location.toLowerCase();
    if (locationLower.includes('kenya') || locationLower.includes('nairobi')) return 'kenya';
    if (locationLower.includes('nigeria') || locationLower.includes('lagos')) return 'nigeria';
    if (locationLower.includes('south africa') || locationLower.includes('cape town')) return 'south africa';
    if (locationLower.includes('usa') || locationLower.includes('united states')) return 'usa';
    if (locationLower.includes('uk') || locationLower.includes('united kingdom')) return 'uk';
    
    return 'global';
  }

  private getRegion(country: string): string {
    const regionMap: Record<string, string> = {
      'kenya': 'east_africa',
      'nigeria': 'west_africa', 
      'south africa': 'southern_africa',
      'usa': 'north_america',
      'uk': 'europe'
    };
    return regionMap[country] || 'global';
  }

  private getCurrentSeason(location: string): string {
    const month = new Date().getMonth();
    const isNorthernHemisphere = !location.toLowerCase().includes('south africa');
    
    if (isNorthernHemisphere) {
      if (month >= 2 && month <= 4) return 'spring';
      if (month >= 5 && month <= 7) return 'summer';
      if (month >= 8 && month <= 10) return 'fall';
      return 'winter';
    } else {
      // Southern hemisphere (opposite seasons)
      if (month >= 8 && month <= 10) return 'spring';
      if (month >= 11 || month <= 1) return 'summer';
      if (month >= 2 && month <= 4) return 'fall';
      return 'winter';
    }
  }

  private getSeasonalReferences(location: string): string[] {
    const season = this.getCurrentSeason(location);
    const country = this.extractCountry(location);
    
    const seasonalRefs: Record<string, Record<string, string[]>> = {
      'kenya': {
        'summer': ['dry season opportunities', 'perfect weather for outdoor dining'],
        'winter': ['rainy season comfort', 'indoor gathering time']
      },
      'nigeria': {
        'summer': ['harmattan season energy', 'dry season activities'],
        'winter': ['rainy season warmth', 'indoor comfort focus']
      }
    };

    return seasonalRefs[country]?.[season] || [`${season} season energy`];
  }

  private getLocalSlang(country: string): string[] {
    const slangMap: Record<string, string[]> = {
      'kenya': ['sawa sawa', 'poa', 'mambo', 'harambee'],
      'nigeria': ['oya', 'wahala', 'sharp sharp', 'no be small thing'],
      'south africa': ['sharp', 'lekker', 'boet', 'howzit'],
      'ghana': ['akwaaba', 'medaase', 'chale', 'omo'],
      'usa': ['awesome', 'let\'s go', 'game changer', 'for sure'],
      'canada': ['eh', 'beauty', 'eh buddy', 'right on'],
      'india': ['namaste', 'accha', 'dhanyawad', 'jugaad', 'areh yaar']
    };
    
    return slangMap[country] || [];
  }

  private getHashtagLimit(platform: Platform): number {
    const limits: Record<string, number> = {
      'Instagram': 10,
      'Facebook': 3,
      'Twitter': 2,
      'LinkedIn': 5
    };
    return limits[platform] || 5;
  }

  private isCurrentEvent(keyword: string): boolean {
    const eventKeywords = ['election', 'festival', 'celebration', 'event', 'conference', 'summit', 'awards'];
    return eventKeywords.some(eventWord => keyword.toLowerCase().includes(eventWord));
  }

  private isCulturalMoment(keyword: string, country: string): boolean {
    const culturalKeywords: Record<string, string[]> = {
      'kenya': ['harambee', 'jamhuri', 'mashujaa', 'cultural'],
      'nigeria': ['independence', 'cultural', 'heritage', 'traditional'],
      'south africa': ['heritage', 'freedom', 'cultural', 'rainbow']
    };
    
    const keywords = culturalKeywords[country] || [];
    return keywords.some(cultural => keyword.toLowerCase().includes(cultural));
  }

  private isRegionallyRelevant(hashtag: string, country: string): boolean {
    const hashtagLower = hashtag.toLowerCase();
    const relevantTerms: Record<string, string[]> = {
      'kenya': ['kenya', 'nairobi', 'east africa', 'african'],
      'nigeria': ['nigeria', 'naija', 'lagos', 'west africa', 'african'],
      'south africa': ['south africa', 'cape town', 'johannesburg', 'african'],
      'ghana': ['ghana', 'accra', 'kumasi', 'west africa', 'african'],
      'usa': ['usa', 'america', 'american', 'us'],
      'canada': ['canada', 'canadian', 'toronto', 'vancouver', 'montreal'],
      'india': ['india', 'indian', 'mumbai', 'delhi', 'bangalore', 'chennai']
    };
    
    const terms = relevantTerms[country] || [];
    return terms.some(term => hashtagLower.includes(term.replace(' ', '')));
  }

  private isBusinessRelevant(event: string, businessType: string): boolean {
    const relevanceMap: Record<string, string[]> = {
      'restaurant': ['food', 'harvest', 'festival', 'celebration', 'market'],
      'fitness': ['health', 'wellness', 'sports', 'marathon', 'competition'],
      'technology': ['innovation', 'tech', 'digital', 'conference', 'startup']
    };
    
    const keywords = relevanceMap[businessType] || [];
    return keywords.some(keyword => event.toLowerCase().includes(keyword));
  }

  private findRelevantPattern(trend: string, patternKeys: string[]): string | null {
    const trendLower = trend.toLowerCase();
    return patternKeys.find(key => trendLower.includes(key.replace('_', ' '))) || null;
  }

  private truncateIntelligently(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    
    // Find last complete sentence within limit
    const truncated = text.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastPeriod > maxLength * 0.8) {
      return truncated.substring(0, lastPeriod + 1);
    } else if (lastSpace > maxLength * 0.9) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  private getDefaultRegionalData(location: string): RegionalTrendData {
    return {
      currentEvents: [`${location} business growth`],
      culturalMoments: ['community focus'],
      seasonalReferences: [this.getCurrentSeason(location)],
      localSlang: this.getLocalSlang(this.extractCountry(location)),
      regionalHashtags: [`#${this.extractCountry(location).replace(' ', '')}`],
      weatherContext: `${this.getCurrentSeason(location)} season energy`
    };
  }

  private getFallbackCaption(context: RegionalCaptionContext): EnhancedCaptionComponents {
    return {
      headline: `Great ${context.businessType}`,
      subheadline: `Quality ${context.businessType} services you can trust in ${context.location}`,
      caption: `Looking for exceptional ${context.businessType} services in ${context.location}? We're here to help with professional, reliable solutions that deliver results. Contact us to learn more about how we can serve you.`,
      callToAction: 'Get in touch today!',
      hashtags: [`#${context.businessType}`, `#${context.location.replace(' ', '')}`],
      localFlavor: {
        language: 'english',
        culturalRef: 'local community focus',
        regionalTrend: 'business growth'
      }
    };
  }

  /**
   * Get fresh economic context (business environment trends)
   */
  private async fetchEconomicContext(country: string): Promise<string> {
    // This could integrate with economic news APIs or your RSS system
    // For now, return relevant business context
    const economicContexts: Record<string, string> = {
      'kenya': 'growing digital economy and entrepreneurship',
      'nigeria': 'vibrant business ecosystem and innovation',
      'south africa': 'emerging market opportunities',
      'usa': 'competitive business environment',
      'uk': 'professional service market'
    };
    
    return economicContexts[country] || 'dynamic business environment';
  }
}
