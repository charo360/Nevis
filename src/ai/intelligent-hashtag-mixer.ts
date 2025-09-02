/**
 * Intelligent Hashtag Mixing Algorithm
 * Advanced algorithm that combines trending RSS hashtags with business-specific tags
 * for optimal reach and relevance using machine learning-inspired scoring
 */

import { AdvancedHashtagStrategy } from './advanced-trending-hashtag-analyzer';
import { ViralHashtagStrategy } from './viral-hashtag-engine';
import { realtimeHashtagScorer, HashtagScore } from './realtime-hashtag-scorer';

export interface HashtagMixStrategy {
  primary: string[];        // Top 5 most important hashtags
  secondary: string[];      // Next 5 supporting hashtags  
  tertiary: string[];       // Final 5 niche/specific hashtags
  final: string[];          // Combined final 15 hashtags
  
  analytics: {
    rssInfluence: number;     // Percentage of RSS-sourced hashtags (0-100)
    businessRelevance: number; // Average business relevance score (0-10)
    trendingScore: number;    // Average trending score (0-10)
    diversityScore: number;   // Hashtag diversity score (0-10)
    confidenceLevel: number;  // Overall confidence (0-10)
    mixingStrategy: string;   // Description of mixing approach used
  };
}

export interface MixingContext {
  businessType: string;
  businessName: string;
  location: string;
  platform: string;
  postContent?: string;
  targetAudience?: string;
  services?: string;
  priority: 'reach' | 'relevance' | 'engagement' | 'balanced';
  rssWeight: number;        // Weight for RSS data (0-1)
  businessWeight: number;   // Weight for business relevance (0-1)
}

export class IntelligentHashtagMixer {
  private mixingCache: Map<string, { strategy: HashtagMixStrategy; timestamp: number }> = new Map();
  private readonly cacheTimeout = 20 * 60 * 1000; // 20 minutes

  /**
   * Create intelligent hashtag mix using advanced algorithms
   */
  public async createIntelligentMix(
    advancedStrategy: AdvancedHashtagStrategy,
    viralStrategy: ViralHashtagStrategy,
    context: MixingContext
  ): Promise<HashtagMixStrategy> {
    const cacheKey = this.generateCacheKey(context);
    const cached = this.mixingCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.strategy;
    }

