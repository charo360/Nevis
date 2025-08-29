/**
 * Trending Topics and Market Intelligence System
 *
 * This module provides real-time trending topics, competitor analysis,
 * and market intelligence for content optimization.
 */

import {
  fetchGoogleTrends,
  fetchTwitterTrends,
  fetchCurrentNews,
  fetchRedditTrends
} from './real-time-trends-integration';

export interface TrendingTopic {
  topic: string;
  relevanceScore: number; // 1-10
  platform: string;
  category: 'news' | 'entertainment' | 'business' | 'technology' | 'lifestyle' | 'local';
  timeframe: 'now' | 'today' | 'week' | 'month';
  engagement_potential: 'high' | 'medium' | 'low';
}

export interface CompetitorInsight {
  competitor_name: string;
  content_gap: string;
  differentiation_opportunity: string;
  successful_strategy: string;
  avoid_strategy: string;
}

export interface CulturalContext {
  location: string;
  cultural_nuances: string[];
  local_customs: string[];
  language_preferences: string[];
  seasonal_relevance: string[];
  local_events: string[];
}

export interface MarketIntelligence {
  trending_topics: TrendingTopic[];
  competitor_insights: CompetitorInsight[];
  cultural_context: CulturalContext;
  viral_content_patterns: string[];
  engagement_triggers: string[];
}

/**
 * Generates real-time trending topics with fallback to static data
 */
export async function generateRealTimeTrendingTopics(
  businessType: string,
  location: string,
  platform: string = 'general'
): Promise<TrendingTopic[]> {
  try {
    console.log(`🔍 Fetching real-time trends for ${businessType} in ${location}...`);
    console.log(`📱 Platform: ${platform}`);

    // Fetch from working real-time sources (temporarily disable failing APIs)
    console.log('🌐 Starting RSS feeds fetch...');
    const [googleTrends, redditTrends] = await Promise.allSettled([
      fetchGoogleTrends(location, businessType),
      fetchRedditTrends(businessType, platform)
    ]);

    console.log(`📊 Google Trends status: ${googleTrends.status}`);
    console.log(`📊 Reddit Trends status: ${redditTrends.status}`);

    // Temporarily disable failing APIs until we fix them
    const twitterTrends = { status: 'rejected' as const, reason: 'Temporarily disabled' };
    const currentNews = { status: 'rejected' as const, reason: 'Temporarily disabled' };

    const allTrends: TrendingTopic[] = [];

    // Process Google Trends
    if (googleTrends.status === 'fulfilled') {
      console.log(`✅ Google Trends: ${googleTrends.value.length} trends received`);
      allTrends.push(...googleTrends.value.map(trend => ({
        topic: trend.topic,
        relevanceScore: trend.relevanceScore,
        platform: platform,
        category: trend.category as any,
        timeframe: trend.timeframe as any,
        engagement_potential: trend.engagement_potential as any
      })));
    }

    // Process Twitter Trends
    if (twitterTrends.status === 'fulfilled') {
      allTrends.push(...twitterTrends.value.map(trend => ({
        topic: trend.topic,
        relevanceScore: trend.relevanceScore,
        platform: platform,
        category: trend.category as any,
        timeframe: trend.timeframe as any,
        engagement_potential: trend.engagement_potential as any
      })));
    }

    // Process News
    if (currentNews.status === 'fulfilled') {
      allTrends.push(...currentNews.value.map(news => ({
        topic: news.topic,
        relevanceScore: news.relevanceScore,
        platform: platform,
        category: news.category as any,
        timeframe: news.timeframe as any,
        engagement_potential: news.engagement_potential as any
      })));
    } else {
      console.warn(`⚠️ Google Trends failed:`, googleTrends.reason);
    }

    // Process Reddit Trends
    if (redditTrends.status === 'fulfilled') {
      console.log(`✅ Reddit Trends: ${redditTrends.value.length} trends received`);
      allTrends.push(...redditTrends.value.map(trend => ({
        topic: trend.topic,
        relevanceScore: trend.relevanceScore,
        platform: platform,
        category: trend.category as any,
        timeframe: trend.timeframe as any,
        engagement_potential: trend.engagement_potential as any
      })));
    } else {
      console.warn(`⚠️ Reddit Trends failed:`, redditTrends.reason);
    }

    // If we have real-time trends, use them
    if (allTrends.length > 0) {
      console.log(`✅ Found ${allTrends.length} real-time trends`);
      return allTrends
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 10);
    }

    // Fallback to static trends
    console.log('⚠️ No real-time trends available, using static fallback');
    return generateStaticTrendingTopics(businessType, location, platform);

  } catch (error) {
    console.error('Error fetching real-time trends:', error);
    return generateStaticTrendingTopics(businessType, location, platform);
  }
}

/**
 * Generates static trending topics (original function, now renamed)
 */
