/**
 * Viral Hashtag Engine - Real-time trending hashtag generation
 * Integrates with RSS feeds and trending data to generate viral hashtags
 * Enhanced with Advanced Trending Hashtag Analyzer for superior relevance
 */

import { trendingEnhancer } from './trending-content-enhancer';
import { advancedHashtagAnalyzer, AnalysisContext } from './advanced-trending-hashtag-analyzer';
import { intelligentHashtagMixer, MixingContext } from './intelligent-hashtag-mixer';
import { hashtagPerformanceTracker } from './hashtag-performance-tracker';

export interface ViralHashtagStrategy {
  trending: string[];      // Currently trending hashtags from RSS feeds
  viral: string[];         // High-engagement viral hashtags
  niche: string[];         // Business-specific niche hashtags
  location: string[];      // Location-based hashtags
  community: string[];     // Community engagement hashtags
  seasonal: string[];      // Seasonal/timely hashtags
  platform: string[];     // Platform-specific hashtags
  total: string[];         // Final combined strategy (15 hashtags)

  // Enhanced analytics from Advanced Hashtag Analyzer
  analytics?: {
    topPerformers: string[];
    emergingTrends: string[];
    businessOptimized: string[];
    rssSourced: string[];
    confidenceScore: number;

    // Intelligent mixing analytics
    mixingStrategy?: {
      rssInfluence: number;
      businessRelevance: number;
      trendingScore: number;
      diversityScore: number;
      confidenceLevel: number;
      algorithm: string;
    };

    // Performance learning insights
    learningInsights?: {
      learnedRecommendations: Array<{ hashtag: string; confidence: number; reason: string }>;
      historicalPerformance: number;
      improvementSuggestions: string[];
    };
  };
}

export class ViralHashtagEngine {

  /**
   * Generate viral hashtag strategy using advanced RSS analysis and real-time trending data
   */
  async generateViralHashtags(
    businessType: string,
    businessName: string,
    location: string,
    platform: string,
    services?: string,
    targetAudience?: string
  ): Promise<ViralHashtagStrategy> {

    try {
      // 🚀 ENHANCED: Use Advanced Hashtag Analyzer for superior RSS integration
      const analysisContext: AnalysisContext = {
        businessType,
        businessName,
        location,
        platform,
        services,
        targetAudience
      };

      // Get advanced hashtag analysis with RSS integration
      const advancedAnalysis = await advancedHashtagAnalyzer.analyzeHashtagTrends(analysisContext);

      // Get traditional trending data as backup
      const trendingData = await trendingEnhancer.getTrendingEnhancement({
        businessType,
        location,
        platform,
        targetAudience
      });

      // 🔥 ENHANCED: Generate hashtag categories using advanced analysis
      const trending = this.extractTrendingFromAnalysis(advancedAnalysis, trendingData);
      const viral = this.getEnhancedViralHashtags(businessType, platform, advancedAnalysis);
      const niche = this.getEnhancedNicheHashtags(businessType, services, advancedAnalysis);
      const location_tags = this.getEnhancedLocationHashtags(location, advancedAnalysis);
      const community = this.getCommunityHashtags(businessType, targetAudience);
      const seasonal = this.getSeasonalHashtags();
      const platform_tags = this.getEnhancedPlatformHashtags(platform, advancedAnalysis);

      // 🧠 ENHANCED: Use Intelligent Hashtag Mixer for optimal combination
      const mixingContext: MixingContext = {
        businessType,
        businessName,
        location,
        platform,
        postContent: undefined, // Could be passed from content generation
        targetAudience,
        services,
        priority: 'balanced', // Could be configurable
        ...intelligentHashtagMixer.getOptimalWeights(businessType, platform)
      };

      // Create the current strategy for mixing
      const currentStrategy = {
        trending,
        viral,
        niche,
        location: location_tags,
        community,
        seasonal,
        platform: platform_tags,
        total: [] // Will be filled by mixer
      };

      // Apply intelligent mixing
      const intelligentMix = await intelligentHashtagMixer.createIntelligentMix(
        advancedAnalysis,
        currentStrategy,
        mixingContext
      );

      // 🧠 ENHANCED: Get learned recommendations from performance tracking
      const learnedRecommendations = hashtagPerformanceTracker.getLearnedRecommendations(
        businessType,
        platform,
        location,
        5
      );

      // 📊 Get performance insights for improvement suggestions
      const performanceInsights = hashtagPerformanceTracker.getPerformanceInsights(
        businessType,
        platform,
        location
      );

      // 🎯 Integrate learned recommendations with intelligent mix
      const enhancedTotal = this.integrateLearnedRecommendations(
        intelligentMix.final,
        learnedRecommendations,
        performanceInsights
      );

      // Use the enhanced hashtags as the final total
      const total = enhancedTotal;

      // Calculate confidence score based on RSS data quality
      const confidenceScore = this.calculateConfidenceScore(advancedAnalysis);

      return {
        trending,
        viral,
        niche,
        location: location_tags,
        community,
        seasonal,
        platform: platform_tags,
        total,
        analytics: {
          topPerformers: advancedAnalysis.finalRecommendations.slice(0, 5),
          emergingTrends: advancedAnalysis.emergingTrends.map(t => t.hashtag).slice(0, 3),
          businessOptimized: advancedAnalysis.businessOptimized.map(b => b.hashtag).slice(0, 3),
          rssSourced: this.extractRSSSourcedHashtags(advancedAnalysis),
          confidenceScore,

          // Include intelligent mixing analytics
          mixingStrategy: {
            rssInfluence: intelligentMix.analytics.rssInfluence,
            businessRelevance: intelligentMix.analytics.businessRelevance,
            trendingScore: intelligentMix.analytics.trendingScore,
            diversityScore: intelligentMix.analytics.diversityScore,
            confidenceLevel: intelligentMix.analytics.confidenceLevel,
            algorithm: intelligentMix.analytics.mixingStrategy
          },

          // Include performance learning insights
          learningInsights: {
            learnedRecommendations,
            historicalPerformance: this.calculateHistoricalPerformance(performanceInsights),
            improvementSuggestions: performanceInsights.learningRecommendations
          }
        }
      };

    } catch (error) {
      return this.getFallbackHashtags(businessType, location, platform);
    }
  }

