/**
 * Real-time Hashtag Relevance Scoring System
 * Advanced scoring algorithm that evaluates hashtag relevance based on
 * RSS trends, business context, location, platform, and engagement potential
 */

import { rssService, TrendingData } from '../services/rss-feed-service';
import { trendingEnhancer } from './trending-content-enhancer';

export interface HashtagScore {
  hashtag: string;
  totalScore: number;
  breakdown: {
    trendingScore: number;      // Based on RSS trend data (0-10)
    businessRelevance: number;  // Business context relevance (0-10)
    locationRelevance: number;  // Geographic relevance (0-10)
    platformOptimization: number; // Platform-specific optimization (0-10)
    engagementPotential: number;  // Predicted engagement (0-10)
    temporalRelevance: number;    // Time-based relevance (0-10)
    competitorAnalysis: number;   // Competitor usage analysis (0-10)
    semanticRelevance: number;    // Content semantic matching (0-10)
  };
  confidence: number;           // Overall confidence in score (0-1)
  recommendation: 'high' | 'medium' | 'low' | 'avoid';
  reasoning: string[];
}

export interface ScoringContext {
  businessType: string;
  businessName: string;
  location: string;
  platform: string;
  postContent?: string;
  targetAudience?: string;
  services?: string;
  industry?: string;
  timeOfDay?: number;
  dayOfWeek?: number;
}

export class RealtimeHashtagScorer {
  private scoreCache: Map<string, { score: HashtagScore; timestamp: number }> = new Map();
  private readonly cacheTimeout = 10 * 60 * 1000; // 10 minutes

  /**
   * Score a single hashtag with comprehensive analysis
   */
  public async scoreHashtag(hashtag: string, context: ScoringContext): Promise<HashtagScore> {
    const cacheKey = `${hashtag}-${this.generateContextKey(context)}`;
    const cached = this.scoreCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.score;
    }

