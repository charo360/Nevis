/**
 * Planning Layer Module
 * Central export for all planning-related functionality
 * Part of Layer 2: Planning Layer
 */

// Content Calendar
export {
  generateContentCalendar,
  getCalendar,
  updateCalendarSlot,
  getNextSlotToGenerate,
  type ContentSlot,
  type ContentType,
  type CalendarConfig,
  type GeneratedCalendar,
} from './contentCalendar';

// Content Pillars
export {
  getSuggestedPillars,
  createContentPillars,
  getContentPillars,
  getNextPillarToUse,
  recordPillarUsage,
  updateContentPillar,
  formatPillarsForAssistant,
  type ContentPillar,
  type PillarSuggestion,
} from './contentPillars';

// Gap Analysis
export {
  analyzeContentGaps,
  formatGapAnalysisForAssistant,
  needsContentGeneration,
  type ContentGap,
  type GapAnalysisResult,
  type PillarBalance,
  type PlatformBalance,
  type ContentSuggestion,
} from './gapAnalysis';

/**
 * Combined planning function for content generation
 * This is the main entry point for the Planning Layer
 */
export async function performPlanning(
  brandProfileId: string,
  options: {
    industry?: string;
    location?: string;
    platforms?: string[];
    generateCalendar?: boolean;
    weeks?: number;
  } = {}
): Promise<{
  pillars: import('./contentPillars').ContentPillar[];
  nextPillar: import('./contentPillars').ContentPillar | null;
  gapAnalysis: import('./gapAnalysis').GapAnalysisResult;
  calendar?: import('./contentCalendar').GeneratedCalendar;
  formattedForAssistant: string;
}> {
  const {
    industry = 'retail',
    location,
    platforms = ['instagram'],
    generateCalendar = false,
    weeks = 4,
  } = options;

  // Get or create content pillars
  let pillars = await (await import('./contentPillars')).getContentPillars(brandProfileId);

  if (pillars.length === 0) {
    // Create default pillars based on industry
    const suggestions = (await import('./contentPillars')).getSuggestedPillars(industry);
    pillars = await (await import('./contentPillars')).createContentPillars(brandProfileId, suggestions);
  }

  // Get next pillar to use
  const nextPillar = await (await import('./contentPillars')).getNextPillarToUse(brandProfileId);

  // Perform gap analysis
  const gapAnalysis = await (await import('./gapAnalysis')).analyzeContentGaps(brandProfileId, { platforms });

  // Optionally generate calendar
  let calendar: import('./contentCalendar').GeneratedCalendar | undefined;
  if (generateCalendar) {
    calendar = await (await import('./contentCalendar')).generateContentCalendar(brandProfileId, {
      weeks,
      industry,
      location,
      platforms,
    });
  }

  // Format for AI assistant
  const formattedForAssistant = formatCombinedPlanning(pillars, nextPillar, gapAnalysis);

  return {
    pillars,
    nextPillar,
    gapAnalysis,
    calendar,
    formattedForAssistant,
  };
}

/**
 * Format all planning data for AI assistant consumption
 */
function formatCombinedPlanning(
  pillars: import('./contentPillars').ContentPillar[],
  nextPillar: import('./contentPillar').ContentPillar | null,
  gapAnalysis: import('./gapAnalysis').GapAnalysisResult
): string {
  let formatted = `
═══════════════════════════════════════════════════════════════
📋 CONTENT PLANNING INSIGHTS
═══════════════════════════════════════════════════════════════

🎯 RECOMMENDED NEXT CONTENT:
• Content Pillar: ${gapAnalysis.contentSuggestion.pillar}
• Marketing Angle: ${gapAnalysis.contentSuggestion.marketingAngle}
• Topic Idea: ${gapAnalysis.contentSuggestion.topicIdea}
• Reasoning: ${gapAnalysis.contentSuggestion.reasoning}

📚 CONTENT PILLARS:
${pillars.map(p => `• ${p.name} (${p.percentage}%): ${p.description}`).join('\n')}

📈 PILLAR BALANCE:
${gapAnalysis.pillarBalance.map(p => 
  `• ${p.pillar}: ${p.actualPercentage}% actual vs ${p.targetPercentage}% target ${
    p.status === 'under-used' ? '⬇️ UNDER' : 
    p.status === 'over-used' ? '⬆️ OVER' : '✅ OK'
  }`
).join('\n')}
`;

  if (nextPillar) {
    formatted += `
🎨 NEXT PILLAR DETAILS:
• Name: ${nextPillar.name}
• Tone: ${nextPillar.toneGuidelines}
• Visual Style: ${nextPillar.visualStyle}
• Example Topics: ${nextPillar.exampleTopics.slice(0, 3).join(', ')}
`;
  }

  if (gapAnalysis.recommendations.length > 0) {
    formatted += `
💡 RECOMMENDATIONS:
${gapAnalysis.recommendations.join('\n')}
`;
  }

  formatted += `
═══════════════════════════════════════════════════════════════
USE THIS PLANNING to create strategically balanced content.
═══════════════════════════════════════════════════════════════
`;

  return formatted;
}
