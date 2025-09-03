/**
 * Hashtag Performance Tracking and Learning System
 * Tracks hashtag performance and learns from successful combinations
 * to improve future hashtag generation with machine learning insights
 */

export interface HashtagPerformanceData {
  hashtag: string;
  usageCount: number;
  totalEngagement: number;
  averageEngagement: number;
  platforms: Record<string, {
    usage: number;
    engagement: number;
    avgEngagement: number;
  }>;
  businessTypes: Record<string, {
    usage: number;
    engagement: number;
    avgEngagement: number;
  }>;
  locations: Record<string, {
    usage: number;
    engagement: number;
    avgEngagement: number;
  }>;
  timePatterns: {
    hourly: Record<number, { usage: number; engagement: number }>;
    daily: Record<number, { usage: number; engagement: number }>;
    monthly: Record<number, { usage: number; engagement: number }>;
  };
  lastUsed: Date;
  firstUsed: Date;
  trendingScore: number;
  successRate: number; // Percentage of successful posts using this hashtag
}

export interface HashtagCombinationData {
  combination: string[]; // Array of hashtags used together
  usageCount: number;
  totalEngagement: number;
  averageEngagement: number;
  successRate: number;
  businessType: string;
  platform: string;
  location: string;
  lastUsed: Date;
  performanceScore: number;
}

export interface PerformanceInsights {
  topPerformingHashtags: Array<{
    hashtag: string;
    avgEngagement: number;
    successRate: number;
    recommendationStrength: 'high' | 'medium' | 'low';
  }>;
  
  bestCombinations: Array<{
    hashtags: string[];
    avgEngagement: number;
    successRate: number;
    context: string;
  }>;
  
  platformInsights: Record<string, {
    bestHashtags: string[];
    avgEngagement: number;
    optimalCount: number;
  }>;
  
  businessTypeInsights: Record<string, {
    bestHashtags: string[];
    avgEngagement: number;
    successPatterns: string[];
  }>;
  
  temporalInsights: {
    bestTimes: Array<{ hour: number; day: number; performance: number }>;
    seasonalTrends: Record<string, string[]>;
  };
  
  learningRecommendations: string[];
}

export interface PostPerformanceData {
  postId: string;
  hashtags: string[];
  platform: string;
  businessType: string;
  location: string;
  timestamp: Date;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
    clicks?: number;
    total: number;
  };
  reach?: number;
  impressions?: number;
  success: boolean; // Whether the post met success criteria
}

export class HashtagPerformanceTracker {
  private performanceData: Map<string, HashtagPerformanceData> = new Map();
  private combinationData: Map<string, HashtagCombinationData> = new Map();
  private postHistory: PostPerformanceData[] = [];
  
  private readonly storageKey = 'hashtag_performance_data';
  private readonly combinationStorageKey = 'hashtag_combination_data';
  private readonly postHistoryKey = 'post_performance_history';

  constructor() {
    this.loadPerformanceData();
  }

  /**
   * Track performance of a post with its hashtags
   */
  public trackPostPerformance(postData: PostPerformanceData): void {
    // Store post data
    this.postHistory.push(postData);
    
    // Update individual hashtag performance
    postData.hashtags.forEach(hashtag => {
      this.updateHashtagPerformance(hashtag, postData);
    });

    // Update combination performance
    this.updateCombinationPerformance(postData);

    // Save to storage
    this.savePerformanceData();
  }

  /**
   * Get performance insights for hashtag optimization
   */
  public getPerformanceInsights(
    businessType?: string,
    platform?: string,
    location?: string
  ): PerformanceInsights {
    const filteredData = this.filterPerformanceData(businessType, platform, location);
    
    return {
      topPerformingHashtags: this.getTopPerformingHashtags(filteredData),
      bestCombinations: this.getBestCombinations(businessType, platform, location),
      platformInsights: this.getPlatformInsights(),
      businessTypeInsights: this.getBusinessTypeInsights(),
      temporalInsights: this.getTemporalInsights(),
      learningRecommendations: this.generateLearningRecommendations(filteredData)
    };
  }

