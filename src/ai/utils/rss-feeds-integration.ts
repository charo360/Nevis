/**
 * RSS Feeds Integration for Trending Topics
 * 
 * This module fetches trending topics from RSS feeds for Google Trends,
 * Reddit, and other sources that provide RSS endpoints.
 */

export interface RSSFeedItem {
  title: string;
  description?: string;
  link?: string;
  pubDate?: string;
  category?: string;
  source: string;
}

export interface ProcessedTrend {
  topic: string;
  source: 'google_trends_rss' | 'reddit_rss' | 'news_rss';
  relevanceScore: number;
  category: string;
  timeframe: string;
  engagement_potential: string;
  link?: string;
}

/**
 * Fetch Google Trends via RSS feeds
 */
export async function fetchGoogleTrendsRSS(
  location: string = 'US',
  category?: string
): Promise<ProcessedTrend[]> {
  try {
    console.log(`🔍 Fetching Google Trends RSS for ${location}...`);
    
    // Google Trends RSS URLs by location
    const trendUrls = getGoogleTrendsRSSUrls(location);
    const allTrends: ProcessedTrend[] = [];

    for (const url of trendUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TrendBot/1.0)'
          }
        });

        if (response.ok) {
          const xmlText = await response.text();
          const trends = parseGoogleTrendsRSS(xmlText, location);
          allTrends.push(...trends);
        }
      } catch (error) {
        console.error(`Error fetching Google Trends RSS from ${url}:`, error);
      }
    }

    console.log(`✅ Found ${allTrends.length} Google Trends from RSS`);
    return allTrends.slice(0, 10);

  } catch (error) {
    console.error('Error fetching Google Trends RSS:', error);
    return [];
  }
}

/**
 * Fetch Reddit trends via RSS feeds
 */
export async function fetchRedditRSS(
  businessType: string,
  subreddits?: string[]
): Promise<ProcessedTrend[]> {
  try {
    console.log(`🔍 Fetching Reddit RSS for ${businessType}...`);
    
    const targetSubreddits = subreddits || getRelevantSubreddits(businessType);
    const allTrends: ProcessedTrend[] = [];

    for (const subreddit of targetSubreddits.slice(0, 5)) {
      try {
        // Reddit RSS URLs for hot posts
        const url = `https://www.reddit.com/r/${subreddit}/hot.rss?limit=10`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TrendBot/1.0)'
          }
        });

        if (response.ok) {
          const xmlText = await response.text();
          const trends = parseRedditRSS(xmlText, subreddit);
          allTrends.push(...trends);
        }
      } catch (error) {
        console.error(`Error fetching Reddit RSS for r/${subreddit}:`, error);
      }
    }

    console.log(`✅ Found ${allTrends.length} Reddit trends from RSS`);
    return allTrends.slice(0, 15);

  } catch (error) {
    console.error('Error fetching Reddit RSS:', error);
    return [];
  }
}

/**
 * Fetch additional news RSS feeds
 */
export async function fetchNewsRSS(
  location: string,
  businessType: string
): Promise<ProcessedTrend[]> {
  try {
    console.log(`🔍 Fetching News RSS for ${location} ${businessType}...`);
    
    const newsUrls = getNewsRSSUrls(location, businessType);
    const allTrends: ProcessedTrend[] = [];

    for (const { url, source } of newsUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TrendBot/1.0)'
          }
        });

        if (response.ok) {
          const xmlText = await response.text();
          const trends = parseNewsRSS(xmlText, source);
          allTrends.push(...trends);
        }
      } catch (error) {
        console.error(`Error fetching News RSS from ${source}:`, error);
      }
    }

    console.log(`✅ Found ${allTrends.length} news trends from RSS`);
    return allTrends.slice(0, 8);

  } catch (error) {
    console.error('Error fetching News RSS:', error);
    return [];
  }
}

/**
 * Get Google Trends RSS URLs by location
 */
function getGoogleTrendsRSSUrls(location: string): string[] {
  const locationMap: Record<string, string[]> = {
    'US': [
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US',
    ],
    'KE': [
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=KE',
    ],
    'GB': [
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=GB',
    ],
    'kenya': [
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=KE',
    ],
    'united states': [
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US',
    ],
    'nairobi': [
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=KE',
    ]
  };

  const locationKey = location.toLowerCase();
  return locationMap[locationKey] || locationMap['US'];
}

/**
 * Get relevant subreddits for business types
 */
function getRelevantSubreddits(businessType: string): string[] {
  const subredditMap: Record<string, string[]> = {
    'financial technology software': ['fintech', 'personalfinance', 'investing', 'entrepreneur', 'startups'],
    'restaurant': ['food', 'recipes', 'restaurantowners', 'smallbusiness', 'cooking'],
    'fitness': ['fitness', 'bodybuilding', 'nutrition', 'personaltrainer', 'workout'],
    'technology': ['technology', 'programming', 'startups', 'artificial', 'MachineLearning'],
    'beauty': ['beauty', 'skincare', 'makeup', 'beautybusiness', 'entrepreneur'],
    'retail': ['retail', 'smallbusiness', 'entrepreneur', 'ecommerce', 'business']
  };

  return subredditMap[businessType.toLowerCase()] || ['business', 'entrepreneur', 'smallbusiness'];
}

