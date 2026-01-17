/**
 * Performance Analyzer
 * Analyzes post performance to identify successful patterns
 * Part of Layer 5: Iteration & Learning Layer
 */

import { createClient } from '@supabase/supabase-js';

export interface PostPerformance {
  postId: string;
  clientId: string;
  platform: string;
  publishedAt: Date;
  metrics: PerformanceMetrics;
  content: {
    headline?: string;
    caption?: string;
    hashtags?: string[];
    contentType?: string;
    marketingAngle?: string;
  };
}

export interface PerformanceMetrics {
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  engagementRate: number; // (engagement / reach) * 100
}

export interface SuccessPattern {
  pattern: string;
  category: 'content_type' | 'marketing_angle' | 'posting_time' | 'hashtag' | 'length' | 'tone';
  avgEngagementRate: number;
  sampleSize: number;
  confidence: number; // 0-1
  examples: string[];
}

export interface PerformanceInsights {
  clientId: string;
  successfulPatterns: SuccessPattern[];
  underperformingPatterns: SuccessPattern[];
  bestPostingTimes: { day: number; hour: number; avgEngagement: number }[];
  topHashtags: { hashtag: string; avgEngagement: number; usageCount: number }[];
  optimalContentLength: { min: number; max: number; avgEngagement: number };
  lastAnalyzed: Date;
}

/**
 * Analyze performance for a client
 */
export async function analyzePerformance(clientId: string): Promise<PerformanceInsights> {
  console.log(`📊 [Performance] Analyzing performance for client ${clientId}`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get scheduled posts with analytics
  const { data: posts } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'published')
    .not('analytics', 'is', null)
    .order('scheduled_at', { ascending: false })
    .limit(200);

  if (!posts || posts.length < 5) {
    console.log(`⚠️ [Performance] Not enough data for analysis (${posts?.length || 0} posts)`);
    return getEmptyInsights(clientId);
  }

  // Convert to PostPerformance objects
  const performances: PostPerformance[] = posts.map(post => ({
    postId: post.id,
    clientId: post.client_id,
    platform: post.platform || 'instagram',
    publishedAt: new Date(post.scheduled_at),
    metrics: extractMetrics(post.analytics),
    content: {
      headline: post.headline,
      caption: post.caption,
      hashtags: post.hashtags,
      contentType: post.content_type,
      marketingAngle: post.marketing_angle,
    },
  }));

  // Analyze patterns
  const successfulPatterns = findSuccessfulPatterns(performances);
  const underperformingPatterns = findUnderperformingPatterns(performances);
  const bestPostingTimes = analyzeBestPostingTimes(performances);
  const topHashtags = analyzeTopHashtags(performances);
  const optimalContentLength = analyzeOptimalLength(performances);

  const insights: PerformanceInsights = {
    clientId,
    successfulPatterns,
    underperformingPatterns,
    bestPostingTimes,
    topHashtags,
    optimalContentLength,
    lastAnalyzed: new Date(),
  };

  // Save to database
  await supabase.from('performance_insights').upsert({
    client_id: clientId,
    successful_patterns: successfulPatterns,
    underperforming_patterns: underperformingPatterns,
    best_posting_times: bestPostingTimes,
    top_hashtags: topHashtags,
    optimal_content_length: optimalContentLength,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'client_id',
  });

  console.log(`✅ [Performance] Analysis complete: ${successfulPatterns.length} successful patterns`);
  return insights;
}

/**
 * Extract metrics from analytics data
 */
function extractMetrics(analytics: Record<string, unknown> | null): PerformanceMetrics {
  if (!analytics) {
    return {
      impressions: 0,
      reach: 0,
      engagement: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      clicks: 0,
      engagementRate: 0,
    };
  }

  const impressions = (analytics.impressions as number) || 0;
  const reach = (analytics.reach as number) || impressions;
  const likes = (analytics.likes as number) || 0;
  const comments = (analytics.comments as number) || 0;
  const shares = (analytics.shares as number) || 0;
  const saves = (analytics.saves as number) || 0;
  const clicks = (analytics.clicks as number) || 0;
  const engagement = likes + comments + shares + saves;
  const engagementRate = reach > 0 ? (engagement / reach) * 100 : 0;

  return {
    impressions,
    reach,
    engagement,
    likes,
    comments,
    shares,
    saves,
    clicks,
    engagementRate,
  };
}

/**
 * Find successful patterns
 */
