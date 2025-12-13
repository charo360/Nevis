/**
 * Enhanced Validation Agent with LlamaIndex Knowledge Base
 * Validates against:
 * - Past successful posts (avoid repetition)
 * - Brand guidelines (ensure compliance)
 * - Cultural context (appropriate for market)
 * - Competitor analysis (maintain differentiation)
 */

import { validateContentUniqueness, AdContent, ValidationResult } from './validation-agent';
import { getKnowledgeBase, PastPost, BrandGuidelines, CulturalContext, CompetitorAnalysis } from '../knowledge/llamaindex-knowledge-base';

export interface EnhancedValidationResult extends ValidationResult {
  brandGuidelineCompliance: {
    passed: boolean;
    violations: string[];
  };
  culturalAppropriate: {
    passed: boolean;
    issues: string[];
  };
  competitorDifferentiation: {
    passed: boolean;
    tooSimilarTo: string[];
  };
}

/**
 * Enhanced validation with knowledge base integration
 */
export async function validateWithKnowledgeBase(
  businessId: string,
  country: string,
  newContent: AdContent
): Promise<EnhancedValidationResult> {
  console.log('\n🧠 [Enhanced Validation] Starting knowledge-based validation...');
  
  const kb = getKnowledgeBase();
  
  // 1. VALIDATE AGAINST PAST POSTS (Repetition Check)
  console.log('📚 [Enhanced Validation] Checking against past posts...');
  const pastPosts = await kb.queryPastPosts(businessId, newContent.headline, 20);
  const recentContent = pastPosts.map(post => ({
    headline: post.headline,
    caption: post.caption,
    sellingAngle: post.sellingAngle,
    emotionalTone: post.emotionalTone,
    targetAudience: post.targetAudience
  }));
  
  const baseValidation = await validateContentUniqueness(newContent, recentContent);
  
  // 2. VALIDATE AGAINST BRAND GUIDELINES
  console.log('🎨 [Enhanced Validation] Checking brand guidelines compliance...');
  const guidelines = await kb.getBrandGuidelines(businessId);
  const brandCompliance = validateBrandGuidelines(newContent, guidelines);
  
  // 3. VALIDATE CULTURAL APPROPRIATENESS
  console.log('🌍 [Enhanced Validation] Checking cultural appropriateness...');
  const culturalContext = await kb.getCulturalContext(country);
  const culturalCheck = validateCulturalContext(newContent, culturalContext);
  
  // 4. VALIDATE COMPETITOR DIFFERENTIATION
  console.log('🎯 [Enhanced Validation] Checking competitor differentiation...');
  const competitors = await kb.getCompetitorAnalysis(businessId);
  const competitorCheck = validateCompetitorDifferentiation(newContent, competitors);
  
  // Combine all validation results
  const enhancedResult: EnhancedValidationResult = {
    ...baseValidation,
    brandGuidelineCompliance: brandCompliance,
    culturalAppropriate: culturalCheck,
    competitorDifferentiation: competitorCheck
  };
  
  // Update overall pass/fail based on all checks
  const allChecksPassed = 
    baseValidation.isUnique &&
    brandCompliance.passed &&
    culturalCheck.passed &&
    competitorCheck.passed;
  
  enhancedResult.isUnique = allChecksPassed;
  
  // Add comprehensive suggestions
  if (!allChecksPassed) {
    const allSuggestions = [
      ...baseValidation.suggestions,
      ...brandCompliance.violations.map(v => `Brand guideline: ${v}`),
      ...culturalCheck.issues.map(i => `Cultural issue: ${i}`),
      ...competitorCheck.tooSimilarTo.map(c => `Too similar to competitor: ${c}`)
    ];
    enhancedResult.suggestions = allSuggestions;
  }
  
  // Log results
  console.log(`\n📊 [Enhanced Validation] Results:`);
  console.log(`   - Uniqueness: ${baseValidation.isUnique ? '✅' : '❌'} (${baseValidation.similarityScore}/100)`);
  console.log(`   - Brand Guidelines: ${brandCompliance.passed ? '✅' : '❌'}`);
  console.log(`   - Cultural Appropriateness: ${culturalCheck.passed ? '✅' : '❌'}`);
  console.log(`   - Competitor Differentiation: ${competitorCheck.passed ? '✅' : '❌'}`);
  console.log(`   - Overall: ${allChecksPassed ? '✅ APPROVED' : '❌ REJECTED'}\n`);
  
  return enhancedResult;
}