  /**
   * Extract trending hashtags from advanced analysis
   */
  private extractTrendingFromAnalysis(advancedAnalysis: any, fallbackData: any): string[] {
    // Prioritize RSS-sourced trending hashtags
    const rssHashtags = advancedAnalysis.topTrending
      .filter((analysis: any) => analysis.sources.some((source: string) =>
        source !== 'business_generator' && source !== 'fallback'
      ))
      .map((analysis: any) => analysis.hashtag);

    // Add high-scoring emerging trends
    const emergingHashtags = advancedAnalysis.emergingTrends
      .filter((analysis: any) => analysis.trendingScore >= 3)
      .map((analysis: any) => analysis.hashtag);

    // Combine with fallback data if needed
    const combined = [...rssHashtags, ...emergingHashtags, ...fallbackData.hashtags];

    // Remove duplicates and return top trending
    return Array.from(new Set(combined)).slice(0, 8);
  }

  /**
   * Get enhanced viral hashtags using RSS analysis
   */
  private getEnhancedViralHashtags(businessType: string, platform: string, advancedAnalysis: any): string[] {
    // Get traditional viral hashtags
    const traditionalViral = this.getViralHashtags(businessType, platform);

    // Add high-engagement hashtags from RSS analysis
    const rssViral = advancedAnalysis.topTrending
      .filter((analysis: any) => analysis.engagementPotential >= 7)
      .map((analysis: any) => analysis.hashtag);

    // Combine and prioritize
    const combined = [...rssViral.slice(0, 4), ...traditionalViral.slice(0, 3)];
    return Array.from(new Set(combined)).slice(0, 7);
  }

  /**
   * Get enhanced niche hashtags using business analysis
   */
  private getEnhancedNicheHashtags(businessType: string, services: string | undefined, advancedAnalysis: any): string[] {
    // Get traditional niche hashtags
    const traditionalNiche = this.getNicheHashtags(businessType, services);

    // Add business-optimized hashtags from RSS analysis
    const rssNiche = advancedAnalysis.businessOptimized
      .filter((analysis: any) => analysis.businessRelevance >= 6)
      .map((analysis: any) => analysis.hashtag);

    // Combine and prioritize
    const combined = [...rssNiche.slice(0, 3), ...traditionalNiche.slice(0, 3)];
    return Array.from(new Set(combined)).slice(0, 6);
  }

