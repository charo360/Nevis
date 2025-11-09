/**
 * Business Understanding System - Entry Point
 * 
 * This system ensures that ALL content generation is informed by
 * deep, specific understanding of each business.
 * 
 * NO TEMPLATES. NO ASSUMPTIONS. ONLY REAL UNDERSTANDING.
 */

import { 
  DeepBusinessAnalyzer,
  deepBusinessAnalyzer,
  type DeepBusinessInsight 
} from './deep-business-analyzer';

import {
  BusinessAwareContentGenerator,
  businessAwareContentGenerator,
  type BusinessAwareContentRequest,
  type BusinessAwareContentGuidelines
} from './business-aware-content-generator';

// Re-export for external use
export { 
  DeepBusinessAnalyzer,
  deepBusinessAnalyzer,
  type DeepBusinessInsight 
};

export {
  BusinessAwareContentGenerator,
  businessAwareContentGenerator,
  type BusinessAwareContentRequest,
  type BusinessAwareContentGuidelines
};

/**
 * Main function to analyze a business and get content guidelines
 */
export async function analyzeBusinessAndGetGuidelines(
  businessData: {
    businessName: string;
    website?: string;
    description?: string;
    industry?: string;
    documents?: any[];
    products?: any[];
    services?: any[];
    pricing?: any[];
    about?: string;
    mission?: string;
    values?: string[];
  },
  contentRequest: {
    contentType: 'social_post' | 'ad_campaign' | 'product_launch' | 'brand_story';
    platform: string;
    objective: string;
    specificFocus?: string;
  }
) {
  console.log('🧠 [Business Understanding] Starting full analysis and guideline generation');

  // Step 1: Deep business analysis
  const businessInsight = await deepBusinessAnalyzer.analyzeBusinessDeeply(businessData);

  // Step 2: Generate content guidelines
  const contentGuidelines = await businessAwareContentGenerator.generateContentGuidelines({
    businessInsight,
    ...contentRequest
  });

  // Step 3: Convert to prompt format
  const promptGuidelines = businessAwareContentGenerator.convertGuidelinesToPrompt(contentGuidelines);

  console.log('✅ [Business Understanding] Analysis and guidelines complete');

  return {
    businessInsight,
    contentGuidelines,
    promptGuidelines
  };
}
