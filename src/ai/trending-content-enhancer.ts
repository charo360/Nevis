/**
 * Trending Content Enhancer
 * Integrates RSS feed data to enhance content generation with trending topics
 */

import { rssService, TrendingData } from '../services/rss-feed-service';

export interface TrendingEnhancement {
  keywords: string[];
  topics: string[];
  hashtags: string[];
  seasonalThemes: string[];
  industryBuzz: string[];
}

export interface ContentContext {
  businessType?: string;
  platform?: string;
  location?: string;
  targetAudience?: string;
}

export class TrendingContentEnhancer {
  private trendingCache: TrendingData | null = null;
  private lastCacheUpdate: number = 0;
  private readonly cacheTimeout = 30 * 60 * 1000; // 30 minutes

  /**
   * Get fresh trending data with caching
   */
  private async getTrendingData(): Promise<TrendingData> {
    const now = Date.now();

    if (this.trendingCache && (now - this.lastCacheUpdate) < this.cacheTimeout) {
      return this.trendingCache;
    }

    this.trendingCache = await rssService.getTrendingData();
    this.lastCacheUpdate = now;

    return this.trendingCache;
  }

  /**
   * Get trending enhancement data for content generation
   */
  public async getTrendingEnhancement(context: ContentContext = {}): Promise<TrendingEnhancement> {
    try {
      const trendingData = await this.getTrendingData();

      // Filter and prioritize based on context
      const relevantKeywords = this.filterKeywordsByContext(trendingData.keywords, context);
      const relevantTopics = this.filterTopicsByContext(trendingData.topics, context);

      // Generate hashtags from trending keywords
      const hashtags = this.generateHashtags(relevantKeywords, context);

      // Extract seasonal themes
      const seasonalThemes = this.extractSeasonalThemes(trendingData);

      // Extract industry-specific buzz
      const industryBuzz = this.extractIndustryBuzz(trendingData, context.businessType);


      return {
        keywords: relevantKeywords.slice(0, 15),
        topics: relevantTopics.slice(0, 10),
        hashtags: hashtags.slice(0, 10),
        seasonalThemes: seasonalThemes.slice(0, 5),
        industryBuzz: industryBuzz.slice(0, 8),
      };

    } catch (error) {

      // Return contextual fallback data based on current context
      return this.generateContextualFallback(context);
    }
  }

  /**
   * Filter keywords based on context relevance
   */
  private filterKeywordsByContext(keywords: string[], context: ContentContext): string[] {
    const platformKeywords = {
      instagram: ['visual', 'photo', 'story', 'reel', 'aesthetic', 'lifestyle'],
      facebook: ['community', 'share', 'connect', 'family', 'local', 'event'],
      twitter: ['news', 'update', 'breaking', 'discussion', 'opinion', 'thread'],
      linkedin: ['professional', 'business', 'career', 'industry', 'networking', 'leadership'],
      tiktok: ['viral', 'trend', 'challenge', 'creative', 'fun', 'entertainment'],
      pinterest: ['inspiration', 'ideas', 'diy', 'design', 'home', 'style'],
    };

    const businessKeywords = {
      restaurant: ['food', 'dining', 'menu', 'chef', 'cuisine', 'taste', 'fresh'],
      retail: ['shopping', 'sale', 'fashion', 'style', 'product', 'deal', 'new'],
      fitness: ['health', 'workout', 'training', 'wellness', 'strength', 'motivation'],
      beauty: ['skincare', 'makeup', 'beauty', 'glow', 'treatment', 'style'],
      tech: ['innovation', 'digital', 'technology', 'software', 'app', 'solution'],
      healthcare: ['health', 'wellness', 'care', 'treatment', 'medical', 'patient'],
    };

    let filtered = [...keywords];

    // Boost platform-relevant keywords
    if (context.platform && platformKeywords[context.platform as keyof typeof platformKeywords]) {
      const platformBoost = platformKeywords[context.platform as keyof typeof platformKeywords];
      filtered = filtered.sort((a, b) => {
        const aBoost = platformBoost.some(boost => a.includes(boost)) ? -1 : 0;
        const bBoost = platformBoost.some(boost => b.includes(boost)) ? -1 : 0;
        return aBoost - bBoost;
      });
    }

    // Boost business-relevant keywords
    if (context.businessType && businessKeywords[context.businessType as keyof typeof businessKeywords]) {
      const businessBoost = businessKeywords[context.businessType as keyof typeof businessKeywords];
      filtered = filtered.sort((a, b) => {
        const aBoost = businessBoost.some(boost => a.includes(boost)) ? -1 : 0;
        const bBoost = businessBoost.some(boost => b.includes(boost)) ? -1 : 0;
        return aBoost - bBoost;
      });
    }

    return filtered;
  }

