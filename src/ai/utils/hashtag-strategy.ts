/**
 * Advanced Hashtag Strategy Utilities
 * 
 * This module provides sophisticated hashtag generation and optimization
 * strategies for different platforms and business types.
 */

export interface HashtagStrategy {
  trending: string[];
  niche: string[];
  branded: string[];
  location: string[];
  community: string[];
  topicSpecific: string[];
  designBased: string[];
}

export interface HashtagAnalysis {
  hashtag: string;
  category: 'trending' | 'niche' | 'branded' | 'location' | 'community';
  competitionLevel: 'high' | 'medium' | 'low';
  estimatedReach: 'high' | 'medium' | 'low';
  relevanceScore: number; // 1-10
}

/**
 * Generates exactly 10 most relevant hashtags based on design and post topic
 */
export function generateHashtagStrategy(
  businessType: string,
  location: string,
  platform: string,
  services?: string,
  targetAudience?: string,
  postTopic?: string,
  designStyle?: string
): HashtagStrategy {

  // Generate all possible hashtags
  const allHashtags = {
    trending: generateTrendingHashtags(businessType, platform),
    niche: generateNicheHashtags(businessType, services),
    branded: generateBrandedHashtags(businessType),
    location: generateLocationHashtags(location),
    community: generateCommunityHashtags(businessType, targetAudience),
    topicSpecific: generateTopicSpecificHashtags(postTopic, designStyle),
    designBased: generateDesignBasedHashtags(designStyle, businessType)
  };

  // Select exactly 10 most relevant hashtags
  return selectTop10Hashtags(allHashtags, platform, businessType, postTopic);
}

/**
 * Optimizes hashtag counts based on platform best practices
 */
function optimizeHashtagsForPlatform(strategy: HashtagStrategy, platform: string): HashtagStrategy {
  const platformLimits: Record<string, { trending: number; niche: number; location: number; community: number; branded: number }> = {
    'instagram': { trending: 5, niche: 8, location: 4, community: 5, branded: 3 },
    'linkedin': { trending: 2, niche: 2, location: 1, community: 1, branded: 1 },
    'twitter': { trending: 2, niche: 1, location: 0, community: 0, branded: 0 },
    'facebook': { trending: 2, niche: 3, location: 2, community: 2, branded: 1 }
  };

  const limits = platformLimits[platform.toLowerCase()] || { trending: 3, niche: 5, location: 3, community: 3, branded: 2 };

  return {
    trending: strategy.trending.slice(0, limits.trending),
    niche: strategy.niche.slice(0, limits.niche),
    location: strategy.location.slice(0, limits.location),
    community: strategy.community.slice(0, limits.community),
    branded: strategy.branded.slice(0, limits.branded),
    topicSpecific: strategy.topicSpecific || [],
    designBased: strategy.designBased || []
  };
}

/**
 * Generates trending hashtags based on business type and platform
 */
function generateTrendingHashtags(businessType: string, platform: string): string[] {
  const businessTypeMap: Record<string, string[]> = {
    'restaurant': ['#foodie', '#delicious', '#foodstagram', '#yummy', '#tasty'],
    'fitness': ['#fitness', '#workout', '#health', '#motivation', '#fitlife'],
    'beauty': ['#beauty', '#skincare', '#makeup', '#selfcare', '#glowup'],
    'retail': ['#shopping', '#style', '#fashion', '#deals', '#newcollection'],
    'technology': ['#tech', '#innovation', '#digital', '#future', '#startup'],
    'healthcare': ['#health', '#wellness', '#care', '#medical', '#healthy'],
    'education': ['#education', '#learning', '#knowledge', '#skills', '#growth'],
    'real_estate': ['#realestate', '#home', '#property', '#investment', '#dreamhome'],
    'automotive': ['#cars', '#automotive', '#driving', '#vehicle', '#auto'],
    'travel': ['#travel', '#adventure', '#explore', '#wanderlust', '#vacation']
  };

  const platformTrending: Record<string, string[]> = {
    'instagram': ['#instagood', '#photooftheday', '#love', '#beautiful', '#happy', '#instadaily', '#follow', '#like4like'],
    'linkedin': ['#professional', '#business', '#career', '#networking', '#success', '#leadership', '#innovation', '#growth'],
    'twitter': ['#trending', '#viral', '#breaking', '#news', '#update', '#thread', '#twitterchat', '#follow'],
    'facebook': ['#community', '#local', '#family', '#friends', '#share', '#like', '#comment', '#engage']
  };

  const businessHashtags = businessTypeMap[businessType.toLowerCase()] || ['#business', '#service', '#quality', '#professional', '#local'];
  const platformHashtags = platformTrending[platform.toLowerCase()] || ['#social', '#content', '#engagement'];

  // Shuffle to ensure variety in each generation
  const shuffledBusiness = businessHashtags.sort(() => 0.5 - Math.random());
  const shuffledPlatform = platformHashtags.sort(() => 0.5 - Math.random());

  return [...shuffledBusiness.slice(0, 3), ...shuffledPlatform.slice(0, 2)];
}