/**
 * Get news RSS URLs by location and business type
 */
function getNewsRSSUrls(location: string, businessType: string): Array<{url: string, source: string}> {
  const urls: Array<{url: string, source: string}> = [];

  // Location-based news
  if (location.toLowerCase().includes('kenya') || location.toLowerCase().includes('nairobi')) {
    urls.push(
      { url: 'https://www.nation.co.ke/kenya/business/-/1006/1006/view/asFeed/-/index.xml', source: 'Daily Nation Kenya' },
      { url: 'https://www.standardmedia.co.ke/rss/business.php', source: 'The Standard Kenya' }
    );
  } else if (location.toLowerCase().includes('united states') || location.toLowerCase().includes('new york')) {
    urls.push(
      { url: 'https://feeds.reuters.com/reuters/businessNews', source: 'Reuters Business' },
      { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', source: 'CNBC Business' }
    );
  }

  // Business type specific news
  if (businessType.toLowerCase().includes('technology') || businessType.toLowerCase().includes('fintech')) {
    urls.push(
      { url: 'https://feeds.feedburner.com/techcrunch/startups', source: 'TechCrunch Startups' },
      { url: 'https://www.wired.com/feed/category/business/latest/rss', source: 'Wired Business' }
    );
  }

  return urls;
}

/**
 * Parse Google Trends RSS XML
 */
function parseGoogleTrendsRSS(xmlText: string, location: string): ProcessedTrend[] {
  const trends: ProcessedTrend[] = [];
  
  try {
    // Simple XML parsing for RSS items
    const itemMatches = xmlText.match(/<item[^>]*>([\s\S]*?)<\/item>/g) || [];
    
    for (const item of itemMatches.slice(0, 10)) {
      const titleMatch = item.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/);
      const linkMatch = item.match(/<link[^>]*>(.*?)<\/link>/);
      const pubDateMatch = item.match(/<pubDate[^>]*>(.*?)<\/pubDate>/);
      
      if (titleMatch) {
        const title = titleMatch[1].trim();
        trends.push({
          topic: title,
          source: 'google_trends_rss',
          relevanceScore: 9, // Google Trends are highly relevant
          category: 'trending',
          timeframe: 'now',
          engagement_potential: 'high',
          link: linkMatch ? linkMatch[1] : undefined
        });
      }
    }
  } catch (error) {
    console.error('Error parsing Google Trends RSS:', error);
  }

  return trends;
}

/**
 * Parse Reddit RSS XML
 */
function parseRedditRSS(xmlText: string, subreddit: string): ProcessedTrend[] {
  const trends: ProcessedTrend[] = [];
  
  try {
    // Simple XML parsing for RSS entries
    const entryMatches = xmlText.match(/<entry[^>]*>([\s\S]*?)<\/entry>/g) || [];
    
    for (const entry of entryMatches.slice(0, 5)) {
      const titleMatch = entry.match(/<title[^>]*>(.*?)<\/title>/);
      const linkMatch = entry.match(/<link[^>]*href="([^"]*)"[^>]*>/);
      const updatedMatch = entry.match(/<updated[^>]*>(.*?)<\/updated>/);
      
      if (titleMatch) {
        const title = titleMatch[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
        
        // Skip if title is too long or contains Reddit formatting
        if (title.length > 100 || title.includes('[removed]') || title.includes('[deleted]')) {
          continue;
        }
        
        trends.push({
          topic: title,
          source: 'reddit_rss',
          relevanceScore: 7, // Reddit trends are moderately relevant
          category: 'community',
          timeframe: 'today',
          engagement_potential: 'medium',
          link: linkMatch ? linkMatch[1] : undefined
        });
      }
    }
  } catch (error) {
    console.error('Error parsing Reddit RSS:', error);
  }

  return trends;
}

/**
 * Parse News RSS XML
 */
function parseNewsRSS(xmlText: string, source: string): ProcessedTrend[] {
  const trends: ProcessedTrend[] = [];
  
  try {
    // Simple XML parsing for RSS items
    const itemMatches = xmlText.match(/<item[^>]*>([\s\S]*?)<\/item>/g) || [];
    
    for (const item of itemMatches.slice(0, 5)) {
      const titleMatch = item.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/) || 
                        item.match(/<title[^>]*>(.*?)<\/title>/);
      const linkMatch = item.match(/<link[^>]*>(.*?)<\/link>/);
      const pubDateMatch = item.match(/<pubDate[^>]*>(.*?)<\/pubDate>/);
      
      if (titleMatch) {
        const title = titleMatch[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
        
        trends.push({
          topic: title,
          source: 'news_rss',
          relevanceScore: 8, // News is highly relevant
          category: 'news',
          timeframe: 'today',
          engagement_potential: 'high',
          link: linkMatch ? linkMatch[1] : undefined
        });
      }
    }
  } catch (error) {
    console.error('Error parsing News RSS:', error);
  }

  return trends;
}
