/**
 * RSS Feed Service for Trending Content & Social Media Insights
 * Fetches and parses RSS feeds to extract trending topics, keywords, and themes
 */

import { parseStringPromise } from 'xml2js';

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
  topics: string[];
  themes: string[];
  articles: RSSArticle[];
  lastUpdated: Date;
}

export class RSSFeedService {
  private cache: Map<string, { data: RSSArticle[]; timestamp: number }> = new Map();
  private readonly cacheTimeout = parseInt(process.env.RSS_CACHE_DURATION || '1800') * 1000; // 30 minutes default

  private readonly feedUrls = {
    // Social Media & Marketing Trends
    socialMediaToday: process.env.RSS_SOCIAL_MEDIA_TODAY,
    socialMediaExaminer: process.env.RSS_SOCIAL_MEDIA_EXAMINER,
    bufferBlog: process.env.RSS_BUFFER_BLOG,
    hootsuiteBlogs: process.env.RSS_HOOTSUITE_BLOG,
    sproutSocial: process.env.RSS_SPROUT_SOCIAL,
    laterBlog: process.env.RSS_LATER_BLOG,

    // Trending Topics & News
    googleNewsTrending: process.env.RSS_GOOGLE_NEWS_TRENDING,
    redditPopular: process.env.RSS_REDDIT_POPULAR,
    buzzfeed: process.env.RSS_BUZZFEED,
    twitterTrending: process.env.RSS_TWITTER_TRENDING,

    // Business & Marketing
    hubspotMarketing: process.env.RSS_HUBSPOT_MARKETING,
    contentMarketingInstitute: process.env.RSS_CONTENT_MARKETING_INSTITUTE,
    marketingProfs: process.env.RSS_MARKETING_PROFS,
    marketingLand: process.env.RSS_MARKETING_LAND,
    neilPatelBlog: process.env.RSS_NEIL_PATEL_BLOG,

    // Industry News
    techCrunch: process.env.RSS_TECHCRUNCH,
    mashable: process.env.RSS_MASHABLE,
    theVerge: process.env.RSS_THE_VERGE,
    wired: process.env.RSS_WIRED,

    // Platform-Specific
    instagramBusiness: process.env.RSS_INSTAGRAM_BUSINESS,
    facebookBusiness: process.env.RSS_FACEBOOK_BUSINESS,
    linkedinMarketing: process.env.RSS_LINKEDIN_MARKETING,
    youtubeCreator: process.env.RSS_YOUTUBE_CREATOR,
    tiktokBusiness: process.env.RSS_TIKTOK_BUSINESS,

    // Analytics & Data
    googleAnalytics: process.env.RSS_GOOGLE_ANALYTICS,
    hootsuiteInsights: process.env.RSS_HOOTSUITE_INSIGHTS,

    // Design & Creative
    canvaDesignSchool: process.env.RSS_CANVA_DESIGN_SCHOOL,
    adobeBlog: process.env.RSS_ADOBE_BLOG,
    creativeBloq: process.env.RSS_CREATIVE_BLOQ,

    // Seasonal & Events
    eventbriteBlog: process.env.RSS_EVENTBRITE_BLOG,
  };

