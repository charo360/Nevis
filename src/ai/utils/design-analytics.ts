/**
 * Design Performance Analytics System
 * 
 * Tracks design performance, learns from successful patterns, and optimizes future generations
 */

import { z } from 'zod';

// Schema for design performance metrics
export const DesignPerformanceSchema = z.object({
  designId: z.string(),
  businessType: z.string(),
  platform: z.string(),
  visualStyle: z.string(),
  generatedAt: z.date(),
  metrics: z.object({
    qualityScore: z.number().min(1).max(10),
    engagementPrediction: z.number().min(1).max(10),
    brandAlignmentScore: z.number().min(1).max(10),
    technicalQuality: z.number().min(1).max(10),
    trendRelevance: z.number().min(1).max(10)
  }),
  designElements: z.object({
    colorPalette: z.array(z.string()),
    typography: z.string(),
    composition: z.string(),
    trends: z.array(z.string()),
    businessDNA: z.string()
  }),
  performance: z.object({
    actualEngagement: z.number().optional(),
    clickThroughRate: z.number().optional(),
    conversionRate: z.number().optional(),
    brandRecall: z.number().optional(),
    userFeedback: z.number().min(1).max(5).optional()
  }).optional(),
  improvements: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional()
});

export type DesignPerformance = z.infer<typeof DesignPerformanceSchema>;

// In-memory storage for design analytics (in production, use a database)
const designAnalytics: Map<string, DesignPerformance> = new Map();
const performancePatterns: Map<string, any> = new Map();

/**
 * Records design generation and initial metrics
 */
export function recordDesignGeneration(
  designId: string,
  businessType: string,
  platform: string,
  visualStyle: string,
  qualityScore: number,
  designElements: {
    colorPalette: string[];
    typography: string;
    composition: string;
    trends: string[];
    businessDNA: string;
  },
  predictions: {
    engagement: number;
    brandAlignment: number;
    technicalQuality: number;
    trendRelevance: number;
  }
): void {
  const record: DesignPerformance = {
    designId,
    businessType,
    platform,
    visualStyle,
    generatedAt: new Date(),
    metrics: {
      qualityScore,
      engagementPrediction: predictions.engagement,
      brandAlignmentScore: predictions.brandAlignment,
      technicalQuality: predictions.technicalQuality,
      trendRelevance: predictions.trendRelevance
    },
    designElements,
    tags: [businessType, platform, visualStyle]
  };

  designAnalytics.set(designId, record);
  updatePerformancePatterns(record);
}

/**
 * Updates design performance with actual metrics
 */
export function updateDesignPerformance(
  designId: string,
  actualMetrics: {
    engagement?: number;
    clickThroughRate?: number;
    conversionRate?: number;
    brandRecall?: number;
    userFeedback?: number;
  }
): void {
  const record = designAnalytics.get(designId);
  if (!record) return;

  record.performance = {
    ...record.performance,
    ...actualMetrics
  };

  designAnalytics.set(designId, record);
  updatePerformancePatterns(record);
}

/**
 * Analyzes performance patterns to improve future designs
 */
function updatePerformancePatterns(record: DesignPerformance): void {
  const patternKey = `${record.businessType}-${record.platform}-${record.visualStyle}`;
  
  if (!performancePatterns.has(patternKey)) {
    performancePatterns.set(patternKey, {
      count: 0,
      avgQuality: 0,
      avgEngagement: 0,
      successfulElements: new Map(),
      commonIssues: new Map(),
      bestPractices: []
    });
  }

  const pattern = performancePatterns.get(patternKey);
  pattern.count += 1;
  
  // Update averages
  pattern.avgQuality = (pattern.avgQuality * (pattern.count - 1) + record.metrics.qualityScore) / pattern.count;
  pattern.avgEngagement = (pattern.avgEngagement * (pattern.count - 1) + record.metrics.engagementPrediction) / pattern.count;

  // Track successful elements
  if (record.metrics.qualityScore >= 8) {
    record.designElements.trends.forEach(trend => {
      const count = pattern.successfulElements.get(trend) || 0;
      pattern.successfulElements.set(trend, count + 1);
    });
  }

  // Track common issues
  if (record.improvements) {
    record.improvements.forEach(issue => {
      const count = pattern.commonIssues.get(issue) || 0;
      pattern.commonIssues.set(issue, count + 1);
    });
  }

  performancePatterns.set(patternKey, pattern);
}

/**
 * Gets performance insights for a specific business/platform combination
 */
export function getPerformanceInsights(
  businessType: string,
  platform: string,
  visualStyle?: string
): {
  averageQuality: number;
  averageEngagement: number;
  topSuccessfulElements: string[];
  commonIssues: string[];
  recommendations: string[];
  sampleSize: number;
} {
  const patternKey = visualStyle 
    ? `${businessType}-${platform}-${visualStyle}`
    : `${businessType}-${platform}`;
  
  const pattern = performancePatterns.get(patternKey);
  
  if (!pattern) {
    return {
      averageQuality: 0,
      averageEngagement: 0,
      topSuccessfulElements: [],
      commonIssues: [],
      recommendations: ['Insufficient data for insights'],
      sampleSize: 0
    };
  }

  // Get top successful elements
  const topElements = Array.from(pattern.successfulElements.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([element]) => element);

  // Get common issues
  const topIssues = Array.from(pattern.commonIssues.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([issue]) => issue);

  // Generate recommendations
  const recommendations = generateRecommendations(pattern, topElements, topIssues);

  return {
    averageQuality: Math.round(pattern.avgQuality * 10) / 10,
    averageEngagement: Math.round(pattern.avgEngagement * 10) / 10,
    topSuccessfulElements: topElements,
    commonIssues: topIssues,
    recommendations,
    sampleSize: pattern.count
  };
}

