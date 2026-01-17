/**
 * Hashtag Research
 * Provides intelligent hashtag recommendations based on industry, content, and platform
 * Part of Layer 1: Research Layer
 */

export interface HashtagRecommendation {
  hashtag: string;
  category: 'trending' | 'evergreen' | 'niche' | 'branded' | 'location';
  popularity: 'high' | 'medium' | 'low';
  competitiveness: 'high' | 'medium' | 'low';
  relevanceScore: number; // 0-1
}

export interface HashtagStrategy {
  trending: string[]; // High volume, current trends
  evergreen: string[]; // Always relevant
  niche: string[]; // Lower volume, highly targeted
  location: string[]; // Location-specific
  branded: string[]; // Brand-specific
  recommended: string[]; // Final mix for optimal reach
}

// Platform-specific hashtag limits and strategies
const PLATFORM_CONFIG: Record<string, {
  maxHashtags: number;
  optimalHashtags: number;
  strategy: string;
}> = {
  instagram: {
    maxHashtags: 30,
    optimalHashtags: 5,
    strategy: 'Mix of trending (2), evergreen (2), niche (1)',
  },
  facebook: {
    maxHashtags: 5,
    optimalHashtags: 3,
    strategy: 'Focus on evergreen (2), trending (1)',
  },
  twitter: {
    maxHashtags: 3,
    optimalHashtags: 2,
    strategy: 'Trending only (2)',
  },
  linkedin: {
    maxHashtags: 5,
    optimalHashtags: 3,
    strategy: 'Professional evergreen (2), industry (1)',
  },
  tiktok: {
    maxHashtags: 5,
    optimalHashtags: 4,
    strategy: 'Trending (2), niche (2)',
  },
};

// Industry-specific hashtag pools
const INDUSTRY_HASHTAGS: Record<string, {
  trending: string[];
  evergreen: string[];
  niche: string[];
}> = {
  retail: {
    trending: ['#shopnow', '#newdrop', '#limitededition', '#flashsale', '#trending'],
    evergreen: ['#shopping', '#style', '#fashion', '#deals', '#quality', '#shoplocal', '#musthave'],
    niche: ['#sustainablefashion', '#ethicalshopping', '#slowfashion', '#capsulewardrobe', '#consciousfashion'],
  },
  food: {
    trending: ['#foodtrends', '#viral', '#foodtiktok', '#mukbang', '#asmrfood'],
    evergreen: ['#foodie', '#delicious', '#yummy', '#instafood', '#homemade', '#foodlover', '#tasty'],
    niche: ['#farmtotable', '#localfood', '#organiceats', '#cleaneating', '#plantbased'],
  },
  finance: {
    trending: ['#fintech', '#digitalbanking', '#mobilemoney', '#financialfreedom', '#moneymoves'],
    evergreen: ['#finance', '#money', '#savings', '#investment', '#banking', '#wealth', '#budgeting'],
    niche: ['#financialliteracy', '#wealthbuilding', '#passiveincome', '#smartmoney', '#moneymanagement'],
  },
  healthcare: {
    trending: ['#telehealth', '#mentalhealth', '#selfcare', '#wellness2024', '#healthtech'],
    evergreen: ['#health', '#wellness', '#healthcare', '#healthy', '#fitness', '#doctor', '#medical'],
    niche: ['#holistichealth', '#preventivecare', '#healthyaging', '#mindfulness', '#wellnessjourney'],
  },
  realestate: {
    trending: ['#dreamhome', '#househunting', '#newhome', '#propertyinvestment', '#realestate2024'],
    evergreen: ['#realestate', '#property', '#home', '#realtor', '#investment', '#forsale', '#housing'],
    niche: ['#firsttimebuyer', '#luxuryrealestate', '#commercialproperty', '#rentalincome', '#propertymarket'],
  },
  service: {
    trending: ['#customerexperience', '#serviceexcellence', '#businessgrowth', '#entrepreneurlife'],
    evergreen: ['#service', '#business', '#professional', '#quality', '#expert', '#trusted', '#solutions'],
    niche: ['#smallbusiness', '#localservice', '#premiumservice', '#businessowner', '#servicewithasmile'],
  },
  saas: {
    trending: ['#ai', '#automation', '#nocode', '#productivityhacks', '#techtrends'],
    evergreen: ['#saas', '#software', '#tech', '#startup', '#business', '#productivity', '#cloud'],
    niche: ['#b2bsaas', '#startuphacks', '#techfounder', '#softwaredev', '#digitaltransformation'],
  },
  education: {
    trending: ['#onlinelearning', '#edtech', '#studytok', '#learnontiktok', '#studywithme'],
    evergreen: ['#education', '#learning', '#student', '#teacher', '#school', '#knowledge', '#study'],
    niche: ['#lifelonglearning', '#professionaldevelopment', '#upskilling', '#elearning', '#studytips'],
  },
  b2b: {
    trending: ['#b2bmarketing', '#linkedinmarketing', '#businessnetworking', '#thoughtleadership'],
    evergreen: ['#b2b', '#business', '#marketing', '#sales', '#enterprise', '#corporate', '#professional'],
    niche: ['#b2bsales', '#demandgen', '#accountbasedmarketing', '#businessstrategy', '#b2bgrowth'],
  },
  nonprofit: {
    trending: ['#socialimpact', '#changemakers', '#giveback', '#communityaction', '#sustainability'],
    evergreen: ['#nonprofit', '#charity', '#donate', '#volunteer', '#community', '#cause', '#support'],
    niche: ['#socialenterprise', '#impactinvesting', '#philanthropy', '#grassroots', '#nonprofitlife'],
  },
};

