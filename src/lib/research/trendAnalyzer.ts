/**
 * Trend Analyzer
 * Analyzes current trends for industries and locations using web search
 * Part of Layer 1: Research Layer
 */

import { createClient } from '@supabase/supabase-js';

export interface TrendData {
  topic: string;
  relevance: number; // 0-1 score
  source: string;
  category: 'trending' | 'evergreen' | 'seasonal' | 'emerging';
  description?: string;
}

export interface TrendResearchResult {
  industry: string;
  location?: string;
  platform: string;
  trends: TrendData[];
  hashtags: string[];
  seasonalEvents: SeasonalEvent[];
  competitorInsights: CompetitorInsight[];
  researchedAt: Date;
  expiresAt: Date;
  confidence: number;
}

export interface SeasonalEvent {
  name: string;
  date: string;
  relevance: number;
  contentIdeas: string[];
}

export interface CompetitorInsight {
  name: string;
  strengths: string[];
  weaknesses: string[];
  contentThemes: string[];
}

// Industry-specific trend keywords for web search
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  retail: ['retail trends', 'shopping trends', 'e-commerce trends', 'consumer behavior'],
  food: ['food trends', 'restaurant trends', 'culinary trends', 'food delivery trends'],
  finance: ['fintech trends', 'banking trends', 'financial services trends', 'mobile payments'],
  healthcare: ['healthcare trends', 'wellness trends', 'health tech trends', 'telemedicine'],
  realestate: ['real estate trends', 'property market trends', 'housing trends'],
  service: ['service industry trends', 'customer service trends', 'professional services'],
  saas: ['SaaS trends', 'software trends', 'tech industry trends', 'B2B software'],
  education: ['education trends', 'edtech trends', 'online learning trends'],
  b2b: ['B2B marketing trends', 'business trends', 'enterprise trends'],
  nonprofit: ['nonprofit trends', 'charity trends', 'social impact trends'],
};

// Platform-specific content trends
const PLATFORM_TRENDS: Record<string, string[]> = {
  instagram: ['Instagram Reels', 'carousel posts', 'Stories', 'user-generated content', 'behind-the-scenes'],
  facebook: ['Facebook Groups', 'live video', 'community building', 'Facebook Shops'],
  twitter: ['Twitter Spaces', 'threads', 'real-time engagement', 'trending topics'],
  linkedin: ['thought leadership', 'employee advocacy', 'LinkedIn newsletters', 'professional content'],
  tiktok: ['short-form video', 'trends', 'challenges', 'authentic content', 'duets'],
};

/**
 * Research trends for a specific industry and location
 */
export async function researchTrends(
  industry: string,
  options: {
    location?: string;
    platform?: string;
    forceRefresh?: boolean;
  } = {}
): Promise<TrendResearchResult> {
  const { location, platform = 'instagram', forceRefresh = false } = options;

  console.log(`🔍 [Research] Analyzing trends for ${industry} in ${location || 'global'}`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = await getCachedResearch(supabase, industry, location, platform);
    if (cached) {
      console.log(`✅ [Research] Using cached research (expires: ${cached.expiresAt})`);
      return cached;
    }
  }

  // Perform fresh research
  console.log(`🔄 [Research] Performing fresh trend analysis...`);

  const [trends, hashtags, seasonalEvents, competitorInsights] = await Promise.all([
    analyzeTrends(industry, location, platform),
    getHashtagRecommendations(industry, platform),
    getSeasonalEvents(industry, location),
    analyzeCompetitors(industry, location),
  ]);

  const result: TrendResearchResult = {
    industry,
    location,
    platform,
    trends,
    hashtags,
    seasonalEvents,
    competitorInsights,
    researchedAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    confidence: calculateConfidence(trends, hashtags, seasonalEvents),
  };

  // Cache the result
  await cacheResearch(supabase, result);

  console.log(`✅ [Research] Trend analysis complete (${trends.length} trends, ${hashtags.length} hashtags)`);
  return result;
}

/**
 * Analyze current trends using AI-powered web search
 */