  /**
   * Get enhanced location hashtags using location analysis
   */
  private getEnhancedLocationHashtags(location: string, advancedAnalysis: any): string[] {
    // Get traditional location hashtags
    const traditionalLocation = this.getLocationHashtags(location);

    // Add location-specific hashtags from RSS analysis
    const rssLocation = advancedAnalysis.locationSpecific
      .filter((analysis: any) => analysis.locationRelevance >= 6)
      .map((analysis: any) => analysis.hashtag);

    // Combine and prioritize
    const combined = [...rssLocation.slice(0, 2), ...traditionalLocation.slice(0, 2)];
    return Array.from(new Set(combined)).slice(0, 4);
  }

  /**
   * Get enhanced platform hashtags using platform analysis
   */
  private getEnhancedPlatformHashtags(platform: string, advancedAnalysis: any): string[] {
    // Get traditional platform hashtags
    const traditionalPlatform = this.getPlatformHashtags(platform);

    // Add platform-optimized hashtags from RSS analysis
    const rssPlatform = advancedAnalysis.platformNative
      .filter((analysis: any) => analysis.platformOptimization >= 6)
      .map((analysis: any) => analysis.hashtag);

    // Combine and prioritize
    const combined = [...rssPlatform.slice(0, 2), ...traditionalPlatform.slice(0, 2)];
    return Array.from(new Set(combined)).slice(0, 4);
  }

  /**
   * Intelligent hashtag mixing algorithm
   */
  private intelligentHashtagMixing(hashtags: string[], advancedAnalysis: any): string[] {
    // Create a scoring system for hashtag selection
    const hashtagScores = new Map<string, number>();

    // Score each hashtag based on multiple factors
    hashtags.forEach(hashtag => {
      let score = 0;

      // Find analysis for this hashtag
      const analysis = this.findHashtagAnalysis(hashtag, advancedAnalysis);

      if (analysis) {
        score += analysis.relevanceScore * 0.3;
        score += analysis.trendingScore * 0.25;
        score += analysis.businessRelevance * 0.2;
        score += analysis.engagementPotential * 0.15;
        score += analysis.platformOptimization * 0.1;
      } else {
        // Default score for hashtags not in analysis
        score = 5;
      }

      hashtagScores.set(hashtag, score);
    });

    // Sort by score and return top hashtags
    const sortedHashtags = Array.from(hashtagScores.entries())
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .map(([hashtag]) => hashtag);

    return sortedHashtags.slice(0, 15);
  }

  /**
   * Find hashtag analysis in advanced analysis results
   */
  private findHashtagAnalysis(hashtag: string, advancedAnalysis: any): any {
    const allAnalyses = [
      ...advancedAnalysis.topTrending,
      ...advancedAnalysis.businessOptimized,
      ...advancedAnalysis.locationSpecific,
      ...advancedAnalysis.platformNative,
      ...advancedAnalysis.emergingTrends
    ];

    return allAnalyses.find((analysis: any) => analysis.hashtag === hashtag);
  }

  /**
   * Calculate confidence score based on RSS data quality
   */
  private calculateConfidenceScore(advancedAnalysis: any): number {
    let score = 0;
    let factors = 0;

    // Factor 1: Number of RSS sources
    const rssSourceCount = this.countRSSSources(advancedAnalysis);
    if (rssSourceCount > 0) {
      score += Math.min(rssSourceCount * 2, 10);
      factors++;
    }

    // Factor 2: Quality of trending data
    const trendingQuality = advancedAnalysis.topTrending.length > 0 ? 8 : 3;
    score += trendingQuality;
    factors++;

    // Factor 3: Business relevance coverage
    const businessCoverage = advancedAnalysis.businessOptimized.length >= 3 ? 9 : 5;
    score += businessCoverage;
    factors++;

    // Factor 4: Emerging trends availability
    const emergingTrends = advancedAnalysis.emergingTrends.length > 0 ? 7 : 4;
    score += emergingTrends;
    factors++;

    return factors > 0 ? Math.round(score / factors) : 5;
  }

  /**
   * Count RSS sources in analysis
   */
  private countRSSSources(advancedAnalysis: any): number {
    const sources = new Set<string>();

    const allAnalyses = [
      ...advancedAnalysis.topTrending,
      ...advancedAnalysis.businessOptimized,
      ...advancedAnalysis.locationSpecific,
      ...advancedAnalysis.platformNative,
      ...advancedAnalysis.emergingTrends
    ];

    allAnalyses.forEach((analysis: any) => {
      analysis.sources.forEach((source: string) => {
        if (source !== 'business_generator' && source !== 'fallback') {
          sources.add(source);
        }
      });
    });

    return sources.size;
  }