// Location-specific hashtags
const LOCATION_HASHTAGS: Record<string, string[]> = {
  kenya: ['#kenya', '#nairobi', '#mombasa', '#kenyan', '#madeinkenya', '#kenyanbusiness', '#nairobilife'],
  nigeria: ['#nigeria', '#lagos', '#nigerian', '#madeinnigeria', '#lagoslife', '#naija'],
  southafrica: ['#southafrica', '#johannesburg', '#capetown', '#proudlysa', '#mzansi'],
  usa: ['#usa', '#america', '#madeinusa', '#american', '#shopusa'],
  uk: ['#uk', '#london', '#british', '#madeinuk', '#shopuk'],
  global: ['#worldwide', '#global', '#international', '#shipping'],
};

/**
 * Get hashtag recommendations for content
 */
export function getHashtagRecommendations(
  industry: string,
  platform: string,
  options: {
    location?: string;
    contentTheme?: string;
    brandName?: string;
    existingHashtags?: string[];
  } = {}
): HashtagStrategy {
  const { location, contentTheme, brandName, existingHashtags = [] } = options;

  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.instagram;
  const industryTags = INDUSTRY_HASHTAGS[industry] || INDUSTRY_HASHTAGS.retail;

  // Build hashtag pools
  const trending = industryTags.trending.filter(h => !existingHashtags.includes(h));
  const evergreen = industryTags.evergreen.filter(h => !existingHashtags.includes(h));
  const niche = industryTags.niche.filter(h => !existingHashtags.includes(h));

  // Location hashtags
  let locationTags: string[] = [];
  if (location) {
    const locationKey = location.toLowerCase().replace(/\s+/g, '');
    locationTags = LOCATION_HASHTAGS[locationKey] || LOCATION_HASHTAGS.global;
  }

  // Branded hashtags
  const branded: string[] = [];
  if (brandName) {
    const cleanBrand = brandName.toLowerCase().replace(/\s+/g, '');
    branded.push(`#${cleanBrand}`);
    branded.push(`#${cleanBrand}kenya`); // Example: #payakenya
  }

  // Build recommended mix based on platform strategy
  const recommended = buildRecommendedMix(
    trending,
    evergreen,
    niche,
    locationTags,
    branded,
    config.optimalHashtags,
    platform
  );

  return {
    trending: trending.slice(0, 5),
    evergreen: evergreen.slice(0, 5),
    niche: niche.slice(0, 5),
    location: locationTags.slice(0, 3),
    branded,
    recommended,
  };
}

