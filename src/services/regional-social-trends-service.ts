// src/services/regional-social-trends-service.ts
/**
 * Regional Social Trends Service
 * Gets real social media trends through legal alternative sources
 */

interface RegionalSocialData {
  location: string;
  trendingHashtags: string[];
  currentEvents: string[];
  culturalMoments: string[];
  localLanguageTerms: string[];
  socialBuzz: string[];
  businessTrends: string[];
}

interface SocialTrendSource {
  name: string;
  url: string;
  type: 'rss' | 'api' | 'scraper';
  region: string;
  dataType: 'hashtags' | 'trends' | 'news' | 'social';
}

/**
 * Alternative Social Media Data Sources (Legal & Effective)
 */
export class RegionalSocialTrendsService {
  
  // Legal alternative sources for social media trends
  private static REGIONAL_SOURCES: Record<string, SocialTrendSource[]> = {
    'kenya': [
      {
        name: 'Nation Kenya RSS',
        url: 'https://www.nation.co.ke/kenya/rss',
        type: 'rss',
        region: 'kenya',
        dataType: 'news'
      },
      {
        name: 'Capital FM Kenya RSS',
        url: 'https://www.capitalfm.co.ke/news/feed/',
        type: 'rss',
        region: 'kenya',
        dataType: 'trends'
      },
      {
        name: 'Reddit Kenya',
        url: 'https://www.reddit.com/r/Kenya/.rss',
        type: 'rss',
        region: 'kenya',
        dataType: 'social'
      }
    ],
    'nigeria': [
      {
        name: 'Punch Nigeria RSS',
        url: 'https://punchng.com/feed/',
        type: 'rss',
        region: 'nigeria',
        dataType: 'news'
      },
      {
        name: 'Premium Times RSS',
        url: 'https://www.premiumtimesng.com/feed',
        type: 'rss',
        region: 'nigeria',
        dataType: 'trends'
      },
      {
        name: 'Reddit Nigeria',
        url: 'https://www.reddit.com/r/Nigeria/.rss',
        type: 'rss',
        region: 'nigeria',
        dataType: 'social'
      }
    ],
    'south africa': [
      {
        name: 'News24 RSS',
        url: 'https://www.news24.com/feeds/rss/News24/News24/SouthAfrica',
        type: 'rss',
        region: 'south africa',
        dataType: 'news'
      },
      {
        name: 'Reddit South Africa',
        url: 'https://www.reddit.com/r/southafrica/.rss',
        type: 'rss',
        region: 'south africa',
        dataType: 'social'
      }
    ],
    'usa': [
      {
        name: 'Google Trends US RSS',
        url: 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US',
        type: 'rss',
        region: 'usa',
        dataType: 'trends'
      },
      {
        name: 'Reddit USA',
        url: 'https://www.reddit.com/r/usa/.rss',
        type: 'rss',
        region: 'usa',
        dataType: 'social'
      },
      {
        name: 'TechCrunch RSS',
        url: 'https://feeds.feedburner.com/TechCrunch',
        type: 'rss',
        region: 'usa',
        dataType: 'trends'
      },
      {
        name: 'Reuters US RSS',
        url: 'https://feeds.reuters.com/reuters/domesticNews',
        type: 'rss',
        region: 'usa',
        dataType: 'news'
      }
    ],
    'canada': [
      {
        name: 'CBC Canada RSS',
        url: 'https://www.cbc.ca/cmlink/rss-canada',
        type: 'rss',
        region: 'canada',
        dataType: 'news'
      },
      {
        name: 'Google Trends Canada RSS',
        url: 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=CA',
        type: 'rss',
        region: 'canada',
        dataType: 'trends'
      },
      {
        name: 'Reddit Canada',
        url: 'https://www.reddit.com/r/canada/.rss',
        type: 'rss',
        region: 'canada',
        dataType: 'social'
      },
      {
        name: 'Global News Canada RSS',
        url: 'https://globalnews.ca/feed/',
        type: 'rss',
        region: 'canada',
        dataType: 'news'
      }
    ],
    'india': [
      {
        name: 'Times of India RSS',
        url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
        type: 'rss',
        region: 'india',
        dataType: 'news'
      },
      {
        name: 'Economic Times RSS',
        url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms',
        type: 'rss',
        region: 'india',
        dataType: 'trends'
      },
      {
        name: 'Google Trends India RSS',
        url: 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=IN',
        type: 'rss',
        region: 'india',
        dataType: 'trends'
      },
      {
        name: 'Reddit India',
        url: 'https://www.reddit.com/r/india/.rss',
        type: 'rss',
        region: 'india',
        dataType: 'social'
      },
      {
        name: 'Tech in Asia India RSS',
        url: 'https://www.techinasia.com/feed',
        type: 'rss',
        region: 'india',
        dataType: 'trends'
      }
    ],
    'ghana': [
      {
        name: 'GhanaWeb RSS',
        url: 'https://www.ghanaweb.com/GhanaHomePage/rss/news.xml',
        type: 'rss',
        region: 'ghana',
        dataType: 'news'
      },
      {
        name: 'Graphic Online RSS',
        url: 'https://www.graphic.com.gh/rss/news.xml',
        type: 'rss',
        region: 'ghana',
        dataType: 'news'
      },
      {
        name: 'MyJoyOnline RSS',
        url: 'https://www.myjoyonline.com/feed/',
        type: 'rss',
        region: 'ghana',
        dataType: 'trends'
      },
      {
        name: 'Reddit Ghana',
        url: 'https://www.reddit.com/r/ghana/.rss',
        type: 'rss',
        region: 'ghana',
        dataType: 'social'
      }
    ]
  };

