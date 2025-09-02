/**
 * Content Performance Analyzer
 * Benchmarks against industry standards and continuously improves content quality
 */

import { SocialMediaPost, BusinessProfile } from './advanced-content-generator';

export interface PerformanceMetrics {
  engagementRate: number;
  reachRate: number;
  clickThroughRate: number;
  conversionRate: number;
  shareRate: number;
  commentRate: number;
  saveRate: number;
  overallScore: number;
}

export interface IndustryBenchmark {
  businessType: string;
  platform: string;
  averageEngagement: number;
  topPerformerEngagement: number;
  averageReach: number;
  bestPractices: string[];
  commonMistakes: string[];
  successPatterns: string[];
}

export interface ContentOptimization {
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  nextIterationFocus: string[];
  competitiveAdvantages: string[];
}

export class ContentPerformanceAnalyzer {
  private industryBenchmarks: Map<string, IndustryBenchmark[]> = new Map();
  private performanceHistory: Map<string, PerformanceMetrics[]> = new Map();
  private contentPatterns: Map<string, string[]> = new Map();

  constructor() {
    this.initializeIndustryBenchmarks();
    this.initializeSuccessPatterns();
  }

  /**
   * Initialize industry benchmarks for different business types
   */
  private initializeIndustryBenchmarks() {
    const benchmarks = {
      restaurant: [
        {
          businessType: 'restaurant',
          platform: 'instagram',
          averageEngagement: 3.2,
          topPerformerEngagement: 8.5,
          averageReach: 15.4,
          bestPractices: [
            'High-quality food photography',
            'Behind-the-scenes content',
            'Customer testimonials',
            'Seasonal menu highlights',
            'Local ingredient stories'
          ],
          commonMistakes: [
            'Poor lighting in photos',
            'Generic captions',
            'Inconsistent posting',
            'Ignoring local trends',
            'Over-promotional content'
          ],
          successPatterns: [
            'Food close-ups with natural lighting',
            'Stories about ingredients and preparation',
            'Customer experience highlights',
            'Local community involvement',
            'Seasonal and trending ingredients'
          ]
        },
        {
          businessType: 'restaurant',
          platform: 'facebook',
          averageEngagement: 2.8,
          topPerformerEngagement: 6.2,
          averageReach: 12.1,
          bestPractices: [
            'Community engagement',
            'Event announcements',
            'Customer reviews sharing',
            'Local partnerships',
            'Family-friendly content'
          ],
          commonMistakes: [
            'Posting only promotional content',
            'Ignoring customer comments',
            'Not leveraging local events',
            'Generic stock photos',
            'Inconsistent brand voice'
          ],
          successPatterns: [
            'Community event participation',
            'Customer story sharing',
            'Local ingredient sourcing stories',
            'Family dining experiences',
            'Seasonal celebration posts'
          ]
        }
      ],
      retail: [
        {
          businessType: 'retail',
          platform: 'instagram',
          averageEngagement: 2.9,
          topPerformerEngagement: 7.8,
          averageReach: 18.2,
          bestPractices: [
            'Product styling and flat lays',
            'User-generated content',
            'Trend-focused content',
            'Behind-the-brand stories',
            'Seasonal collections'
          ],
          commonMistakes: [
            'Product-only posts',
            'Poor product photography',
            'Ignoring fashion trends',
            'Not showcasing versatility',
            'Generic product descriptions'
          ],
          successPatterns: [
            'Lifestyle product integration',
            'Trend-forward styling',
            'Customer styling examples',
            'Seasonal fashion guides',
            'Sustainable fashion stories'
          ]
        }
      ],
      fitness: [
        {
          businessType: 'fitness',
          platform: 'instagram',
          averageEngagement: 4.1,
          topPerformerEngagement: 9.3,
          averageReach: 16.7,
          bestPractices: [
            'Transformation stories',
            'Workout demonstrations',
            'Motivational content',
            'Community challenges',
            'Expert tips and advice'
          ],
          commonMistakes: [
            'Intimidating content for beginners',
            'Only showing perfect bodies',
            'Generic motivational quotes',
            'Not addressing different fitness levels',
            'Ignoring mental health aspects'
          ],
          successPatterns: [
            'Inclusive fitness content',
            'Real transformation journeys',
            'Beginner-friendly workouts',
            'Mental health and fitness connection',
            'Community support stories'
          ]
        }
      ],
      beauty: [
        {
          businessType: 'beauty',
          platform: 'instagram',
          averageEngagement: 3.7,
          topPerformerEngagement: 8.9,
          averageReach: 14.3,
          bestPractices: [
            'Before/after transformations',
            'Tutorial content',
            'Product demonstrations',
            'Skin care education',
            'Inclusive beauty content'
          ],
          commonMistakes: [
            'Over-filtered photos',
            'Not showing diverse skin types',
            'Generic beauty tips',
            'Ignoring skincare science',
            'Not addressing common concerns'
          ],
          successPatterns: [
            'Natural beauty enhancement',
            'Educational skincare content',
            'Diverse model representation',
            'Seasonal beauty tips',
            'Self-care and confidence building'
          ]
        }
      ]
    };

    Object.entries(benchmarks).forEach(([businessType, benchmarkArray]) => {
      this.industryBenchmarks.set(businessType, benchmarkArray);
    });
  }