  /**
   * Get hashtag recommendations based on learning
   */
  public getLearnedRecommendations(
    businessType: string,
    platform: string,
    location: string,
    count: number = 10
  ): Array<{ hashtag: string; confidence: number; reason: string }> {
    const recommendations: Array<{ hashtag: string; confidence: number; reason: string }> = [];
    
    // Get hashtags that performed well for similar contexts
    const contextualData = Array.from(this.performanceData.values())
      .filter(data => {
        const businessMatch = data.businessTypes[businessType]?.avgEngagement > 0;
        const platformMatch = data.platforms[platform]?.avgEngagement > 0;
        const locationMatch = data.locations[location]?.avgEngagement > 0;
        
        return businessMatch || platformMatch || locationMatch;
      })
      .sort((a, b) => b.averageEngagement - a.averageEngagement);

    contextualData.slice(0, count).forEach(data => {
      let confidence = 0;
      let reason = '';

      // Calculate confidence based on performance and context match
      if (data.businessTypes[businessType]) {
        confidence += 0.4 * (data.businessTypes[businessType].avgEngagement / 100);
        reason += `Strong performance in ${businessType} (${data.businessTypes[businessType].avgEngagement.toFixed(1)} avg engagement). `;
      }

      if (data.platforms[platform]) {
        confidence += 0.3 * (data.platforms[platform].avgEngagement / 100);
        reason += `Good ${platform} performance (${data.platforms[platform].avgEngagement.toFixed(1)} avg). `;
      }

      if (data.locations[location]) {
        confidence += 0.2 * (data.locations[location].avgEngagement / 100);
        reason += `Local relevance in ${location}. `;
      }

      confidence += 0.1 * data.successRate;
      reason += `${data.successRate.toFixed(1)}% success rate over ${data.usageCount} uses.`;

      recommendations.push({
        hashtag: data.hashtag,
        confidence: Math.min(confidence, 1),
        reason: reason.trim()
      });
    });

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Update individual hashtag performance
   */
  private updateHashtagPerformance(hashtag: string, postData: PostPerformanceData): void {
    let data = this.performanceData.get(hashtag);
    
    if (!data) {
      data = {
        hashtag,
        usageCount: 0,
        totalEngagement: 0,
        averageEngagement: 0,
        platforms: {},
        businessTypes: {},
        locations: {},
        timePatterns: {
          hourly: {},
          daily: {},
          monthly: {}
        },
        lastUsed: postData.timestamp,
        firstUsed: postData.timestamp,
        trendingScore: 0,
        successRate: 0
      };
    }

    // Update basic metrics
    data.usageCount++;
    data.totalEngagement += postData.engagement.total;
    data.averageEngagement = data.totalEngagement / data.usageCount;
    data.lastUsed = postData.timestamp;

    // Update platform performance
    if (!data.platforms[postData.platform]) {
      data.platforms[postData.platform] = { usage: 0, engagement: 0, avgEngagement: 0 };
    }
    data.platforms[postData.platform].usage++;
    data.platforms[postData.platform].engagement += postData.engagement.total;
    data.platforms[postData.platform].avgEngagement = 
      data.platforms[postData.platform].engagement / data.platforms[postData.platform].usage;

    // Update business type performance
    if (!data.businessTypes[postData.businessType]) {
      data.businessTypes[postData.businessType] = { usage: 0, engagement: 0, avgEngagement: 0 };
    }
    data.businessTypes[postData.businessType].usage++;
    data.businessTypes[postData.businessType].engagement += postData.engagement.total;
    data.businessTypes[postData.businessType].avgEngagement = 
      data.businessTypes[postData.businessType].engagement / data.businessTypes[postData.businessType].usage;

    // Update location performance
    if (!data.locations[postData.location]) {
      data.locations[postData.location] = { usage: 0, engagement: 0, avgEngagement: 0 };
    }
    data.locations[postData.location].usage++;
    data.locations[postData.location].engagement += postData.engagement.total;
    data.locations[postData.location].avgEngagement = 
      data.locations[postData.location].engagement / data.locations[postData.location].usage;

    // Update time patterns
    const hour = postData.timestamp.getHours();
    const day = postData.timestamp.getDay();
    const month = postData.timestamp.getMonth();

    if (!data.timePatterns.hourly[hour]) {
      data.timePatterns.hourly[hour] = { usage: 0, engagement: 0 };
    }
    data.timePatterns.hourly[hour].usage++;
    data.timePatterns.hourly[hour].engagement += postData.engagement.total;

    if (!data.timePatterns.daily[day]) {
      data.timePatterns.daily[day] = { usage: 0, engagement: 0 };
    }
    data.timePatterns.daily[day].usage++;
    data.timePatterns.daily[day].engagement += postData.engagement.total;

    if (!data.timePatterns.monthly[month]) {
      data.timePatterns.monthly[month] = { usage: 0, engagement: 0 };
    }
    data.timePatterns.monthly[month].usage++;
    data.timePatterns.monthly[month].engagement += postData.engagement.total;

    // Update success rate
    const successfulPosts = this.postHistory.filter(post => 
      post.hashtags.includes(hashtag) && post.success
    ).length;
    data.successRate = (successfulPosts / data.usageCount) * 100;

    this.performanceData.set(hashtag, data);
  }

  /**
   * Update combination performance
   */
  private updateCombinationPerformance(postData: PostPerformanceData): void {
    const combinationKey = postData.hashtags.sort().join('|');
    let data = this.combinationData.get(combinationKey);

    if (!data) {
      data = {
        combination: postData.hashtags.sort(),
        usageCount: 0,
        totalEngagement: 0,
        averageEngagement: 0,
        successRate: 0,
        businessType: postData.businessType,
        platform: postData.platform,
        location: postData.location,
        lastUsed: postData.timestamp,
        performanceScore: 0
      };
    }

    data.usageCount++;
    data.totalEngagement += postData.engagement.total;
    data.averageEngagement = data.totalEngagement / data.usageCount;
    data.lastUsed = postData.timestamp;

    // Calculate success rate for this combination
    const combinationPosts = this.postHistory.filter(post => 
      post.hashtags.sort().join('|') === combinationKey
    );
    const successfulCombinationPosts = combinationPosts.filter(post => post.success);
    data.successRate = (successfulCombinationPosts.length / combinationPosts.length) * 100;

    // Calculate performance score (weighted average of engagement and success rate)
    data.performanceScore = (data.averageEngagement * 0.7) + (data.successRate * 0.3);

    this.combinationData.set(combinationKey, data);
  }

  /**
   * Get top performing hashtags
   */
  private getTopPerformingHashtags(
    data: HashtagPerformanceData[]
  ): PerformanceInsights['topPerformingHashtags'] {
    return data
      .filter(d => d.usageCount >= 3) // Minimum usage for reliability
      .sort((a, b) => b.averageEngagement - a.averageEngagement)
      .slice(0, 20)
      .map(d => ({
        hashtag: d.hashtag,
        avgEngagement: d.averageEngagement,
        successRate: d.successRate,
        recommendationStrength: this.getRecommendationStrength(d)
      }));
  }

  /**
   * Get best hashtag combinations
   */
  private getBestCombinations(
    businessType?: string,
    platform?: string,
    location?: string
  ): PerformanceInsights['bestCombinations'] {
    return Array.from(this.combinationData.values())
      .filter(data => {
        if (businessType && data.businessType !== businessType) return false;
        if (platform && data.platform !== platform) return false;
        if (location && data.location !== location) return false;
        return data.usageCount >= 2;
      })
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 10)
      .map(data => ({
        hashtags: data.combination,
        avgEngagement: data.averageEngagement,
        successRate: data.successRate,
        context: `${data.businessType} on ${data.platform} in ${data.location}`
      }));
  }