function findSuccessfulPatterns(performances: PostPerformance[]): SuccessPattern[] {
  const patterns: SuccessPattern[] = [];

  // Calculate average engagement rate
  const avgEngagement = performances.reduce((sum, p) => sum + p.metrics.engagementRate, 0) / performances.length;

  // Analyze by content type
  const byContentType = groupBy(performances, p => p.content.contentType || 'unknown');
  for (const [contentType, posts] of Object.entries(byContentType)) {
    const typeAvg = posts.reduce((sum, p) => sum + p.metrics.engagementRate, 0) / posts.length;
    if (typeAvg > avgEngagement * 1.2 && posts.length >= 3) {
      patterns.push({
        pattern: `Content type: ${contentType}`,
        category: 'content_type',
        avgEngagementRate: typeAvg,
        sampleSize: posts.length,
        confidence: Math.min(posts.length / 10, 1),
        examples: posts.slice(0, 3).map(p => p.content.caption?.substring(0, 100) || ''),
      });
    }
  }

  // Analyze by marketing angle
  const byAngle = groupBy(performances, p => p.content.marketingAngle || 'unknown');
  for (const [angle, posts] of Object.entries(byAngle)) {
    const angleAvg = posts.reduce((sum, p) => sum + p.metrics.engagementRate, 0) / posts.length;
    if (angleAvg > avgEngagement * 1.2 && posts.length >= 3) {
      patterns.push({
        pattern: `Marketing angle: ${angle}`,
        category: 'marketing_angle',
        avgEngagementRate: angleAvg,
        sampleSize: posts.length,
        confidence: Math.min(posts.length / 10, 1),
        examples: posts.slice(0, 3).map(p => p.content.caption?.substring(0, 100) || ''),
      });
    }
  }

  // Analyze by posting hour
  const byHour = groupBy(performances, p => p.publishedAt.getHours().toString());
  for (const [hour, posts] of Object.entries(byHour)) {
    const hourAvg = posts.reduce((sum, p) => sum + p.metrics.engagementRate, 0) / posts.length;
    if (hourAvg > avgEngagement * 1.3 && posts.length >= 3) {
      patterns.push({
        pattern: `Posting at ${hour}:00`,
        category: 'posting_time',
        avgEngagementRate: hourAvg,
        sampleSize: posts.length,
        confidence: Math.min(posts.length / 10, 1),
        examples: [],
      });
    }
  }

  return patterns.sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);
}

/**
 * Find underperforming patterns
 */
function findUnderperformingPatterns(performances: PostPerformance[]): SuccessPattern[] {
  const patterns: SuccessPattern[] = [];

  // Calculate average engagement rate
  const avgEngagement = performances.reduce((sum, p) => sum + p.metrics.engagementRate, 0) / performances.length;

  // Analyze by content type
  const byContentType = groupBy(performances, p => p.content.contentType || 'unknown');
  for (const [contentType, posts] of Object.entries(byContentType)) {
    const typeAvg = posts.reduce((sum, p) => sum + p.metrics.engagementRate, 0) / posts.length;
    if (typeAvg < avgEngagement * 0.7 && posts.length >= 3) {
      patterns.push({
        pattern: `Content type: ${contentType}`,
        category: 'content_type',
        avgEngagementRate: typeAvg,
        sampleSize: posts.length,
        confidence: Math.min(posts.length / 10, 1),
        examples: [],
      });
    }
  }

  // Analyze by marketing angle
  const byAngle = groupBy(performances, p => p.content.marketingAngle || 'unknown');
  for (const [angle, posts] of Object.entries(byAngle)) {
    const angleAvg = posts.reduce((sum, p) => sum + p.metrics.engagementRate, 0) / posts.length;
    if (angleAvg < avgEngagement * 0.7 && posts.length >= 3) {
      patterns.push({
        pattern: `Marketing angle: ${angle}`,
        category: 'marketing_angle',
        avgEngagementRate: angleAvg,
        sampleSize: posts.length,
        confidence: Math.min(posts.length / 10, 1),
        examples: [],
      });
    }
  }

  return patterns.sort((a, b) => a.avgEngagementRate - b.avgEngagementRate);
}

/**
 * Analyze best posting times
 */
function analyzeBestPostingTimes(performances: PostPerformance[]): PerformanceInsights['bestPostingTimes'] {
  const timeSlots: Record<string, { total: number; count: number }> = {};

  for (const perf of performances) {
    const day = perf.publishedAt.getDay();
    const hour = perf.publishedAt.getHours();
    const key = `${day}-${hour}`;

    if (!timeSlots[key]) {
      timeSlots[key] = { total: 0, count: 0 };
    }
    timeSlots[key].total += perf.metrics.engagementRate;
    timeSlots[key].count++;
  }

  return Object.entries(timeSlots)
    .filter(([, data]) => data.count >= 2)
    .map(([key, data]) => {
      const [day, hour] = key.split('-').map(Number);
      return {
        day,
        hour,
        avgEngagement: data.total / data.count,
      };
    })
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 10);
}

/**
 * Analyze top performing hashtags
 */