export function generateStaticTrendingTopics(
  businessType: string,
  location: string,
  platform: string = 'general'
): TrendingTopic[] {

  const businessTrends: Record<string, TrendingTopic[]> = {
    'restaurant': [
      {
        topic: 'Sustainable dining trends',
        relevanceScore: 9,
        platform: 'instagram',
        category: 'lifestyle',
        timeframe: 'now',
        engagement_potential: 'high'
      },
      {
        topic: 'Local food festivals',
        relevanceScore: 8,
        platform: 'facebook',
        category: 'local',
        timeframe: 'week',
        engagement_potential: 'high'
      },
      {
        topic: 'Plant-based menu innovations',
        relevanceScore: 7,
        platform: 'linkedin',
        category: 'business',
        timeframe: 'month',
        engagement_potential: 'medium'
      }
    ],
    'fitness': [
      {
        topic: 'New Year fitness resolutions',
        relevanceScore: 9,
        platform: 'instagram',
        category: 'lifestyle',
        timeframe: 'now',
        engagement_potential: 'high'
      },
      {
        topic: 'Mental health and exercise',
        relevanceScore: 8,
        platform: 'linkedin',
        category: 'lifestyle',
        timeframe: 'today',
        engagement_potential: 'high'
      },
      {
        topic: 'Home workout equipment trends',
        relevanceScore: 7,
        platform: 'facebook',
        category: 'lifestyle',
        timeframe: 'week',
        engagement_potential: 'medium'
      }
    ],
    'technology': [
      {
        topic: 'AI in business automation',
        relevanceScore: 10,
        platform: 'linkedin',
        category: 'technology',
        timeframe: 'now',
        engagement_potential: 'high'
      },
      {
        topic: 'Cybersecurity awareness',
        relevanceScore: 9,
        platform: 'twitter',
        category: 'technology',
        timeframe: 'today',
        engagement_potential: 'high'
      },
      {
        topic: 'Remote work productivity tools',
        relevanceScore: 8,
        platform: 'linkedin',
        category: 'business',
        timeframe: 'week',
        engagement_potential: 'medium'
      }
    ],
    'beauty': [
      {
        topic: 'Clean beauty movement',
        relevanceScore: 9,
        platform: 'instagram',
        category: 'lifestyle',
        timeframe: 'now',
        engagement_potential: 'high'
      },
      {
        topic: 'Skincare for different seasons',
        relevanceScore: 8,
        platform: 'instagram',
        category: 'lifestyle',
        timeframe: 'today',
        engagement_potential: 'high'
      },
      {
        topic: 'Sustainable beauty packaging',
        relevanceScore: 7,
        platform: 'facebook',
        category: 'lifestyle',
        timeframe: 'week',
        engagement_potential: 'medium'
      }
    ],
    'financial technology software': [
      {
        topic: 'Digital banking adoption in Africa',
        relevanceScore: 10,
        platform: 'linkedin',
        category: 'technology',
        timeframe: 'now',
        engagement_potential: 'high'
      },
      {
        topic: 'Financial inclusion initiatives',
        relevanceScore: 9,
        platform: 'twitter',
        category: 'business',
        timeframe: 'today',
        engagement_potential: 'high'
      },
      {
        topic: 'Mobile payment security',
        relevanceScore: 8,
        platform: 'linkedin',
        category: 'technology',
        timeframe: 'week',
        engagement_potential: 'medium'
      }
    ]
  };

  // Get base trends for business type
  const baseTrends = businessTrends[businessType.toLowerCase()] || businessTrends['technology'];

  // Add location-specific trends
  const locationTrends = generateLocationTrends(location);

  // Combine and filter by platform
  const allTrends = [...baseTrends, ...locationTrends];

  return allTrends
    .filter(trend => trend.platform === platform || trend.platform === 'general')
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);
}

/**
 * Generates location-specific trending topics
 */
function generateLocationTrends(location: string): TrendingTopic[] {
  const locationMap: Record<string, TrendingTopic[]> = {
    'nairobi': [
      {
        topic: 'Nairobi tech hub growth',
        relevanceScore: 8,
        platform: 'linkedin',
        category: 'business',
        timeframe: 'week',
        engagement_potential: 'high'
      },
      {
        topic: 'Kenyan startup ecosystem',
        relevanceScore: 7,
        platform: 'twitter',
        category: 'business',
        timeframe: 'today',
        engagement_potential: 'medium'
      }
    ],
    'new york': [
      {
        topic: 'NYC small business support',
        relevanceScore: 8,
        platform: 'facebook',
        category: 'local',
        timeframe: 'week',
        engagement_potential: 'high'
      }
    ],
    'london': [
      {
        topic: 'London fintech innovation',
        relevanceScore: 8,
        platform: 'linkedin',
        category: 'business',
        timeframe: 'week',
        engagement_potential: 'high'
      }
    ]
  };

  const locationKey = location.toLowerCase().split(',')[0].trim();
  return locationMap[locationKey] || [];
}

