/**
 * RSS Feeds Integration for Trending Topics
 *
 * This module fetches trending topics from RSS feeds for Google Trends,
 * Reddit, and other sources that provide RSS endpoints.
 * Enhanced with better error handling and debugging for Revo 2.0
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
    console.log(`📡 Trying ${trendUrls.length} Google Trends RSS URLs...`);

    for (const url of trendUrls) {
      try {
        console.log(`🌐 Fetching: ${url}`);
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TrendBot/1.0)'
          },
          timeout: 10000 // 10 second timeout
        });

        console.log(`📊 Response status: ${response.status} for ${url}`);
        if (response.ok) {
          const xmlText = await response.text();
          console.log(`📄 Received ${xmlText.length} characters of XML data`);
          const trends = parseGoogleTrendsRSS(xmlText, location);
          console.log(`🎯 Parsed ${trends.length} trends from this URL`);
          allTrends.push(...trends);
        } else {
          console.warn(`⚠️ Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error(`❌ Error fetching Google Trends RSS from ${url}:`, error);
      }
    }

    console.log(`✅ Found ${allTrends.length} Google Trends from RSS`);

    // If no trends found, use smart fallback
    if (allTrends.length === 0) {
      console.log('🔄 Google Trends RSS failed, using smart contextual fallback...');
      return getSmartTrendingFallback(location, category);
    }

    return allTrends.slice(0, 10);

  } catch (error) {
    console.error('❌ Error fetching Google Trends RSS:', error);
    console.log('🔄 Using smart contextual fallback for Google Trends...');
    return getSmartTrendingFallback(location, category);
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
  // Note: Google Trends RSS endpoints are often unreliable or blocked
  // We'll try multiple alternative approaches
  const locationMap: Record<string, string[]> = {
    'US': [
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US',
      'https://trends.google.com/trends/trendingsearches/realtime/rss?geo=US&cat=all',
    ],
    'KE': [
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=KE',
      'https://trends.google.com/trends/trendingsearches/realtime/rss?geo=KE&cat=all',
      // Fallback to regional trends if Kenya-specific fails
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US', // Global fallback
    ],
    'GB': [
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=GB',
      'https://trends.google.com/trends/trendingsearches/realtime/rss?geo=GB&cat=all',
    ],
    'kenya': [
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=KE',
      'https://trends.google.com/trends/trendingsearches/realtime/rss?geo=KE&cat=all',
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US',
    ],
    'united states': [
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US',
      'https://trends.google.com/trends/trendingsearches/realtime/rss?geo=US&cat=all',
    ],
    'nairobi': [
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=KE',
      'https://trends.google.com/trends/trendingsearches/realtime/rss?geo=KE&cat=all',
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US',
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
function getNewsRSSUrls(location: string, businessType: string): Array<{ url: string, source: string }> {
  const urls: Array<{ url: string, source: string }> = [];

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

/**
 * Test RSS feeds integration - for debugging
 */
export async function testRSSFeeds(location: string = 'Kenya', businessType: string = 'restaurant'): Promise<void> {
  console.log('🧪 Testing RSS Feeds Integration...');
  console.log(`📍 Location: ${location}`);
  console.log(`🏢 Business Type: ${businessType}`);

  try {
    // Test Google Trends RSS
    console.log('\n🔍 Testing Google Trends RSS...');
    const googleTrends = await fetchGoogleTrendsRSS(location);
    console.log(`✅ Google Trends: ${googleTrends.length} trends found`);
    googleTrends.slice(0, 3).forEach((trend, i) => {
      console.log(`  ${i + 1}. ${trend.topic} (Score: ${trend.relevanceScore})`);
    });

    // Test Reddit RSS
    console.log('\n🔍 Testing Reddit RSS...');
    const redditTrends = await fetchRedditRSS(businessType);
    console.log(`✅ Reddit Trends: ${redditTrends.length} trends found`);
    redditTrends.slice(0, 3).forEach((trend, i) => {
      console.log(`  ${i + 1}. ${trend.topic} (Score: ${trend.relevanceScore})`);
    });

    // Test News RSS
    console.log('\n🔍 Testing News RSS...');
    const newsTrends = await fetchNewsRSS(location, businessType);
    console.log(`✅ News Trends: ${newsTrends.length} trends found`);
    newsTrends.slice(0, 3).forEach((trend, i) => {
      console.log(`  ${i + 1}. ${trend.topic} (Score: ${trend.relevanceScore})`);
    });

    console.log('\n🎉 RSS Feeds test completed!');

  } catch (error) {
    console.error('❌ RSS Feeds test failed:', error);
  }
}

/**
 * Smart contextual fallback for trending topics when RSS feeds fail
 */
function getSmartTrendingFallback(location: string, category?: string): ProcessedTrend[] {
  const currentDate = new Date();
  const month = currentDate.getMonth();
  const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

  // Base trends that work globally
  let trends: ProcessedTrend[] = [
    {
      topic: 'Weekend vibes',
      source: 'smart_fallback',
      relevanceScore: isWeekend ? 9 : 6,
      category: 'lifestyle',
      timeframe: 'now',
      engagement_potential: 'high'
    },
    {
      topic: 'Small business success',
      source: 'smart_fallback',
      relevanceScore: 8,
      category: 'business',
      timeframe: 'now',
      engagement_potential: 'high'
    }
  ];

  // Location-specific trends
  if (location.toLowerCase().includes('kenya') || location.toLowerCase().includes('nairobi')) {
    trends.push(
      {
        topic: 'Kenyan entrepreneurship',
        source: 'smart_fallback',
        relevanceScore: 9,
        category: 'business',
        timeframe: 'now',
        engagement_potential: 'high'
      },
      {
        topic: 'East African innovation',
        source: 'smart_fallback',
        relevanceScore: 8,
        category: 'technology',
        timeframe: 'now',
        engagement_potential: 'high'
      },
      {
        topic: 'Nairobi lifestyle',
        source: 'smart_fallback',
        relevanceScore: 7,
        category: 'lifestyle',
        timeframe: 'now',
        engagement_potential: 'medium'
      }
    );
  }

  // Seasonal trends
  if (month >= 11 || month <= 1) { // Holiday season
    trends.push({
      topic: 'Holiday celebrations',
      source: 'smart_fallback',
      relevanceScore: 9,
      category: 'seasonal',
      timeframe: 'now',
      engagement_potential: 'high'
    });
  } else if (month >= 5 && month <= 7) { // Mid-year
    trends.push({
      topic: 'Summer activities',
      source: 'smart_fallback',
      relevanceScore: 8,
      category: 'seasonal',
      timeframe: 'now',
      engagement_potential: 'high'
    });
  }

  // Category-specific trends
  if (category?.toLowerCase().includes('food') || category?.toLowerCase().includes('restaurant')) {
    trends.push({
      topic: 'Local cuisine trends',
      source: 'smart_fallback',
      relevanceScore: 8,
      category: 'food',
      timeframe: 'now',
      engagement_potential: 'high'
    });
  }

  console.log(`🧠 Generated ${trends.length} smart fallback trends for ${location}`);
  return trends.slice(0, 10);
}
