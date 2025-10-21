/**
 * RSS Feed Service for Trending Content & Social Media Insights
 * Client-side service that fetches RSS data from API routes
 */

export interface RSSArticle {
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  category?: string;
  keywords: string[];
  source: string;
}

export interface TrendingData {
  keywords: string[];
  hashtags: string[];
  topics: string[];
  themes: string[];
  articles: RSSArticle[];
  lastUpdated: Date;
  hashtagAnalytics?: {
    trending: Array<{ hashtag: string; frequency: number; momentum: 'rising' | 'stable' | 'declining' }>;
    byCategory: Record<string, string[]>;
    byLocation: Record<string, string[]>;
    byIndustry: Record<string, string[]>;
    sentiment: Record<string, 'positive' | 'neutral' | 'negative'>;
  };
}

export class RSSFeedService {
  private cache: Map<string, { data: TrendingData; timestamp: number }> = new Map();
  private readonly cacheTimeout = 30 * 60 * 1000; // 30 minutes

  /**
   * Fetch trending data using direct RSS fetching (FIXED for 1K users)
   */
  async getTrendingData(category: 'tech' | 'business' | 'general' = 'general', limit: number = 50): Promise<TrendingData> {
    const cacheKey = `${category}-${limit}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {

      // 🛡️ FIXED: Use direct RSS fetching instead of problematic API calls
      const { fetchRSSFeedDirect } = await import('../ai/utils/rss-direct-fetch');
      const articles = await fetchRSSFeedDirect(category, limit);

      // Process articles into trending data
      const data = this.processArticlesIntoTrendingData(articles, category);

      // Cache the result
      this.cache.set(cacheKey, { data, timestamp: Date.now() });

      return data;

    } catch (error) {
      console.error('❌ [RSS Service] Error fetching RSS data:', error);

      // Return fallback data if everything fails
      return this.getFallbackTrendingData(category);
    }
  }

  /**
   * Process articles into trending data format
   */
  private processArticlesIntoTrendingData(articles: any[], category: string): TrendingData {
    // Extract keywords from articles
    const allKeywords = articles.flatMap(article => article.keywords || []);
    const keywordCounts = new Map<string, number>();

    allKeywords.forEach(keyword => {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    });

    // Get top keywords
    const topKeywords = Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword]) => keyword);

    // Generate hashtags from keywords
    const hashtags = topKeywords.map(keyword => `#${keyword.toLowerCase().replace(/\s+/g, '')}`);

    return {
      keywords: topKeywords,
      hashtags,
      topics: topKeywords.slice(0, 10),
      themes: topKeywords.slice(0, 15),
      articles: articles.map(article => ({
        ...article,
        pubDate: new Date(article.pubDate)
      })),
      lastUpdated: new Date(),
      hashtagAnalytics: {
        trending: topKeywords.slice(0, 10).map(keyword => ({
          hashtag: `#${keyword}`,
          frequency: keywordCounts.get(keyword) || 0,
          momentum: 'rising' as const
        })),
        byCategory: {
          [category]: hashtags.slice(0, 10)
        },
        byLocation: {},
        byIndustry: {},
        sentiment: {}
      }
    };
  }

  /**
   * Get fallback trending data when all else fails
   */
  private getFallbackTrendingData(category: string): TrendingData {
    const fallbackKeywords = {
      tech: ['technology', 'innovation', 'digital', 'software', 'ai', 'startup'],
      business: ['business', 'growth', 'success', 'strategy', 'market', 'sales'],
      general: ['news', 'update', 'trending', 'popular', 'latest', 'breaking']
    };

    const keywords = fallbackKeywords[category] || fallbackKeywords.general;
    const hashtags = keywords.map(keyword => `#${keyword}`);

    return {
      keywords,
      hashtags,
      topics: keywords.slice(0, 5),
      themes: keywords.slice(0, 8),
      articles: [],
      lastUpdated: new Date(),
      hashtagAnalytics: {
        trending: keywords.map(keyword => ({
          hashtag: `#${keyword}`,
          frequency: 1,
          momentum: 'stable' as const
        })),
        byCategory: {
          [category]: hashtags
        },
        byLocation: {},
        byIndustry: {},
        sentiment: {}
      }
    };
  }

  /**
   * Get trending keywords
   */
  async getTrendingKeywords(category?: string): Promise<string[]> {
    const data = await this.getTrendingData(category as any);
    return data.keywords;
  }

  /**
   * Get trending hashtags
   */
  async getTrendingHashtags(category?: string): Promise<string[]> {
    const data = await this.getTrendingData(category as any);
    return data.hashtags;
  }

  /**
   * Get recent articles
   */
  async getRecentArticles(limit: number = 10, category?: string): Promise<RSSArticle[]> {
    const data = await this.getTrendingData(category as any, limit);
    return data.articles.slice(0, limit);
  }

  /**
   * Get trending topics
   */
  async getTrendingTopics(category?: string): Promise<string[]> {
    const data = await this.getTrendingData(category as any);
    return data.topics;
  }

  /**
   * Get trending keywords for a specific category
   */
  async getTrendingKeywordsByCategory(category: 'social' | 'business' | 'tech' | 'design'): Promise<string[]> {
    const categoryMap = {
      social: 'general',
      business: 'business',
      tech: 'tech',
      design: 'general'
    };

    const data = await this.getTrendingData(categoryMap[category] as any);
    return data.keywords.slice(0, 20);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const rssService = new RSSFeedService();
