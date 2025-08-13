/**
 * Real-Time Trends Integration System
 * 
 * This module integrates multiple real-time trending topic sources
 * and provides a unified interface for getting current trends.
 */

export interface TrendingTopicSource {
  name: string;
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  rateLimitPerHour: number;
}

export interface LocalContext {
  weather?: {
    temperature: number;
    condition: string;
    business_impact: string;
    content_opportunities: string[];
  };
  events?: Array<{
    name: string;
    category: string;
    relevance_score: number;
    start_date: string;
  }>;
}

export interface RealTimeTrendingConfig {
  sources: {
    googleTrends: TrendingTopicSource;
    twitterApi: TrendingTopicSource;
    newsApi: TrendingTopicSource;
    redditApi: TrendingTopicSource;
    youtubeApi: TrendingTopicSource;
    eventbriteApi: TrendingTopicSource;
    openWeatherApi: TrendingTopicSource;
  };
  fallbackToStatic: boolean;
  cacheTimeMinutes: number;
}

/**
 * Configuration for real-time trending topics
 * Add your API keys to environment variables
 */
export const TRENDING_CONFIG: RealTimeTrendingConfig = {
  sources: {
    googleTrends: {
      name: 'Google Trends RSS',
      enabled: process.env.GOOGLE_TRENDS_RSS_ENABLED === 'true',
      apiKey: undefined, // RSS doesn't need API key
      baseUrl: 'https://trends.google.com/trends/trendingsearches/daily/rss',
      rateLimitPerHour: 1000 // RSS has higher limits
    },
    twitterApi: {
      name: 'Twitter API v1.1',
      enabled: false, // Temporarily disabled due to endpoint issues
      apiKey: process.env.TWITTER_BEARER_TOKEN,
      baseUrl: 'https://api.twitter.com/1.1',
      rateLimitPerHour: 300
    },
    newsApi: {
      name: 'News API',
      enabled: false, // Temporarily disabled due to API key issues
      apiKey: process.env.NEWS_API_KEY,
      baseUrl: 'https://newsapi.org/v2',
      rateLimitPerHour: 1000
    },
    redditApi: {
      name: 'Reddit RSS',
      enabled: process.env.REDDIT_RSS_ENABLED === 'true',
      apiKey: undefined, // RSS doesn't need API key
      baseUrl: 'https://www.reddit.com',
      rateLimitPerHour: 1000 // RSS has higher limits
    },
    youtubeApi: {
      name: 'YouTube Data API',
      enabled: !!process.env.YOUTUBE_API_KEY,
      apiKey: process.env.YOUTUBE_API_KEY,
      baseUrl: 'https://www.googleapis.com/youtube/v3',
      rateLimitPerHour: 10000
    },
    eventbriteApi: {
      name: 'Eventbrite API',
      enabled: !!process.env.EVENTBRITE_API_KEY,
      apiKey: process.env.EVENTBRITE_API_KEY,
      baseUrl: 'https://www.eventbriteapi.com/v3',
      rateLimitPerHour: 1000
    },
    openWeatherApi: {
      name: 'OpenWeather API',
      enabled: !!process.env.OPENWEATHER_API_KEY,
      apiKey: process.env.OPENWEATHER_API_KEY,
      baseUrl: 'https://api.openweathermap.org/data/2.5',
      rateLimitPerHour: 1000
    }
  },
  fallbackToStatic: true,
  cacheTimeMinutes: 30
};

/**
 * Google Trends Integration via RSS
 */
export async function fetchGoogleTrends(
  location: string,
  category?: string
): Promise<any[]> {
  if (!TRENDING_CONFIG.sources.googleTrends.enabled) {
    console.log('Google Trends RSS not enabled, using fallback');
    return getGoogleTrendsFallback(location, category);
  }

  try {
    // Import RSS integration
    const { fetchGoogleTrendsRSS } = await import('./rss-feeds-integration');

    // Use RSS feeds for Google Trends
    const geoCode = getGoogleTrendsGeoCode(location);
    const trends = await fetchGoogleTrendsRSS(geoCode, category);

    // Convert to expected format
    return trends.map(trend => ({
      topic: trend.topic,
      relevanceScore: trend.relevanceScore,
      category: trend.category,
      timeframe: trend.timeframe,
      engagement_potential: trend.engagement_potential,
      source: 'google_trends_rss'
    }));

  } catch (error) {
    console.error('Error fetching Google Trends RSS:', error);
    return getGoogleTrendsFallback(location, category);
  }
}

/**
 * Twitter/X Trends Integration
 */