function analyzeTopHashtags(performances: PostPerformance[]): PerformanceInsights['topHashtags'] {
  const hashtagStats: Record<string, { total: number; count: number }> = {};

  for (const perf of performances) {
    const hashtags = perf.content.hashtags || [];
    for (const hashtag of hashtags) {
      if (!hashtagStats[hashtag]) {
        hashtagStats[hashtag] = { total: 0, count: 0 };
      }
      hashtagStats[hashtag].total += perf.metrics.engagementRate;
      hashtagStats[hashtag].count++;
    }
  }

  return Object.entries(hashtagStats)
    .filter(([, data]) => data.count >= 3)
    .map(([hashtag, data]) => ({
      hashtag,
      avgEngagement: data.total / data.count,
      usageCount: data.count,
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 15);
}

/**
 * Analyze optimal content length
 */
function analyzeOptimalLength(performances: PostPerformance[]): PerformanceInsights['optimalContentLength'] {
  // Group by length buckets
  const buckets: Record<string, { total: number; count: number }> = {
    'short': { total: 0, count: 0 },   // < 50 words
    'medium': { total: 0, count: 0 },  // 50-100 words
    'long': { total: 0, count: 0 },    // > 100 words
  };

  for (const perf of performances) {
    const wordCount = (perf.content.caption || '').split(/\s+/).length;
    const bucket = wordCount < 50 ? 'short' : wordCount < 100 ? 'medium' : 'long';
    buckets[bucket].total += perf.metrics.engagementRate;
    buckets[bucket].count++;
  }

  // Find best performing bucket
  let bestBucket = 'medium';
  let bestAvg = 0;

  for (const [bucket, data] of Object.entries(buckets)) {
    if (data.count > 0) {
      const avg = data.total / data.count;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestBucket = bucket;
      }
    }
  }

  const ranges = {
    'short': { min: 20, max: 50 },
    'medium': { min: 50, max: 100 },
    'long': { min: 100, max: 200 },
  };

  return {
    ...ranges[bestBucket as keyof typeof ranges],
    avgEngagement: bestAvg,
  };
}

/**
 * Get empty insights for new clients
 */
function getEmptyInsights(clientId: string): PerformanceInsights {
  return {
    clientId,
    successfulPatterns: [],
    underperformingPatterns: [],
    bestPostingTimes: [],
    topHashtags: [],
    optimalContentLength: { min: 50, max: 100, avgEngagement: 0 },
    lastAnalyzed: new Date(),
  };
}

/**
 * Helper: Group array by key
 */
function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Get performance insights for a client
 */
export async function getPerformanceInsights(clientId: string): Promise<PerformanceInsights | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from('performance_insights')
    .select('*')
    .eq('client_id', clientId)
    .single();

  if (!data) return null;

  return {
    clientId: data.client_id,
    successfulPatterns: data.successful_patterns || [],
    underperformingPatterns: data.underperforming_patterns || [],
    bestPostingTimes: data.best_posting_times || [],
    topHashtags: data.top_hashtags || [],
    optimalContentLength: data.optimal_content_length || { min: 50, max: 100, avgEngagement: 0 },
    lastAnalyzed: new Date(data.updated_at),
  };
}

/**
 * Format performance insights for AI assistant
 */
export function formatPerformanceInsightsForAssistant(insights: PerformanceInsights): string {
  if (insights.successfulPatterns.length === 0) {
    return 'No performance data available yet. Continue posting to build insights.';
  }

  let formatted = `
📊 PERFORMANCE INSIGHTS (based on historical data):

✅ SUCCESSFUL PATTERNS:
${insights.successfulPatterns.slice(0, 5).map(p => 
  `• ${p.pattern} (${p.avgEngagementRate.toFixed(2)}% engagement, ${p.sampleSize} posts)`
).join('\n')}

⏰ BEST POSTING TIMES:
${insights.bestPostingTimes.slice(0, 5).map(t => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `• ${days[t.day]} at ${t.hour}:00 (${t.avgEngagement.toFixed(2)}% avg)`;
}).join('\n')}

#️⃣ TOP HASHTAGS:
${insights.topHashtags.slice(0, 5).map(h => 
  `• ${h.hashtag} (${h.avgEngagement.toFixed(2)}% avg, used ${h.usageCount}x)`
).join('\n')}

📏 OPTIMAL CONTENT LENGTH:
• ${insights.optimalContentLength.min}-${insights.optimalContentLength.max} words

Apply these insights to maximize engagement.
`;

  if (insights.underperformingPatterns.length > 0) {
    formatted += `
⚠️ PATTERNS TO AVOID:
${insights.underperformingPatterns.slice(0, 3).map(p => 
  `• ${p.pattern} (only ${p.avgEngagementRate.toFixed(2)}% engagement)`
).join('\n')}
`;
  }

  return formatted;
}

export default {
  analyzePerformance,
  getPerformanceInsights,
  formatPerformanceInsightsForAssistant,
};