/**
 * Build optimal hashtag mix for platform
 */
function buildRecommendedMix(
  trending: string[],
  evergreen: string[],
  niche: string[],
  location: string[],
  branded: string[],
  targetCount: number,
  platform: string
): string[] {
  const mix: string[] = [];

  // Platform-specific mixing strategy
  switch (platform) {
    case 'instagram':
      // 2 trending, 2 evergreen, 1 niche (5 total)
      mix.push(...trending.slice(0, 2));
      mix.push(...evergreen.slice(0, 2));
      mix.push(...niche.slice(0, 1));
      break;

    case 'facebook':
      // 2 evergreen, 1 trending (3 total)
      mix.push(...evergreen.slice(0, 2));
      mix.push(...trending.slice(0, 1));
      break;

    case 'twitter':
      // 2 trending only
      mix.push(...trending.slice(0, 2));
      break;

    case 'linkedin':
      // 2 evergreen, 1 niche (professional focus)
      mix.push(...evergreen.slice(0, 2));
      mix.push(...niche.slice(0, 1));
      break;

    case 'tiktok':
      // 2 trending, 2 niche
      mix.push(...trending.slice(0, 2));
      mix.push(...niche.slice(0, 2));
      break;

    default:
      // Default: balanced mix
      mix.push(...trending.slice(0, 2));
      mix.push(...evergreen.slice(0, 2));
      mix.push(...niche.slice(0, 1));
  }

  // Ensure we don't exceed target count
  return mix.slice(0, targetCount);
}

/**
 * Analyze hashtag performance (placeholder for future analytics integration)
 */
export function analyzeHashtagPerformance(
  hashtags: string[],
  platform: string
): HashtagRecommendation[] {
  return hashtags.map(hashtag => ({
    hashtag,
    category: categorizeHashtag(hashtag),
    popularity: 'medium' as const,
    competitiveness: 'medium' as const,
    relevanceScore: 0.7,
  }));
}

/**
 * Categorize a hashtag
 */
function categorizeHashtag(hashtag: string): HashtagRecommendation['category'] {
  const tag = hashtag.toLowerCase();

  // Check if it's a location hashtag
  for (const [, tags] of Object.entries(LOCATION_HASHTAGS)) {
    if (tags.includes(tag)) return 'location';
  }

  // Check trending indicators
  if (tag.includes('2024') || tag.includes('2025') || tag.includes('viral') || tag.includes('trending')) {
    return 'trending';
  }

  // Check niche indicators
  if (tag.includes('sustainable') || tag.includes('organic') || tag.includes('holistic') || tag.includes('premium')) {
    return 'niche';
  }

  return 'evergreen';
}

/**
 * Get platform-specific hashtag config
 */
export function getPlatformHashtagConfig(platform: string) {
  return PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.instagram;
}

/**
 * Format hashtags for display
 */
export function formatHashtags(hashtags: string[]): string {
  return hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
}

/**
 * Validate hashtags for platform
 */
export function validateHashtags(
  hashtags: string[],
  platform: string
): { valid: boolean; issues: string[] } {
  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.instagram;
  const issues: string[] = [];

  if (hashtags.length > config.maxHashtags) {
    issues.push(`Too many hashtags: ${hashtags.length} (max: ${config.maxHashtags})`);
  }

  // Check for invalid characters
  const invalidHashtags = hashtags.filter(h => !/^#?[\w]+$/.test(h));
  if (invalidHashtags.length > 0) {
    issues.push(`Invalid hashtags: ${invalidHashtags.join(', ')}`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export default {
  getHashtagRecommendations,
  analyzeHashtagPerformance,
  getPlatformHashtagConfig,
  formatHashtags,
  validateHashtags,
};