/**
 * Generates competitor analysis insights
 */
export function generateCompetitorInsights(
  businessType: string,
  location: string,
  services?: string
): CompetitorInsight[] {

  const competitorStrategies: Record<string, CompetitorInsight[]> = {
    'financial technology software': [
      {
        competitor_name: 'Traditional Banks',
        content_gap: 'Lack of educational content about digital banking benefits',
        differentiation_opportunity: 'Focus on simplicity and accessibility for everyday users',
        successful_strategy: 'Trust-building through security messaging',
        avoid_strategy: 'Overly technical jargon that confuses users'
      },
      {
        competitor_name: 'Other Fintech Apps',
        content_gap: 'Limited focus on local market needs and culture',
        differentiation_opportunity: 'Emphasize local partnerships and community impact',
        successful_strategy: 'User testimonials and success stories',
        avoid_strategy: 'Generic global messaging without local relevance'
      }
    ],
    'restaurant': [
      {
        competitor_name: 'Chain Restaurants',
        content_gap: 'Lack of personal connection and local community focus',
        differentiation_opportunity: 'Highlight local sourcing, chef personality, and community involvement',
        successful_strategy: 'Behind-the-scenes content and food preparation videos',
        avoid_strategy: 'Generic food photos without story or context'
      }
    ],
    'fitness': [
      {
        competitor_name: 'Large Gym Chains',
        content_gap: 'Impersonal approach and lack of individual attention',
        differentiation_opportunity: 'Focus on personal transformation stories and community support',
        successful_strategy: 'Client success stories and progress tracking',
        avoid_strategy: 'Intimidating fitness content that discourages beginners'
      }
    ]
  };

  return competitorStrategies[businessType.toLowerCase()] || [
    {
      competitor_name: 'Industry Leaders',
      content_gap: 'Generic messaging without personal touch',
      differentiation_opportunity: 'Focus on authentic storytelling and customer relationships',
      successful_strategy: 'Educational content that provides real value',
      avoid_strategy: 'Overly promotional content without substance'
    }
  ];
}

/**
 * Generates cultural context for location-specific content
 */
export function generateCulturalContext(location: string): CulturalContext {
  const culturalMap: Record<string, CulturalContext> = {
    'nairobi, kenya': {
      location: 'Nairobi, Kenya',
      cultural_nuances: [
        'Ubuntu philosophy - community and interconnectedness',
        'Respect for elders and traditional values',
        'Entrepreneurial spirit and innovation mindset',
        'Multilingual communication (English, Swahili, local languages)'
      ],
      local_customs: [
        'Harambee - community cooperation and fundraising',
        'Greeting customs and respect protocols',
        'Religious diversity and tolerance',
        'Family-centered decision making'
      ],
      language_preferences: [
        'Mix of English and Swahili phrases',
        'Respectful and formal tone in business contexts',
        'Storytelling and proverb usage',
        'Community-focused language'
      ],
      seasonal_relevance: [
        'Rainy seasons (March-May, October-December)',
        'School calendar considerations',
        'Agricultural seasons and harvest times',
        'Holiday seasons and celebrations'
      ],
      local_events: [
        'Nairobi Innovation Week',
        'Kenya Music Festival',
        'Nairobi Restaurant Week',
        'Local cultural festivals'
      ]
    }
  };

  const locationKey = location.toLowerCase();
  return culturalMap[locationKey] || {
    location: location,
    cultural_nuances: ['Local community values', 'Regional business customs'],
    local_customs: ['Local traditions', 'Community practices'],
    language_preferences: ['Local language nuances', 'Regional communication styles'],
    seasonal_relevance: ['Local seasons', 'Regional events'],
    local_events: ['Local festivals', 'Community gatherings']
  };
}

/**
 * Generates complete market intelligence
 */
export function generateMarketIntelligence(
  businessType: string,
  location: string,
  platform: string,
  services?: string
): MarketIntelligence {
  return {
    trending_topics: generateStaticTrendingTopics(businessType, location, platform),
    competitor_insights: generateCompetitorInsights(businessType, location, services),
    cultural_context: generateCulturalContext(location),
    viral_content_patterns: [
      'Behind-the-scenes authentic moments',
      'User-generated content and testimonials',
      'Educational content that solves problems',
      'Emotional storytelling with clear outcomes',
      'Interactive content that encourages participation'
    ],
    engagement_triggers: [
      'Ask questions that require personal responses',
      'Share relatable struggles and solutions',
      'Use local references and cultural touchpoints',
      'Create content that people want to share with friends',
      'Provide exclusive insights or early access'
    ]
  };
}