  /**
   * Get real-time regional social trends (better than Instagram/Twitter RSS)
   */
  static async getRegionalTrends(
    location: string,
    businessType: string
  ): Promise<RegionalSocialData> {
    const country = this.extractCountry(location);
    const sources = this.REGIONAL_SOURCES[country] || this.REGIONAL_SOURCES['usa'];
    
    try {
      // Fetch from multiple regional sources in parallel
      const trendPromises = sources.map(source => this.fetchSourceData(source, businessType));
      const results = await Promise.all(trendPromises);
      
      // Combine and deduplicate data
      const combinedData = this.combineRegionalData(results, location);
      
      console.log(`📍 Got regional trends for ${location}:`, {
        hashtags: combinedData.trendingHashtags.length,
        events: combinedData.currentEvents.length,
        cultural: combinedData.culturalMoments.length
      });
      
      return combinedData;
      
    } catch (error) {
      console.warn('Regional trends fetch failed:', error);
      return this.getFallbackRegionalData(location, businessType);
    }
  }

  /**
   * Fetch data from individual source
   */
  private static async fetchSourceData(
    source: SocialTrendSource,
    businessType: string
  ): Promise<Partial<RegionalSocialData>> {
    try {
      if (source.type === 'rss') {
        return await this.fetchRSSSourceData(source, businessType);
      }
      
      return {};
    } catch (error) {
      console.warn(`Failed to fetch from ${source.name}:`, error);
      return {};
    }
  }

  /**
   * Fetch RSS source data
   */
  private static async fetchRSSSourceData(
    source: SocialTrendSource,
    businessType: string
  ): Promise<Partial<RegionalSocialData>> {
    try {
      // Use your existing RSS system
      const response = await fetch(`/api/rss-data?customUrl=${encodeURIComponent(source.url)}&limit=30`);
      if (!response.ok) return {};
      
      const rssData = await response.json();
      
      const result: Partial<RegionalSocialData> = {};
      
      // Extract hashtags from RSS content
      if (rssData.hashtags) {
        result.trendingHashtags = rssData.hashtags
          .filter((tag: string) => this.isRegionallyRelevant(tag, source.region))
          .slice(0, 10);
      }
      
      // Extract current events
      if (rssData.keywords) {
        result.currentEvents = rssData.keywords
          .filter((keyword: string) => this.isCurrentEvent(keyword, source.region))
          .slice(0, 5);
      }
      
      // Extract business trends
      if (rssData.articles) {
        result.businessTrends = rssData.articles
          .filter((article: any) => this.isBusinessRelevant(article.title, businessType))
          .map((article: any) => article.title)
          .slice(0, 3);
      }
      
      // Extract social buzz from Reddit-like sources
      if (source.dataType === 'social' && rssData.keywords) {
        result.socialBuzz = rssData.keywords
          .filter((keyword: string) => this.isSocialBuzz(keyword))
          .slice(0, 5);
      }
      
      return result;
      
    } catch (error) {
      console.warn(`RSS fetch failed for ${source.name}:`, error);
      return {};
    }
  }

  /**
   * Alternative Instagram/Twitter Data Sources (Legal Methods)
   */
  static async getInstagramTwitterAlternatives(businessType: string, location: string): Promise<string[]> {
    const alternatives = await Promise.all([
      this.getGoogleTrendsData(location, businessType),
      this.getRedditTrendingData(businessType),
      this.getNewsBasedSocialTrends(location, businessType),
      this.getInfluencerPlatformData(businessType)
    ]);
    
    return alternatives.flat().slice(0, 15);
  }

