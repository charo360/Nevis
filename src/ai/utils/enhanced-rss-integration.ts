/**
 * Enhanced RSS Integration for Revo 1.0 AI Content Generation
 * Provides business-relevant RSS data filtering and integration
 */

export interface RSSArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  category?: string;
  relevanceScore?: number;
}

export interface BusinessRelevantRSSData {
  articles: RSSArticle[];
  trends: string[];
  localNews: RSSArticle[];
  industryNews: RSSArticle[];
  relevanceInsights: string[];
}

/**
 * RSS Categories mapping for different business types
 */
const RSS_CATEGORIES = {
  'Software Development': ['technology', 'business', 'startup'],
  'Web Development': ['technology', 'business', 'startup'],
  'Restaurant': ['food', 'business', 'local'],
  'Retail': ['business', 'consumer', 'local'],
  'Healthcare': ['health', 'business', 'local'],
  'Finance': ['finance', 'business', 'economy'],
  'Education': ['education', 'business', 'local'],
  'Real Estate': ['realestate', 'business', 'local'],
  'Marketing': ['marketing', 'business', 'technology'],
  'Consulting': ['business', 'professional', 'industry']
};

/**
 * Location-specific RSS sources
 */
const LOCATION_RSS_SOURCES = {
  'Kenya': [
    'https://www.nation.co.ke/kenya/news/rss',
    'https://www.standardmedia.co.ke/rss/headlines.php'
  ],
  'South Africa': [
    'https://www.news24.com/news24/southafrica/rss',
    'https://mg.co.za/rss/'
  ],
  'Nigeria': [
    'https://punchng.com/feed/',
    'https://www.vanguardngr.com/feed/'
  ],
  'United States': [
    'https://feeds.bbci.co.uk/news/rss.xml',
    'https://rss.cnn.com/rss/edition.rss'
  ]
};

/**
 * Fetch business-relevant RSS data with relevance scoring
 */