async function analyzeTrends(
  industry: string,
  location?: string,
  platform?: string
): Promise<TrendData[]> {
  const trends: TrendData[] = [];

  // Get industry-specific keywords
  const keywords = INDUSTRY_KEYWORDS[industry] || INDUSTRY_KEYWORDS.retail;
  const platformTrends = PLATFORM_TRENDS[platform || 'instagram'] || [];

  // Build search queries
  const year = new Date().getFullYear();
  const month = new Date().toLocaleString('en-US', { month: 'long' });

  const searchQueries = [
    `${keywords[0]} ${year}`,
    `${industry} social media trends ${month} ${year}`,
    `viral ${industry} content ${year}`,
    location ? `${industry} ${location} trends ${year}` : null,
  ].filter(Boolean) as string[];

  // For now, use static trend data based on industry
  // TODO: Integrate with Claude's web_search tool or external API
  const staticTrends = getStaticTrends(industry, platform || 'instagram');
  trends.push(...staticTrends);

  // Add platform-specific trends
  platformTrends.forEach((trend, index) => {
    trends.push({
      topic: trend,
      relevance: 0.8 - index * 0.1,
      source: 'platform_analysis',
      category: 'trending',
      description: `Popular ${platform} content format`,
    });
  });

  return trends.slice(0, 10); // Return top 10 trends
}

/**
 * Get static trends based on industry (fallback when web search unavailable)
 */
function getStaticTrends(industry: string, platform: string): TrendData[] {
  const industryTrends: Record<string, TrendData[]> = {
    retail: [
      { topic: 'Sustainable shopping', relevance: 0.95, source: 'industry_analysis', category: 'trending' },
      { topic: 'Buy now pay later', relevance: 0.9, source: 'industry_analysis', category: 'trending' },
      { topic: 'Social commerce', relevance: 0.88, source: 'industry_analysis', category: 'emerging' },
      { topic: 'Personalized recommendations', relevance: 0.85, source: 'industry_analysis', category: 'evergreen' },
      { topic: 'Mobile-first shopping', relevance: 0.82, source: 'industry_analysis', category: 'evergreen' },
    ],
    food: [
      { topic: 'Plant-based options', relevance: 0.92, source: 'industry_analysis', category: 'trending' },
      { topic: 'Food delivery innovation', relevance: 0.9, source: 'industry_analysis', category: 'trending' },
      { topic: 'Local sourcing', relevance: 0.88, source: 'industry_analysis', category: 'evergreen' },
      { topic: 'Ghost kitchens', relevance: 0.85, source: 'industry_analysis', category: 'emerging' },
      { topic: 'Sustainable packaging', relevance: 0.82, source: 'industry_analysis', category: 'trending' },
    ],
    finance: [
      { topic: 'Digital banking', relevance: 0.95, source: 'industry_analysis', category: 'trending' },
      { topic: 'Mobile payments', relevance: 0.93, source: 'industry_analysis', category: 'evergreen' },
      { topic: 'Financial literacy', relevance: 0.9, source: 'industry_analysis', category: 'trending' },
      { topic: 'Instant transfers', relevance: 0.88, source: 'industry_analysis', category: 'evergreen' },
      { topic: 'Embedded finance', relevance: 0.85, source: 'industry_analysis', category: 'emerging' },
    ],
    healthcare: [
      { topic: 'Telehealth', relevance: 0.95, source: 'industry_analysis', category: 'trending' },
      { topic: 'Mental health awareness', relevance: 0.93, source: 'industry_analysis', category: 'trending' },
      { topic: 'Preventive care', relevance: 0.9, source: 'industry_analysis', category: 'evergreen' },
      { topic: 'Health apps', relevance: 0.88, source: 'industry_analysis', category: 'trending' },
      { topic: 'Personalized medicine', relevance: 0.85, source: 'industry_analysis', category: 'emerging' },
    ],
  };

  return industryTrends[industry] || industryTrends.retail;
}

/**
 * Get hashtag recommendations for an industry
 */
