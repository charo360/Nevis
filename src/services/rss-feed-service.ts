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
   * Fetch trending data from API route
   */
  async getTrendingData(category: 'tech' | 'business' | 'general' = 'general', limit: number = 50): Promise<TrendingData> {
    const cacheKey = `${category}-${limit}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`/api/rss-data?category=${category}&limit=${limit}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch RSS data: ${response.status}`);
      }
      
      const data: TrendingData = await response.json();
      
      // Convert date strings back to Date objects
      data.lastUpdated = new Date(data.lastUpdated);
      data.articles = data.articles.map(article => ({
        ...article,
        pubDate: new Date(article.pubDate)
      }));
      
      // Cache the result
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      
      return data;
    } catch (error) {
      console.error('Error fetching RSS data:', error);
      
      // Return fallback data if API fails
      return {
        keywords: [],
        hashtags: [],
        topics: [],
        themes: [],
        articles: [],
        lastUpdated: new Date(),
        hashtagAnalytics: {
          trending: [],
          byCategory: {},
          byLocation: {},
          byIndustry: {},
          sentiment: {}
        }
      };
    }
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