    try {
      // 🧠 STEP 1: Score all available hashtags
      const allHashtags = this.collectAllHashtags(advancedStrategy, viralStrategy);
      const scoredHashtags = await this.scoreAllHashtags(allHashtags, context);

      // 🎯 STEP 2: Apply intelligent mixing algorithm
      const mixedHashtags = this.applyMixingAlgorithm(scoredHashtags, context);

      // 📊 STEP 3: Analyze the final mix
      const analytics = this.analyzeMix(mixedHashtags, advancedStrategy, context);

      // 🏗️ STEP 4: Structure the final strategy
      const strategy = this.structureFinalStrategy(mixedHashtags, analytics);

      // Cache the result
      this.mixingCache.set(cacheKey, { strategy, timestamp: Date.now() });

      return strategy;

    } catch (error) {
      return this.getFallbackMix(context);
    }
  }

  /**
   * Collect all hashtags from different sources
   */
  private collectAllHashtags(
    advancedStrategy: AdvancedHashtagStrategy,
    viralStrategy: ViralHashtagStrategy
  ): Array<{ hashtag: string; source: string; priority: number }> {
    const hashtags: Array<{ hashtag: string; source: string; priority: number }> = [];

    // Advanced strategy hashtags (highest priority)
    advancedStrategy.finalRecommendations.forEach(hashtag => {
      hashtags.push({ hashtag, source: 'advanced_rss', priority: 10 });
    });

    advancedStrategy.topTrending.forEach(analysis => {
      hashtags.push({ hashtag: analysis.hashtag, source: 'rss_trending', priority: 9 });
    });

    advancedStrategy.emergingTrends.forEach(analysis => {
      hashtags.push({ hashtag: analysis.hashtag, source: 'rss_emerging', priority: 8 });
    });

    advancedStrategy.businessOptimized.forEach(analysis => {
      hashtags.push({ hashtag: analysis.hashtag, source: 'rss_business', priority: 8 });
    });

    // Viral strategy hashtags (medium priority)
    viralStrategy.trending.forEach(hashtag => {
      hashtags.push({ hashtag, source: 'viral_trending', priority: 7 });
    });

    viralStrategy.viral.forEach(hashtag => {
      hashtags.push({ hashtag, source: 'viral_engagement', priority: 7 });
    });

    viralStrategy.niche.forEach(hashtag => {
      hashtags.push({ hashtag, source: 'viral_niche', priority: 6 });
    });

    viralStrategy.location.forEach(hashtag => {
      hashtags.push({ hashtag, source: 'viral_location', priority: 6 });
    });

    viralStrategy.platform.forEach(hashtag => {
      hashtags.push({ hashtag, source: 'viral_platform', priority: 5 });
    });

    // Remove duplicates while preserving highest priority
    const uniqueHashtags = new Map<string, { hashtag: string; source: string; priority: number }>();
    
    hashtags.forEach(item => {
      const existing = uniqueHashtags.get(item.hashtag);
      if (!existing || item.priority > existing.priority) {
        uniqueHashtags.set(item.hashtag, item);
      }
    });

    return Array.from(uniqueHashtags.values());
  }

  /**
   * Score all hashtags using the realtime scorer
   */
  private async scoreAllHashtags(
    hashtags: Array<{ hashtag: string; source: string; priority: number }>,
    context: MixingContext
  ): Promise<Array<{ hashtag: string; source: string; priority: number; score: HashtagScore }>> {
    const scoringContext = {
      businessType: context.businessType,
      businessName: context.businessName,
      location: context.location,
      platform: context.platform,
      postContent: context.postContent,
      targetAudience: context.targetAudience,
      services: context.services
    };

    const scoredHashtags = await Promise.all(
      hashtags.map(async item => ({
        ...item,
        score: await realtimeHashtagScorer.scoreHashtag(item.hashtag, scoringContext)
      }))
    );

    return scoredHashtags;
  }

  /**
   * Apply intelligent mixing algorithm based on context priority
   */
  private applyMixingAlgorithm(
    scoredHashtags: Array<{ hashtag: string; source: string; priority: number; score: HashtagScore }>,
    context: MixingContext
  ): Array<{ hashtag: string; source: string; priority: number; score: HashtagScore; finalScore: number }> {
    
    return scoredHashtags.map(item => {
      let finalScore = 0;

      // Base score from realtime scorer
      finalScore += item.score.totalScore * 0.4;

      // Priority bonus from source
      finalScore += item.priority * 0.2;

      // Context-specific adjustments
      switch (context.priority) {
        case 'reach':
          finalScore += item.score.breakdown.trendingScore * 0.3;
          finalScore += item.score.breakdown.engagementPotential * 0.1;
          break;
        
        case 'relevance':
          finalScore += item.score.breakdown.businessRelevance * 0.3;
          finalScore += item.score.breakdown.semanticRelevance * 0.1;
          break;
        
        case 'engagement':
          finalScore += item.score.breakdown.engagementPotential * 0.3;
          finalScore += item.score.breakdown.platformOptimization * 0.1;
          break;
        
        case 'balanced':
        default:
          finalScore += (
            item.score.breakdown.trendingScore +
            item.score.breakdown.businessRelevance +
            item.score.breakdown.engagementPotential
          ) * 0.1;
          break;
      }

      // RSS weight adjustment
      if (item.source.includes('rss')) {
        finalScore += finalScore * context.rssWeight * 0.2;
      }

      // Business weight adjustment
      if (item.source.includes('business') || item.source.includes('niche')) {
        finalScore += finalScore * context.businessWeight * 0.2;
      }

      // Confidence bonus
      finalScore += item.score.confidence * 2;

      return {
        ...item,
        finalScore: Math.round(finalScore * 10) / 10
      };
    }).sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * Analyze the quality of the final mix
   */
  private analyzeMix(
    mixedHashtags: Array<{ hashtag: string; source: string; priority: number; score: HashtagScore; finalScore: number }>,
    advancedStrategy: AdvancedHashtagStrategy,
    context: MixingContext
  ): HashtagMixStrategy['analytics'] {
    const top15 = mixedHashtags.slice(0, 15);

    // Calculate RSS influence
    const rssHashtags = top15.filter(item => item.source.includes('rss')).length;
    const rssInfluence = Math.round((rssHashtags / 15) * 100);

    // Calculate average business relevance
    const avgBusinessRelevance = top15.reduce((sum, item) => 
      sum + item.score.breakdown.businessRelevance, 0) / 15;

    // Calculate average trending score
    const avgTrendingScore = top15.reduce((sum, item) => 
      sum + item.score.breakdown.trendingScore, 0) / 15;

    // Calculate diversity score
    const sources = new Set(top15.map(item => item.source));
    const diversityScore = Math.min((sources.size / 6) * 10, 10); // Max 6 different sources

    // Calculate overall confidence
    const avgConfidence = top15.reduce((sum, item) => sum + item.score.confidence, 0) / 15;
    const confidenceLevel = Math.round(avgConfidence * 10);

    // Determine mixing strategy description
    const mixingStrategy = this.describeMixingStrategy(context, rssInfluence, avgBusinessRelevance);

    return {
      rssInfluence,
      businessRelevance: Math.round(avgBusinessRelevance * 10) / 10,
      trendingScore: Math.round(avgTrendingScore * 10) / 10,
      diversityScore: Math.round(diversityScore * 10) / 10,
      confidenceLevel,
      mixingStrategy
    };
  }

  /**
   * Structure the final hashtag strategy
   */
  private structureFinalStrategy(
    mixedHashtags: Array<{ hashtag: string; source: string; priority: number; score: HashtagScore; finalScore: number }>,
    analytics: HashtagMixStrategy['analytics']
  ): HashtagMixStrategy {
    const top15 = mixedHashtags.slice(0, 15);

    return {
      primary: top15.slice(0, 5).map(item => item.hashtag),
      secondary: top15.slice(5, 10).map(item => item.hashtag),
      tertiary: top15.slice(10, 15).map(item => item.hashtag),
      final: top15.map(item => item.hashtag),
      analytics
    };
  }

  /**
   * Describe the mixing strategy used
   */
  private describeMixingStrategy(
    context: MixingContext,
    rssInfluence: number,
    businessRelevance: number
  ): string {
    let strategy = `${context.priority.charAt(0).toUpperCase() + context.priority.slice(1)}-focused mixing`;
    
    if (rssInfluence >= 70) {
      strategy += ' with heavy RSS trending emphasis';
    } else if (rssInfluence >= 40) {
      strategy += ' with balanced RSS integration';
    } else {
      strategy += ' with minimal RSS influence';
    }

    if (businessRelevance >= 8) {
      strategy += ' and high business relevance';
    } else if (businessRelevance >= 6) {
      strategy += ' and moderate business relevance';
    } else {
      strategy += ' and broad market appeal';
    }

    return strategy;
  }

  /**
   * Generate cache key for mixing context
   */
  private generateCacheKey(context: MixingContext): string {
    return `${context.businessType}-${context.location}-${context.platform}-${context.priority}-${context.rssWeight}-${context.businessWeight}`.toLowerCase();
  }

  /**
   * Get fallback mix when algorithm fails
   */
  private getFallbackMix(context: MixingContext): HashtagMixStrategy {
    const fallbackHashtags = [
      '#trending', '#viral', `#${context.businessType.replace(/\s+/g, '')}`,
      '#local', '#community', '#business', '#quality', '#professional',
      '#service', '#new', '#amazing', '#best', '#popular', '#love', '#today'
    ];

    return {
      primary: fallbackHashtags.slice(0, 5),
      secondary: fallbackHashtags.slice(5, 10),
      tertiary: fallbackHashtags.slice(10, 15),
      final: fallbackHashtags,
      analytics: {
        rssInfluence: 0,
        businessRelevance: 5.0,
        trendingScore: 3.0,
        diversityScore: 4.0,
        confidenceLevel: 3,
        mixingStrategy: 'Fallback strategy due to algorithm failure'
      }
    };
  }

  /**
   * Get optimal mixing weights based on business type and platform
   */
  public getOptimalWeights(businessType: string, platform: string): { rssWeight: number; businessWeight: number } {
    // Platform-specific weights
    const platformWeights = {
      instagram: { rssWeight: 0.7, businessWeight: 0.6 },
      tiktok: { rssWeight: 0.8, businessWeight: 0.4 },
      twitter: { rssWeight: 0.9, businessWeight: 0.5 },
      linkedin: { rssWeight: 0.6, businessWeight: 0.8 },
      facebook: { rssWeight: 0.5, businessWeight: 0.7 },
      pinterest: { rssWeight: 0.6, businessWeight: 0.6 }
    };

    // Business type adjustments
    const businessAdjustments = {
      restaurant: { rssBoost: 0.1, businessBoost: 0.2 },
      retail: { rssBoost: 0.2, businessBoost: 0.1 },
      healthcare: { rssBoost: 0.0, businessBoost: 0.3 },
      technology: { rssBoost: 0.3, businessBoost: 0.1 },
      fitness: { rssBoost: 0.2, businessBoost: 0.2 },
      beauty: { rssBoost: 0.2, businessBoost: 0.1 }
    };

    const platformWeight = platformWeights[platform.toLowerCase() as keyof typeof platformWeights] || 
                          { rssWeight: 0.6, businessWeight: 0.6 };
    
    const businessAdj = businessAdjustments[businessType.toLowerCase() as keyof typeof businessAdjustments] || 
                       { rssBoost: 0.1, businessBoost: 0.1 };

    return {
      rssWeight: Math.min(platformWeight.rssWeight + businessAdj.rssBoost, 1.0),
      businessWeight: Math.min(platformWeight.businessWeight + businessAdj.businessBoost, 1.0)
    };
  }
}

// Export singleton instance
export const intelligentHashtagMixer = new IntelligentHashtagMixer();
