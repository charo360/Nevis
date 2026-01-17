/**
 * Gap Analysis
 * Identifies content gaps and suggests what to create next
 * Part of Layer 2: Planning Layer
 */

import { createClient } from '@supabase/supabase-js';
import { getContentPillars, ContentPillar } from './contentPillars';
import { getCalendar, ContentSlot } from './contentCalendar';

export interface ContentGap {
  type: 'pillar' | 'platform' | 'time' | 'angle' | 'event';
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
  data?: Record<string, unknown>;
}

export interface GapAnalysisResult {
  gaps: ContentGap[];
  recommendations: string[];
  pillarBalance: PillarBalance[];
  platformBalance: PlatformBalance[];
  contentSuggestion: ContentSuggestion;
}

export interface PillarBalance {
  pillar: string;
  targetPercentage: number;
  actualPercentage: number;
  gap: number; // Positive = under-used, negative = over-used
  status: 'balanced' | 'under-used' | 'over-used';
}

export interface PlatformBalance {
  platform: string;
  postsThisWeek: number;
  postsLastWeek: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface ContentSuggestion {
  pillar: string;
  contentType: string;
  marketingAngle: string;
  topicIdea: string;
  reasoning: string;
}

// Marketing angles for rotation tracking
const MARKETING_ANGLES = [
  'price-value',
  'quality-premium',
  'convenience-ease',
  'trust-reliability',
  'innovation-modern',
  'community-belonging',
  'urgency-scarcity',
  'social-proof',
  'problem-solution',
  'transformation',
];

/**
 * Analyze content gaps for a brand
 */
export async function analyzeContentGaps(
  brandProfileId: string,
  options: {
    lookbackDays?: number;
    platforms?: string[];
  } = {}
): Promise<GapAnalysisResult> {
  const { lookbackDays = 30, platforms = ['instagram'] } = options;

  console.log(`🔍 [Gap Analysis] Analyzing content gaps for brand ${brandProfileId}`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get content pillars
  const pillars = await getContentPillars(brandProfileId);

  // Get recent calendar data
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackDays);
  const calendar = await getCalendar(brandProfileId, { startDate });

  // Get recent posts from scheduled_posts
  const { data: recentPosts } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('client_id', brandProfileId)
    .gte('scheduled_at', startDate.toISOString())
    .order('scheduled_at', { ascending: false });

  // Analyze gaps
  const gaps: ContentGap[] = [];

  // 1. Pillar balance analysis
  const pillarBalance = analyzePillarBalance(pillars, calendar);
  for (const balance of pillarBalance) {
    if (balance.status === 'under-used' && balance.gap > 10) {
      gaps.push({
        type: 'pillar',
        severity: balance.gap > 20 ? 'high' : 'medium',
        description: `"${balance.pillar}" content is under-represented`,
        suggestion: `Create more ${balance.pillar.toLowerCase()} content to reach ${balance.targetPercentage}% target`,
        data: { pillar: balance.pillar, gap: balance.gap },
      });
    }
  }

  // 2. Platform balance analysis
  const platformBalance = analyzePlatformBalance(calendar, platforms);
  for (const balance of platformBalance) {
    if (balance.postsThisWeek === 0) {
      gaps.push({
        type: 'platform',
        severity: 'high',
        description: `No posts scheduled for ${balance.platform} this week`,
        suggestion: `Schedule content for ${balance.platform} to maintain presence`,
        data: { platform: balance.platform },
      });
    }
  }

  // 3. Time gap analysis
  const timeGaps = analyzeTimeGaps(calendar);
  gaps.push(...timeGaps);

  // 4. Marketing angle rotation
  const angleGaps = analyzeAngleRotation(recentPosts || []);
  gaps.push(...angleGaps);

  // 5. Generate content suggestion
  const contentSuggestion = generateContentSuggestion(pillarBalance, gaps, pillars);

  // 6. Build recommendations
  const recommendations = buildRecommendations(gaps, pillarBalance);

  console.log(`✅ [Gap Analysis] Found ${gaps.length} gaps`);

  return {
    gaps,
    recommendations,
    pillarBalance,
    platformBalance,
    contentSuggestion,
  };
}

/**
 * Analyze pillar usage balance
 */
function analyzePillarBalance(
  pillars: ContentPillar[],
  calendar: ContentSlot[]
): PillarBalance[] {
  const totalPosts = calendar.length || 1; // Avoid division by zero

  // Count posts per pillar
  const pillarCounts: Record<string, number> = {};
  for (const slot of calendar) {
    const pillar = slot.contentPillar || 'Unknown';
    pillarCounts[pillar] = (pillarCounts[pillar] || 0) + 1;
  }

  return pillars.map(pillar => {
    const count = pillarCounts[pillar.name] || 0;
    const actualPercentage = (count / totalPosts) * 100;
    const gap = pillar.percentage - actualPercentage;

    let status: PillarBalance['status'] = 'balanced';
    if (gap > 5) status = 'under-used';
    if (gap < -5) status = 'over-used';

    return {
      pillar: pillar.name,
      targetPercentage: pillar.percentage,
      actualPercentage: Math.round(actualPercentage),
      gap: Math.round(gap),
      status,
    };
  });
}

/**
 * Analyze platform posting balance
 */
function analyzePlatformBalance(
  calendar: ContentSlot[],
  platforms: string[]
): PlatformBalance[] {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  return platforms.map(platform => {
    const thisWeek = calendar.filter(
      slot => slot.platform === platform && slot.date >= oneWeekAgo
    ).length;

    const lastWeek = calendar.filter(
      slot => slot.platform === platform && slot.date >= twoWeeksAgo && slot.date < oneWeekAgo
    ).length;

    let trend: PlatformBalance['trend'] = 'stable';
    if (thisWeek > lastWeek + 1) trend = 'increasing';
    if (thisWeek < lastWeek - 1) trend = 'decreasing';

    return {
      platform,
      postsThisWeek: thisWeek,
      postsLastWeek: lastWeek,
      trend,
    };
  });
}

/**
 * Analyze time gaps in posting schedule
 */
function analyzeTimeGaps(calendar: ContentSlot[]): ContentGap[] {
  const gaps: ContentGap[] = [];

  // Sort by date
  const sorted = [...calendar].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Check for gaps longer than 3 days
  for (let i = 1; i < sorted.length; i++) {
    const daysBetween = Math.floor(
      (sorted[i].date.getTime() - sorted[i - 1].date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysBetween > 3) {
      gaps.push({
        type: 'time',
        severity: daysBetween > 5 ? 'high' : 'medium',
        description: `${daysBetween}-day gap between posts`,
        suggestion: `Fill the gap between ${sorted[i - 1].date.toLocaleDateString()} and ${sorted[i].date.toLocaleDateString()}`,
        data: { daysBetween, startDate: sorted[i - 1].date, endDate: sorted[i].date },
      });
    }
  }

  // Check if no posts scheduled for next 7 days
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingPosts = sorted.filter(slot => slot.date >= now && slot.date <= nextWeek);

  if (upcomingPosts.length === 0) {
    gaps.push({
      type: 'time',
      severity: 'high',
      description: 'No posts scheduled for the next 7 days',
      suggestion: 'Generate content calendar for the upcoming week',
    });
  }

  return gaps;
}

/**
 * Analyze marketing angle rotation
 */
function analyzeAngleRotation(recentPosts: Array<{ marketing_angle?: string }>): ContentGap[] {
  const gaps: ContentGap[] = [];

  // Count angle usage
  const angleCounts: Record<string, number> = {};
  for (const post of recentPosts) {
    const angle = post.marketing_angle || 'unknown';
    angleCounts[angle] = (angleCounts[angle] || 0) + 1;
  }

  // Find unused angles
  const unusedAngles = MARKETING_ANGLES.filter(angle => !angleCounts[angle]);

  if (unusedAngles.length > 3) {
    gaps.push({
      type: 'angle',
      severity: 'medium',
      description: `${unusedAngles.length} marketing angles haven't been used recently`,
      suggestion: `Try using: ${unusedAngles.slice(0, 3).join(', ')}`,
      data: { unusedAngles },
    });
  }

  // Check for over-used angles
  const totalPosts = recentPosts.length || 1;
  for (const [angle, count] of Object.entries(angleCounts)) {
    const percentage = (count / totalPosts) * 100;
    if (percentage > 30) {
      gaps.push({
        type: 'angle',
        severity: 'low',
        description: `"${angle}" angle used in ${Math.round(percentage)}% of posts`,
        suggestion: 'Diversify marketing angles for variety',
        data: { angle, percentage },
      });
    }
  }

  return gaps;
}

/**
 * Generate content suggestion based on gaps
 */
function generateContentSuggestion(
  pillarBalance: PillarBalance[],
  gaps: ContentGap[],
  pillars: ContentPillar[]
): ContentSuggestion {
  // Find most under-used pillar
  const mostUnderused = pillarBalance
    .filter(p => p.status === 'under-used')
    .sort((a, b) => b.gap - a.gap)[0];

  const pillarName = mostUnderused?.pillar || pillarBalance[0]?.pillar || 'General';
  const pillar = pillars.find(p => p.name === pillarName);

  // Find unused marketing angle
  const angleGap = gaps.find(g => g.type === 'angle' && g.data?.unusedAngles);
  const unusedAngles = (angleGap?.data?.unusedAngles as string[]) || MARKETING_ANGLES;
  const suggestedAngle = unusedAngles[Math.floor(Math.random() * unusedAngles.length)];

  // Generate topic idea
  const topicIdea = pillar?.exampleTopics[
    Math.floor(Math.random() * (pillar?.exampleTopics.length || 1))
  ] || 'General content';

  return {
    pillar: pillarName,
    contentType: pillar?.name.toLowerCase().replace(/\s+/g, '-') || 'promotional',
    marketingAngle: suggestedAngle,
    topicIdea,
    reasoning: mostUnderused
      ? `"${pillarName}" is ${mostUnderused.gap}% below target`
      : 'Balanced content distribution',
  };
}

/**
 * Build actionable recommendations
 */
function buildRecommendations(
  gaps: ContentGap[],
  pillarBalance: PillarBalance[]
): string[] {
  const recommendations: string[] = [];

  // High priority gaps
  const highPriority = gaps.filter(g => g.severity === 'high');
  for (const gap of highPriority.slice(0, 3)) {
    recommendations.push(`🔴 ${gap.suggestion}`);
  }

  // Medium priority gaps
  const mediumPriority = gaps.filter(g => g.severity === 'medium');
  for (const gap of mediumPriority.slice(0, 2)) {
    recommendations.push(`🟡 ${gap.suggestion}`);
  }

  // Pillar-specific recommendations
  const underusedPillars = pillarBalance.filter(p => p.status === 'under-used');
  if (underusedPillars.length > 0) {
    recommendations.push(
      `📊 Focus on: ${underusedPillars.map(p => p.pillar).join(', ')}`
    );
  }

  // If no gaps, suggest maintaining current strategy
  if (recommendations.length === 0) {
    recommendations.push('✅ Content strategy is well-balanced');
    recommendations.push('💡 Consider experimenting with new content formats');
  }

  return recommendations;
}

/**
 * Format gap analysis for AI assistant
 */
export function formatGapAnalysisForAssistant(analysis: GapAnalysisResult): string {
  let formatted = `
📊 CONTENT GAP ANALYSIS
═══════════════════════════════════════════════════════════════

🎯 RECOMMENDED NEXT CONTENT:
• Pillar: ${analysis.contentSuggestion.pillar}
• Angle: ${analysis.contentSuggestion.marketingAngle}
• Topic: ${analysis.contentSuggestion.topicIdea}
• Reason: ${analysis.contentSuggestion.reasoning}

📈 PILLAR BALANCE:
${analysis.pillarBalance.map(p => 
  `• ${p.pillar}: ${p.actualPercentage}% (target: ${p.targetPercentage}%) ${p.status === 'under-used' ? '⬇️' : p.status === 'over-used' ? '⬆️' : '✅'}`
).join('\n')}

💡 RECOMMENDATIONS:
${analysis.recommendations.join('\n')}
`;

  if (analysis.gaps.length > 0) {
    formatted += `
⚠️ IDENTIFIED GAPS:
${analysis.gaps.slice(0, 5).map(g => `• [${g.severity.toUpperCase()}] ${g.description}`).join('\n')}
`;
  }

  return formatted;
}

/**
 * Quick check if content generation is needed
 */
export async function needsContentGeneration(
  brandProfileId: string
): Promise<{ needed: boolean; reason: string }> {
  const analysis = await analyzeContentGaps(brandProfileId);

  const highPriorityGaps = analysis.gaps.filter(g => g.severity === 'high');

  if (highPriorityGaps.length > 0) {
    return {
      needed: true,
      reason: highPriorityGaps[0].description,
    };
  }

  return {
    needed: false,
    reason: 'Content calendar is well-maintained',
  };
}

export default {
  analyzeContentGaps,
  formatGapAnalysisForAssistant,
  needsContentGeneration,
};