  /**
   * Fetch and parse a single RSS feed
   */
  private async fetchRSSFeed(url: string, sourceName: string): Promise<RSSArticle[]> {
    try {
      // Check cache first
      const cached = this.cache.get(url);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Nevis-AI-Content-Generator/1.0',
        },
        timeout: 10000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlData = await response.text();
      const parsed = await parseStringPromise(xmlData);

      const articles: RSSArticle[] = [];
      const items = parsed.rss?.channel?.[0]?.item || parsed.feed?.entry || [];

      const maxArticles = parseInt(process.env.RSS_MAX_ARTICLES_PER_FEED || '50');

      for (const item of items.slice(0, maxArticles)) {
        const article: RSSArticle = {
          title: this.extractText(item.title),
          description: this.extractText(item.description || item.summary),
          link: this.extractText(item.link || item.id),
          pubDate: new Date(this.extractText(item.pubDate || item.published) || Date.now()),
          category: this.extractText(item.category),
          keywords: this.extractKeywords(
            this.extractText(item.title) + ' ' + this.extractText(item.description || item.summary)
          ),
          source: sourceName,
        };

        articles.push(article);
      }

      // Cache the results
      this.cache.set(url, { data: articles, timestamp: Date.now() });

      return articles;

    } catch (error) {
      return [];
    }
  }

  /**
   * Extract text content from RSS item fields
   */
  private extractText(field: any): string {
    if (!field) return '';
    
    if (typeof field === 'string') return field;
    if (Array.isArray(field) && field.length > 0) {
      return typeof field[0] === 'string' ? field[0] : field[0]._ || '';
    }
    if (typeof field === 'object' && field._) return field._;
    
    return '';
  }

  /**
   * Extract keywords from text content
   */
  private extractKeywords(text: string): string[] {
    if (!text) return [];

    // Remove HTML tags and normalize text
    const cleanText = text
      .replace(/<[^>]*>/g, '')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract meaningful words (3+ characters, not common stop words)
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'will', 'with'
    ]);

    const words = cleanText
      .split(' ')
      .filter(word => word.length >= 3 && !stopWords.has(word))
      .slice(0, 10); // Limit to top 10 keywords per article

    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Fetch all RSS feeds and return trending data
   */
  public async getTrendingData(): Promise<TrendingData> {
    
    const allArticles: RSSArticle[] = [];
    const fetchPromises: Promise<RSSArticle[]>[] = [];

    // Fetch all feeds concurrently
    for (const [sourceName, url] of Object.entries(this.feedUrls)) {
      if (url) {
        fetchPromises.push(this.fetchRSSFeed(url, sourceName));
      }
    }

    const results = await Promise.allSettled(fetchPromises);
    
    // Collect all successful results
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
      }
    });

    // Sort articles by publication date (newest first)
    allArticles.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

    // Extract trending keywords and topics
    const allKeywords: string[] = [];
    const allTopics: string[] = [];
    const allThemes: string[] = [];

    allArticles.forEach(article => {
      allKeywords.push(...article.keywords);
      if (article.title) allTopics.push(article.title);
      if (article.category) allThemes.push(article.category);
    });

    // Count frequency and get top items
    const keywordCounts = this.getTopItems(allKeywords, 50);
    const topicCounts = this.getTopItems(allTopics, 30);
    const themeCounts = this.getTopItems(allThemes, 20);


    return {
      keywords: keywordCounts,
      topics: topicCounts,
      themes: themeCounts,
      articles: allArticles.slice(0, 100), // Return top 100 most recent articles
      lastUpdated: new Date(),
    };
  }

  /**
   * Get top items by frequency
   */
  private getTopItems(items: string[], limit: number): string[] {
    const counts = new Map<string, number>();
    
    items.forEach(item => {
      const normalized = item.toLowerCase().trim();
      if (normalized.length >= 3) {
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([item]) => item);
  }

  /**
   * Get trending keywords for a specific category
   */
  public async getTrendingKeywordsByCategory(category: 'social' | 'business' | 'tech' | 'design'): Promise<string[]> {
    const trendingData = await this.getTrendingData();
    
    const categoryFeeds = {
      social: ['socialMediaToday', 'socialMediaExaminer', 'bufferBlog', 'hootsuiteBlogs'],
      business: ['hubspotMarketing', 'contentMarketingInstitute', 'marketingProfs'],
      tech: ['techCrunch', 'theVerge', 'wired'],
      design: ['canvaDesignSchool', 'adobeBlog', 'creativeBloq'],
    };

    const categoryArticles = trendingData.articles.filter(article => 
      categoryFeeds[category].includes(article.source)
    );

    const keywords: string[] = [];
    categoryArticles.forEach(article => keywords.push(...article.keywords));

    return this.getTopItems(keywords, 20);
  }
}

// Export singleton instance
export const rssService = new RSSFeedService();