  /**
   * Get platform-specific insights
   */
  private getPlatformInsights(): PerformanceInsights['platformInsights'] {
    const insights: PerformanceInsights['platformInsights'] = {};
    
    // Group data by platform
    const platformData: Record<string, HashtagPerformanceData[]> = {};
    
    this.performanceData.forEach(data => {
      Object.keys(data.platforms).forEach(platform => {
        if (!platformData[platform]) platformData[platform] = [];
        platformData[platform].push(data);
      });
    });

    // Generate insights for each platform
    Object.entries(platformData).forEach(([platform, data]) => {
      const sortedData = data
        .filter(d => d.platforms[platform].usage >= 2)
        .sort((a, b) => b.platforms[platform].avgEngagement - a.platforms[platform].avgEngagement);

      insights[platform] = {
        bestHashtags: sortedData.slice(0, 10).map(d => d.hashtag),
        avgEngagement: sortedData.reduce((sum, d) => sum + d.platforms[platform].avgEngagement, 0) / sortedData.length,
        optimalCount: this.calculateOptimalHashtagCount(platform)
      };
    });

    return insights;
  }

  /**
   * Get business type insights
   */
  private getBusinessTypeInsights(): PerformanceInsights['businessTypeInsights'] {
    const insights: PerformanceInsights['businessTypeInsights'] = {};
    
    // Group data by business type
    const businessData: Record<string, HashtagPerformanceData[]> = {};
    
    this.performanceData.forEach(data => {
      Object.keys(data.businessTypes).forEach(businessType => {
        if (!businessData[businessType]) businessData[businessType] = [];
        businessData[businessType].push(data);
      });
    });

    // Generate insights for each business type
    Object.entries(businessData).forEach(([businessType, data]) => {
      const sortedData = data
        .filter(d => d.businessTypes[businessType].usage >= 2)
        .sort((a, b) => b.businessTypes[businessType].avgEngagement - a.businessTypes[businessType].avgEngagement);

      insights[businessType] = {
        bestHashtags: sortedData.slice(0, 8).map(d => d.hashtag),
        avgEngagement: sortedData.reduce((sum, d) => sum + d.businessTypes[businessType].avgEngagement, 0) / sortedData.length,
        successPatterns: this.identifySuccessPatterns(businessType)
      };
    });

    return insights;
  }