  /**
   * Filter topics based on context relevance
   */
  private filterTopicsByContext(topics: string[], context: ContentContext): string[] {
    // Remove topics that are too generic or not suitable for social media
    const filtered = topics.filter(topic => {
      const lower = topic.toLowerCase();
      return !lower.includes('error') &&
        !lower.includes('404') &&
        !lower.includes('page not found') &&
        lower.length > 10 &&
        lower.length < 100;
    });

    return filtered;
  }

  /**
   * Generate relevant hashtags from keywords
   */
  private generateHashtags(keywords: string[], context: ContentContext): string[] {
    const hashtags: string[] = [];

    // Convert keywords to hashtags
    keywords.forEach(keyword => {
      const cleanKeyword = keyword.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (cleanKeyword.length >= 3 && cleanKeyword.length <= 20) {
        hashtags.push(`#${cleanKeyword}`);
      }
    });

    // Add platform-specific hashtags
    const platformHashtags = {
      instagram: ['#instagood', '#photooftheday', '#instadaily', '#picoftheday'],
      facebook: ['#community', '#local', '#share', '#connect'],
      twitter: ['#news', '#update', '#discussion', '#trending'],
      linkedin: ['#professional', '#business', '#career', '#networking'],
      tiktok: ['#fyp', '#viral', '#trending', '#foryou'],
      pinterest: ['#inspiration', '#ideas', '#diy', '#style'],
    };

    if (context.platform && platformHashtags[context.platform as keyof typeof platformHashtags]) {
      hashtags.push(...platformHashtags[context.platform as keyof typeof platformHashtags]);
    }

    // Remove duplicates and return
    return Array.from(new Set(hashtags));
  }

  /**
   * Extract seasonal themes from trending data
   */
  private extractSeasonalThemes(trendingData: TrendingData): string[] {
    const currentMonth = new Date().getMonth();
    const seasonalKeywords = {
      0: ['new year', 'resolution', 'fresh start', 'winter'], // January
      1: ['valentine', 'love', 'romance', 'winter'], // February
      2: ['spring', 'march madness', 'renewal', 'growth'], // March
      3: ['easter', 'spring', 'bloom', 'fresh'], // April
      4: ['mother\'s day', 'spring', 'flowers', 'celebration'], // May
      5: ['summer', 'graduation', 'father\'s day', 'vacation'], // June
      6: ['summer', 'july 4th', 'independence', 'freedom'], // July
      7: ['summer', 'vacation', 'back to school', 'preparation'], // August
      8: ['back to school', 'fall', 'autumn', 'harvest'], // September
      9: ['halloween', 'october', 'spooky', 'fall'], // October
      10: ['thanksgiving', 'gratitude', 'family', 'harvest'], // November
      11: ['christmas', 'holiday', 'winter', 'celebration'], // December
    };

    const currentSeasonalKeywords = seasonalKeywords[currentMonth as keyof typeof seasonalKeywords] || [];

    const seasonalThemes = trendingData.keywords.filter(keyword =>
      currentSeasonalKeywords.some(seasonal =>
        keyword.toLowerCase().includes(seasonal.toLowerCase())
      )
    );

    return seasonalThemes;
  }