export async function fetchBusinessRelevantRSSData(
  businessType: string,
  location: string,
  limit: number = 20
): Promise<BusinessRelevantRSSData> {
  try {
    console.log(`🔍 [Enhanced RSS] Fetching data for: ${businessType} in ${location}`);
    
    // Get relevant categories for business type
    const categories = RSS_CATEGORIES[businessType] || ['business', 'general'];
    
    // Fetch RSS data from multiple sources
    const articles: RSSArticle[] = [];
    
    // Fetch general business news
    for (const category of categories) {
      try {
        const response = await fetch(`/api/rss-data?category=${category}&limit=${Math.ceil(limit / categories.length)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.articles) {
            articles.push(...data.articles.map((article: any) => ({
              ...article,
              category,
              relevanceScore: calculateRelevanceScore(article, businessType, location)
            })));
          }
        }
      } catch (error) {
        console.warn(`⚠️ [Enhanced RSS] Failed to fetch ${category} data:`, error);
      }
    }
    
    // Sort by relevance score and limit results
    const sortedArticles = articles
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, limit);
    
    // Categorize articles
    const localNews = sortedArticles.filter(article => 
      article.title.toLowerCase().includes(location.toLowerCase()) ||
      article.description?.toLowerCase().includes(location.toLowerCase())
    );
    
    const industryNews = sortedArticles.filter(article =>
      article.title.toLowerCase().includes(businessType.toLowerCase()) ||
      article.description?.toLowerCase().includes(businessType.toLowerCase())
    );
    
    // Extract trends from article titles
    const trends = extractTrendsFromArticles(sortedArticles, businessType);
    
    // Generate relevance insights
    const relevanceInsights = generateRelevanceInsights(sortedArticles, businessType, location);
    
    console.log(`✅ [Enhanced RSS] Processed ${sortedArticles.length} articles with ${trends.length} trends`);
    
    return {
      articles: sortedArticles,
      trends,
      localNews,
      industryNews,
      relevanceInsights
    };
    
  } catch (error) {
    console.error('❌ [Enhanced RSS] Error fetching RSS data:', error);
    return {
      articles: [],
      trends: [],
      localNews: [],
      industryNews: [],
      relevanceInsights: []
    };
  }
}

/**
 * Calculate relevance score for an article (0-1 scale)
 */
function calculateRelevanceScore(article: any, businessType: string, location: string): number {
  let score = 0;
  
  const title = article.title?.toLowerCase() || '';
  const description = article.description?.toLowerCase() || '';
  const content = `${title} ${description}`;
  
  // Business type relevance (40% weight)
  const businessKeywords = businessType.toLowerCase().split(' ');
  const businessMatches = businessKeywords.filter(keyword => 
    content.includes(keyword)
  ).length;
  score += (businessMatches / businessKeywords.length) * 0.4;
  
  // Location relevance (30% weight)
  const locationKeywords = location.toLowerCase().split(' ');
  const locationMatches = locationKeywords.filter(keyword =>
    content.includes(keyword)
  ).length;
  score += (locationMatches / locationKeywords.length) * 0.3;
  
  // Industry keywords (20% weight)
  const industryKeywords = ['business', 'market', 'industry', 'economy', 'growth', 'innovation'];
  const industryMatches = industryKeywords.filter(keyword =>
    content.includes(keyword)
  ).length;
  score += (industryMatches / industryKeywords.length) * 0.2;
  
  // Recency bonus (10% weight)
  const pubDate = new Date(article.pubDate);
  const now = new Date();
  const daysDiff = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 1 - (daysDiff / 7)); // Decay over 7 days
  score += recencyScore * 0.1;
  
  return Math.min(1, score);
}

/**
 * Extract trending topics from articles
 */
function extractTrendsFromArticles(articles: RSSArticle[], businessType: string): string[] {
  const trendKeywords = new Map<string, number>();
  
  articles.forEach(article => {
    const content = `${article.title} ${article.description || ''}`.toLowerCase();
    
    // Extract potential trend keywords
    const words = content.split(/\s+/)
      .filter(word => word.length > 4)
      .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'her', 'now', 'air', 'any', 'may', 'say', 'she', 'try', 'way'].includes(word));
    
    words.forEach(word => {
      trendKeywords.set(word, (trendKeywords.get(word) || 0) + 1);
    });
  });
  
  // Get top trending keywords
  return Array.from(trendKeywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword]) => keyword);
}

/**
 * Generate relevance insights for content creation
 */
function generateRelevanceInsights(articles: RSSArticle[], businessType: string, location: string): string[] {
  const insights: string[] = [];
  
  if (articles.length === 0) {
    return ['No relevant news data available for enhanced content generation'];
  }
  
  // High relevance articles
  const highRelevanceArticles = articles.filter(article => (article.relevanceScore || 0) > 0.7);
  if (highRelevanceArticles.length > 0) {
    insights.push(`${highRelevanceArticles.length} highly relevant news stories available for context`);
  }
  
  // Local news insights
  const localArticles = articles.filter(article =>
    article.title.toLowerCase().includes(location.toLowerCase())
  );
  if (localArticles.length > 0) {
    insights.push(`${localArticles.length} local news stories from ${location} area`);
  }
  
  // Industry insights
  const industryArticles = articles.filter(article =>
    article.title.toLowerCase().includes(businessType.toLowerCase())
  );
  if (industryArticles.length > 0) {
    insights.push(`${industryArticles.length} industry-specific stories about ${businessType}`);
  }
  
  // Recent news insights
  const recentArticles = articles.filter(article => {
    const pubDate = new Date(article.pubDate);
    const now = new Date();
    const hoursDiff = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
  });
  if (recentArticles.length > 0) {
    insights.push(`${recentArticles.length} breaking news stories from the last 24 hours`);
  }
  
  return insights;
}
