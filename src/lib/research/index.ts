/**
 * Research Layer Module
 * Central export for all research-related functionality
 * Part of Layer 1: Research Layer
 */

// Trend Analyzer
export {
  researchTrends,
  formatResearchForAssistant,
  type TrendData,
  type TrendResearchResult,
  type SeasonalEvent as TrendSeasonalEvent,
  type CompetitorInsight,
} from './trendAnalyzer';

// Hashtag Research
export {
  getHashtagRecommendations,
  analyzeHashtagPerformance,
  getPlatformHashtagConfig,
  formatHashtags,
  validateHashtags,
  type HashtagRecommendation,
  type HashtagStrategy,
} from './hashtagResearch';

// Seasonal Events
export {
  getUpcomingEvents,
  getEventContentIdeas,
  formatEventsForAssistant,
  getTodaysEvents,
  getEventsForPlanning,
  type SeasonalEvent,
  type EventCalendar,
} from './seasonalEvents';

/**
 * Combined research function for content generation
 * This is the main entry point for the Research Layer
 */
export async function performResearch(
  industry: string,
  options: {
    location?: string;
    platform?: string;
    brandName?: string;
    forceRefresh?: boolean;
  } = {}
): Promise<{
  trends: import('./trendAnalyzer').TrendResearchResult;
  hashtags: import('./hashtagResearch').HashtagStrategy;
  events: import('./seasonalEvents').EventCalendar;
  formattedForAssistant: string;
}> {
  const { location, platform = 'instagram', brandName, forceRefresh = false } = options;

  // Perform all research in parallel
  const [trends, events] = await Promise.all([
    (await import('./trendAnalyzer')).researchTrends(industry, { location, platform, forceRefresh }),
    Promise.resolve((await import('./seasonalEvents')).getUpcomingEvents({ location, industry })),
  ]);

  // Get hashtag recommendations
  const hashtags = (await import('./hashtagResearch')).getHashtagRecommendations(
    industry,
    platform,
    { location, brandName }
  );

  // Format for AI assistant
  const formattedForAssistant = formatCombinedResearch(trends, hashtags, events);

  return {
    trends,
    hashtags,
    events,
    formattedForAssistant,
  };
}

/**
 * Format all research data for AI assistant consumption
 */
function formatCombinedResearch(
  trends: import('./trendAnalyzer').TrendResearchResult,
  hashtags: import('./hashtagResearch').HashtagStrategy,
  events: import('./seasonalEvents').EventCalendar
): string {
  let formatted = `
═══════════════════════════════════════════════════════════════
📊 MARKET RESEARCH & TRENDS (${trends.industry.toUpperCase()})
═══════════════════════════════════════════════════════════════
Research Date: ${trends.researchedAt.toLocaleDateString()}
Confidence: ${Math.round(trends.confidence * 100)}%

🔥 CURRENT TRENDS:
${trends.trends.slice(0, 5).map(t => `• ${t.topic} [${t.category}]`).join('\n')}

#️⃣ RECOMMENDED HASHTAGS (${trends.platform}):
${hashtags.recommended.join(' ')}

Alternative hashtags:
• Trending: ${hashtags.trending.slice(0, 3).join(' ')}
• Evergreen: ${hashtags.evergreen.slice(0, 3).join(' ')}
• Niche: ${hashtags.niche.slice(0, 3).join(' ')}
`;

  if (events.thisWeek.length > 0) {
    formatted += `
📅 EVENTS THIS WEEK:
${events.thisWeek.map(e => `• ${e.name} (${e.date}) - ${e.contentIdeas[0]}`).join('\n')}
`;
  }

  if (events.thisMonth.length > 0 && events.thisWeek.length === 0) {
    formatted += `
📅 UPCOMING EVENTS:
${events.thisMonth.slice(0, 3).map(e => `• ${e.name} (${e.date})`).join('\n')}
`;
  }

  if (trends.competitorInsights.length > 0) {
    formatted += `
🎯 COMPETITIVE POSITIONING:
${trends.competitorInsights.slice(0, 2).map(c => 
  `• vs ${c.name}: Emphasize ${c.contentThemes.slice(0, 2).join(', ')}`
).join('\n')}
`;
  }

  formatted += `
═══════════════════════════════════════════════════════════════
USE THIS RESEARCH to make content timely, relevant, and competitive.
═══════════════════════════════════════════════════════════════
`;

  return formatted;
}