export async function fetchTwitterTrends(
  location: string,
  businessType?: string
): Promise<any[]> {
  if (!TRENDING_CONFIG.sources.twitterApi.enabled) {
    console.log('Twitter API not configured, using fallback');
    return getTwitterTrendsFallback(location, businessType);
  }

  try {
    const woeid = getTwitterWOEID(location);

    // Use Twitter API v2 trending topics endpoint
    const response = await fetch(
      `${TRENDING_CONFIG.sources.twitterApi.baseUrl}/trends/place.json?id=${woeid}`,
      {
        headers: {
          'Authorization': `Bearer ${TRENDING_CONFIG.sources.twitterApi.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'TrendingTopicsBot/2.0'
        }
      }
    );

    if (!response.ok) {
      console.log(`Twitter API response: ${response.status} ${response.statusText}`);
      throw new Error(`Twitter API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Twitter API returned ${data.length || 0} trend locations`);

    // Process Twitter trends data
    return processTwitterTrendsData(data, businessType);

  } catch (error) {
    console.error('Error fetching Twitter trends:', error);
    return getTwitterTrendsFallback(location, businessType);
  }
}

/**
 * News API Integration
 */
export async function fetchCurrentNews(
  location: string,
  businessType: string,
  category?: string
): Promise<any[]> {
  if (!TRENDING_CONFIG.sources.newsApi.enabled) {
    console.log('News API not configured, using fallback');
    return getNewsFallback(location, businessType, category);
  }

  try {
    const params = new URLSearchParams({
      country: getNewsApiCountryCode(location),
      category: category || 'business',
      pageSize: '10',
      apiKey: TRENDING_CONFIG.sources.newsApi.apiKey!
    });

    console.log(`🔍 Fetching news from News API for ${location}...`);
    const response = await fetch(`${TRENDING_CONFIG.sources.newsApi.baseUrl}/top-headlines?${params}`);

    if (!response.ok) {
      console.log(`News API response: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('News API error details:', errorText);
      throw new Error(`News API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ News API returned ${data.articles?.length || 0} articles`);

    // Process news data
    return processNewsData(data, businessType);

  } catch (error) {
    console.error('Error fetching news:', error);
    return getNewsFallback(location, businessType, category);
  }
}

/**
 * Reddit Trends Integration via RSS
 */
export async function fetchRedditTrends(
  businessType: string,
  platform: string
): Promise<any[]> {
  if (!TRENDING_CONFIG.sources.redditApi.enabled) {
    console.log('Reddit RSS not enabled, using fallback');
    return getRedditTrendsFallback(businessType, platform);
  }

  try {
    // Import RSS integration
    const { fetchRedditRSS } = await import('./rss-feeds-integration');

    // Use RSS feeds for Reddit trends
    const trends = await fetchRedditRSS(businessType);

    // Convert to expected format
    return trends.map(trend => ({
      topic: trend.topic,
      relevanceScore: trend.relevanceScore,
      category: trend.category,
      timeframe: trend.timeframe,
      engagement_potential: trend.engagement_potential,
      source: 'reddit_rss'
    }));

  } catch (error) {
    console.error('Error fetching Reddit RSS:', error);
    return getRedditTrendsFallback(businessType, platform);
  }
}

/**
 * Helper functions for processing API data
 */
function processGoogleTrendsData(data: any, location: string, category?: string) {
  // Process Google Trends API response
  return [
    {
      topic: `Trending in ${location}`,
      source: 'google_trends',
      relevanceScore: 9,
      category: category || 'general',
      timeframe: 'now',
      engagement_potential: 'high'
    }
  ];
}

function processTwitterTrendsData(data: any, businessType?: string) {
  // Process Twitter API response
  if (data && data[0] && data[0].trends) {
    return data[0].trends.slice(0, 10).map((trend: any) => ({
      topic: trend.name,
      source: 'twitter',
      relevanceScore: trend.tweet_volume ? Math.min(10, Math.log10(trend.tweet_volume)) : 5,
      category: 'social',
      timeframe: 'now',
      engagement_potential: trend.tweet_volume > 10000 ? 'high' : 'medium'
    }));
  }
  return [];
}

function processNewsData(data: any, businessType: string) {
  // Process News API response
  if (data && data.articles) {
    return data.articles.slice(0, 8).map((article: any) => ({
      topic: article.title,
      source: 'news',
      relevanceScore: 8,
      category: 'news',
      timeframe: 'today',
      engagement_potential: 'high',
      business_angle: `How this relates to ${businessType} industry`
    }));
  }
  return [];
}

function processRedditData(data: any, subreddit: string) {
  // Process Reddit API response
  if (data && data.data && data.data.children) {
    return data.data.children.slice(0, 5).map((post: any) => ({
      topic: post.data.title,
      source: 'reddit',
      relevanceScore: Math.min(10, post.data.score / 100),
      category: 'community',
      timeframe: 'today',
      engagement_potential: post.data.score > 1000 ? 'high' : 'medium',
      subreddit: subreddit
    }));
  }
  return [];
}

/**
 * Helper functions for API parameters
 */
function getGoogleTrendsGeoCode(location: string): string {
  const geoMap: Record<string, string> = {
    'kenya': 'KE',
    'united states': 'US',
    'nairobi': 'KE',
    'new york': 'US-NY',
    'london': 'GB-ENG'
  };
  return geoMap[location.toLowerCase()] || 'US';
}

function getTwitterWOEID(location: string): string {
  const woeidMap: Record<string, string> = {
    'kenya': '23424863',
    'united states': '23424977',
    'nairobi': '1528488',
    'new york': '2459115',
    'london': '44418'
  };
  return woeidMap[location.toLowerCase()] || '1'; // Worldwide
}

function getNewsApiCountryCode(location: string): string {
  const countryMap: Record<string, string> = {
    'kenya': 'ke',
    'united states': 'us',
    'nairobi': 'ke',
    'new york': 'us',
    'london': 'gb'
  };
  return countryMap[location.toLowerCase()] || 'us';
}

function getRelevantSubreddits(businessType: string): string[] {
  const subredditMap: Record<string, string[]> = {
    'financial technology software': ['fintech', 'personalfinance', 'investing', 'entrepreneur'],
    'restaurant': ['food', 'recipes', 'restaurantowners', 'smallbusiness'],
    'fitness': ['fitness', 'bodybuilding', 'nutrition', 'personaltrainer'],
    'technology': ['technology', 'programming', 'startups', 'artificial']
  };
  return subredditMap[businessType.toLowerCase()] || ['business', 'entrepreneur'];
}

/**
 * Fallback functions when APIs are not available
 */
function getGoogleTrendsFallback(location: string, category?: string) {
  return [
    {
      topic: `Local business trends in ${location}`,
      source: 'fallback',
      relevanceScore: 7,
      category: category || 'business',
      timeframe: 'week',
      engagement_potential: 'medium'
    }
  ];
}

function getTwitterTrendsFallback(location: string, businessType?: string) {
  return [
    {
      topic: '#MondayMotivation',
      source: 'fallback',
      relevanceScore: 6,
      category: 'social',
      timeframe: 'today',
      engagement_potential: 'medium'
    }
  ];
}

function getNewsFallback(location: string, businessType: string, category?: string) {
  return [
    {
      topic: `${businessType} industry updates`,
      source: 'fallback',
      relevanceScore: 6,
      category: 'news',
      timeframe: 'today',
      engagement_potential: 'medium'
    }
  ];
}

function getRedditTrendsFallback(businessType: string, platform: string) {
  return [
    {
      topic: `${businessType} community discussions`,
      source: 'fallback',
      relevanceScore: 5,
      category: 'community',
      timeframe: 'today',
      engagement_potential: 'medium'
    }
  ];
}

/**
 * Fetch comprehensive local context (weather + events)
 */
export async function fetchLocalContext(
  location: string,
  businessType: string
): Promise<LocalContext> {
  const context: LocalContext = {};

  try {
    // Fetch weather context
    if (TRENDING_CONFIG.sources.openWeatherApi.enabled) {
      console.log(`🌤️ Fetching weather context for ${location}...`);

      const params = new URLSearchParams({
        q: location,
        appid: TRENDING_CONFIG.sources.openWeatherApi.apiKey!,
        units: 'metric'
      });

      const response = await fetch(
        `${TRENDING_CONFIG.sources.openWeatherApi.baseUrl}/weather?${params}`
      );

      if (response.ok) {
        const weatherData = await response.json();
        context.weather = {
          temperature: Math.round(weatherData.main.temp),
          condition: weatherData.weather[0].main,
          business_impact: generateBusinessWeatherImpact(weatherData.weather[0].main, weatherData.main.temp, businessType),
          content_opportunities: generateWeatherContentOpportunities(weatherData.weather[0].main, weatherData.main.temp, businessType)
        };
        console.log(`✅ Weather: ${context.weather.temperature}°C, ${context.weather.condition}`);
      }
    }

    // Fetch events context
    if (TRENDING_CONFIG.sources.eventbriteApi.enabled) {
      console.log(`🎪 Fetching events context for ${location}...`);

      const params = new URLSearchParams({
        'location.address': location,
        'location.within': '25km',
        'start_date.range_start': new Date().toISOString(),
        'start_date.range_end': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        'sort_by': 'relevance',
        'page_size': '10'
      });

      const response = await fetch(
        `${TRENDING_CONFIG.sources.eventbriteApi.baseUrl}/events/search/?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${TRENDING_CONFIG.sources.eventbriteApi.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const eventsData = await response.json();
        context.events = (eventsData.events || []).slice(0, 5).map((event: any) => ({
          name: event.name?.text || 'Event',
          category: event.category?.name || 'General',
          relevance_score: calculateEventRelevance(event, businessType),
          start_date: event.start?.local || event.start?.utc
        }));
        console.log(`✅ Found ${context.events.length} relevant events`);
      }
    }

  } catch (error) {
    console.error('Error fetching local context:', error);
  }

  return context;
}

// Helper functions for weather and events
function generateBusinessWeatherImpact(condition: string, temperature: number, businessType: string): string {
  const businessImpacts: Record<string, Record<string, string>> = {
    'restaurant': {
      'sunny': 'Perfect weather for outdoor dining and patio service',
      'rain': 'Great opportunity to promote cozy indoor dining experience',
      'hot': 'Ideal time to highlight refreshing drinks and cool dishes',
      'cold': 'Perfect weather for warm comfort food and hot beverages'
    },
    'fitness': {
      'sunny': 'Excellent conditions for outdoor workouts and activities',
      'rain': 'Great time to promote indoor fitness programs',
      'hot': 'Important to emphasize hydration and cooling strategies',
      'cold': 'Perfect for promoting warm-up routines and indoor training'
    },
    'financial technology software': {
      'sunny': 'Great weather for outdoor meetings and client visits',
      'rain': 'Perfect time for indoor productivity and digital solutions',
      'hot': 'Ideal for promoting mobile solutions and remote services',
      'cold': 'Good time for cozy indoor planning and financial reviews'
    }
  };

  const businessKey = businessType.toLowerCase();
  const impacts = businessImpacts[businessKey] || businessImpacts['restaurant'];

  if (temperature > 25) return impacts['hot'] || 'Weather creates opportunities for seasonal promotions';
  if (temperature < 10) return impacts['cold'] || 'Weather creates opportunities for comfort-focused messaging';

  return impacts[condition.toLowerCase()] || impacts['sunny'] || 'Current weather conditions are favorable for business';
}

function generateWeatherContentOpportunities(condition: string, temperature: number, businessType: string): string[] {
  const opportunities: string[] = [];

  // Temperature-based opportunities
  if (temperature > 25) {
    opportunities.push('Hot weather content angle', 'Summer promotion opportunity', 'Cooling solutions messaging');
  } else if (temperature < 10) {
    opportunities.push('Cold weather content angle', 'Winter comfort messaging', 'Warm-up solutions');
  }

  // Condition-based opportunities
  switch (condition.toLowerCase()) {
    case 'rain':
      opportunities.push('Rainy day indoor activities', 'Weather protection messaging', 'Cozy atmosphere content');
      break;
    case 'sunny':
    case 'clear':
      opportunities.push('Beautiful weather celebration', 'Outdoor activity promotion', 'Sunshine positivity');
      break;
    case 'clouds':
      opportunities.push('Perfect weather for activities', 'Comfortable conditions messaging');
      break;
  }

  return opportunities;
}

function calculateEventRelevance(event: any, businessType: string): number {
  let score = 5; // Base score

  const eventName = (event.name?.text || '').toLowerCase();
  const eventCategory = (event.category?.name || '').toLowerCase();

  // Business type relevance
  const businessKeywords = getBusinessKeywords(businessType);
  for (const keyword of businessKeywords) {
    if (eventName.includes(keyword) || eventCategory.includes(keyword)) {
      score += 2;
    }
  }

  // Event category bonus
  if (eventCategory.includes('business') || eventCategory.includes('networking')) {
    score += 1;
  }

  return Math.min(10, score);
}

function getBusinessKeywords(businessType: string): string[] {
  const keywordMap: Record<string, string[]> = {
    'financial technology software': ['fintech', 'finance', 'banking', 'payment', 'blockchain', 'startup', 'tech'],
    'restaurant': ['food', 'culinary', 'cooking', 'dining', 'chef', 'restaurant'],
    'fitness': ['fitness', 'health', 'wellness', 'gym', 'workout', 'nutrition'],
    'technology': ['tech', 'software', 'programming', 'ai', 'digital', 'innovation']
  };

  return keywordMap[businessType.toLowerCase()] || ['business', 'networking', 'professional'];
}
