/**
 * Direct RSS Feed Fetching Utility
 * Replaces problematic internal API calls with direct RSS fetching
 * Fixes the 15+ failed API calls per request issue
 */

import { parseStringPromise } from 'xml2js';

export interface RSSArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  keywords?: string[];
  source?: string;
}

// Reliable RSS feed URLs by category
const RSS_FEEDS = {
  tech: [
    'https://feeds.feedburner.com/TechCrunch',
    'https://www.wired.com/feed/rss',
    'https://feeds.arstechnica.com/arstechnica/index'
  ],
  business: [
    'https://feeds.bloomberg.com/markets/news.rss',
    'https://feeds.reuters.com/reuters/businessNews'
  ],
  general: [
    'https://feeds.bbci.co.uk/news/rss.xml',
    'https://rss.cnn.com/rss/edition.rss'
  ],
  technology: [
    'https://feeds.feedburner.com/TechCrunch',
    'https://www.wired.com/feed/rss'
  ],
  startup: [
    'https://feeds.feedburner.com/TechCrunch',
    'https://feeds.reuters.com/reuters/businessNews'
  ],
  food: [
    'https://feeds.bbci.co.uk/news/rss.xml'
  ],
  local: [
    'https://feeds.bbci.co.uk/news/rss.xml'
  ],
  consumer: [
    'https://feeds.reuters.com/reuters/businessNews'
  ],
  health: [
    'https://feeds.bbci.co.uk/news/rss.xml'
  ],
  finance: [
    'https://feeds.bloomberg.com/markets/news.rss',
    'https://feeds.reuters.com/reuters/businessNews'
  ],
  economy: [
    'https://feeds.bloomberg.com/markets/news.rss'
  ],
  education: [
    'https://feeds.bbci.co.uk/news/rss.xml'
  ],
  realestate: [
    'https://feeds.reuters.com/reuters/businessNews'
  ],
  marketing: [
    'https://feeds.feedburner.com/TechCrunch'
  ],
  professional: [
    'https://feeds.reuters.com/reuters/businessNews'
  ],
  industry: [
    'https://feeds.reuters.com/reuters/businessNews'
  ]
};

/**
 * Fetch RSS feed directly with proper error handling and timeouts
 */
async function fetchSingleRSSFeed(url: string): Promise<RSSArticle[]> {
  try {

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Nevis-AI/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`📡 [Direct RSS] HTTP ${response.status} for ${url}`);
      return [];
    }

    const xmlData = await response.text();
    const result = await parseStringPromise(xmlData);

    const articles: RSSArticle[] = [];
    const items = result.rss?.channel?.[0]?.item || result.feed?.entry || [];

    for (const item of items.slice(0, 5)) { // Limit to 5 articles per feed
      const title = item.title?.[0]?._ || item.title?.[0] || '';
      const description = item.description?.[0]?._ || item.description?.[0] || item.summary?.[0]?._ || item.summary?.[0] || '';
      const link = item.link?.[0]?.$ || item.link?.[0] || '';
      const pubDate = item.pubDate?.[0] || item.published?.[0] || new Date().toISOString();

      if (title && description) {
        articles.push({
          title: typeof title === 'string' ? title : title.toString(),
          description: typeof description === 'string' ? description : description.toString(),
          link: typeof link === 'string' ? link : link.toString(),
          pubDate: typeof pubDate === 'string' ? pubDate : pubDate.toString(),
          keywords: extractKeywords(title + ' ' + description),
          source: new URL(url).hostname
        });
      }
    }

    return articles;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`⏱️ [Direct RSS] Timeout for ${url}`);
    } else {
      console.warn(`❌ [Direct RSS] Error fetching ${url}:`, error.message);
    }
    return [];
  }
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'will', 'said', 'more', 'than', 'what', 'when', 'where', 'would', 'could', 'should'].includes(word));

  // Get unique words and return top 10
  return [...new Set(words)].slice(0, 10);
}

/**
 * Fetch RSS feeds for a specific category using server-side API (CORS-safe)
 */
export async function fetchRSSFeedDirect(category: string, limit: number = 10): Promise<RSSArticle[]> {
  try {

    // Use server-side API route to avoid CORS issues
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    const apiUrl = `${baseUrl}/api/rss-data?category=${encodeURIComponent(category)}&limit=${limit}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`📡 [Direct RSS] API request failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();

    if (data.error) {
      console.warn(`📡 [Direct RSS] API returned error:`, data.error);
      return [];
    }

    // Convert the API response articles to our format
    const articles: RSSArticle[] = (data.articles || []).map((article: any) => ({
      title: article.title || '',
      description: article.description || '',
      link: article.link || '',
      pubDate: article.pubDate || new Date().toISOString(),
      keywords: article.keywords || [],
      source: article.source || 'unknown'
    }));

    return articles;

  } catch (error) {
    console.error(`❌ [Direct RSS] Server API error for category ${category}:`, error);

    // Fallback: return empty array instead of trying direct fetch to avoid CORS
    return [];
  }
}

/**
 * Health check for RSS feeds
 */
export async function checkRSSHealth(): Promise<{ healthy: number; total: number; details: any[] }> {
  const allFeeds = Object.values(RSS_FEEDS).flat();
  const uniqueFeeds = [...new Set(allFeeds)];

  const healthChecks = await Promise.allSettled(
    uniqueFeeds.map(async (url) => {
      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);

        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Nevis-AI/1.0)' }
        });

        return { url, status: response.status, healthy: response.ok };
      } catch (error) {
        return { url, status: 0, healthy: false, error: error.message };
      }
    })
  );

  const results = healthChecks.map((check, index) => ({
    url: uniqueFeeds[index],
    ...(check.status === 'fulfilled' ? check.value : { healthy: false, error: check.reason })
  }));

  const healthy = results.filter(r => r.healthy).length;

  return {
    healthy,
    total: uniqueFeeds.length,
    details: results
  };
}