  /**
   * Extract RSS-sourced hashtags
   */
  private extractRSSSourcedHashtags(advancedAnalysis: any): string[] {
    const allAnalyses = [
      ...advancedAnalysis.topTrending,
      ...advancedAnalysis.businessOptimized,
      ...advancedAnalysis.locationSpecific,
      ...advancedAnalysis.platformNative,
      ...advancedAnalysis.emergingTrends
    ];

    return allAnalyses
      .filter((analysis: any) =>
        analysis.sources.some((source: string) =>
          source !== 'business_generator' && source !== 'fallback'
        )
      )
      .map((analysis: any) => analysis.hashtag)
      .slice(0, 8);
  }

  /**
   * Get high-engagement viral hashtags
   */
  private getViralHashtags(businessType: string, platform: string): string[] {
    const viralHashtags = {
      general: ['#viral', '#trending', '#fyp', '#explore', '#discover', '#amazing', '#incredible', '#mustsee'],
      instagram: ['#instagood', '#photooftheday', '#instadaily', '#reels', '#explorepage'],
      tiktok: ['#fyp', '#foryou', '#viral', '#trending', '#foryoupage'],
      facebook: ['#viral', '#share', '#community', '#local', '#trending'],
      twitter: ['#trending', '#viral', '#breaking', '#news', '#update'],
      linkedin: ['#professional', '#business', '#networking', '#career', '#industry']
    };

    const general = viralHashtags.general.sort(() => 0.5 - Math.random()).slice(0, 4);
    const platformSpecific = viralHashtags[platform.toLowerCase() as keyof typeof viralHashtags] || [];

    return [...general, ...platformSpecific.slice(0, 3)];
  }

  /**
   * Get business-specific niche hashtags
   */
  private getNicheHashtags(businessType: string, services?: string): string[] {
    const nicheMap: Record<string, string[]> = {
      restaurant: ['#foodie', '#delicious', '#freshfood', '#localeats', '#foodlover', '#tasty', '#chef', '#dining'],
      bakery: ['#freshbaked', '#artisan', '#homemade', '#bakery', '#pastry', '#bread', '#dessert', '#sweet'],
      fitness: ['#fitness', '#workout', '#health', '#gym', '#strong', '#motivation', '#fitlife', '#training'],
      beauty: ['#beauty', '#skincare', '#makeup', '#glam', '#selfcare', '#beautiful', '#style', '#cosmetics'],
      tech: ['#tech', '#innovation', '#digital', '#software', '#technology', '#startup', '#coding', '#ai'],
      retail: ['#shopping', '#fashion', '#style', '#sale', '#newcollection', '#boutique', '#trendy', '#deals']
    };

    const baseNiche = nicheMap[businessType.toLowerCase()] || ['#business', '#service', '#quality', '#professional'];

    // Add service-specific hashtags if provided
    if (services) {
      const serviceWords = services.toLowerCase().split(/[,\s]+/).filter(word => word.length > 3);
      const serviceHashtags = serviceWords.slice(0, 3).map(word => `#${word.replace(/[^a-z0-9]/g, '')}`);
      baseNiche.push(...serviceHashtags);
    }

    return baseNiche.slice(0, 6);
  }

  /**
   * Get location-based hashtags
   */
  private getLocationHashtags(location: string): string[] {
    const locationParts = location.split(',').map(part => part.trim());
    const hashtags: string[] = [];

    locationParts.forEach(part => {
      const cleanLocation = part.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '');
      if (cleanLocation.length > 2) {
        hashtags.push(`#${cleanLocation.toLowerCase()}`);
      }
    });

    // Add generic location hashtags
    hashtags.push('#local', '#community', '#neighborhood');