/**
 * Generates actionable recommendations based on performance data
 */
function generateRecommendations(
  pattern: any,
  successfulElements: string[],
  commonIssues: string[]
): string[] {
  const recommendations: string[] = [];

  // Quality-based recommendations
  if (pattern.avgQuality < 7) {
    recommendations.push('Focus on improving overall design quality through better composition and typography');
  }

  // Engagement-based recommendations
  if (pattern.avgEngagement < 7) {
    recommendations.push('Incorporate more attention-grabbing elements and bold visual choices');
  }

  // Element-based recommendations
  if (successfulElements.length > 0) {
    recommendations.push(`Continue using successful elements: ${successfulElements.slice(0, 3).join(', ')}`);
  }

  // Issue-based recommendations
  if (commonIssues.length > 0) {
    recommendations.push(`Address common issues: ${commonIssues.slice(0, 2).join(', ')}`);
  }

  // Sample size recommendations
  if (pattern.count < 10) {
    recommendations.push('Generate more designs to improve insights accuracy');
  }

  return recommendations;
}

/**
 * Gets top performing designs for learning
 */
export function getTopPerformingDesigns(
  businessType?: string,
  platform?: string,
  limit: number = 10
): DesignPerformance[] {
  let designs = Array.from(designAnalytics.values());

  // Filter by business type and platform if specified
  if (businessType) {
    designs = designs.filter(d => d.businessType === businessType);
  }
  if (platform) {
    designs = designs.filter(d => d.platform === platform);
  }

  // Sort by quality score and engagement prediction
  designs.sort((a, b) => {
    const scoreA = (a.metrics.qualityScore + a.metrics.engagementPrediction) / 2;
    const scoreB = (b.metrics.qualityScore + b.metrics.engagementPrediction) / 2;
    return scoreB - scoreA;
  });

  return designs.slice(0, limit);
}

/**
 * Generates performance-optimized design instructions
 */
export function generatePerformanceOptimizedInstructions(
  businessType: string,
  platform: string,
  visualStyle: string
): string {
  const insights = getPerformanceInsights(businessType, platform, visualStyle);
  
  if (insights.sampleSize === 0) {
    return ''; // No data available
  }

  let instructions = `\n**PERFORMANCE-OPTIMIZED DESIGN INSTRUCTIONS:**\n`;
  
  if (insights.topSuccessfulElements.length > 0) {
    instructions += `**Proven Successful Elements (${insights.sampleSize} designs analyzed):**\n`;
    insights.topSuccessfulElements.forEach(element => {
      instructions += `- Incorporate: ${element}\n`;
    });
  }

  if (insights.commonIssues.length > 0) {
    instructions += `\n**Avoid Common Issues:**\n`;
    insights.commonIssues.forEach(issue => {
      instructions += `- Prevent: ${issue}\n`;
    });
  }

  if (insights.recommendations.length > 0) {
    instructions += `\n**Performance Recommendations:**\n`;
    insights.recommendations.forEach(rec => {
      instructions += `- ${rec}\n`;
    });
  }

  instructions += `\n**Performance Benchmarks:**\n`;
  instructions += `- Target Quality Score: ${Math.max(insights.averageQuality + 0.5, 8)}/10\n`;
  instructions += `- Target Engagement: ${Math.max(insights.averageEngagement + 0.5, 8)}/10\n`;

  return instructions;
}

/**
 * Exports analytics data for external analysis
 */
export function exportAnalyticsData(): {
  designs: DesignPerformance[];
  patterns: Array<{ key: string; data: any }>;
  summary: {
    totalDesigns: number;
    averageQuality: number;
    topBusinessTypes: string[];
    topPlatforms: string[];
  };
} {
  const designs = Array.from(designAnalytics.values());
  const patterns = Array.from(performancePatterns.entries()).map(([key, data]) => ({ key, data }));

  // Calculate summary statistics
  const totalDesigns = designs.length;
  const averageQuality = designs.reduce((sum, d) => sum + d.metrics.qualityScore, 0) / totalDesigns;
  
  const businessTypeCounts = designs.reduce((acc, d) => {
    acc[d.businessType] = (acc[d.businessType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const platformCounts = designs.reduce((acc, d) => {
    acc[d.platform] = (acc[d.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topBusinessTypes = Object.entries(businessTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type]) => type);

  const topPlatforms = Object.entries(platformCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([platform]) => platform);

  return {
    designs,
    patterns,
    summary: {
      totalDesigns,
      averageQuality: Math.round(averageQuality * 10) / 10,
      topBusinessTypes,
      topPlatforms
    }
  };
}