    try {
      // Get trending data for analysis
      const trendingData = await rssService.getTrendingData();
      
      // Calculate individual score components
      const breakdown = {
        trendingScore: await this.calculateTrendingScore(hashtag, trendingData),
        businessRelevance: this.calculateBusinessRelevance(hashtag, context),
        locationRelevance: this.calculateLocationRelevance(hashtag, context),
        platformOptimization: this.calculatePlatformOptimization(hashtag, context),
        engagementPotential: this.calculateEngagementPotential(hashtag, context),
        temporalRelevance: this.calculateTemporalRelevance(hashtag, context),
        competitorAnalysis: await this.calculateCompetitorAnalysis(hashtag, context, trendingData),
        semanticRelevance: this.calculateSemanticRelevance(hashtag, context)
      };

      // Calculate weighted total score
      const totalScore = this.calculateWeightedScore(breakdown, context);
      
      // Determine confidence level
      const confidence = this.calculateConfidence(breakdown, trendingData);
      
      // Generate recommendation
      const recommendation = this.generateRecommendation(totalScore, confidence);
      
      // Generate reasoning
      const reasoning = this.generateReasoning(breakdown, context);

      const score: HashtagScore = {
        hashtag,
        totalScore,
        breakdown,
        confidence,
        recommendation,
        reasoning
      };

      // Cache the result
      this.scoreCache.set(cacheKey, { score, timestamp: Date.now() });

      return score;

    } catch (error) {
      return this.getFallbackScore(hashtag, context);
    }
  }

  /**
   * Score multiple hashtags and return sorted by relevance
   */
  public async scoreHashtags(hashtags: string[], context: ScoringContext): Promise<HashtagScore[]> {
    const scores = await Promise.all(
      hashtags.map(hashtag => this.scoreHashtag(hashtag, context))
    );

    return scores.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Calculate trending score based on RSS data
   */
  private async calculateTrendingScore(hashtag: string, trendingData: TrendingData): Promise<number> {
    let score = 0;
    const hashtagLower = hashtag.toLowerCase().replace('#', '');

    // Check direct mentions in RSS articles
    const mentionCount = trendingData.articles.filter(article => {
      const content = `${article.title} ${article.description}`.toLowerCase();
      return content.includes(hashtagLower);
    }).length;

    // Score based on mention frequency
    if (mentionCount >= 5) score += 10;
    else if (mentionCount >= 3) score += 8;
    else if (mentionCount >= 1) score += 6;
    else score += 2;

    // Check keyword relevance in trending topics
    const keywordRelevance = trendingData.keywords.filter(keyword =>
      keyword.toLowerCase().includes(hashtagLower) || hashtagLower.includes(keyword.toLowerCase())
    ).length;

    score += Math.min(keywordRelevance * 2, 4);

    // Recency bonus (newer articles get higher weight)
    const recentMentions = trendingData.articles.filter(article => {
      const hoursSincePublished = (Date.now() - article.pubDate.getTime()) / (1000 * 60 * 60);
      const content = `${article.title} ${article.description}`.toLowerCase();
      return hoursSincePublished <= 6 && content.includes(hashtagLower);
    }).length;

    if (recentMentions > 0) score += 2;

    return Math.min(score, 10);
  }

  /**
   * Calculate business relevance score
   */
  private calculateBusinessRelevance(hashtag: string, context: ScoringContext): number {
    let score = 0;
    const hashtagLower = hashtag.toLowerCase().replace('#', '');

    // Direct business name match
    if (hashtagLower.includes(context.businessName.toLowerCase().replace(/\s+/g, ''))) {
      score += 10;
    }

    // Business type relevance
    if (hashtagLower.includes(context.businessType.toLowerCase())) {
      score += 8;
    }

    // Services/expertise relevance
    if (context.services) {
      const services = context.services.toLowerCase().split(/[,\s]+/);
      const serviceMatches = services.filter(service => 
        hashtagLower.includes(service) || service.includes(hashtagLower)
      ).length;
      score += Math.min(serviceMatches * 3, 6);
    }

    // Industry keywords
    const industryKeywords = this.getIndustryKeywords(context.businessType);
    const industryMatches = industryKeywords.filter(keyword =>
      hashtagLower.includes(keyword.toLowerCase())
    ).length;
    score += Math.min(industryMatches * 2, 4);

    return Math.min(score, 10);
  }

  /**
   * Calculate location relevance score
   */
  private calculateLocationRelevance(hashtag: string, context: ScoringContext): number {
    let score = 0;
    const hashtagLower = hashtag.toLowerCase().replace('#', '');
    const locationLower = context.location.toLowerCase();

    // Direct location match
    if (hashtagLower.includes(locationLower.replace(/\s+/g, ''))) {
      score += 10;
    }

    // Location parts (city, state, country)
    const locationParts = context.location.split(/[,\s]+/).filter(part => part.length > 2);
    const locationMatches = locationParts.filter(part =>
      hashtagLower.includes(part.toLowerCase())
    ).length;
    score += Math.min(locationMatches * 4, 8);

    // Local/community keywords
    const localKeywords = ['local', 'community', 'neighborhood', 'area', 'town', 'city'];
    if (localKeywords.some(keyword => hashtagLower.includes(keyword))) {
      score += 6;
    }

    // Regional keywords
    const regionalKeywords = ['regional', 'metro', 'downtown', 'uptown', 'district'];
    if (regionalKeywords.some(keyword => hashtagLower.includes(keyword))) {
      score += 4;
    }

    return Math.min(score, 10);
  }

  /**
   * Calculate platform optimization score
   */
  private calculatePlatformOptimization(hashtag: string, context: ScoringContext): number {
    const platformHashtags = {
      instagram: {
        high: ['instagood', 'photooftheday', 'instadaily', 'reels', 'igers', 'instamood'],
        medium: ['picoftheday', 'instapic', 'instalike', 'followme', 'instagramhub']
      },
      facebook: {
        high: ['community', 'local', 'share', 'connect', 'family', 'friends'],
        medium: ['like', 'follow', 'page', 'group', 'event']
      },
      twitter: {
        high: ['news', 'update', 'discussion', 'trending', 'breaking', 'thread'],
        medium: ['tweet', 'retweet', 'follow', 'hashtag', 'viral']
      },
      linkedin: {
        high: ['professional', 'business', 'career', 'networking', 'industry', 'leadership'],
        medium: ['job', 'work', 'corporate', 'company', 'team']
      },
      tiktok: {
        high: ['fyp', 'viral', 'trending', 'foryou', 'dance', 'challenge'],
        medium: ['tiktok', 'video', 'funny', 'entertainment', 'music']
      },
      pinterest: {
        high: ['inspiration', 'ideas', 'diy', 'style', 'design', 'home'],
        medium: ['pinterest', 'pin', 'board', 'creative', 'art']
      }
    };

    const platform = context.platform.toLowerCase();
    const hashtagLower = hashtag.toLowerCase().replace('#', '');
    
    const platformData = platformHashtags[platform as keyof typeof platformHashtags];
    if (!platformData) return 5; // Default score for unknown platforms

    // Check high-value platform hashtags
    if (platformData.high.some(tag => hashtagLower.includes(tag))) {
      return 10;
    }

    // Check medium-value platform hashtags
    if (platformData.medium.some(tag => hashtagLower.includes(tag))) {
      return 7;
    }

    // Platform-specific length optimization
    const optimalLengths = {
      instagram: { min: 5, max: 20 },
      twitter: { min: 3, max: 15 },
      tiktok: { min: 3, max: 12 },
      linkedin: { min: 8, max: 25 },
      facebook: { min: 5, max: 18 },
      pinterest: { min: 6, max: 22 }
    };

    const lengthData = optimalLengths[platform as keyof typeof optimalLengths];
    if (lengthData && hashtag.length >= lengthData.min && hashtag.length <= lengthData.max) {
      return 6;
    }

    return 3; // Base score
  }

  /**
   * Calculate engagement potential score
   */
  private calculateEngagementPotential(hashtag: string, context: ScoringContext): number {
    let score = 0;
    const hashtagLower = hashtag.toLowerCase().replace('#', '');

    // High-engagement keywords
    const highEngagementKeywords = [
      'viral', 'trending', 'amazing', 'incredible', 'awesome', 'beautiful',
      'love', 'best', 'new', 'hot', 'popular', 'top', 'must', 'perfect',
      'exclusive', 'limited', 'special', 'unique', 'rare'
    ];

    if (highEngagementKeywords.some(keyword => hashtagLower.includes(keyword))) {
      score += 9;
    }

    // Emotional keywords
    const emotionalKeywords = [
      'happy', 'excited', 'proud', 'grateful', 'blessed', 'inspired',
      'motivated', 'passionate', 'thrilled', 'delighted'
    ];

    if (emotionalKeywords.some(keyword => hashtagLower.includes(keyword))) {
      score += 7;
    }

    // Action keywords
    const actionKeywords = [
      'discover', 'explore', 'experience', 'try', 'learn', 'create',
      'build', 'grow', 'achieve', 'succeed'
    ];

    if (actionKeywords.some(keyword => hashtagLower.includes(keyword))) {
      score += 6;
    }

    // Length-based scoring (optimal hashtag lengths)
    if (hashtag.length >= 6 && hashtag.length <= 15) {
      score += 5;
    } else if (hashtag.length >= 4 && hashtag.length <= 20) {
      score += 3;
    } else {
      score += 1;
    }

    // Avoid overly generic hashtags
    const genericHashtags = ['good', 'nice', 'cool', 'great', 'ok', 'fine'];
    if (genericHashtags.some(generic => hashtagLower === generic)) {
      score -= 3;
    }

    return Math.min(Math.max(score, 0), 10);
  }

  /**
   * Calculate temporal relevance score
   */
  private calculateTemporalRelevance(hashtag: string, context: ScoringContext): number {
    let score = 5; // Base score
    const hashtagLower = hashtag.toLowerCase().replace('#', '');
    const now = new Date();
    const currentHour = context.timeOfDay || now.getHours();
    const currentDay = context.dayOfWeek || now.getDay();

    // Time-of-day relevance
    const timeKeywords = {
      morning: ['morning', 'breakfast', 'coffee', 'start', 'fresh'],
      afternoon: ['lunch', 'afternoon', 'work', 'business', 'professional'],
      evening: ['dinner', 'evening', 'relax', 'unwind', 'family'],
      night: ['night', 'late', 'weekend', 'party', 'fun']
    };

    let timeCategory = 'morning';
    if (currentHour >= 12 && currentHour < 17) timeCategory = 'afternoon';
    else if (currentHour >= 17 && currentHour < 21) timeCategory = 'evening';
    else if (currentHour >= 21 || currentHour < 6) timeCategory = 'night';

    if (timeKeywords[timeCategory as keyof typeof timeKeywords].some(keyword => 
      hashtagLower.includes(keyword)
    )) {
      score += 3;
    }

    // Day-of-week relevance
    const dayKeywords = {
      weekday: ['work', 'business', 'professional', 'office', 'meeting'],
      weekend: ['weekend', 'fun', 'relax', 'family', 'leisure', 'party']
    };

    const isWeekend = currentDay === 0 || currentDay === 6;
    const dayCategory = isWeekend ? 'weekend' : 'weekday';

    if (dayKeywords[dayCategory].some(keyword => hashtagLower.includes(keyword))) {
      score += 2;
    }

    // Seasonal relevance (basic implementation)
    const month = now.getMonth();
    const seasonalKeywords = {
      spring: ['spring', 'fresh', 'new', 'bloom', 'growth'],
      summer: ['summer', 'hot', 'vacation', 'beach', 'outdoor'],
      fall: ['fall', 'autumn', 'harvest', 'cozy', 'warm'],
      winter: ['winter', 'cold', 'holiday', 'celebration', 'indoor']
    };

    let season = 'spring';
    if (month >= 5 && month <= 7) season = 'summer';
    else if (month >= 8 && month <= 10) season = 'fall';
    else if (month >= 11 || month <= 1) season = 'winter';

    if (seasonalKeywords[season as keyof typeof seasonalKeywords].some(keyword => 
      hashtagLower.includes(keyword)
    )) {
      score += 2;
    }

    return Math.min(score, 10);
  }

  /**
   * Calculate competitor analysis score
   */
  private async calculateCompetitorAnalysis(
    hashtag: string, 
    context: ScoringContext, 
    trendingData: TrendingData
  ): Promise<number> {
    let score = 5; // Base score
    const hashtagLower = hashtag.toLowerCase().replace('#', '');

    // Analyze if competitors in the same industry are using this hashtag
    const industryKeywords = this.getIndustryKeywords(context.businessType);
    const competitorMentions = trendingData.articles.filter(article => {
      const content = `${article.title} ${article.description}`.toLowerCase();
      return industryKeywords.some(keyword => content.includes(keyword.toLowerCase())) &&
             content.includes(hashtagLower);
    }).length;

    // Score based on competitor usage
    if (competitorMentions >= 3) {
      score += 4; // High competitor usage indicates relevance
    } else if (competitorMentions >= 1) {
      score += 2; // Some competitor usage
    }

    // Check for oversaturation (too many competitors using the same hashtag)
    if (competitorMentions >= 10) {
      score -= 2; // Penalty for oversaturated hashtags
    }

    return Math.min(Math.max(score, 0), 10);
  }

  /**
   * Calculate semantic relevance score
   */
  private calculateSemanticRelevance(hashtag: string, context: ScoringContext): number {
    let score = 0;
    const hashtagLower = hashtag.toLowerCase().replace('#', '');

    // Content relevance (if post content is provided)
    if (context.postContent) {
      const contentLower = context.postContent.toLowerCase();
      const contentWords = contentLower.split(/\s+/);
      
      // Direct word match
      if (contentWords.some(word => word.includes(hashtagLower) || hashtagLower.includes(word))) {
        score += 8;
      }

      // Semantic similarity (basic implementation)
      const semanticKeywords = this.extractSemanticKeywords(context.postContent);
      if (semanticKeywords.some(keyword => 
        hashtagLower.includes(keyword) || keyword.includes(hashtagLower)
      )) {
        score += 6;
      }
    }

    // Target audience relevance
    if (context.targetAudience) {
      const audienceKeywords = context.targetAudience.toLowerCase().split(/[,\s]+/);
      if (audienceKeywords.some(keyword => hashtagLower.includes(keyword))) {
        score += 5;
      }
    }

    // Industry semantic relevance
    const industrySemantics = this.getIndustrySemantics(context.businessType);
    if (industrySemantics.some(semantic => hashtagLower.includes(semantic.toLowerCase()))) {
      score += 4;
    }

    return Math.min(score, 10);
  }

  /**
   * Calculate weighted total score
   */
  private calculateWeightedScore(breakdown: HashtagScore['breakdown'], context: ScoringContext): number {
    // Weights can be adjusted based on business priorities
    const weights = {
      trendingScore: 0.25,      // RSS trending data is highly important
      businessRelevance: 0.20,  // Business relevance is crucial
      engagementPotential: 0.15, // Engagement drives results
      platformOptimization: 0.12, // Platform fit matters
      locationRelevance: 0.10,   // Local relevance for local businesses
      semanticRelevance: 0.08,   // Content matching
      temporalRelevance: 0.06,   // Time-based relevance
      competitorAnalysis: 0.04   // Competitive intelligence
    };

    let totalScore = 0;
    totalScore += breakdown.trendingScore * weights.trendingScore;
    totalScore += breakdown.businessRelevance * weights.businessRelevance;
    totalScore += breakdown.engagementPotential * weights.engagementPotential;
    totalScore += breakdown.platformOptimization * weights.platformOptimization;
    totalScore += breakdown.locationRelevance * weights.locationRelevance;
    totalScore += breakdown.semanticRelevance * weights.semanticRelevance;
    totalScore += breakdown.temporalRelevance * weights.temporalRelevance;
    totalScore += breakdown.competitorAnalysis * weights.competitorAnalysis;

    return Math.round(totalScore * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Calculate confidence in the score
   */
  private calculateConfidence(breakdown: HashtagScore['breakdown'], trendingData: TrendingData): number {
    let confidence = 0;
    let factors = 0;

    // RSS data quality factor
    if (trendingData.articles.length >= 10) {
      confidence += 0.3;
      factors++;
    } else if (trendingData.articles.length >= 5) {
      confidence += 0.2;
      factors++;
    }

    // Score consistency factor
    const scores = Object.values(breakdown);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
    
    if (variance < 4) { // Low variance indicates consistent scoring
      confidence += 0.3;
      factors++;
    } else if (variance < 9) {
      confidence += 0.2;
      factors++;
    }

    // High-scoring factors
    const highScores = scores.filter(score => score >= 7).length;
    if (highScores >= 4) {
      confidence += 0.4;
      factors++;
    } else if (highScores >= 2) {
      confidence += 0.3;
      factors++;
    }

    return factors > 0 ? Math.min(confidence, 1) : 0.5;
  }

  /**
   * Generate recommendation based on score and confidence
   */
  private generateRecommendation(totalScore: number, confidence: number): HashtagScore['recommendation'] {
    if (totalScore >= 8 && confidence >= 0.7) return 'high';
    if (totalScore >= 6 && confidence >= 0.5) return 'medium';
    if (totalScore >= 4) return 'low';
    return 'avoid';
  }

  /**
   * Generate reasoning for the score
   */
  private generateReasoning(breakdown: HashtagScore['breakdown'], context: ScoringContext): string[] {
    const reasoning: string[] = [];

    if (breakdown.trendingScore >= 8) {
      reasoning.push('Highly trending in RSS feeds and news sources');
    } else if (breakdown.trendingScore >= 6) {
      reasoning.push('Moderately trending in current news cycle');
    }

    if (breakdown.businessRelevance >= 8) {
      reasoning.push('Highly relevant to your business type and services');
    } else if (breakdown.businessRelevance >= 6) {
      reasoning.push('Good business relevance for your industry');
    }

    if (breakdown.engagementPotential >= 8) {
      reasoning.push('High potential for user engagement and interaction');
    }

    if (breakdown.platformOptimization >= 8) {
      reasoning.push(`Optimized for ${context.platform} platform algorithms`);
    }

    if (breakdown.locationRelevance >= 8) {
      reasoning.push('Strong local/geographic relevance');
    }

    if (breakdown.competitorAnalysis >= 7) {
      reasoning.push('Successfully used by industry competitors');
    }

    if (reasoning.length === 0) {
      reasoning.push('Basic hashtag with standard performance potential');
    }

    return reasoning;
  }

  /**
   * Get industry-specific keywords
   */
  private getIndustryKeywords(businessType: string): string[] {
    const industryMap: Record<string, string[]> = {
      restaurant: ['food', 'dining', 'cuisine', 'chef', 'menu', 'delicious', 'taste', 'recipe'],
      retail: ['shopping', 'fashion', 'style', 'sale', 'deals', 'boutique', 'store', 'brand'],
      healthcare: ['health', 'wellness', 'medical', 'care', 'treatment', 'doctor', 'patient'],
      fitness: ['workout', 'gym', 'fitness', 'health', 'training', 'exercise', 'strength'],
      beauty: ['beauty', 'skincare', 'makeup', 'salon', 'spa', 'treatment', 'cosmetics'],
      technology: ['tech', 'digital', 'innovation', 'software', 'app', 'online', 'data'],
      education: ['learning', 'education', 'training', 'course', 'skill', 'knowledge', 'teach'],
      automotive: ['car', 'auto', 'vehicle', 'repair', 'service', 'maintenance', 'drive'],
      realestate: ['property', 'home', 'house', 'real estate', 'investment', 'buy', 'sell'],
      legal: ['law', 'legal', 'attorney', 'lawyer', 'justice', 'rights', 'court']
    };

    return industryMap[businessType.toLowerCase()] || ['business', 'service', 'professional', 'quality'];
  }

  /**
   * Get industry semantic keywords
   */
  private getIndustrySemantics(businessType: string): string[] {
    const semanticMap: Record<string, string[]> = {
      restaurant: ['culinary', 'gastronomy', 'hospitality', 'ambiance', 'flavor'],
      retail: ['merchandise', 'consumer', 'lifestyle', 'trend', 'collection'],
      healthcare: ['therapeutic', 'diagnosis', 'prevention', 'recovery', 'healing'],
      fitness: ['performance', 'endurance', 'transformation', 'motivation', 'results'],
      beauty: ['aesthetic', 'enhancement', 'rejuvenation', 'glamour', 'confidence'],
      technology: ['automation', 'efficiency', 'connectivity', 'intelligence', 'solution'],
      education: ['development', 'growth', 'achievement', 'mastery', 'expertise'],
      automotive: ['performance', 'reliability', 'maintenance', 'transportation', 'mobility'],
      realestate: ['investment', 'location', 'value', 'opportunity', 'lifestyle'],
      legal: ['advocacy', 'representation', 'protection', 'resolution', 'compliance']
    };

    return semanticMap[businessType.toLowerCase()] || ['excellence', 'quality', 'service', 'professional'];
  }

  /**
   * Extract semantic keywords from content
   */
  private extractSemanticKeywords(content: string): string[] {
    // Simple keyword extraction (can be enhanced with NLP)
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Remove common stop words
    const stopWords = ['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'were', 'said'];
    return words.filter(word => !stopWords.includes(word));
  }

  /**
   * Generate context key for caching
   */
  private generateContextKey(context: ScoringContext): string {
    return `${context.businessType}-${context.location}-${context.platform}`.toLowerCase();
  }

  /**
   * Get fallback score when analysis fails
   */
  private getFallbackScore(hashtag: string, context: ScoringContext): HashtagScore {
    return {
      hashtag,
      totalScore: 5.0,
      breakdown: {
        trendingScore: 5,
        businessRelevance: 5,
        locationRelevance: 5,
        platformOptimization: 5,
        engagementPotential: 5,
        temporalRelevance: 5,
        competitorAnalysis: 5,
        semanticRelevance: 5
      },
      confidence: 0.3,
      recommendation: 'medium',
      reasoning: ['Fallback scoring due to analysis error']
    };
  }
}

// Export singleton instance
export const realtimeHashtagScorer = new RealtimeHashtagScorer();