  /**
   * Google Trends RSS (Legal Instagram/Twitter alternative)
   */
  private static async getGoogleTrendsData(location: string, businessType: string): Promise<string[]> {
    try {
      const countryCode = this.getCountryCode(location);
      const trendsUrl = `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${countryCode}`;
      
      const response = await fetch(`/api/rss-data?customUrl=${encodeURIComponent(trendsUrl)}&limit=20`);
      if (!response.ok) return [];
      
      const trendsData = await response.json();
      
      return trendsData.keywords
        ?.filter((keyword: string) => this.isBusinessRelevantKeyword(keyword, businessType))
        ?.map((keyword: string) => `#${keyword.toLowerCase().replace(/\s+/g, '')}`)
        ?.slice(0, 8) || [];
        
    } catch (error) {
      console.warn('Google Trends fetch failed:', error);
      return [];
    }
  }

  /**
   * Reddit trending data (Great social media alternative)
   */
  private static async getRedditTrendingData(businessType: string): Promise<string[]> {
    try {
      const businessSubreddits: Record<string, string[]> = {
        'restaurant': ['r/food', 'r/FoodPorn', 'r/recipes', 'r/foodtrucks'],
        'fitness': ['r/fitness', 'r/bodybuilding', 'r/loseit', 'r/nutrition'],
        'technology': ['r/technology', 'r/programming', 'r/startups', 'r/entrepreneur'],
        'healthcare': ['r/health', 'r/medicine', 'r/nutrition', 'r/wellness'],
        'retail': ['r/fashion', 'r/deals', 'r/shopping', 'r/smallbusiness']
      };

      const subreddits = businessSubreddits[businessType] || ['r/popular'];
      const trendPromises = subreddits.slice(0, 2).map(subreddit =>
        fetch(`/api/rss-data?customUrl=${encodeURIComponent(`https://www.reddit.com/${subreddit}/.rss`)}&limit=15`)
      );

      const responses = await Promise.all(trendPromises);
      const allData = await Promise.all(
        responses.map(r => r.ok ? r.json() : null)
      );

      const combinedHashtags = allData
        .filter(data => data && data.keywords)
        .flatMap(data => data.keywords)
        .filter((keyword: string) => this.isBusinessRelevantKeyword(keyword, businessType))
        .map((keyword: string) => `#${keyword.toLowerCase().replace(/\s+/g, '')}`)
        .slice(0, 10);

      return combinedHashtags;
      
    } catch (error) {
      console.warn('Reddit trends fetch failed:', error);
      return [];
    }
  }

  /**
   * News-based social trends (What people are talking about)
   */
  private static async getNewsBasedSocialTrends(location: string, businessType: string): Promise<string[]> {
    try {
      const regionalData = await this.getRegionalTrends(location, businessType);
      
      // Convert current events to hashtags
      const eventHashtags = regionalData.currentEvents
        .map(event => `#${event.toLowerCase().replace(/\s+/g, '')}`)
        .slice(0, 5);
        
      return eventHashtags;
      
    } catch (error) {
      return [];
    }
  }

  /**
   * Influencer platform data (Public hashtag research)
   */
  private static async getInfluencerPlatformData(businessType: string): Promise<string[]> {
    // This could integrate with influencer marketing platforms that publish trending hashtags
    // For now, return business-specific trending patterns
    
    const influencerTrends: Record<string, string[]> = {
      'restaurant': ['#foodstagram', '#eatlocal', '#cheflife', '#foodblogger', '#tastethis'],
      'fitness': ['#fitspo', '#gymlife', '#workoutmotivation', '#fitnessjourney', '#healthyeating'],
      'technology': ['#techlife', '#innovation', '#futuretech', '#digitaltrends', '#airevolution'],
      'healthcare': ['#healthtech', '#wellness', '#preventivecare', '#healthylife', '#medicalcare'],
      'retail': ['#shoplocal', '#sustainablefashion', '#qualityover quantity', '#ethicalbrand', '#madetoorder']
    };
    
    return influencerTrends[businessType] || ['#quality', '#service', '#local', '#community', '#excellence'];
  }

  /**
   * Helper methods
   */
  private static extractCountry(location: string): string {
    const locationLower = location.toLowerCase();
    if (locationLower.includes('kenya') || locationLower.includes('nairobi')) return 'kenya';
    if (locationLower.includes('nigeria') || locationLower.includes('lagos') || locationLower.includes('abuja')) return 'nigeria';
    if (locationLower.includes('south africa') || locationLower.includes('cape town') || locationLower.includes('johannesburg')) return 'south africa';
    if (locationLower.includes('ghana') || locationLower.includes('accra') || locationLower.includes('kumasi')) return 'ghana';
    if (locationLower.includes('usa') || locationLower.includes('united states') || locationLower.includes('america')) return 'usa';
    if (locationLower.includes('canada') || locationLower.includes('toronto') || locationLower.includes('vancouver') || locationLower.includes('montreal')) return 'canada';
    if (locationLower.includes('india') || locationLower.includes('mumbai') || locationLower.includes('delhi') || locationLower.includes('bangalore')) return 'india';
    if (locationLower.includes('uk') || locationLower.includes('united kingdom') || locationLower.includes('london')) return 'uk';
    return 'global';
  }

  private static getCountryCode(location: string): string {
    const country = this.extractCountry(location);
    const codes: Record<string, string> = {
      'kenya': 'KE',
      'nigeria': 'NG', 
      'south africa': 'ZA',
      'ghana': 'GH',
      'usa': 'US',
      'canada': 'CA',
      'india': 'IN',
      'uk': 'GB'
    };
    return codes[country] || 'US';
  }

  private static combineRegionalData(
    results: Partial<RegionalSocialData>[],
    location: string
  ): RegionalSocialData {
    const combined: RegionalSocialData = {
      location,
      trendingHashtags: [],
      currentEvents: [],
      culturalMoments: [],
      localLanguageTerms: [],
      socialBuzz: [],
      businessTrends: []
    };

    results.forEach(result => {
      if (result.trendingHashtags) combined.trendingHashtags.push(...result.trendingHashtags);
      if (result.currentEvents) combined.currentEvents.push(...result.currentEvents);
      if (result.culturalMoments) combined.culturalMoments.push(...result.culturalMoments);
      if (result.socialBuzz) combined.socialBuzz.push(...result.socialBuzz);
      if (result.businessTrends) combined.businessTrends.push(...result.businessTrends);
    });

    // Deduplicate and limit
    combined.trendingHashtags = [...new Set(combined.trendingHashtags)].slice(0, 15);
    combined.currentEvents = [...new Set(combined.currentEvents)].slice(0, 8);
    combined.culturalMoments = [...new Set(combined.culturalMoments)].slice(0, 5);
    combined.socialBuzz = [...new Set(combined.socialBuzz)].slice(0, 10);
    combined.businessTrends = [...new Set(combined.businessTrends)].slice(0, 6);

    return combined;
  }

  private static isRegionallyRelevant(hashtag: string, region: string): boolean {
    const regionalTerms: Record<string, string[]> = {
      'kenya': ['kenya', 'nairobi', 'east', 'african', 'harambee'],
      'nigeria': ['nigeria', 'naija', 'lagos', 'west', 'african'],
      'south africa': ['south', 'africa', 'cape', 'joburg', 'mzansi']
    };
    
    const terms = regionalTerms[region] || [];
    const hashtagLower = hashtag.toLowerCase();
    
    return terms.some(term => hashtagLower.includes(term));
  }

  private static isCurrentEvent(keyword: string, region: string): boolean {
    const eventIndicators = ['festival', 'event', 'celebration', 'conference', 'summit', 'launch', 'opening'];
    const keywordLower = keyword.toLowerCase();
    
    return eventIndicators.some(indicator => keywordLower.includes(indicator));
  }

  private static isBusinessRelevant(title: string, businessType: string): boolean {
    const businessKeywords: Record<string, string[]> = {
      'restaurant': ['food', 'restaurant', 'dining', 'chef', 'cuisine', 'eat'],
      'fitness': ['fitness', 'gym', 'workout', 'health', 'exercise', 'wellness'],
      'technology': ['tech', 'software', 'digital', 'innovation', 'startup', 'ai'],
      'healthcare': ['health', 'medical', 'clinic', 'hospital', 'care', 'wellness'],
      'retail': ['retail', 'shop', 'store', 'fashion', 'brand', 'business']
    };
    
    const keywords = businessKeywords[businessType] || [];
    const titleLower = title.toLowerCase();
    
    return keywords.some(keyword => titleLower.includes(keyword));
  }

  private static isSocialBuzz(keyword: string): boolean {
    const buzzIndicators = ['viral', 'trending', 'popular', 'hot', 'buzz', 'talking', 'discussing'];
    return buzzIndicators.some(indicator => keyword.toLowerCase().includes(indicator));
  }

  private static isBusinessRelevantKeyword(keyword: string, businessType: string): boolean {
    return this.isBusinessRelevant(keyword, businessType);
  }

  private static getFallbackRegionalData(location: string, businessType: string): RegionalSocialData {
    const country = this.extractCountry(location);
    
    const fallbackData: Record<string, Partial<RegionalSocialData>> = {
      'kenya': {
        trendingHashtags: ['#Kenya', '#Nairobi', '#EastAfrica', '#Harambee', '#Innovation'],
        currentEvents: ['Kenya tech growth', 'Nairobi business summit'],
        culturalMoments: ['Harambee spirit', 'Community unity'],
        localLanguageTerms: ['Harambee', 'Jambo', 'Asante']
      },
      'nigeria': {
        trendingHashtags: ['#Nigeria', '#Naija', '#Lagos', '#WestAfrica', '#Innovation'],
        currentEvents: ['Nigeria tech boom', 'Lagos business growth'],
        culturalMoments: ['Naija spirit', 'Unity in diversity'],
        localLanguageTerms: ['Oya', 'Wahala', 'Sharp sharp']
      },
      'south africa': {
        trendingHashtags: ['#SouthAfrica', '#Mzansi', '#CapeTown', '#Innovation'],
        currentEvents: ['South Africa business growth', 'Cape Town innovation'],
        culturalMoments: ['Rainbow Nation spirit', 'Ubuntu philosophy'],
        localLanguageTerms: ['Sharp', 'Lekker', 'Howzit']
      },
      'ghana': {
        trendingHashtags: ['#Ghana', '#Accra', '#WestAfrica', '#GhanaBusiness', '#Innovation'],
        currentEvents: ['Ghana digital transformation', 'Accra business growth'],
        culturalMoments: ['Ghanaian hospitality', 'Unity and progress'],
        localLanguageTerms: ['Akwaaba', 'Medaase', 'Yɛn ara asɛm']
      },
      'usa': {
        trendingHashtags: ['#USA', '#America', '#Business', '#Innovation', '#Growth'],
        currentEvents: ['Tech innovation trends', 'Business growth strategies'],
        culturalMoments: ['American entrepreneurship', 'Innovation culture'],
        localLanguageTerms: ['Awesome', 'Let\'s go', 'Game changer']
      },
      'canada': {
        trendingHashtags: ['#Canada', '#Innovation', '#Business', '#CanadianBusiness', '#Growth'],
        currentEvents: ['Canadian business innovation', 'Tech sector growth'],
        culturalMoments: ['Canadian hospitality', 'Inclusive business culture'],
        localLanguageTerms: ['Eh', 'Sorry', 'Eh buddy', 'Beauty']
      },
      'india': {
        trendingHashtags: ['#India', '#Innovation', '#Business', '#DigitalIndia', '#Growth'],
        currentEvents: ['India digital revolution', 'Startup ecosystem growth'],
        culturalMoments: ['Namaste culture', 'Unity in diversity'],
        localLanguageTerms: ['Namaste', 'Dhanyawad', 'Accha', 'Jugaad']
      }
    };

    const regionData = fallbackData[country] || {};
    
    return {
      location,
      trendingHashtags: regionData.trendingHashtags || [`#${businessType}`, '#Quality'],
      currentEvents: regionData.currentEvents || [`${location} business growth`],
      culturalMoments: regionData.culturalMoments || ['Community focus'],
      localLanguageTerms: regionData.localLanguageTerms || [],
      socialBuzz: [`${businessType} trending`, 'Local business success'],
      businessTrends: [`${businessType} innovation`, `${location} business growth`]
    };
  }
}

/**
 * BETTER THAN INSTAGRAM/TWITTER RSS: Real Social Intelligence
 * 
 * Instead of trying to get Instagram/Twitter RSS (which is limited/restricted):
 * ✅ Google Trends RSS - What people are actually searching
 * ✅ Reddit RSS - What people are discussing  
 * ✅ Regional news RSS - Current local events
 * ✅ Local media RSS - Cultural moments and trends
 * ✅ Business news RSS - Industry-specific trends
 * 
 * This gives you BETTER data than social media RSS because:
 * - More comprehensive (search + discussion + news + culture)
 * - Less restricted (no API limits or approvals needed)
 * - More business-relevant (filtered for your industry)
 * - More regional intelligence (local news + cultural context)
 * - More actionable (real trends people care about vs random viral content)
 */
