/**
 * Humanization Layer Module
 * Central export for all humanization-related functionality
 * Part of Layer 4: Humanization Layer
 */

// AI Pattern Removal
export {
  removeAIPatterns,
  addConversationalElements,
  addNaturalImperfections,
  expandContractions,
  addContractions,
  humanizeContent,
  type HumanizationResult,
} from './aiPatternRemoval';

// Brand Voice
export {
  getDefaultBrandVoice,
  injectBrandVoice,
  getBrandVoice,
  saveBrandVoice,
  analyzeBrandVoiceConsistency,
  formatBrandVoiceForAssistant,
  type BrandVoice,
  type BrandVocabulary,
  type ToneAttribute,
} from './brandVoice';

/**
 * Full humanization pipeline for content
 * This is the main entry point for the Humanization Layer
 */
export async function performHumanization(
  content: string,
  options: {
    brandProfileId?: string;
    industry?: string;
    removeAIPatterns?: boolean;
    injectBrandVoice?: boolean;
    addConversational?: boolean;
    addContractions?: boolean;
  } = {}
): Promise<{
  original: string;
  humanized: string;
  changesApplied: string[];
  humanScore: number;
  brandVoiceScore?: number;
}> {
  const {
    brandProfileId,
    industry = 'service',
    removeAIPatterns: removePatterns = true,
    injectBrandVoice: injectVoice = true,
    addConversational = true,
    addContractions: addContr = true,
  } = options;

  let result = content;
  const allChanges: string[] = [];

  // Step 1: Remove AI patterns and humanize
  if (removePatterns || addConversational || addContr) {
    const { humanizeContent } = await import('./aiPatternRemoval');
    const humanized = humanizeContent(result, {
      removePatterns,
      addConversational,
      addContractions: addContr,
      addImperfections: false,
    });
    result = humanized.humanized;
    allChanges.push(...humanized.changesApplied);
  }

  // Step 2: Inject brand voice
  let brandVoiceScore: number | undefined;
  if (injectVoice) {
    const { getBrandVoice, getDefaultBrandVoice, injectBrandVoice, analyzeBrandVoiceConsistency } = await import('./brandVoice');
    
    let brandVoice = brandProfileId ? await getBrandVoice(brandProfileId) : null;
    
    if (!brandVoice) {
      // Use default brand voice for industry
      const defaultVoice = getDefaultBrandVoice(industry);
      brandVoice = {
        brandProfileId: brandProfileId || 'default',
        vocabulary: defaultVoice.vocabulary!,
        toneAttributes: defaultVoice.toneAttributes!,
        avoidWords: defaultVoice.avoidWords!,
        preferredPhrases: defaultVoice.preferredPhrases!,
        emojiStyle: defaultVoice.emojiStyle!,
        formality: defaultVoice.formality!,
      };
    }

    const voiceResult = injectBrandVoice(result, brandVoice);
    result = voiceResult.result;
    allChanges.push(...voiceResult.changesApplied);

    // Analyze brand voice consistency
    const consistency = analyzeBrandVoiceConsistency(result, brandVoice);
    brandVoiceScore = consistency.score;
  }

  // Calculate final human score
  const { removeAIPatterns: rap } = await import('./aiPatternRemoval');
  const finalAnalysis = rap(result);

  return {
    original: content,
    humanized: result,
    changesApplied: allChanges,
    humanScore: finalAnalysis.humanScore,
    brandVoiceScore,
  };
}

/**
 * Quick humanization for captions (lighter processing)
 */
export function humanizeCaption(caption: string): string {
  const { humanizeContent } = require('./aiPatternRemoval');
  const result = humanizeContent(caption, {
    removePatterns: true,
    addConversational: false,
    addContractions: true,
    addImperfections: false,
  });
  return result.humanized;
}

/**
 * Quick humanization for headlines (preserve impact)
 */
export function humanizeHeadline(headline: string): string {
  const { removeAIPatterns } = require('./aiPatternRemoval');
  const result = removeAIPatterns(headline);
  return result.humanized;
}

/**
 * Format humanization results for logging
 */
export function formatHumanizationReport(
  original: string,
  humanized: string,
  changesApplied: string[],
  humanScore: number
): string {
  return `
═══════════════════════════════════════════════════════════════
🤖➡️👤 HUMANIZATION REPORT
═══════════════════════════════════════════════════════════════

📊 HUMAN SCORE: ${Math.round(humanScore * 100)}%

📝 CHANGES APPLIED (${changesApplied.length}):
${changesApplied.length > 0 ? changesApplied.map(c => `• ${c}`).join('\n') : '• No changes needed'}

📄 ORIGINAL:
"${original.substring(0, 200)}${original.length > 200 ? '...' : ''}"

✨ HUMANIZED:
"${humanized.substring(0, 200)}${humanized.length > 200 ? '...' : ''}"

═══════════════════════════════════════════════════════════════
`;
}