  /**
   * Initialize success patterns for content optimization
   */
  private initializeSuccessPatterns() {
    const patterns = {
      'high-engagement-headlines': [
        'Question-based headlines that spark curiosity',
        'Numbers and statistics in headlines',
        'Emotional trigger words',
        'Local references and community connection',
        'Trending topic integration',
        'Problem-solution format',
        'Exclusive or limited-time offers',
        'Behind-the-scenes insights'
      ],
      'effective-captions': [
        'Storytelling approach',
        'Personal anecdotes and experiences',
        'Call-to-action integration',
        'Community questions and engagement',
        'Educational value provision',
        'Emotional connection building',
        'Local culture and language integration',
        'Trending hashtag utilization'
      ],
      'compelling-ctas': [
        'Action-oriented language',
        'Urgency and scarcity elements',
        'Clear value proposition',
        'Personalized messaging',
        'Community-focused calls',
        'Experience-based invitations',
        'Social proof integration',
        'Local relevance emphasis'
      ]
    };

    Object.entries(patterns).forEach(([category, patternList]) => {
      this.contentPatterns.set(category, patternList);
    });
  }

  /**
   * Analyze content performance against industry benchmarks
   */
  public analyzePerformance(
    post: SocialMediaPost,
    profile: BusinessProfile,
    actualMetrics?: PerformanceMetrics
  ): ContentOptimization {

    const benchmarks = this.industryBenchmarks.get(profile.businessType) || [];
    const platformBenchmark = benchmarks.find(b => b.platform === post.platform);

    if (!platformBenchmark) {
      return this.generateGenericOptimization();
    }

    // Analyze content elements
    const headlineAnalysis = this.analyzeHeadline(post.headline, platformBenchmark);
    const captionAnalysis = this.analyzeCaption(post.caption, platformBenchmark);
    const ctaAnalysis = this.analyzeCTA(post.cta, platformBenchmark);
    const hashtagAnalysis = this.analyzeHashtags(post.hashtags, platformBenchmark);

    // Generate optimization recommendations
    const optimization: ContentOptimization = {
      strengths: [
        ...headlineAnalysis.strengths,
        ...captionAnalysis.strengths,
        ...ctaAnalysis.strengths,
        ...hashtagAnalysis.strengths
      ],
      improvements: [
        ...headlineAnalysis.improvements,
        ...captionAnalysis.improvements,
        ...ctaAnalysis.improvements,
        ...hashtagAnalysis.improvements
      ],
      recommendations: this.generateRecommendations(platformBenchmark, profile),
      nextIterationFocus: this.identifyNextIterationFocus(platformBenchmark, profile),
      competitiveAdvantages: this.identifyCompetitiveAdvantages(platformBenchmark, profile)
    };

    return optimization;
  }