  /**
   * Get temporal insights
   */
  private getTemporalInsights(): PerformanceInsights['temporalInsights'] {
    // Analyze best posting times
    const timePerformance: Array<{ hour: number; day: number; performance: number }> = [];
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const posts = this.postHistory.filter(post => 
          post.timestamp.getDay() === day && post.timestamp.getHours() === hour
        );
        
        if (posts.length >= 3) {
          const avgEngagement = posts.reduce((sum, post) => sum + post.engagement.total, 0) / posts.length;
          timePerformance.push({ hour, day, performance: avgEngagement });
        }
      }
    }

    const bestTimes = timePerformance
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 10);

    // Seasonal trends (simplified)
    const seasonalTrends = {
      spring: this.getSeasonalHashtags([2, 3, 4]),
      summer: this.getSeasonalHashtags([5, 6, 7]),
      fall: this.getSeasonalHashtags([8, 9, 10]),
      winter: this.getSeasonalHashtags([11, 0, 1])
    };

    return {
      bestTimes,
      seasonalTrends
    };
  }

  /**
   * Generate learning recommendations
   */
  private generateLearningRecommendations(data: HashtagPerformanceData[]): string[] {
    const recommendations: string[] = [];

    // Analyze performance patterns
    const highPerformers = data.filter(d => d.averageEngagement > 50 && d.successRate > 70);
    const lowPerformers = data.filter(d => d.averageEngagement < 10 || d.successRate < 30);

    if (highPerformers.length > 0) {
      recommendations.push(`Focus on high-performing hashtags like ${highPerformers.slice(0, 3).map(d => d.hashtag).join(', ')}`);
    }

    if (lowPerformers.length > 5) {
      recommendations.push(`Consider replacing underperforming hashtags: ${lowPerformers.slice(0, 3).map(d => d.hashtag).join(', ')}`);
    }

    // Platform-specific recommendations
    const platformPerformance = this.analyzePlatformPerformance();
    Object.entries(platformPerformance).forEach(([platform, perf]) => {
      if (perf.avgEngagement > 0) {
        recommendations.push(`${platform} performs best with ${perf.optimalCount} hashtags, focus on ${perf.topHashtag}`);
      }
    });

    return recommendations;
  }

  /**
   * Helper methods
   */
  private filterPerformanceData(
    businessType?: string,
    platform?: string,
    location?: string
  ): HashtagPerformanceData[] {
    return Array.from(this.performanceData.values()).filter(data => {
      if (businessType && !data.businessTypes[businessType]) return false;
      if (platform && !data.platforms[platform]) return false;
      if (location && !data.locations[location]) return false;
      return true;
    });
  }

  private getRecommendationStrength(data: HashtagPerformanceData): 'high' | 'medium' | 'low' {
    if (data.averageEngagement > 50 && data.successRate > 70) return 'high';
    if (data.averageEngagement > 20 && data.successRate > 50) return 'medium';
    return 'low';
  }

  private calculateOptimalHashtagCount(platform: string): number {
    const platformPosts = this.postHistory.filter(post => post.platform === platform);
    const countPerformance: Record<number, number[]> = {};

    platformPosts.forEach(post => {
      const count = post.hashtags.length;
      if (!countPerformance[count]) countPerformance[count] = [];
      countPerformance[count].push(post.engagement.total);
    });

    let bestCount = 10; // Default
    let bestAvg = 0;

    Object.entries(countPerformance).forEach(([count, engagements]) => {
      if (engagements.length >= 3) { // Minimum sample size
        const avg = engagements.reduce((sum, eng) => sum + eng, 0) / engagements.length;
        if (avg > bestAvg) {
          bestAvg = avg;
          bestCount = parseInt(count);
        }
      }
    });

    return bestCount;
  }

  private identifySuccessPatterns(businessType: string): string[] {
    const patterns: string[] = [];
    const businessPosts = this.postHistory.filter(post => 
      post.businessType === businessType && post.success
    );

    // Analyze common hashtag patterns in successful posts
    const hashtagFrequency: Record<string, number> = {};
    businessPosts.forEach(post => {
      post.hashtags.forEach(hashtag => {
        hashtagFrequency[hashtag] = (hashtagFrequency[hashtag] || 0) + 1;
      });
    });

    const commonHashtags = Object.entries(hashtagFrequency)
      .filter(([, count]) => count >= 3)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([hashtag]) => hashtag);

    if (commonHashtags.length > 0) {
      patterns.push(`Common successful hashtags: ${commonHashtags.join(', ')}`);
    }

    return patterns;
  }

  private getSeasonalHashtags(months: number[]): string[] {
    const seasonalPosts = this.postHistory.filter(post => 
      months.includes(post.timestamp.getMonth())
    );

    const hashtagFrequency: Record<string, number> = {};
    seasonalPosts.forEach(post => {
      post.hashtags.forEach(hashtag => {
        hashtagFrequency[hashtag] = (hashtagFrequency[hashtag] || 0) + 1;
      });
    });

    return Object.entries(hashtagFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([hashtag]) => hashtag);
  }

  private analyzePlatformPerformance(): Record<string, { avgEngagement: number; optimalCount: number; topHashtag: string }> {
    const analysis: Record<string, { avgEngagement: number; optimalCount: number; topHashtag: string }> = {};

    // Group by platform
    const platformGroups: Record<string, PostPerformanceData[]> = {};
    this.postHistory.forEach(post => {
      if (!platformGroups[post.platform]) platformGroups[post.platform] = [];
      platformGroups[post.platform].push(post);
    });

    Object.entries(platformGroups).forEach(([platform, posts]) => {
      const avgEngagement = posts.reduce((sum, post) => sum + post.engagement.total, 0) / posts.length;
      const optimalCount = this.calculateOptimalHashtagCount(platform);
      
      // Find top hashtag for this platform
      const hashtagPerf: Record<string, number[]> = {};
      posts.forEach(post => {
        post.hashtags.forEach(hashtag => {
          if (!hashtagPerf[hashtag]) hashtagPerf[hashtag] = [];
          hashtagPerf[hashtag].push(post.engagement.total);
        });
      });

      const topHashtag = Object.entries(hashtagPerf)
        .filter(([, engagements]) => engagements.length >= 2)
        .map(([hashtag, engagements]) => ({
          hashtag,
          avg: engagements.reduce((sum, eng) => sum + eng, 0) / engagements.length
        }))
        .sort((a, b) => b.avg - a.avg)[0]?.hashtag || '';

      analysis[platform] = { avgEngagement, optimalCount, topHashtag };
    });

    return analysis;
  }

  /**
   * Storage methods
   */
  private loadPerformanceData(): void {
    try {
      const performanceData = localStorage.getItem(this.storageKey);
      if (performanceData) {
        const parsed = JSON.parse(performanceData);
        this.performanceData = new Map(Object.entries(parsed));
      }

      const combinationData = localStorage.getItem(this.combinationStorageKey);
      if (combinationData) {
        const parsed = JSON.parse(combinationData);
        this.combinationData = new Map(Object.entries(parsed));
      }

      const postHistory = localStorage.getItem(this.postHistoryKey);
      if (postHistory) {
        this.postHistory = JSON.parse(postHistory).map((post: any) => ({
          ...post,
          timestamp: new Date(post.timestamp)
        }));
      }
    } catch (error) {
      // Initialize with empty data if loading fails
    }
  }

  private savePerformanceData(): void {
    try {
      // Save performance data
      const performanceObj = Object.fromEntries(this.performanceData);
      localStorage.setItem(this.storageKey, JSON.stringify(performanceObj));

      // Save combination data
      const combinationObj = Object.fromEntries(this.combinationData);
      localStorage.setItem(this.combinationStorageKey, JSON.stringify(combinationObj));

      // Save post history (keep only last 1000 posts)
      const recentHistory = this.postHistory.slice(-1000);
      localStorage.setItem(this.postHistoryKey, JSON.stringify(recentHistory));
    } catch (error) {
      // Handle storage errors gracefully
    }
  }

  /**
   * Clear all performance data (for testing or reset)
   */
  public clearPerformanceData(): void {
    this.performanceData.clear();
    this.combinationData.clear();
    this.postHistory = [];
    
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.combinationStorageKey);
    localStorage.removeItem(this.postHistoryKey);
  }
}

// Export singleton instance
export const hashtagPerformanceTracker = new HashtagPerformanceTracker();
