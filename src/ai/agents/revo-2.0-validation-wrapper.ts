/**
 * Revo 2.0 Validation Wrapper - Integrates validation agent into generation workflow
 * Ensures content uniqueness and quality before image generation
 */

import { validateContentUniqueness, extractContentCharacteristics, AdContent } from './validation-agent';
import { storeGeneration, getRecentGenerations, logGenerationStats } from './generation-history';

export interface ValidationConfig {
  maxRetries: number;
  minSimilarityScore: number;
  enableValidation: boolean;
}

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  maxRetries: 3,
  minSimilarityScore: 75, // Minimum score to pass (75-100 = acceptable)
  enableValidation: true
};

/**
 * Generate content with validation loop
 * Retries with different approaches if content is too similar to recent generations
 */
export async function generateWithValidation(
  businessId: string,
  generateFunction: () => Promise<any>,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): Promise<{
  content: any;
  validationPassed: boolean;
  attempts: number;
  finalSimilarityScore: number;
}> {
  
  if (!config.enableValidation) {
    console.log('⚠️ [Validation Wrapper] Validation disabled - generating without checks');
    const content = await generateFunction();
    return {
      content,
      validationPassed: true,
      attempts: 1,
      finalSimilarityScore: 100
    };
  }

  console.log('\n🔒 [Validation Wrapper] Starting validated generation process');
  console.log(`📊 [Validation Wrapper] Config: maxRetries=${config.maxRetries}, minScore=${config.minSimilarityScore}`);
  
  // Get recent generations for this business
  const recentGenerations = getRecentGenerations(businessId, 10);
  console.log(`📚 [Validation Wrapper] Found ${recentGenerations.length} recent generations for comparison`);
  
  // Log current statistics
  if (recentGenerations.length > 0) {
    logGenerationStats(businessId);
  }

  let attempts = 0;
  let lastContent: any = null;
  let lastValidationResult: any = null;

  while (attempts < config.maxRetries) {
    attempts++;
    console.log(`\n🎲 [Validation Wrapper] Attempt ${attempts}/${config.maxRetries}`);

    // Generate content
    const generatedContent = await generateFunction();
    lastContent = generatedContent;

    // Extract content for validation
    const adContent: AdContent = {
      headline: generatedContent.content?.headline || generatedContent.headline || '',
      caption: generatedContent.content?.caption || generatedContent.caption || '',
      sellingAngle: generatedContent.content?.sellingAngle,
      emotionalTone: generatedContent.content?.emotionalTone,
      targetAudience: generatedContent.content?.targetAudience
    };

    // Validate uniqueness
    const validationResult = await validateContentUniqueness(adContent, recentGenerations);
    lastValidationResult = validationResult;

    // Check if validation passed
    if (validationResult.isUnique && validationResult.similarityScore >= config.minSimilarityScore) {
      console.log(`✅ [Validation Wrapper] Content approved on attempt ${attempts}`);
      console.log(`📊 [Validation Wrapper] Final similarity score: ${validationResult.similarityScore}/100`);
      
      // Store successful generation
      const characteristics = extractContentCharacteristics(adContent);
      storeGeneration(businessId, adContent, characteristics);
      
      return {
        content: generatedContent,
        validationPassed: true,
        attempts,
        finalSimilarityScore: validationResult.similarityScore
      };
    }

    // Validation failed
    console.log(`❌ [Validation Wrapper] Attempt ${attempts} rejected (score: ${validationResult.similarityScore}/100)`);
    
    if (attempts < config.maxRetries) {
      console.log(`🔄 [Validation Wrapper] Retrying with different approach...`);
      console.log(`💡 [Validation Wrapper] Suggestions for next attempt:`);
      validationResult.suggestions.forEach((suggestion, i) => {
        console.log(`   ${i + 1}. ${suggestion}`);
      });
      
      // Wait a bit before retry (helps with randomization)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Max retries reached - use last content with warning
  console.warn(`⚠️ [Validation Wrapper] Max retries (${config.maxRetries}) reached`);
  console.warn(`⚠️ [Validation Wrapper] Using last generated content (score: ${lastValidationResult?.similarityScore || 0}/100)`);
  console.warn(`⚠️ [Validation Wrapper] This content may be similar to recent generations`);
  
  // Store even failed validation (to track patterns)
  if (lastContent) {
    const adContent: AdContent = {
      headline: lastContent.content?.headline || lastContent.headline || '',
      caption: lastContent.content?.caption || lastContent.caption || ''
    };
    const characteristics = extractContentCharacteristics(adContent);
    storeGeneration(businessId, adContent, characteristics);
  }

  return {
    content: lastContent,
    validationPassed: false,
    attempts,
    finalSimilarityScore: lastValidationResult?.similarityScore || 0
  };
}

/**
 * Metrics tracking for validation performance
 */
export interface ValidationMetrics {
  totalGenerations: number;
  passedFirstAttempt: number;
  passedAfterRetry: number;
  failedValidation: number;
  averageAttempts: number;
  averageSimilarityScore: number;
}

const metricsStore = new Map<string, ValidationMetrics>();

export function trackValidationMetrics(
  businessId: string,
  validationPassed: boolean,
  attempts: number,
  similarityScore: number
): void {
  const existing = metricsStore.get(businessId) || {
    totalGenerations: 0,
    passedFirstAttempt: 0,
    passedAfterRetry: 0,
    failedValidation: 0,
    averageAttempts: 0,
    averageSimilarityScore: 0
  };

  existing.totalGenerations++;
  
  if (validationPassed && attempts === 1) {
    existing.passedFirstAttempt++;
  } else if (validationPassed && attempts > 1) {
    existing.passedAfterRetry++;
  } else {
    existing.failedValidation++;
  }

  // Update running averages
  const totalAttempts = existing.averageAttempts * (existing.totalGenerations - 1) + attempts;
  existing.averageAttempts = totalAttempts / existing.totalGenerations;

  const totalScore = existing.averageSimilarityScore * (existing.totalGenerations - 1) + similarityScore;
  existing.averageSimilarityScore = totalScore / existing.totalGenerations;

  metricsStore.set(businessId, existing);
}

export function getValidationMetrics(businessId: string): ValidationMetrics | null {
  return metricsStore.get(businessId) || null;
}

export function logValidationMetrics(businessId: string): void {
  const metrics = metricsStore.get(businessId);
  
  if (!metrics) {
    console.log(`📊 [Validation Metrics] No metrics available for business ${businessId}`);
    return;
  }

  console.log('\n📊 [Validation Metrics] Performance Summary');
  console.log(`Business ID: ${businessId}`);
  console.log(`Total Generations: ${metrics.totalGenerations}`);
  console.log(`\n✅ Success Rates:`);
  console.log(`  - Passed 1st Attempt: ${metrics.passedFirstAttempt} (${((metrics.passedFirstAttempt / metrics.totalGenerations) * 100).toFixed(1)}%)`);
  console.log(`  - Passed After Retry: ${metrics.passedAfterRetry} (${((metrics.passedAfterRetry / metrics.totalGenerations) * 100).toFixed(1)}%)`);
  console.log(`  - Failed Validation: ${metrics.failedValidation} (${((metrics.failedValidation / metrics.totalGenerations) * 100).toFixed(1)}%)`);
  console.log(`\n📈 Averages:`);
  console.log(`  - Avg Attempts: ${metrics.averageAttempts.toFixed(2)}`);
  console.log(`  - Avg Similarity Score: ${metrics.averageSimilarityScore.toFixed(1)}/100`);
  console.log('');
}
