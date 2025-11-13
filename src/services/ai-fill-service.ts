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
  private cache = new Map<string, { data: ContextualData; timestamp: number; accessCount: number; lastAccess: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CACHE_SIZE = 100; // Maximum cache entries
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Fetch comprehensive contextual data for AI suggestions
   */
  async fetchContextualData(brandProfile: BrandProfile): Promise<ContextualData> {
    const cacheKey = `${brandProfile.businessType}-${brandProfile.location}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      // Update access tracking
      cached.accessCount++;
      cached.lastAccess = Date.now();
      this.cache.set(cacheKey, cached);
      return cached.data;
    }

    try {
      // Fetch all data sources in parallel with enhanced error handling
      const [
        trendingData,
        localContext,
        realTimeTrends,
        industryInsights,
        competitorData
      ] = await Promise.allSettled([
        this.retryOperation(() => rssService.getTrendingData()),
        this.retryOperation(() => fetchLocalContext(brandProfile.location, brandProfile.businessType)),
        this.retryOperation(() => generateRealTimeTrendingTopics(
          brandProfile.businessType,
          brandProfile.location,
          'instagram' // Default platform
        )),
        this.fetchIndustryInsights(brandProfile.businessType),
        this.fetchCompetitorAnalysis(brandProfile.businessType, brandProfile.location)
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

      // Process real-time trends (TrendingTopic[])
      const realTimeTrendsData = realTimeTrends.status === 'fulfilled'
        ? realTimeTrends.value || []
        : [];
      
      // Extract news-related trends
      const news = realTimeTrendsData.filter(trend => 
        trend.category === 'news' || trend.category === 'business'
      ).map(trend => ({
        title: trend.topic,
        category: trend.category,
        relevance: trend.relevanceScore
      }));

      // Generate seasonal context
      const now = new Date();
      const seasonalContext = {
        season: this.getSeason(now),
        month: now.toLocaleDateString('en-US', { month: 'long' }),
        dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
        timeOfDay: this.getTimeOfDay(now)
      };

      // Generate business-specific context with industry insights
      const industryTrendsData = industryInsights.status === 'fulfilled' 
        ? industryInsights.value 
        : [];
      
      const competitorInsightsData = competitorData.status === 'fulfilled'
        ? competitorData.value
        : [];

      const businessContext = this.generateBusinessContext(
        brandProfile.businessType,
        trendingKeywords,
        trendingTopics,
        industryTrendsData,
        competitorInsightsData
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

      // Cache the result with access tracking
      this.cache.set(cacheKey, { 
        data: contextualData, 
        timestamp: Date.now(),
        accessCount: 1,
        lastAccess: Date.now()
      });

      // Clean up cache if it's getting too large
      this.cleanupCache();

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
    const businessName = brandProfile.businessName || 'Your Business';
    const businessType = brandProfile.businessType || 'Business';
    const location = brandProfile.location || 'Your Location';
    const targetAudience = brandProfile.targetAudience || '';
    const contactInfo = brandProfile.contactInfo || {};

    // Enhanced debugging for any business
    console.log('🚀 [AI Fill Service] Generating suggestions for business:', {
      businessName,
      businessType,
      location,
      targetAudience,
      contactInfo,
      hasContextualData: !!contextualData,
      trendingKeywordsCount: contextualData.trendingKeywords?.length || 0,
      localEventsCount: contextualData.localEvents?.length || 0
    });

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

    // Debug generated options
    console.log('📝 [AI Fill Service] Generated options:', {
      headlinesGenerated: headlines.length,
      subheadlinesGenerated: subheadlines.length,
      ctasGenerated: ctas.length,
      descriptionsGenerated: descriptions.length,
      sampleHeadlines: headlines.slice(0, 3),
      sampleSubheadlines: subheadlines.slice(0, 3)
    });

    // Randomly select suggestions
    const randomHeadline = headlines[Math.floor(Math.random() * headlines.length)];
    const randomSubheadline = subheadlines[Math.floor(Math.random() * subheadlines.length)];
    const randomCta = ctas[Math.floor(Math.random() * ctas.length)];
    const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];

    // Debug selected suggestions
    console.log('✅ [AI Fill Service] Selected suggestions:', {
      selectedHeadline: randomHeadline,
      selectedSubheadline: randomSubheadline,
      selectedCta: randomCta,
      selectedDescription: randomDescription
    });

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
    const { trendingKeywords, seasonalContext, localEvents, businessContext } = contextualData;

    // PRIORITY 1: Business-focused headlines (always include these)
    headlines.push(
      `${businessName} - Your ${businessType} Solution`,
      `Transform Your ${businessType} Experience with ${businessName}`,
      `${businessName}: Excellence in ${businessType}`,
      `Professional ${businessType} Services by ${businessName}`,
      `${businessName} - Trusted ${businessType} Experts`
    );

    // PRIORITY 2: Industry-specific headlines (use business context first)
    if (businessContext.industryTrends.length > 0) {
      const industryTrend = businessContext.industryTrends[0];
      // Only use if it's business-relevant
      if (this.isBusinessRelevant(industryTrend, businessType)) {
        headlines.push(
          `${businessName}: Leading ${industryTrend}`,
          `Experience ${industryTrend} with ${businessName}`
        );
      }
    }

    // PRIORITY 3: Filtered trending keywords (only business-relevant ones)
    if (trendingKeywords.length > 0) {
      const relevantKeywords = trendingKeywords.filter(keyword => 
        this.isBusinessRelevant(keyword, businessType)
      );
      
      if (relevantKeywords.length > 0) {
        const trendingKeyword = relevantKeywords[0];
        headlines.push(
          `${businessName}: ${trendingKeyword} Solutions`,
          `${businessName} - Leading ${trendingKeyword} Innovation`
        );
      }
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

    // Industry-specific headlines based on business context
    if (businessContext.industryTrends.length > 0) {
      const industryTrend = businessContext.industryTrends[0];
      headlines.push(
        `${businessName}: Leading ${industryTrend}`,
        `Experience ${industryTrend} with ${businessName}`,
        `${businessName} - Your ${industryTrend} Experts`
      );
    }

    // Market opportunity headlines
    if (businessContext.marketOpportunities.length > 0) {
      const opportunity = businessContext.marketOpportunities[0];
      headlines.push(
        `${businessName}: Seizing ${opportunity}`,
        `Don't Miss ${opportunity} with ${businessName}`
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

    // Trending topics subheadlines (filtered for business relevance)
    if (trendingTopics.length > 0) {
      const relevantTopics = trendingTopics.filter(topic => 
        this.isBusinessRelevant(topic, businessType)
      );
      
      if (relevantTopics.length > 0) {
        const topic = relevantTopics[0];
        subheadlines.push(
          `Stay ahead with ${topic} - ${businessName} has you covered`,
          `Leading ${topic} solutions in ${location}`
        );
      }
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

    // Trending-based descriptions (filtered for business relevance)
    if (trendingKeywords.length > 0) {
      const relevantKeywords = trendingKeywords.filter(keyword => 
        this.isBusinessRelevant(keyword, businessType)
      );
      
      if (relevantKeywords.length > 0) {
        const trendingKeyword = relevantKeywords[0];
        descriptions.push(
          `Stay ahead of the curve with ${businessName}. We're at the forefront of ${trendingKeyword} innovation in ${businessType.toLowerCase()}.`,
          `Experience ${trendingKeyword} excellence with ${businessName} - your trusted ${businessType.toLowerCase()} partner.`
        );
      }
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
    const { services, businessName } = brandProfile;
    const { trendingKeywords, seasonalContext, businessContext } = contextualData;

    // If business profile has services, use them
    if (services && services.trim()) {
      return services.split('\n').map(service => `• ${service.trim()}`).join('\n');
    }

    // Generate contextual products/services based on business type
    const businessType = brandProfile.businessType.toLowerCase();
    const businessNameLower = businessName?.toLowerCase() || '';
    
    // Electronics/Technology businesses
    if (businessType.includes('electronics') || businessType.includes('electronic') || 
        businessNameLower.includes('electronics') || businessNameLower.includes('tech')) {
      return [
        '• Mobile Phones & Smartphones',
        '• Laptops & Computers',
        '• Home Electronics & Appliances',
        '• Audio & Video Equipment',
        '• Smart Home Devices',
        '• Electronic Accessories',
        '• Technical Support & Repairs',
        '• Installation Services'
      ].join('\n');
    }
    
    // Retail/Shopping businesses
    else if (businessType.includes('retail') || businessType.includes('shop') || businessType.includes('store')) {
      const industryTrend = businessContext.industryTrends.length > 0 ? businessContext.industryTrends[0] : '';
      const seasonalItems = seasonalContext.season === 'winter' 
        ? ['• Winter Collection', '• Holiday Specials', '• Seasonal Offers']
        : ['• Summer Collection', '• New Arrivals', '• Seasonal Deals'];
      
      return [
        '• Quality Products',
        '• Brand Merchandise',
        '• Customer Service',
        ...seasonalItems,
        industryTrend ? `• ${industryTrend} Products` : '• Premium Selection',
        '• Delivery Services'
      ].join('\n');
    }
    
    // Restaurant/Food businesses
    else if (businessType.includes('restaurant') || businessType.includes('food') || businessType.includes('cafe')) {
      const seasonalItems = seasonalContext.season === 'winter' 
        ? ['• Hot Soups & Stews', '• Warm Beverages', '• Comfort Food']
        : ['• Fresh Salads', '• Cold Drinks', '• Light Meals'];
      
      return [
        '• Appetizers & Starters',
        '• Main Courses',
        '• Desserts & Beverages',
        ...seasonalItems,
        '• Takeaway & Delivery',
        '• Catering Services'
      ].join('\n');
    }
    
    // Fitness/Health businesses
    else if (businessType.includes('fitness') || businessType.includes('gym') || businessType.includes('health')) {
      return [
        '• Personal Training Sessions',
        '• Group Fitness Classes',
        '• Nutrition Counseling',
        '• Equipment Training',
        '• Wellness Programs',
        '• Membership Plans'
      ].join('\n');
    }
    
    // Beauty/Salon businesses
    else if (businessType.includes('beauty') || businessType.includes('salon') || businessType.includes('spa')) {
      return [
        '• Hair Styling & Cutting',
        '• Hair Coloring & Treatment',
        '• Facial Treatments',
        '• Manicures & Pedicures',
        '• Makeup Services',
        '• Beauty Consultations'
      ].join('\n');
    }
    
    // Financial Technology/Fintech businesses (PRIORITY: Must come before generic tech)
    else if (businessType.includes('financial technology') || businessType.includes('fintech') || 
             businessType.includes('finance') || businessNameLower.includes('finance') ||
             businessNameLower.includes('fintech') || businessNameLower.includes('payment')) {
      return [
        '• Digital Payment Solutions',
        '• Mobile Money Services',
        '• Online Banking Platform',
        '• Financial Management Tools',
        '• Investment & Savings Plans',
        '• Loan & Credit Services',
        '• Currency Exchange',
        '• Financial Analytics & Reports',
        '• Security & Fraud Protection',
        '• API Integration Services'
      ].join('\n');
    }
    
    // Technology/Software businesses (General tech - after fintech)
    else if (businessType.includes('tech') || businessType.includes('software') || businessType.includes('digital')) {
      return [
        '• Web Development',
        '• Mobile App Development',
        '• Digital Marketing Solutions',
        '• SEO & Online Presence',
        '• IT Consulting',
        '• Technical Support'
      ].join('\n');
    }
    
    // Finance/Banking businesses
    else if (businessType.includes('finance') || businessType.includes('bank') || businessType.includes('financial')) {
      return [
        '• Financial Planning',
        '• Investment Advice',
        '• Loan Services',
        '• Insurance Solutions',
        '• Business Banking',
        '• Financial Consultations'
      ].join('\n');
    }
    
    // Education/Training businesses
    else if (businessType.includes('education') || businessType.includes('training') || businessType.includes('school')) {
      return [
        '• Professional Courses',
        '• Skills Training',
        '• Certification Programs',
        '• Online Learning',
        '• Educational Consulting',
        '• Career Development'
      ].join('\n');
    }
    
    // Healthcare/Medical businesses
    else if (businessType.includes('health') || businessType.includes('medical') || businessType.includes('clinic')) {
      return [
        '• Medical Consultations',
        '• Health Screenings',
        '• Treatment Services',
        '• Preventive Care',
        '• Health Education',
        '• Emergency Services'
      ].join('\n');
    }
    
    // Generic business services (fallback)
    else {
      const industryTrend = businessContext.industryTrends.length > 0 ? businessContext.industryTrends[0] : '';
      return [
        `• Professional ${businessType} Services`,
        '• Expert Consultations',
        '• Custom Solutions',
        '• Quality Support',
        industryTrend ? `• ${industryTrend} Solutions` : '• Premium Services',
        '• Customer Care'
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
    trendingTopics: string[],
    industryTrendsData: string[] = [],
    competitorInsightsData: string[] = []
  ) {
    // Combine fetched industry trends with keyword-based trends
    const keywordBasedTrends = trendingKeywords.filter(keyword => 
      keyword.toLowerCase().includes(businessType.toLowerCase()) ||
      businessType.toLowerCase().includes(keyword.toLowerCase())
    );

    const topicBasedInsights = trendingTopics.filter(topic =>
      topic.toLowerCase().includes('competitor') ||
      topic.toLowerCase().includes('market')
    );

    const marketOpportunities = trendingKeywords.filter(keyword =>
      keyword.toLowerCase().includes('opportunity') ||
      keyword.toLowerCase().includes('growth') ||
      keyword.toLowerCase().includes('innovation')
    );

    // Merge fetched data with filtered data
    const combinedIndustryTrends = [...industryTrendsData, ...keywordBasedTrends];
    const combinedCompetitorInsights = [...competitorInsightsData, ...topicBasedInsights];

    return {
      industryTrends: combinedIndustryTrends.slice(0, 8),
      competitorInsights: combinedCompetitorInsights.slice(0, 6),
      marketOpportunities: marketOpportunities.slice(0, 5)
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

  /**
   * Clean up cache using LRU (Least Recently Used) strategy
   */
  private cleanupCache(): void {
    if (this.cache.size <= this.MAX_CACHE_SIZE) {
      return;
    }

    // Convert cache entries to array and sort by last access time
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      value,
      score: value.accessCount * 0.7 + (Date.now() - value.lastAccess) * -0.3 // Favor frequently accessed and recently used
    }));

    // Sort by score (higher is better)
    entries.sort((a, b) => b.score - a.score);

    // Keep only the top entries
    const keepEntries = entries.slice(0, Math.floor(this.MAX_CACHE_SIZE * 0.8));
    
    // Clear cache and re-add the kept entries
    this.cache.clear();
    keepEntries.forEach(({ key, value }) => {
      this.cache.set(key, value);
    });

    console.log(`Cache cleaned up: kept ${keepEntries.length} entries out of ${entries.length}`);
  }

  /**
   * Check if a keyword/trend is relevant to the business type
   */
  private isBusinessRelevant(keyword: string, businessType: string): boolean {
    const lowerKeyword = keyword.toLowerCase();
    const lowerBusinessType = businessType.toLowerCase();
    
    // Blacklist of irrelevant topics
    const irrelevantTopics = [
      'trump', 'politics', 'election', 'biden', 'government', 'congress',
      'celebrity', 'entertainment', 'sports', 'football', 'basketball',
      'movie', 'tv show', 'music', 'album', 'concert', 'actor', 'actress',
      'scandal', 'controversy', 'drama', 'gossip', 'viral video',
      'meme', 'tiktok', 'instagram', 'twitter', 'social media drama'
    ];
    
    // Check if keyword contains any irrelevant topics
    if (irrelevantTopics.some(topic => lowerKeyword.includes(topic))) {
      return false;
    }
    
    // Business-relevant keywords
    const businessRelevantKeywords = [
      'business', 'service', 'customer', 'quality', 'professional', 'expert',
      'solution', 'innovation', 'technology', 'digital', 'online', 'local',
      'community', 'growth', 'success', 'experience', 'value', 'trust',
      'reliable', 'affordable', 'premium', 'consultation', 'support'
    ];
    
    // Industry-specific keywords
    const industryKeywords = {
      'electronics': ['tech', 'device', 'gadget', 'smart', 'digital', 'electronic', 'mobile', 'computer'],
      'retail': ['shopping', 'store', 'product', 'sale', 'discount', 'offer', 'deal', 'merchandise'],
      'restaurant': ['food', 'dining', 'meal', 'cuisine', 'recipe', 'chef', 'menu', 'delivery'],
      'fitness': ['health', 'workout', 'exercise', 'training', 'wellness', 'nutrition', 'gym'],
      'beauty': ['skincare', 'makeup', 'beauty', 'cosmetic', 'treatment', 'salon', 'spa'],
      'finance': ['financial', 'money', 'investment', 'banking', 'loan', 'credit', 'insurance'],
      'education': ['learning', 'education', 'training', 'course', 'skill', 'knowledge', 'teach'],
      'healthcare': ['health', 'medical', 'doctor', 'treatment', 'care', 'wellness', 'therapy']
    };
    
    // Check if keyword is generally business-relevant
    if (businessRelevantKeywords.some(relevant => lowerKeyword.includes(relevant))) {
      return true;
    }
    
    // Check if keyword is relevant to the specific business type
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (lowerBusinessType.includes(industry) || industry.includes(lowerBusinessType)) {
        if (keywords.some(industryKeyword => lowerKeyword.includes(industryKeyword))) {
          return true;
        }
      }
    }
    
    // Check if keyword contains the business type
    if (lowerKeyword.includes(lowerBusinessType) || lowerBusinessType.includes(lowerKeyword)) {
      return true;
    }
    
    return false;
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; accessCount: number; lastAccess: Date; age: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      accessCount: value.accessCount,
      lastAccess: new Date(value.lastAccess),
      age: Math.round((now - value.timestamp) / 1000 / 60) // Age in minutes
    }));

    // Calculate hit rate (simplified - would need to track misses for accurate calculation)
    const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const hitRate = entries.length > 0 ? totalAccesses / entries.length : 0;

    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: Math.round(hitRate * 100) / 100,
      entries: entries.sort((a, b) => b.accessCount - a.accessCount)
    };
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt}/${this.MAX_RETRIES} failed:`, error);
        
        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * Fetch industry-specific insights and trends
   */
  private async fetchIndustryInsights(businessType: string): Promise<string[]> {
    try {
      // Industry-specific trending keywords and insights
      const industryMap: Record<string, string[]> = {
        'restaurant': [
          'sustainable dining', 'plant-based menu', 'local sourcing', 'food delivery trends',
          'contactless ordering', 'outdoor dining', 'farm-to-table', 'dietary restrictions'
        ],
        'fitness': [
          'virtual training', 'mental wellness', 'functional fitness', 'recovery methods',
          'nutrition coaching', 'group challenges', 'wearable tech', 'home workouts'
        ],
        'beauty': [
          'clean beauty', 'sustainable packaging', 'personalized skincare', 'virtual consultations',
          'inclusive beauty', 'anti-aging treatments', 'natural ingredients', 'self-care routines'
        ],
        'technology': [
          'AI integration', 'cybersecurity', 'cloud solutions', 'remote work tools',
          'automation', 'data analytics', 'mobile-first design', 'user experience'
        ],
        'retail': [
          'omnichannel experience', 'sustainable products', 'personalization', 'social commerce',
          'local shopping', 'customer loyalty', 'inventory management', 'seasonal trends'
        ],
        'finance': [
          'digital banking', 'cryptocurrency', 'financial wellness', 'investment education',
          'budgeting tools', 'retirement planning', 'insurance innovation', 'fintech solutions'
        ]
      };

      const businessKey = businessType.toLowerCase();
      const matchedIndustry = Object.keys(industryMap).find(key => 
        businessKey.includes(key) || key.includes(businessKey)
      );

      return matchedIndustry ? industryMap[matchedIndustry] : industryMap['retail'];
    } catch (error) {
      console.warn('Failed to fetch industry insights:', error);
      return ['innovation', 'customer experience', 'digital transformation'];
    }
  }

  /**
   * Fetch competitor analysis and market opportunities
   */
  private async fetchCompetitorAnalysis(businessType: string, location: string): Promise<string[]> {
    try {
      // Generate location and business-specific competitive insights
      const competitiveFactors = [
        `Local ${businessType} market analysis`,
        `${location} business opportunities`,
        `Competitive pricing strategies`,
        `Market differentiation tactics`,
        `Customer acquisition trends`,
        `Service innovation opportunities`,
        `Digital presence optimization`,
        `Community engagement strategies`
      ];

      // Add location-specific insights
      if (location) {
        competitiveFactors.push(
          `${location} demographic trends`,
          `Local partnership opportunities`,
          `Regional market preferences`
        );
      }

      return competitiveFactors.slice(0, 8);
    } catch (error) {
      console.warn('Failed to fetch competitor analysis:', error);
      return ['market analysis', 'competitive advantage', 'growth opportunities'];
    }
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
