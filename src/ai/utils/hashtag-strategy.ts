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
}

export interface HashtagAnalysis {
  hashtag: string;
  category: 'trending' | 'niche' | 'branded' | 'location' | 'community';
  competitionLevel: 'high' | 'medium' | 'low';
  estimatedReach: 'high' | 'medium' | 'low';
  relevanceScore: number; // 1-10
}

/**
 * Generates platform-specific hashtag strategies
 */
export function generateHashtagStrategy(
  businessType: string,
  location: string,
  platform: string,
  services?: string,
  targetAudience?: string
): HashtagStrategy {

  const strategy: HashtagStrategy = {
    trending: generateTrendingHashtags(businessType, platform),
    niche: generateNicheHashtags(businessType, services),
    branded: generateBrandedHashtags(businessType),
    location: generateLocationHashtags(location),
    community: generateCommunityHashtags(businessType, targetAudience)
  };

  // Optimize hashtag counts based on platform
  return optimizeHashtagsForPlatform(strategy, platform);
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
    branded: strategy.branded.slice(0, limits.branded)
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

  return [...businessHashtags.slice(0, 3), ...platformHashtags.slice(0, 2)];
}

/**
 * Generates niche-specific hashtags
 */
function generateNicheHashtags(businessType: string, services?: string): string[] {
  const nicheMap: Record<string, string[]> = {
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

  // Add service-specific hashtags if services are provided
  if (services) {
    const serviceWords = services.toLowerCase().split(/[,\s]+/).filter(word => word.length > 3);
    const serviceHashtags = serviceWords.slice(0, 3).map(word => `#${word.replace(/[^a-z0-9]/g, '')}`);
    return [...baseNiche.slice(0, 5), ...serviceHashtags];
  }

  return baseNiche.slice(0, 8);
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