    return hashtags.slice(0, 5);
  }

  /**
   * Get community engagement hashtags
   */
  private getCommunityHashtags(businessType: string, targetAudience?: string): string[] {
    const communityHashtags = ['#community', '#local', '#support', '#family', '#friends', '#together', '#love'];

    if (targetAudience) {
      const audienceWords = targetAudience.toLowerCase().split(/[,\s]+/).filter(word => word.length > 3);
      const audienceHashtags = audienceWords.slice(0, 2).map(word => `#${word.replace(/[^a-z0-9]/g, '')}`);
      communityHashtags.push(...audienceHashtags);
    }

    return communityHashtags.slice(0, 5);
  }

  /**
   * Get seasonal/timely hashtags
   */
  private getSeasonalHashtags(): string[] {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();

    // Seasonal hashtags based on current time
    const seasonal: Record<number, string[]> = {
      0: ['#newyear', '#january', '#fresh', '#newbeginnings'], // January
      1: ['#february', '#love', '#valentine', '#winter'], // February  
      2: ['#march', '#spring', '#fresh', '#bloom'], // March
      3: ['#april', '#spring', '#easter', '#renewal'], // April
      4: ['#may', '#spring', '#mothers', '#bloom'], // May
      5: ['#june', '#summer', '#fathers', '#sunshine'], // June
      6: ['#july', '#summer', '#vacation', '#hot'], // July
      7: ['#august', '#summer', '#vacation', '#sunny'], // August
      8: ['#september', '#fall', '#autumn', '#backtoschool'], // September
      9: ['#october', '#fall', '#halloween', '#autumn'], // October
      10: ['#november', '#thanksgiving', '#grateful', '#fall'], // November
      11: ['#december', '#christmas', '#holiday', '#winter'] // December
    };

    return seasonal[month] || ['#today', '#now', '#current'];
  }

  /**
   * Get platform-specific hashtags
   */
  private getPlatformHashtags(platform: string): string[] {
    const platformHashtags: Record<string, string[]> = {
      instagram: ['#instagram', '#insta', '#ig'],
      facebook: ['#facebook', '#fb', '#social'],
      twitter: ['#twitter', '#tweet', '#x'],
      linkedin: ['#linkedin', '#professional', '#business'],
      tiktok: ['#tiktok', '#tt', '#video']
    };

    return platformHashtags[platform.toLowerCase()] || ['#social', '#media'];
  }

  /**
   * Get business-relevant trending hashtags
   */
  private getBusinessTrendingHashtags(businessType: string, platform: string): string[] {
    // This would integrate with real trending APIs in production
    const trendingByBusiness: Record<string, string[]> = {
      restaurant: ['#foodtrends', '#eats2024', '#localfood', '#foodie'],
      fitness: ['#fitness2024', '#healthtrends', '#workout', '#wellness'],
      beauty: ['#beautytrends', '#skincare2024', '#makeup', '#selfcare'],
      tech: ['#tech2024', '#innovation', '#ai', '#digital'],
      retail: ['#fashion2024', '#shopping', '#style', '#trends']
    };

    return trendingByBusiness[businessType.toLowerCase()] || ['#trending', '#popular', '#new'];
  }

  /**
   * Optimize hashtag selection for maximum virality
   */
  private optimizeForVirality(hashtags: string[]): string[] {
    // Remove duplicates
    const unique = Array.from(new Set(hashtags));

    // Sort by estimated engagement potential (simplified scoring)
    const scored = unique.map(tag => ({
      tag,
      score: this.calculateViralScore(tag)
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, 15).map(item => item.tag);
  }

  /**
   * Calculate viral potential score for a hashtag
   */
  private calculateViralScore(hashtag: string): number {
    let score = 0;

    // High-engagement keywords get bonus points
    const viralKeywords = ['viral', 'trending', 'fyp', 'explore', 'amazing', 'incredible'];
    if (viralKeywords.some(keyword => hashtag.toLowerCase().includes(keyword))) {
      score += 10;
    }

    // Platform-specific hashtags get bonus
    const platformKeywords = ['instagram', 'tiktok', 'reels', 'story'];
    if (platformKeywords.some(keyword => hashtag.toLowerCase().includes(keyword))) {
      score += 5;
    }

    // Local hashtags get moderate bonus
    const localKeywords = ['local', 'community', 'neighborhood'];
    if (localKeywords.some(keyword => hashtag.toLowerCase().includes(keyword))) {
      score += 3;
    }

    // Length penalty (very long hashtags perform worse)
    if (hashtag.length > 20) score -= 2;
    if (hashtag.length > 30) score -= 5;

    return score + Math.random(); // Add randomness for variety
  }

  /**
   * Enhanced fallback hashtags when trending data fails
   */
  private getFallbackHashtags(businessType: string, location: string, platform: string): ViralHashtagStrategy {
    const fallbackTotal = [
      '#trending', '#viral', `#${businessType.replace(/\s+/g, '')}`, '#local', '#community',
      '#amazing', '#quality', '#professional', '#popular', '#new',
      '#support', '#service', `#${platform.toLowerCase()}`, '#today', '#love'
    ];

    return {
      trending: ['#trending', '#viral', '#popular', '#new'],
      viral: ['#amazing', '#incredible', '#mustsee', '#wow'],
      niche: [`#${businessType.replace(/\s+/g, '')}`, '#quality', '#professional', '#service'],
      location: ['#local', '#community', `#${location.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`],
      community: ['#community', '#support', '#family', '#love'],
      seasonal: ['#today', '#now'],
      platform: [`#${platform.toLowerCase()}`],
      total: fallbackTotal,
      analytics: {
        topPerformers: fallbackTotal.slice(0, 5),
        emergingTrends: ['#trending', '#viral', '#new'],
        businessOptimized: [`#${businessType.replace(/\s+/g, '')}`, '#quality', '#professional'],
        rssSourced: [], // No RSS data in fallback
        confidenceScore: 3 // Low confidence for fallback
      }
    };
  }

  /**
   * 🧠 ENHANCED: Integrate learned recommendations with intelligent mix
   */
  private integrateLearnedRecommendations(
    intelligentMix: string[],
    learnedRecommendations: Array<{ hashtag: string; confidence: number; reason: string }>,
    performanceInsights: any
  ): string[] {
    const enhancedHashtags = [...intelligentMix];

    // Replace low-confidence hashtags with high-confidence learned recommendations
    const highConfidenceRecommendations = learnedRecommendations.filter(rec => rec.confidence >= 0.7);

    if (highConfidenceRecommendations.length > 0) {
      // Find hashtags in the mix that might be replaced
      const replaceableIndices: number[] = [];

      // Look for hashtags that aren't in the top performers
      const topPerformers = performanceInsights.topPerformingHashtags.map((h: any) => h.hashtag);

      enhancedHashtags.forEach((hashtag, index) => {
        if (!topPerformers.includes(hashtag) && index >= 10) { // Only replace from tertiary hashtags
          replaceableIndices.push(index);
        }
      });

      // Replace up to 3 hashtags with learned recommendations
      const replacementCount = Math.min(
        highConfidenceRecommendations.length,
        replaceableIndices.length,
        3
      );

      for (let i = 0; i < replacementCount; i++) {
        const indexToReplace = replaceableIndices[i];
        const recommendation = highConfidenceRecommendations[i];

        // Only replace if the recommendation isn't already in the mix
        if (!enhancedHashtags.includes(recommendation.hashtag)) {
          enhancedHashtags[indexToReplace] = recommendation.hashtag;
        }
      }
    }

    return enhancedHashtags;
  }

  /**
   * Calculate historical performance score
   */
  private calculateHistoricalPerformance(performanceInsights: any): number {
    if (!performanceInsights.topPerformingHashtags.length) return 0;

    const avgEngagement = performanceInsights.topPerformingHashtags
      .reduce((sum: number, hashtag: any) => sum + hashtag.avgEngagement, 0) /
      performanceInsights.topPerformingHashtags.length;

    const avgSuccessRate = performanceInsights.topPerformingHashtags
      .reduce((sum: number, hashtag: any) => sum + hashtag.successRate, 0) /
      performanceInsights.topPerformingHashtags.length;

    // Weighted score: 70% engagement, 30% success rate
    return Math.round((avgEngagement * 0.7 + avgSuccessRate * 0.3) * 10) / 10;
  }

  /**
   * 📊 ENHANCED: Method to track hashtag performance after post creation
   */
  public trackHashtagPerformance(
    hashtags: string[],
    platform: string,
    businessType: string,
    location: string,
    engagement: {
      likes: number;
      comments: number;
      shares: number;
      views?: number;
      clicks?: number;
      total: number;
    },
    success: boolean = false
  ): void {
    const postData = {
      postId: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      hashtags,
      platform,
      businessType,
      location,
      timestamp: new Date(),
      engagement,
      success
    };

    hashtagPerformanceTracker.trackPostPerformance(postData);
  }

  /**
   * 📈 Get performance insights for hashtag optimization
   */
  public getHashtagPerformanceInsights(
    businessType?: string,
    platform?: string,
    location?: string
  ) {
    return hashtagPerformanceTracker.getPerformanceInsights(businessType, platform, location);
  }

  /**
   * 🎯 Get learned hashtag recommendations
   */
  public getLearnedHashtagRecommendations(
    businessType: string,
    platform: string,
    location: string,
    count: number = 10
  ) {
    return hashtagPerformanceTracker.getLearnedRecommendations(businessType, platform, location, count);
  }
}

// Export singleton instance
export const viralHashtagEngine = new ViralHashtagEngine();