async function getHashtagRecommendations(
  industry: string,
  platform: string
): Promise<string[]> {
  // Industry-specific hashtags
  const industryHashtags: Record<string, string[]> = {
    retail: ['#shopping', '#deals', '#newcollection', '#shoplocal', '#retailtherapy', '#fashion', '#style', '#sale', '#newarrivals', '#musthave'],
    food: ['#foodie', '#delicious', '#yummy', '#foodporn', '#instafood', '#homemade', '#foodlover', '#tasty', '#chef', '#cooking'],
    finance: ['#fintech', '#banking', '#money', '#finance', '#investment', '#savings', '#financialfreedom', '#moneytips', '#wealth', '#budgeting'],
    healthcare: ['#health', '#wellness', '#healthcare', '#healthy', '#fitness', '#selfcare', '#mentalhealth', '#healthylifestyle', '#medical', '#doctor'],
    realestate: ['#realestate', '#property', '#home', '#househunting', '#realtor', '#dreamhome', '#investment', '#homedecor', '#forsale', '#newlisting'],
    service: ['#service', '#business', '#professional', '#quality', '#customerservice', '#expert', '#trusted', '#solutions', '#support', '#excellence'],
    saas: ['#saas', '#software', '#tech', '#startup', '#business', '#productivity', '#automation', '#cloud', '#innovation', '#digital'],
    education: ['#education', '#learning', '#student', '#teacher', '#school', '#knowledge', '#study', '#edtech', '#onlinelearning', '#skills'],
  };

  // Platform-specific hashtag strategies
  const platformLimits: Record<string, number> = {
    instagram: 15,
    facebook: 5,
    twitter: 3,
    linkedin: 5,
    tiktok: 5,
  };

  const hashtags = industryHashtags[industry] || industryHashtags.retail;
  const limit = platformLimits[platform] || 10;

  return hashtags.slice(0, limit);
}

/**
 * Get upcoming seasonal events relevant to the industry
 */
