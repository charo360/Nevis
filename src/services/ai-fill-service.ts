/**
 * AI Fill Service - Enhanced contextual suggestions for prompt builder
 * Integrates with RSS feeds, trending data, local events, and weather
 */

import { BrandProfile } from '@/lib/types';
import { rssService } from './rss-feed-service';
import { fetchLocalContext } from '@/ai/utils/real-time-trends-integration';
import { generateRealTimeTrendingTopics } from '@/ai/utils/trending-topics';

export interface ContextualData {
  trendingKeywords: string[];
  trendingTopics: string[];
  localEvents: any[];
  weather: any;
  news: any[];
  seasonalContext: {
    season: string;
    month: string;
    dayOfWeek: string;
    timeOfDay: string;
  };
  businessContext: {
    industryTrends: string[];
    competitorInsights: string[];
    marketOpportunities: string[];
  };
}

export interface EnhancedPromptData {
  headline: string;
  subheadline: string;
  cta: string;
  description: string;
  productsServices: string;
  includeProductsServices: boolean;
  email: string;
  phone: string;
  website: string;
  includeImage: boolean;
  contextualElements: {
    trendingHashtags: string[];
    localRelevance: string[];
    seasonalElements: string[];
    urgencyFactors: string[];
  };
}

export class AIFillService {
  private cache = new Map<string, { data: ContextualData; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Fetch comprehensive contextual data for AI suggestions
   */
  async fetchContextualData(brandProfile: BrandProfile): Promise<ContextualData> {
    const cacheKey = `${brandProfile.businessType}-${brandProfile.location}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Fetch all data sources in parallel
      const [
        trendingData,
        localContext,
        realTimeTrends
      ] = await Promise.allSettled([
        rssService.getTrendingData(),
        fetchLocalContext(brandProfile.location, brandProfile.businessType),
        generateRealTimeTrendingTopics(
          brandProfile.businessType,
          brandProfile.location,
          'instagram' // Default platform
        )
      ]);

      // Process trending data
      const trendingKeywords = trendingData.status === 'fulfilled' 
        ? trendingData.value.keywords.slice(0, 20) 
        : [];
      
      const trendingTopics = trendingData.status === 'fulfilled'
        ? trendingData.value.topics.slice(0, 10)
        : [];

      // Process local context
      const localEvents = localContext.status === 'fulfilled'
        ? localContext.value.events || []
        : [];

      const weather = localContext.status === 'fulfilled'
        ? localContext.value.weather || null
        : null;

      // Process real-time trends
      const news = realTimeTrends.status === 'fulfilled'
        ? realTimeTrends.value.news || []
        : [];

      // Generate seasonal context
      const now = new Date();
      const seasonalContext = {
        season: this.getSeason(now),
        month: now.toLocaleDateString('en-US', { month: 'long' }),
        dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
        timeOfDay: this.getTimeOfDay(now)
      };

      // Generate business-specific context
      const businessContext = this.generateBusinessContext(
        brandProfile.businessType,
        trendingKeywords,
        trendingTopics
      );

      const contextualData: ContextualData = {
        trendingKeywords,
        trendingTopics,
        localEvents,
        weather,
        news,
        seasonalContext,
        businessContext
      };

      // Cache the result
      this.cache.set(cacheKey, { data: contextualData, timestamp: Date.now() });

      return contextualData;
    } catch (error) {
      console.error('Error fetching contextual data:', error);
      // Return fallback data
      return this.getFallbackContextualData(brandProfile);
    }
  }

  /**
   * Generate enhanced AI suggestions with contextual data
   */
  async generateEnhancedSuggestions(
    brandProfile: BrandProfile,
    contextualData: ContextualData
  ): Promise<EnhancedPromptData> {
    const businessName = brandProfile.businessName;
    const businessType = brandProfile.businessType;
    const location = brandProfile.location;
    const description = brandProfile.description || '';
    const services = brandProfile.services || '';
    const targetAudience = brandProfile.targetAudience || '';
    const contactInfo = brandProfile.contactInfo || {};

    // Generate contextual headlines
    const headlines = this.generateContextualHeadlines(
      businessName,
      businessType,
      contextualData
    );

    // Generate contextual subheadlines
    const subheadlines = this.generateContextualSubheadlines(
      businessName,
      businessType,
      location,
      contextualData
    );

    // Generate contextual CTAs
    const ctas = this.generateContextualCTAs(
      businessType,
      contextualData
    );

    // Generate contextual descriptions
    const descriptions = this.generateContextualDescriptions(
      businessName,
      businessType,
      location,
      contextualData
    );

    // Generate contextual elements
    const contextualElements = this.generateContextualElements(
      contextualData,
      businessType
    );

    // Randomly select suggestions
    const randomHeadline = headlines[Math.floor(Math.random() * headlines.length)];
    const randomSubheadline = subheadlines[Math.floor(Math.random() * subheadlines.length)];
    const randomCta = ctas[Math.floor(Math.random() * ctas.length)];
    const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];

    // Generate products/services based on business profile
    const productsServices = this.generateProductsServices(brandProfile, contextualData);

    return {
      headline: randomHeadline,
      subheadline: randomSubheadline,
      cta: randomCta,
      description: randomDescription,
      productsServices,
      includeProductsServices: true, // AI Fill always includes products/services
      email: contactInfo.email || '',
      phone: contactInfo.phone || '',
      website: brandProfile.websiteUrl || '',
      includeImage: false,
      contextualElements
    };
  }

  private generateContextualHeadlines(
    businessName: string,
    businessType: string,
    contextualData: ContextualData
  ): string[] {
    const headlines: string[] = [];
    const { trendingKeywords, seasonalContext, localEvents } = contextualData;

    // Base headlines
    headlines.push(
      `${businessName} - Your ${businessType} Solution`,
      `Transform Your ${businessType} Experience with ${businessName}`,
      `${businessName}: Excellence in ${businessType}`
    );

    // Trending-based headlines
    if (trendingKeywords.length > 0) {
      const trendingKeyword = trendingKeywords[0];
      headlines.push(
        `${businessName}: ${trendingKeyword} Solutions`,
        `Join the ${trendingKeyword} Revolution with ${businessName}`,
        `${businessName} - Leading ${trendingKeyword} Innovation`
      );
    }

    // Seasonal headlines
    if (seasonalContext.season === 'summer') {
      headlines.push(
        `Summer Ready with ${businessName}`,
        `${businessName} - Your Summer ${businessType} Partner`
      );
    } else if (seasonalContext.season === 'winter') {
      headlines.push(
        `Winter Solutions from ${businessName}`,
        `${businessName} - Your Winter ${businessType} Expert`
      );
    }

    // Event-based headlines
    if (localEvents.length > 0) {
      const event = localEvents[0];
      headlines.push(
        `${businessName} at ${event.name || 'Local Events'}`,
        `Celebrating with ${businessName} - ${event.name || 'Local Community'}`
      );
    }

    return headlines;
  }

  private generateContextualSubheadlines(
    businessName: string,
    businessType: string,
    location: string,
    contextualData: ContextualData
  ): string[] {
    const subheadlines: string[] = [];
    const { trendingTopics, weather, seasonalContext } = contextualData;

    // Base subheadlines
    subheadlines.push(
      `Professional ${businessType} services in ${location}`,
      `Your trusted partner for ${businessType.toLowerCase()} needs`,
      `Quality ${businessType.toLowerCase()} services you can count on`
    );

    // Weather-based subheadlines
    if (weather) {
      if (weather.condition?.toLowerCase().includes('sunny')) {
        subheadlines.push(
          `Perfect weather for ${businessType.toLowerCase()} - let's get started!`,
          `Sunny days, great ${businessType.toLowerCase()} solutions`
        );
      } else if (weather.condition?.toLowerCase().includes('rain')) {
        subheadlines.push(
          `Rain or shine, we deliver exceptional ${businessType.toLowerCase()} services`,
          `Don't let the weather stop your ${businessType.toLowerCase()} goals`
        );
      }
    }

    // Trending topics subheadlines
    if (trendingTopics.length > 0) {
      const topic = trendingTopics[0];
      subheadlines.push(
        `Stay ahead with ${topic} - ${businessName} has you covered`,
        `Join the ${topic} conversation with ${businessName}`
      );
    }

    // Seasonal subheadlines
    if (seasonalContext.month === 'December') {
      subheadlines.push(
        `Holiday specials and year-end ${businessType.toLowerCase()} solutions`,
        `Finish the year strong with ${businessName}`
      );
    }

    return subheadlines;
  }

  private generateContextualCTAs(
    businessType: string,
    contextualData: ContextualData
  ): string[] {
    const ctas: string[] = [];
    const { trendingKeywords, seasonalContext, localEvents } = contextualData;

    // Base CTAs
    ctas.push(
      'Get Started Today',
      'Contact Us Now',
      'Learn More',
      'Book Consultation'
    );

    // Trending-based CTAs
    if (trendingKeywords.length > 0) {
      ctas.push(
        'Join the Trend',
        'Be Part of It',
        'Don\'t Miss Out'
      );
    }

    // Seasonal CTAs
    if (seasonalContext.season === 'summer') {
      ctas.push(
        'Summer Special',
        'Beat the Heat',
        'Summer Ready'
      );
    } else if (seasonalContext.season === 'winter') {
      ctas.push(
        'Winter Warmth',
        'Stay Cozy',
        'Winter Special'
      );
    }

    // Event-based CTAs
    if (localEvents.length > 0) {
      ctas.push(
        'Join Us There',
        'See You There',
        'Event Special'
      );
    }

    return ctas;
  }

  private generateContextualDescriptions(
    businessName: string,
    businessType: string,
    location: string,
    contextualData: ContextualData
  ): string[] {
    const descriptions: string[] = [];
    const { trendingKeywords, weather, localEvents, seasonalContext } = contextualData;

    // Base descriptions
    descriptions.push(
      `Experience the difference with ${businessName}. We provide exceptional ${businessType.toLowerCase()} services tailored to your needs.`,
      `Professional ${businessType.toLowerCase()} services in ${location} with a commitment to excellence.`
    );

    // Trending-based descriptions
    if (trendingKeywords.length > 0) {
      const trendingKeyword = trendingKeywords[0];
      descriptions.push(
        `Stay ahead of the curve with ${businessName}. We're at the forefront of ${trendingKeyword} innovation in ${businessType.toLowerCase()}.`,
        `Join the ${trendingKeyword} movement with ${businessName} - your trusted ${businessType.toLowerCase()} partner.`
      );
    }

    // Weather-based descriptions
    if (weather) {
      descriptions.push(
        `Whether it's ${weather.condition || 'any weather'}, ${businessName} delivers reliable ${businessType.toLowerCase()} solutions.`,
        `Don't let ${weather.condition || 'the weather'} stop your ${businessType.toLowerCase()} goals. ${businessName} is here to help.`
      );
    }

    // Event-based descriptions
    if (localEvents.length > 0) {
      const event = localEvents[0];
      descriptions.push(
        `Join us at ${event.name || 'local events'} and discover why ${businessName} is the ${businessType.toLowerCase()} choice for ${location}.`,
        `Celebrating our community with ${businessName} - your local ${businessType.toLowerCase()} experts.`
      );
    }

    // Seasonal descriptions
    if (seasonalContext.month === 'December') {
      descriptions.push(
        `End the year strong with ${businessName}. Special holiday ${businessType.toLowerCase()} solutions to help you finish 2024 on top.`,
        `Holiday cheer and ${businessType.toLowerCase()} excellence - that's what ${businessName} brings to ${location}.`
      );
    }

    return descriptions;
  }

  private generateProductsServices(
    brandProfile: BrandProfile,
    contextualData: ContextualData
  ): string {
    const { services } = brandProfile;
    const { trendingKeywords, seasonalContext } = contextualData;

    // If business profile has services, use them
    if (services && services.trim()) {
      return services.split('\n').map(service => `• ${service.trim()}`).join('\n');
    }

    // Generate contextual products/services based on business type
    const businessType = brandProfile.businessType.toLowerCase();
    
    if (businessType.includes('restaurant') || businessType.includes('food')) {
      const seasonalItems = seasonalContext.season === 'winter' 
        ? ['• Hot Soups', '• Warm Beverages', '• Comfort Food']
        : ['• Fresh Salads', '• Cold Drinks', '• Light Meals'];
      
      return [
        '• Appetizers & Starters',
        '• Main Courses',
        '• Desserts',
        ...seasonalItems,
        '• Catering Services'
      ].join('\n');
    } else if (businessType.includes('fitness') || businessType.includes('gym')) {
      return [
        '• Personal Training',
        '• Group Classes',
        '• Nutrition Counseling',
        '• Equipment Training',
        '• Membership Plans'
      ].join('\n');
    } else if (businessType.includes('beauty') || businessType.includes('salon')) {
      return [
        '• Hair Styling',
        '• Hair Coloring',
        '• Facial Treatments',
        '• Manicures & Pedicures',
        '• Makeup Services'
      ].join('\n');
    } else if (businessType.includes('tech') || businessType.includes('software')) {
      return [
        '• Web Development',
        '• Mobile App Development',
        '• Digital Marketing',
        '• SEO Services',
        '• IT Consulting'
      ].join('\n');
    } else {
      // Generic business services
      return [
        '• Consultation Services',
        '• Custom Solutions',
        '• Support & Maintenance',
        '• Training Programs',
        '• Premium Packages'
      ].join('\n');
    }
  }

  private generateContextualElements(
    contextualData: ContextualData,
    businessType: string
  ) {
    const { trendingKeywords, localEvents, seasonalContext } = contextualData;

    return {
      trendingHashtags: trendingKeywords.slice(0, 5).map(keyword => 
        `#${keyword.replace(/\s+/g, '')}`
      ),
      localRelevance: localEvents.slice(0, 3).map(event => 
        event.name || 'Local Event'
      ),
      seasonalElements: [
        seasonalContext.season,
        seasonalContext.month,
        seasonalContext.dayOfWeek
      ],
      urgencyFactors: [
        'Limited Time',
        'Exclusive Offer',
        'Don\'t Miss Out'
      ]
    };
  }

  private generateBusinessContext(
    businessType: string,
    trendingKeywords: string[],
    trendingTopics: string[]
  ) {
    const industryTrends = trendingKeywords.filter(keyword => 
      keyword.toLowerCase().includes(businessType.toLowerCase()) ||
      businessType.toLowerCase().includes(keyword.toLowerCase())
    );

    const competitorInsights = trendingTopics.filter(topic =>
      topic.toLowerCase().includes('competitor') ||
      topic.toLowerCase().includes('market')
    );

    const marketOpportunities = trendingKeywords.filter(keyword =>
      keyword.toLowerCase().includes('opportunity') ||
      keyword.toLowerCase().includes('growth') ||
      keyword.toLowerCase().includes('innovation')
    );

    return {
      industryTrends: industryTrends.slice(0, 5),
      competitorInsights: competitorInsights.slice(0, 3),
      marketOpportunities: marketOpportunities.slice(0, 3)
    };
  }

  private getSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  private getFallbackContextualData(brandProfile: BrandProfile): ContextualData {
    return {
      trendingKeywords: ['innovation', 'quality', 'service', 'excellence'],
      trendingTopics: ['business growth', 'customer satisfaction'],
      localEvents: [],
      weather: null,
      news: [],
      seasonalContext: {
        season: this.getSeason(new Date()),
        month: new Date().toLocaleDateString('en-US', { month: 'long' }),
        dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        timeOfDay: this.getTimeOfDay(new Date())
      },
      businessContext: {
        industryTrends: [],
        competitorInsights: [],
        marketOpportunities: []
      }
    };
  }
}

export const aiFillService = new AIFillService();