  /**
   * Analyze headline effectiveness
   */
  private analyzeHeadline(headline: string, benchmark: IndustryBenchmark): { strengths: string[]; improvements: string[] } {
    const strengths: string[] = [];
    const improvements: string[] = [];

    // Check for success patterns
    const successPatterns = this.contentPatterns.get('high-engagement-headlines') || [];
    
    if (headline.includes('?')) {
      strengths.push('Uses question format to engage audience');
    } else {
      improvements.push('Consider using questions to increase engagement');
    }

    if (/\d+/.test(headline)) {
      strengths.push('Includes numbers for credibility');
    } else {
      improvements.push('Consider adding specific numbers or statistics');
    }

    if (headline.length > 10 && headline.length < 60) {
      strengths.push('Optimal headline length for platform');
    } else {
      improvements.push('Adjust headline length for better readability');
    }

    // Check for emotional triggers
    const emotionalWords = ['amazing', 'incredible', 'exclusive', 'limited', 'secret', 'proven'];
    if (emotionalWords.some(word => headline.toLowerCase().includes(word))) {
      strengths.push('Uses emotional trigger words');
    } else {
      improvements.push('Add emotional trigger words to increase appeal');
    }

    return { strengths, improvements };
  }

  /**
   * Analyze caption effectiveness
   */
  private analyzeCaption(caption: string, benchmark: IndustryBenchmark): { strengths: string[]; improvements: string[] } {
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (caption.length > 50 && caption.length < 300) {
      strengths.push('Optimal caption length for engagement');
    } else {
      improvements.push('Adjust caption length for better engagement');
    }

    // Check for storytelling elements
    if (caption.includes('we') || caption.includes('our') || caption.includes('story')) {
      strengths.push('Uses storytelling approach');
    } else {
      improvements.push('Add storytelling elements to create connection');
    }

    // Check for community engagement
    if (caption.includes('?') || caption.includes('comment') || caption.includes('share')) {
      strengths.push('Encourages community engagement');
    } else {
      improvements.push('Add questions or engagement prompts');
    }

    return { strengths, improvements };
  }

  /**
   * Analyze CTA effectiveness
   */
  private analyzeCTA(cta: string, benchmark: IndustryBenchmark): { strengths: string[]; improvements: string[] } {
    const strengths: string[] = [];
    const improvements: string[] = [];

    const actionWords = ['visit', 'book', 'call', 'order', 'try', 'discover', 'experience'];
    if (actionWords.some(word => cta.toLowerCase().includes(word))) {
      strengths.push('Uses strong action words');
    } else {
      improvements.push('Use more compelling action words');
    }

    if (cta.length > 5 && cta.length < 50) {
      strengths.push('Appropriate CTA length');
    } else {
      improvements.push('Optimize CTA length for clarity');
    }

    return { strengths, improvements };
  }

  /**
   * Analyze hashtag strategy
   */
  private analyzeHashtags(hashtags: string[], benchmark: IndustryBenchmark): { strengths: string[]; improvements: string[] } {
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (hashtags.length >= 5 && hashtags.length <= 10) {
      strengths.push('Optimal number of hashtags');
    } else {
      improvements.push('Adjust hashtag count for better reach');
    }

    // Check for mix of popular and niche hashtags
    const hasPopular = hashtags.some(tag => tag.includes('trending') || tag.includes('viral'));
    const hasNiche = hashtags.some(tag => tag.length > 15);

    if (hasPopular && hasNiche) {
      strengths.push('Good mix of popular and niche hashtags');
    } else {
      improvements.push('Balance popular and niche hashtags for better reach');
    }

    return { strengths, improvements };
  }

