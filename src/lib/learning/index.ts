/**
 * Learning Layer Module
 * Central export for all learning-related functionality
 * Part of Layer 5: Iteration & Learning Layer
 */

// Feedback Processor
export {
  trackUserEdit,
  analyzePatterns,
  getLearningInsights,
  formatLearningInsightsForAssistant,
  type UserEdit,
  type EditType,
  type EditPattern,
  type LearningInsights,
} from './feedbackProcessor';

// Performance Analyzer
export {
  analyzePerformance,
  getPerformanceInsights,
  formatPerformanceInsightsForAssistant,
  type PostPerformance,
  type PerformanceMetrics,
  type SuccessPattern,
  type PerformanceInsights,
} from './performanceAnalyzer';

/**
 * Combined learning function for content generation
 * This is the main entry point for the Learning Layer
 */
export async function gatherLearnings(
  clientId: string
): Promise<{
  learningInsights: import('./feedbackProcessor').LearningInsights | null;
  performanceInsights: import('./performanceAnalyzer').PerformanceInsights | null;
  formattedForAssistant: string;
}> {
  // Get both types of insights in parallel
  const [learningInsights, performanceInsights] = await Promise.all([
    (await import('./feedbackProcessor')).getLearningInsights(clientId),
    (await import('./performanceAnalyzer')).getPerformanceInsights(clientId),
  ]);

  // Format for AI assistant
  const formattedForAssistant = formatCombinedLearnings(learningInsights, performanceInsights);

  return {
    learningInsights,
    performanceInsights,
    formattedForAssistant,
  };
}

/**
 * Format all learning data for AI assistant consumption
 */
function formatCombinedLearnings(
  learningInsights: import('./feedbackProcessor').LearningInsights | null,
  performanceInsights: import('./performanceAnalyzer').PerformanceInsights | null
): string {
  let formatted = `
═══════════════════════════════════════════════════════════════
🧠 LEARNING & PERFORMANCE INSIGHTS
═══════════════════════════════════════════════════════════════
`;

  if (learningInsights && learningInsights.totalEdits > 0) {
    formatted += `
📝 USER PREFERENCES (from ${learningInsights.totalEdits} edits):
• Preferred tone: ${learningInsights.preferredTone}
• Preferred length: ${learningInsights.preferredLength}
• Emoji style: ${learningInsights.emojiPreference}
`;

    if (learningInsights.commonRemovals.length > 0) {
      formatted += `
🚫 WORDS USER OFTEN REMOVES:
${learningInsights.commonRemovals.slice(0, 5).map(w => `• "${w}"`).join('\n')}
`;
    }

    if (learningInsights.commonAdditions.length > 0) {
      formatted += `
✅ WORDS USER OFTEN ADDS:
${learningInsights.commonAdditions.slice(0, 5).map(w => `• "${w}"`).join('\n')}
`;
    }
  } else {
    formatted += `
📝 USER PREFERENCES: No edit history yet
`;
  }

  if (performanceInsights && performanceInsights.successfulPatterns.length > 0) {
    formatted += `
📊 TOP PERFORMING PATTERNS:
${performanceInsights.successfulPatterns.slice(0, 3).map(p => 
  `• ${p.pattern} (${p.avgEngagementRate.toFixed(1)}% engagement)`
).join('\n')}
`;

    if (performanceInsights.bestPostingTimes.length > 0) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      formatted += `
⏰ BEST POSTING TIMES:
${performanceInsights.bestPostingTimes.slice(0, 3).map(t => 
  `• ${days[t.day]} at ${t.hour}:00`
).join('\n')}
`;
    }

    if (performanceInsights.topHashtags.length > 0) {
      formatted += `
#️⃣ TOP HASHTAGS:
${performanceInsights.topHashtags.slice(0, 5).map(h => h.hashtag).join(' ')}
`;
    }

    if (performanceInsights.underperformingPatterns.length > 0) {
      formatted += `
⚠️ AVOID THESE PATTERNS:
${performanceInsights.underperformingPatterns.slice(0, 2).map(p => 
  `• ${p.pattern}`
).join('\n')}
`;
    }
  } else {
    formatted += `
📊 PERFORMANCE DATA: Not enough posts yet for analysis
`;
  }

  formatted += `
═══════════════════════════════════════════════════════════════
APPLY these learnings to create content the user will love.
═══════════════════════════════════════════════════════════════
`;

  return formatted;
}

/**
 * Trigger full learning analysis for a client
 */
export async function runFullAnalysis(clientId: string): Promise<void> {
  console.log(`🔄 [Learning] Running full analysis for client ${clientId}`);

  const [{ analyzePatterns }, { analyzePerformance }] = await Promise.all([
    import('./feedbackProcessor'),
    import('./performanceAnalyzer'),
  ]);

  await Promise.all([
    analyzePatterns(clientId),
    analyzePerformance(clientId),
  ]);

  console.log(`✅ [Learning] Full analysis complete for client ${clientId}`);
}

/**
 * Check if learning data is stale and needs refresh
 */
export async function needsRefresh(clientId: string): Promise<boolean> {
  const { getPerformanceInsights } = await import('./performanceAnalyzer');
  const insights = await getPerformanceInsights(clientId);

  if (!insights) return true;

  // Refresh if last analysis was more than 7 days ago
  const daysSinceAnalysis = (Date.now() - insights.lastAnalyzed.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceAnalysis > 7;
}