/**
 * Validate content against brand guidelines
 */
function validateBrandGuidelines(
  content: AdContent,
  guidelines: BrandGuidelines | null
): { passed: boolean; violations: string[] } {
  if (!guidelines) {
    return { passed: true, violations: [] };
  }
  
  const violations: string[] = [];
  const fullText = `${content.headline} ${content.caption}`.toLowerCase();
  
  // Check prohibited words
  for (const word of guidelines.prohibitedWords) {
    if (fullText.includes(word.toLowerCase())) {
      violations.push(`Contains prohibited word: "${word}"`);
    }
  }
  
  // Check if preferred phrases are used (warning, not violation)
  const usesPreferredPhrases = guidelines.preferredPhrases.some(phrase =>
    fullText.includes(phrase.toLowerCase())
  );
  
  if (guidelines.preferredPhrases.length > 0 && !usesPreferredPhrases) {
    violations.push(`Consider using preferred phrases: ${guidelines.preferredPhrases.slice(0, 3).join(', ')}`);
  }
  
  return {
    passed: violations.length === 0,
    violations
  };
}

/**
 * Validate content for cultural appropriateness
 */
function validateCulturalContext(
  content: AdContent,
  context: CulturalContext | null
): { passed: boolean; issues: string[] } {
  if (!context) {
    return { passed: true, issues: [] };
  }
  
  const issues: string[] = [];
  const fullText = `${content.headline} ${content.caption}`.toLowerCase();
  
  // Check for topics to avoid
  for (const topic of context.avoidTopics) {
    if (fullText.includes(topic.toLowerCase())) {
      issues.push(`Contains sensitive topic: "${topic}"`);
    }
  }
  
  // Check if local phrases are used appropriately
  const usesLocalPhrases = context.localPhrases.some(phrase =>
    fullText.includes(phrase.phrase.toLowerCase())
  );
  
  // Suggest using local phrases if none are present (not a failure)
  if (context.localPhrases.length > 0 && !usesLocalPhrases) {
    // This is just a suggestion, not an issue
    console.log(`💡 [Cultural Tip] Consider using local phrases: ${context.localPhrases.slice(0, 3).map(p => p.phrase).join(', ')}`);
  }
  
  return {
    passed: issues.length === 0,
    issues
  };
}

/**
 * Validate content maintains differentiation from competitors
 */
function validateCompetitorDifferentiation(
  content: AdContent,
  competitors: CompetitorAnalysis[]
): { passed: boolean; tooSimilarTo: string[] } {
  if (competitors.length === 0) {
    return { passed: true, tooSimilarTo: [] };
  }
  
  const tooSimilarTo: string[] = [];
  const fullText = `${content.headline} ${content.caption}`.toLowerCase();
  
  // Check if content uses competitor's common approaches
  for (const competitor of competitors) {
    for (const approach of competitor.contentApproaches) {
      if (fullText.includes(approach.toLowerCase())) {
        tooSimilarTo.push(`${competitor.competitorName} (uses similar approach: "${approach}")`);
      }
    }
  }
  
  // Suggest differentiation opportunities
  if (competitors.length > 0) {
    const opportunities = competitors.flatMap(c => c.differentiationOpportunities);
    if (opportunities.length > 0) {
      console.log(`💡 [Differentiation Tip] Highlight: ${opportunities.slice(0, 2).join(', ')}`);
    }
  }
  
  return {
    passed: tooSimilarTo.length === 0,
    tooSimilarTo
  };
}

/**
 * Store successful generation in knowledge base
 */
export async function storeSuccessfulGeneration(
  businessId: string,
  platform: string,
  content: AdContent,
  performanceScore?: number
): Promise<void> {
  const kb = getKnowledgeBase();
  
  const post: PastPost = {
    id: `${businessId}-${Date.now()}`,
    businessId,
    platform,
    headline: content.headline,
    caption: content.caption,
    sellingAngle: content.sellingAngle || 'unknown',
    emotionalTone: content.emotionalTone || 'neutral',
    targetAudience: content.targetAudience || 'general',
    performanceScore,
    createdAt: new Date()
  };
  
  await kb.storePastPost(post);
  console.log(`✅ [Knowledge Base] Stored successful generation`);
}