/**
 * Generates niche-specific hashtags
 */
function generateNicheHashtags(businessType: string, services?: string): string[] {
  const nicheMap: Record<string, string[]> = {
    'food production': ['#foodproduction', '#nutrition', '#healthyfood', '#manufacturing', '#qualitycontrol', '#foodsafety', '#sustainable', '#organic', '#processing', '#ingredients', '#nutritious', '#wholesome'],
    'restaurant': ['#localfood', '#chefspecial', '#freshingredients', '#culinaryart', '#foodculture', '#diningexperience', '#artisanfood', '#farmtotable'],
    'fitness': ['#personaltrainer', '#strengthtraining', '#cardio', '#nutrition', '#bodybuilding', '#crossfit', '#yoga', '#pilates'],
    'beauty': ['#beautytips', '#skincareroutine', '#makeuptutorial', '#beautyproducts', '#antiaging', '#naturalbeauty', '#beautysalon', '#spa'],
    'retail': ['#boutique', '#handmade', '#unique', '#quality', '#craftsmanship', '#designer', '#exclusive', '#limited'],
    'technology': ['#software', '#AI', '#machinelearning', '#cybersecurity', '#cloudcomputing', '#blockchain', '#IoT', '#automation'],
    'healthcare': ['#preventivecare', '#patientcare', '#medicaladvice', '#healthtips', '#wellness', '#mentalhealth', '#nutrition', '#exercise'],
    'education': ['#onlinelearning', '#skillbuilding', '#certification', '#training', '#development', '#mentorship', '#coaching', '#academy'],
    'real_estate': ['#propertyinvestment', '#homebuying', '#realtorlife', '#propertymanagement', '#commercialrealestate', '#luxury', '#firsttimehomebuyer'],
    'automotive': ['#carcare', '#automotive', '#mechanic', '#carrepair', '#maintenance', '#performance', '#luxury', '#electric'],
    'travel': ['#localtourism', '#hiddengems', '#culturalexperience', '#adventure', '#ecotourism', '#luxurytravel', '#backpacking', '#roadtrip']
  };

  const baseNiche = nicheMap[businessType.toLowerCase()] || ['#specialized', '#expert', '#professional', '#quality', '#service', '#local', '#trusted', '#experienced'];

  // Shuffle the base niche hashtags to ensure variety
  const shuffledNiche = baseNiche.sort(() => 0.5 - Math.random());

  // Add service-specific hashtags if services are provided
  if (services) {
    const serviceWords = services.toLowerCase().split(/[,\s]+/).filter(word => word.length > 3);
    const serviceHashtags = serviceWords.slice(0, 3).map(word => `#${word.replace(/[^a-z0-9]/g, '')}`);
    return [...shuffledNiche.slice(0, 5), ...serviceHashtags];
  }

  return shuffledNiche.slice(0, 8);
}

/**
 * Generates branded hashtags
 */
function generateBrandedHashtags(businessType: string): string[] {
  const brandedSuffixes = ['experience', 'quality', 'service', 'difference', 'way', 'style', 'approach'];
  const businessPrefix = businessType.toLowerCase().replace(/[^a-z]/g, '');

  return [
    `#${businessPrefix}${brandedSuffixes[0]}`,
    `#${businessPrefix}${brandedSuffixes[1]}`,
    `#choose${businessPrefix}`
  ];
}

/**
 * Generates location-based hashtags
 */
function generateLocationHashtags(location: string): string[] {
  const locationParts = location.split(',').map(part => part.trim());
  const hashtags: string[] = [];

  locationParts.forEach(part => {
    const cleanLocation = part.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '').toLowerCase();
    if (cleanLocation.length > 2) {
      hashtags.push(`#${cleanLocation}`);
      hashtags.push(`#local${cleanLocation}`);
      hashtags.push(`#${cleanLocation}business`);
    }
  });

  // Add generic location hashtags
  hashtags.push('#local', '#community', '#neighborhood');

  return hashtags.slice(0, 5);
}

/**
 * Generates community and engagement hashtags
 */