async function getSeasonalEvents(
  industry: string,
  location?: string
): Promise<SeasonalEvent[]> {
  const now = new Date();
  const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  // Universal events
  const universalEvents: SeasonalEvent[] = [
    {
      name: 'New Year',
      date: `${now.getFullYear() + 1}-01-01`,
      relevance: 0.9,
      contentIdeas: ['New year resolutions', 'Fresh start', 'Year in review', 'Goals for the year'],
    },
    {
      name: "Valentine's Day",
      date: `${now.getFullYear()}-02-14`,
      relevance: 0.85,
      contentIdeas: ['Gift ideas', 'Special offers', 'Love-themed content', 'Couples promotions'],
    },
    {
      name: 'Black Friday',
      date: `${now.getFullYear()}-11-29`,
      relevance: 0.95,
      contentIdeas: ['Biggest sale', 'Countdown', 'Early access', 'Deal reveals'],
    },
    {
      name: 'Christmas',
      date: `${now.getFullYear()}-12-25`,
      relevance: 0.95,
      contentIdeas: ['Gift guide', 'Holiday specials', 'Festive content', 'Year-end celebration'],
    },
  ];

  // Kenya-specific events (if location is Kenya)
  const kenyaEvents: SeasonalEvent[] = [
    {
      name: 'Jamhuri Day',
      date: `${now.getFullYear()}-12-12`,
      relevance: 0.8,
      contentIdeas: ['Independence celebration', 'Kenyan pride', 'National heritage'],
    },
    {
      name: 'Mashujaa Day',
      date: `${now.getFullYear()}-10-20`,
      relevance: 0.75,
      contentIdeas: ['Heroes celebration', 'Kenyan heroes', 'Community stories'],
    },
    {
      name: 'Madaraka Day',
      date: `${now.getFullYear()}-06-01`,
      relevance: 0.75,
      contentIdeas: ['Self-governance celebration', 'Kenyan achievements'],
    },
  ];

  let events = [...universalEvents];
  
  if (location?.toLowerCase().includes('kenya')) {
    events = [...events, ...kenyaEvents];
  }

  // Filter to upcoming events only
  return events
    .filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= now && eventDate <= threeMonthsFromNow;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Analyze competitors in the industry
 */
async function analyzeCompetitors(
  industry: string,
  location?: string
): Promise<CompetitorInsight[]> {
  // Static competitor insights by industry
  // TODO: Integrate with web search for real competitor analysis
  const competitorInsights: Record<string, CompetitorInsight[]> = {
    finance: [
      {
        name: 'Traditional Banks',
        strengths: ['Established trust', 'Physical branches', 'Full service'],
        weaknesses: ['Slow processes', 'High fees', 'Poor mobile experience'],
        contentThemes: ['Speed', 'Low fees', 'Mobile-first', 'User-friendly'],
      },
      {
        name: 'Other Fintechs',
        strengths: ['Tech-savvy', 'Modern UI', 'Quick onboarding'],
        weaknesses: ['Limited services', 'Trust issues', 'Customer support'],
        contentThemes: ['Full service', 'Reliability', 'Customer care', 'Security'],
      },
    ],
    retail: [
      {
        name: 'Large Retailers',
        strengths: ['Wide selection', 'Brand recognition', 'Logistics'],
        weaknesses: ['Impersonal', 'Generic products', 'Slow adaptation'],
        contentThemes: ['Personal touch', 'Unique products', 'Local focus', 'Quality'],
      },
    ],
    food: [
      {
        name: 'Chain Restaurants',
        strengths: ['Consistency', 'Brand recognition', 'Convenience'],
        weaknesses: ['Generic taste', 'Mass production', 'No local flavor'],
        contentThemes: ['Authentic taste', 'Fresh ingredients', 'Local recipes', 'Quality'],
      },
    ],
  };

  return competitorInsights[industry] || [];
}

/**
 * Calculate confidence score for research results
 */
function calculateConfidence(
  trends: TrendData[],
  hashtags: string[],
  seasonalEvents: SeasonalEvent[]
): number {
  let score = 0.5; // Base score

  if (trends.length >= 5) score += 0.2;
  if (hashtags.length >= 10) score += 0.15;
  if (seasonalEvents.length >= 2) score += 0.15;

  return Math.min(score, 1);
}

/**
 * Get cached research from database
 */
async function getCachedResearch(
  supabase: ReturnType<typeof createClient>,
  industry: string,
  location: string | undefined,
  platform: string
): Promise<TrendResearchResult | null> {
  const { data } = await supabase
    .from('trend_research')
    .select('*')
    .eq('industry', industry)
    .eq('platform', platform)
    .gt('expires_at', new Date().toISOString())
    .order('researched_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;

  return {
    industry: data.industry,
    location: data.location,
    platform: data.platform,
    trends: data.trends || [],
    hashtags: data.hashtags || [],
    seasonalEvents: data.seasonal_events || [],
    competitorInsights: data.competitor_insights || [],
    researchedAt: new Date(data.researched_at),
    expiresAt: new Date(data.expires_at),
    confidence: data.confidence_score || 0.7,
  };
}

/**
 * Cache research results to database
 */
async function cacheResearch(
  supabase: ReturnType<typeof createClient>,
  result: TrendResearchResult
): Promise<void> {
  await supabase.from('trend_research').upsert({
    industry: result.industry,
    location: result.location || null,
    platform: result.platform,
    trends: result.trends,
    hashtags: result.hashtags,
    seasonal_events: result.seasonalEvents,
    competitor_insights: result.competitorInsights,
    researched_at: result.researchedAt.toISOString(),
    expires_at: result.expiresAt.toISOString(),
    confidence_score: result.confidence,
    source: 'trend_analyzer',
  }, {
    onConflict: 'industry,location,platform',
  });
}

/**
 * Get research insights formatted for AI assistant
 */
export function formatResearchForAssistant(research: TrendResearchResult): string {
  let formatted = `
📊 CURRENT MARKET RESEARCH (${research.industry.toUpperCase()})
Research Date: ${research.researchedAt.toLocaleDateString()}
Confidence: ${Math.round(research.confidence * 100)}%

🔥 TRENDING TOPICS:
${research.trends.slice(0, 5).map(t => `- ${t.topic} (${t.category})`).join('\n')}

#️⃣ RECOMMENDED HASHTAGS:
${research.hashtags.slice(0, 10).join(' ')}
`;

  if (research.seasonalEvents.length > 0) {
    formatted += `
📅 UPCOMING EVENTS:
${research.seasonalEvents.map(e => `- ${e.name} (${e.date}): ${e.contentIdeas[0]}`).join('\n')}
`;
  }

  if (research.competitorInsights.length > 0) {
    formatted += `
🎯 COMPETITIVE POSITIONING:
${research.competitorInsights.map(c => 
  `- vs ${c.name}: Emphasize ${c.contentThemes.slice(0, 2).join(', ')}`
).join('\n')}
`;
  }

  return formatted;
}

export default {
  researchTrends,
  formatResearchForAssistant,
};