  /**
   * Generate specific recommendations based on benchmarks
   */
  private generateRecommendations(benchmark: IndustryBenchmark, profile: BusinessProfile): string[] {
    const recommendations: string[] = [];

    // Add benchmark-specific recommendations
    benchmark.bestPractices.forEach(practice => {
      recommendations.push(`Implement: ${practice}`);
    });

    // Add business-specific recommendations
    recommendations.push(`Leverage ${profile.location} local culture and events`);
    recommendations.push(`Highlight unique selling points: ${profile.uniqueSellingPoints.join(', ')}`);
    recommendations.push(`Target ${profile.targetAudience} with personalized messaging`);

    return recommendations.slice(0, 8); // Limit to top 8 recommendations
  }

  /**
   * Identify focus areas for next iteration
   */
  private identifyNextIterationFocus(benchmark: IndustryBenchmark, profile: BusinessProfile): string[] {
    const focus: string[] = [];

    // Focus on top-performing patterns
    benchmark.successPatterns.forEach(pattern => {
      focus.push(`Enhance: ${pattern}`);
    });

    // Avoid common mistakes
    benchmark.commonMistakes.forEach(mistake => {
      focus.push(`Avoid: ${mistake}`);
    });

    return focus.slice(0, 6); // Limit to top 6 focus areas
  }

  /**
   * Identify competitive advantages
   */
  private identifyCompetitiveAdvantages(benchmark: IndustryBenchmark, profile: BusinessProfile): string[] {
    const advantages: string[] = [];

    // Business-specific advantages
    profile.uniqueSellingPoints.forEach(usp => {
      advantages.push(`Unique advantage: ${usp}`);
    });

    // Location-based advantages
    advantages.push(`Local market expertise in ${profile.location}`);
    advantages.push(`Community connection and trust`);
    advantages.push(`Cultural understanding and relevance`);

    return advantages.slice(0, 5); // Limit to top 5 advantages
  }

  /**
   * Generate generic optimization for unknown business types
   */
  private generateGenericOptimization(): ContentOptimization {
    return {
      strengths: ['Content created with business context'],
      improvements: ['Add industry-specific benchmarks', 'Enhance local relevance'],
      recommendations: ['Research industry best practices', 'Analyze competitor content'],
      nextIterationFocus: ['Improve targeting', 'Enhance engagement'],
      competitiveAdvantages: ['Personalized approach', 'Local market focus']
    };
  }

  /**
   * Track performance over time for continuous improvement
   */
  public trackPerformance(businessName: string, metrics: PerformanceMetrics): void {
    const history = this.performanceHistory.get(businessName) || [];
    history.push(metrics);
    this.performanceHistory.set(businessName, history.slice(-20)); // Keep last 20 records

  }

  /**
   * Get performance trends for a business
   */
  public getPerformanceTrends(businessName: string): {
    trend: 'improving' | 'declining' | 'stable';
    averageScore: number;
    bestPerformingContent: string[];
  } {
    const history = this.performanceHistory.get(businessName) || [];
    
    if (history.length < 2) {
      return {
        trend: 'stable',
        averageScore: history[0]?.overallScore || 0,
        bestPerformingContent: []
      };
    }

    const recent = history.slice(-5);
    const older = history.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, m) => sum + m.overallScore, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.overallScore, 0) / older.length;
    
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentAvg > olderAvg + 0.5) trend = 'improving';
    else if (recentAvg < olderAvg - 0.5) trend = 'declining';

    const averageScore = history.reduce((sum, m) => sum + m.overallScore, 0) / history.length;

    return {
      trend,
      averageScore,
      bestPerformingContent: ['High-engagement headlines', 'Community-focused content', 'Local relevance']
    };
  }
}

// Export singleton instance
export const performanceAnalyzer = new ContentPerformanceAnalyzer();