function generateCommunityHashtags(businessType: string, targetAudience?: string): string[] {
  const communityMap: Record<string, string[]> = {
    'restaurant': ['#foodlovers', '#foodies', '#localfoodie', '#foodcommunity'],
    'fitness': ['#fitnesscommunity', '#healthylifestyle', '#fitnessjourney', '#workoutbuddy'],
    'beauty': ['#beautycommunity', '#selfcare', '#beautylovers', '#skincarecommunity'],
    'retail': ['#shoplocal', '#supportlocal', '#shoppingcommunity', '#stylelovers'],
    'technology': ['#techcommunity', '#developers', '#innovation', '#digitaltransformation'],
    'healthcare': ['#healthcommunity', '#wellness', '#patientcare', '#healthylife'],
    'education': ['#learningcommunity', '#students', '#educators', '#knowledge'],
    'real_estate': ['#homeowners', '#investors', '#realestatecommunity', '#propertylovers'],
    'automotive': ['#carenthusiasts', '#automotive', '#carlovers', '#drivingcommunity'],
    'travel': ['#travelers', '#explorers', '#adventurers', '#wanderers']
  };

  const baseCommunity = communityMap[businessType.toLowerCase()] || ['#community', '#customers', '#supporters', '#family'];

  // Add audience-specific hashtags if provided
  if (targetAudience) {
    const audienceWords = targetAudience.toLowerCase().split(/[,\s]+/).filter(word => word.length > 3);
    const audienceHashtags = audienceWords.slice(0, 2).map(word => `#${word.replace(/[^a-z0-9]/g, '')}`);
    return [...baseCommunity.slice(0, 3), ...audienceHashtags];
  }

  return baseCommunity.slice(0, 4);
}

/**
 * Analyzes hashtag effectiveness
 */
export function analyzeHashtags(hashtags: string[]): HashtagAnalysis[] {
  return hashtags.map(hashtag => ({
    hashtag,
    category: categorizeHashtag(hashtag),
    competitionLevel: estimateCompetition(hashtag),
    estimatedReach: estimateReach(hashtag),
    relevanceScore: Math.floor(Math.random() * 3) + 8 // Simplified scoring
  }));
}

function categorizeHashtag(hashtag: string): HashtagAnalysis['category'] {
  const trending = ['#instagood', '#photooftheday', '#love', '#beautiful', '#happy', '#fitness', '#food'];
  const location = hashtag.includes('local') || hashtag.includes('community');
  const branded = hashtag.includes('experience') || hashtag.includes('quality');

  if (trending.some(t => hashtag.includes(t.slice(1)))) return 'trending';
  if (location) return 'location';
  if (branded) return 'branded';
  return 'niche';
}

function estimateCompetition(hashtag: string): 'high' | 'medium' | 'low' {
  const highCompetition = ['#love', '#instagood', '#photooftheday', '#beautiful', '#happy'];
  const lowCompetition = hashtag.length > 15 || hashtag.includes('local');

  if (highCompetition.includes(hashtag)) return 'high';
  if (lowCompetition) return 'low';
  return 'medium';
}

function estimateReach(hashtag: string): 'high' | 'medium' | 'low' {
  const highReach = ['#love', '#instagood', '#photooftheday', '#beautiful', '#happy'];
  const lowReach = hashtag.length > 15 || hashtag.includes('local');

  if (highReach.includes(hashtag)) return 'high';
  if (lowReach) return 'low';
  return 'medium';
}

/**
 * Generates hashtags based on specific post topic and content
 */