  /**
   * Extract industry-specific buzz from trending data
   */
  private extractIndustryBuzz(trendingData: TrendingData, businessType?: string): string[] {
    if (!businessType) return [];

    const industryKeywords = {
      restaurant: ['food', 'dining', 'chef', 'cuisine', 'recipe', 'restaurant', 'menu'],
      retail: ['shopping', 'fashion', 'style', 'product', 'brand', 'sale', 'deal'],
      fitness: ['fitness', 'workout', 'health', 'gym', 'training', 'wellness', 'exercise'],
      beauty: ['beauty', 'skincare', 'makeup', 'cosmetics', 'treatment', 'spa'],
      tech: ['technology', 'tech', 'digital', 'software', 'app', 'innovation', 'ai'],
      healthcare: ['health', 'medical', 'healthcare', 'wellness', 'treatment', 'care'],
    };

    const relevantKeywords = industryKeywords[businessType as keyof typeof industryKeywords] || [];

    const industryBuzz = trendingData.keywords.filter(keyword =>
      relevantKeywords.some(industry =>
        keyword.toLowerCase().includes(industry.toLowerCase())
      )
    );

    return industryBuzz;
  }

  /**
   * Generate contextual fallback data without hardcoded placeholders
   */
  private generateContextualFallback(context: ContentContext): TrendingEnhancement {
    const today = new Date();
    const currentMonth = today.toLocaleDateString('en-US', { month: 'long' });
    const currentDay = today.toLocaleDateString('en-US', { weekday: 'long' });

    // Generate contextual keywords based on business type and current date
    const keywords: string[] = [];
    if (context.businessType) {
      keywords.push(`${context.businessType} services`, `${context.businessType} solutions`);
    }
    keywords.push(`${currentDay} motivation`, `${currentMonth} opportunities`);

    // Generate contextual topics
    const topics: string[] = [];
    if (context.businessType) {
      topics.push(`${context.businessType} industry insights`);
    }
    if (context.location) {
      topics.push(`${context.location} business community`);
    }
    topics.push(`${currentMonth} business trends`);

    // Generate contextual hashtags
    const hashtags: string[] = [];
    if (context.businessType) {
      hashtags.push(`#${context.businessType.replace(/\s+/g, '')}Business`);
    }
    if (context.location) {
      const locationParts = context.location.split(',').map(part => part.trim());
      locationParts.forEach(part => {
        if (part.length > 2) {
          hashtags.push(`#${part.replace(/\s+/g, '')}`);
        }
      });
    }
    hashtags.push(`#${currentDay}Motivation`, `#${currentMonth}${today.getFullYear()}`);

    // Generate seasonal themes
    const seasonalThemes: string[] = [];
    const month = today.getMonth();
    if (month >= 2 && month <= 4) seasonalThemes.push('Spring renewal', 'Fresh starts');
    else if (month >= 5 && month <= 7) seasonalThemes.push('Summer energy', 'Outdoor activities');
    else if (month >= 8 && month <= 10) seasonalThemes.push('Autumn preparation', 'Harvest season');
    else seasonalThemes.push('Winter planning', 'Year-end reflection');

    return {
      keywords: keywords.slice(0, 15),
      topics: topics.slice(0, 10),
      hashtags: hashtags.slice(0, 10),
      seasonalThemes: seasonalThemes.slice(0, 5),
      industryBuzz: context.businessType ? [`${context.businessType} innovation`] : [],
    };
  }

  /**
   * Get trending prompt enhancement for AI content generation
   */
  public async getTrendingPromptEnhancement(context: ContentContext = {}): Promise<string> {
    const enhancement = await this.getTrendingEnhancement(context);

    const promptParts: string[] = [];

    if (enhancement.keywords.length > 0) {
      promptParts.push(`Trending keywords to consider: ${enhancement.keywords.slice(0, 8).join(', ')}`);
    }

    if (enhancement.seasonalThemes.length > 0) {
      promptParts.push(`Current seasonal themes: ${enhancement.seasonalThemes.join(', ')}`);
    }

    if (enhancement.industryBuzz.length > 0) {
      promptParts.push(`Industry trending topics: ${enhancement.industryBuzz.slice(0, 5).join(', ')}`);
    }

    if (enhancement.hashtags.length > 0) {
      promptParts.push(`Suggested hashtags: ${enhancement.hashtags.slice(0, 6).join(' ')}`);
    }

    return promptParts.join('\n');
  }
}

// Export singleton instance
export const trendingEnhancer = new TrendingContentEnhancer();