function generateTopicSpecificHashtags(postTopic?: string, designStyle?: string): string[] {
  if (!postTopic) return [];

  const postContent = postTopic.toLowerCase();
  const hashtags: string[] = [];

  // Content-based hashtag detection
  const contentKeywords = {
    // Food & Nutrition
    'food': ['#food', '#nutrition', '#healthy', '#delicious', '#fresh'],
    'cookie': ['#cookies', '#snacks', '#treats', '#baked', '#homemade'],
    'nutritious': ['#nutritious', '#healthy', '#wellness', '#goodforyou', '#natural'],
    'malnutrition': ['#nutrition', '#health', '#wellness', '#community', '#impact'],

    // Business actions
    'sale': ['#sale', '#discount', '#offer', '#deal', '#savings'],
    'new': ['#new', '#launch', '#fresh', '#latest', '#innovation'],
    'quality': ['#quality', '#premium', '#excellence', '#trusted', '#reliable'],
    'service': ['#service', '#professional', '#expert', '#specialized', '#care'],

    // Emotions & Values
    'future': ['#future', '#tomorrow', '#progress', '#growth', '#vision'],
    'fighting': ['#fighting', '#mission', '#purpose', '#impact', '#change'],
    'learn': ['#learn', '#education', '#knowledge', '#discover', '#grow'],
    'experience': ['#experience', '#expertise', '#skilled', '#proven', '#established'],

    // Industry specific
    'production': ['#production', '#manufacturing', '#quality', '#process', '#industry'],
    'technology': ['#technology', '#innovation', '#digital', '#modern', '#advanced'],
    'consulting': ['#consulting', '#advisory', '#expertise', '#solutions', '#strategy'],
    'retail': ['#retail', '#shopping', '#products', '#customer', '#store']
  };

  // Extract relevant hashtags based on content
  Object.entries(contentKeywords).forEach(([keyword, tags]) => {
    if (postContent.includes(keyword)) {
      hashtags.push(...tags.slice(0, 2)); // Take first 2 from each matching category
    }
  });

  // Add random variation to avoid repetition
  const randomVariations = [
    '#amazing', '#incredible', '#outstanding', '#exceptional', '#remarkable',
    '#innovative', '#creative', '#unique', '#special', '#exclusive',
    '#authentic', '#genuine', '#original', '#custom', '#personalized',
    '#sustainable', '#eco', '#green', '#responsible', '#ethical'
  ];

  // Add 1-2 random variations for uniqueness
  const shuffled = randomVariations.sort(() => 0.5 - Math.random());
  hashtags.push(...shuffled.slice(0, 2));

  return [...new Set(hashtags)]; // Remove duplicates
}

/**
 * Generates hashtags based on design style and visual elements
 */
function generateDesignBasedHashtags(designStyle?: string, businessType?: string): string[] {
  if (!designStyle) return [];

  const designMap: Record<string, string[]> = {
    'modern': ['#modern', '#clean', '#minimal', '#sleek', '#contemporary'],
    'vintage': ['#vintage', '#retro', '#classic', '#timeless', '#nostalgic'],
    'bold': ['#bold', '#vibrant', '#striking', '#powerful', '#dynamic'],
    'elegant': ['#elegant', '#sophisticated', '#luxury', '#premium', '#refined'],
    'playful': ['#playful', '#fun', '#creative', '#colorful', '#energetic'],
    'minimalist': ['#minimalist', '#simple', '#clean', '#pure', '#essential'],
    'professional': ['#professional', '#corporate', '#business', '#formal', '#polished'],
    'artistic': ['#artistic', '#creative', '#design', '#art', '#visual'],
    'trendy': ['#trendy', '#stylish', '#fashionable', '#current', '#hip'],
    'warm': ['#warm', '#cozy', '#inviting', '#friendly', '#welcoming']
  };

  // Find matching design style
  const style = Object.keys(designMap).find(key =>
    designStyle.toLowerCase().includes(key)
  );

  return style ? designMap[style] : [];
}

/**
 * Selects exactly 10 most relevant hashtags from all categories
 */
function selectTop10Hashtags(
  allHashtags: HashtagStrategy & { topicSpecific: string[]; designBased: string[] },
  platform: string,
  businessType: string,
  postTopic?: string
): HashtagStrategy {
  // Use timestamp for randomization seed to ensure different results each time
  const randomSeed = Date.now() % 1000;

  // Priority weights for different categories
  const categoryWeights = {
    topicSpecific: 3.0,    // Highest priority - directly related to post content
    designBased: 2.5,      // High priority - matches visual style
    niche: 2.0,           // High priority - business-specific
    branded: 1.8,         // Good priority - brand building
    trending: 1.5,        // Medium priority - reach
    location: 1.3,        // Medium priority - local relevance
    community: 1.0        // Lower priority - general engagement
  };

  // Collect all hashtags with scores and add randomization
  const scoredHashtags: Array<{ hashtag: string; score: number; category: string }> = [];

  Object.entries(allHashtags).forEach(([category, hashtags]) => {
    const weight = categoryWeights[category as keyof typeof categoryWeights] || 1.0;
    hashtags.forEach((hashtag, index) => {
      // Avoid duplicates
      if (!scoredHashtags.some(item => item.hashtag === hashtag)) {
        // Add slight randomization to score to ensure variety
        const randomBonus = (randomSeed + index) % 100 / 1000;
        scoredHashtags.push({
          hashtag,
          score: weight + randomBonus,
          category
        });
      }
    });
  });

  // Sort by score (highest first) and take top 10
  const top10 = scoredHashtags
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(item => item.hashtag);

  // Return in the expected format (distribute across categories for compatibility)
  return {
    trending: top10.slice(0, 3),
    niche: top10.slice(3, 6),
    branded: top10.slice(6, 8),
    location: top10.slice(8, 9),
    community: top10.slice(9, 10),
    topicSpecific: [],
    designBased: []
  };
}
