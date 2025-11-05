/**
 * Adaptive Marketing Framework Orchestrator
 * 
 * Coordinates business type detection, rule loading, and content generation
 * This is the main entry point for the adaptive system
 */

import {
  detectBusinessType,
  getBusinessTypeName,
  logBusinessTypeDetection,
  BusinessTypeDetection
} from './business-type-detector';

import {
  generateUniversalRulesPrompt,
  validateUniversalRules,
  containsBannedPatterns,
  stripOverusedWords
} from './universal-rules';

import {
  getTypeSpecificModule,
  generateTypeSpecificPrompt,
  validateTypeSpecificRules,
  TypeSpecificModule
} from './type-specific-rules';

export interface AdaptiveFrameworkConfig {
  brandProfile: any;
  enableLogging?: boolean;
  strictValidation?: boolean;
}

export interface AdaptiveFrameworkResult {
  detection: BusinessTypeDetection;
  primaryModule: TypeSpecificModule | null;
  secondaryModule: TypeSpecificModule | null;
  combinedPrompt: string;
  isHybrid: boolean;
}

/**
 * Initialize the adaptive framework for a brand
 * This is the main entry point that should be called before content generation
 */
export function initializeAdaptiveFramework(
  config: AdaptiveFrameworkConfig
): AdaptiveFrameworkResult {
  const { brandProfile, enableLogging = true } = config;
  
  // STEP 1: Detect business type
  if (enableLogging) {
    console.log('\n🚀 INITIALIZING ADAPTIVE MARKETING FRAMEWORK');
    console.log('='.repeat(80));
  }
  
  const detection = detectBusinessType(brandProfile);
  
  if (enableLogging) {
    logBusinessTypeDetection(detection);
  }
  
  // STEP 2: Load appropriate modules
  const primaryModule = getTypeSpecificModule(detection.primaryType);
  const secondaryModule = detection.secondaryType 
    ? getTypeSpecificModule(detection.secondaryType)
    : null;
  
  if (enableLogging) {
    console.log('📦 LOADING FRAMEWORK MODULES');
    console.log('-'.repeat(80));
    console.log(`✅ Universal Rules: Loaded`);
    console.log(`✅ Primary Module: ${primaryModule ? primaryModule.name : 'Generic'}`);
    if (secondaryModule) {
      console.log(`✅ Secondary Module: ${secondaryModule.name}`);
    }
    console.log('='.repeat(80) + '\n');
  }
  
  // STEP 3: Generate combined prompt
  const combinedPrompt = generateCombinedPrompt(
    detection,
    primaryModule,
    secondaryModule,
    brandProfile
  );
  
  return {
    detection,
    primaryModule,
    secondaryModule,
    combinedPrompt,
    isHybrid: detection.isHybrid
  };
}

/**
 * Generate combined prompt with universal + type-specific rules
 */
function generateCombinedPrompt(
  detection: BusinessTypeDetection,
  primaryModule: TypeSpecificModule | null,
  secondaryModule: TypeSpecificModule | null,
  brandProfile: any
): string {
  let prompt = '';
  
  // Header
  prompt += '\n' + '='.repeat(80) + '\n';
  prompt += '🎯 ADAPTIVE MARKETING FRAMEWORK\n';
  prompt += '='.repeat(80) + '\n';
  
  // Business type information
  prompt += `\n📊 DETECTED BUSINESS TYPE: ${getBusinessTypeName(detection.primaryType)}\n`;
  if (detection.secondaryType) {
    prompt += `📊 SECONDARY TYPE: ${getBusinessTypeName(detection.secondaryType)}\n`;
    prompt += `🔀 HYBRID BUSINESS: Yes\n`;
  }
  prompt += `✅ CONFIDENCE: ${detection.confidence}%\n`;
  
  // Universal rules (always included)
  prompt += generateUniversalRulesPrompt();
  
  // Primary type-specific rules
  if (primaryModule) {
    prompt += '\n' + '='.repeat(80) + '\n';
    prompt += '📋 PRIMARY BUSINESS TYPE FRAMEWORK\n';
    prompt += '='.repeat(80) + '\n';
    prompt += generateTypeSpecificPrompt(primaryModule);
  }
  
  // Secondary type-specific rules (for hybrid businesses)
  if (secondaryModule && detection.isHybrid) {
    prompt += '\n' + '='.repeat(80) + '\n';
    prompt += '📋 SECONDARY BUSINESS TYPE FRAMEWORK (Apply selectively)\n';
    prompt += '='.repeat(80) + '\n';
    prompt += generateTypeSpecificPrompt(secondaryModule);
    
    prompt += '\n\n🔀 HYBRID BUSINESS GUIDANCE:\n';
    prompt += `- Primary focus: ${primaryModule?.name || 'Primary business'} (70% of content)\n`;
    prompt += `- Secondary focus: ${secondaryModule.name} (30% of content)\n`;
    prompt += '- Blend elements from both frameworks appropriately\n';
    prompt += '- Ensure each ad focuses on ONE business aspect (don\'t mix in single ad)\n';
  }
  
  // Product catalog integration (if retail/ecommerce)
  if (detection.primaryType === 'retail' && brandProfile.productCatalog && brandProfile.productCatalog.length > 0) {
    prompt += '\n\n🛍️ PRODUCT CATALOG INTEGRATION:\n';
    prompt += 'CRITICAL: Use specific products from the catalog below to create product-focused ads.\n\n';
    prompt += '📦 AVAILABLE PRODUCTS:\n';
    
    const products = brandProfile.productCatalog.slice(0, 5);
    products.forEach((product: any, index: number) => {
      prompt += `\nProduct ${index + 1}: ${product.name}\n`;
      if (product.price) prompt += `- Price: ${product.price}\n`;
      if (product.originalPrice) prompt += `- Original Price: ${product.originalPrice}\n`;
      if (product.discount) prompt += `- Discount: ${product.discount}\n`;
      if (product.features && product.features.length > 0) {
        prompt += `- Features: ${product.features.slice(0, 3).join(', ')}\n`;
      }
    });
  }
  
  // Final instructions
  prompt += '\n\n' + '='.repeat(80) + '\n';
  prompt += '🎯 CONTENT GENERATION INSTRUCTIONS\n';
  prompt += '='.repeat(80) + '\n';
  prompt += `
STEP-BY-STEP PROCESS:

1. ✅ APPLY UNIVERSAL RULES (Always required)
   - All 10 universal rules must be followed
   - Check for banned patterns and overused words
   
2. ✅ APPLY TYPE-SPECIFIC RULES (Based on business type)
   - Follow all required elements for ${getBusinessTypeName(detection.primaryType)}
   - Use type-specific CTAs and tone
   - Include type-specific visual requirements
   
3. ✅ SELECT MARKETING ANGLE
   - Choose from universal 7 angles + type-specific additional angles
   - Ensure angle diversity across campaign
   
4. ✅ GENERATE CONTENT
   - Create headline, caption, and CTA
   - Ensure all elements tell ONE unified story
   - Match tone to business type and audience
   
5. ✅ VALIDATE
   - Check universal rules compliance
   - Check type-specific rules compliance
   - Verify story coherence
   - Confirm no banned patterns or overused words

REMEMBER:
- Universal rules apply to ALL content
- Type-specific rules apply ONLY to ${getBusinessTypeName(detection.primaryType)}
- Each ad should use a different marketing angle
- Be specific, not generic
- Focus on ONE clear message per ad
`;
  
  prompt += '\n' + '='.repeat(80) + '\n';
  
  return prompt;
}

/**
 * Validate generated content against adaptive framework
 */
export function validateAdaptiveContent(
  content: any,
  framework: AdaptiveFrameworkResult
): {
  passed: boolean;
  universalValidation: any;
  typeSpecificValidation: any;
  bannedPatterns: any;
  overallScore: number;
} {
  // Validate universal rules
  const universalValidation = validateUniversalRules(content);
  
  // Check for banned patterns
  const contentText = `${content.headline} ${content.caption}`;
  const bannedPatterns = containsBannedPatterns(contentText);
  
  // Validate type-specific rules
  let typeSpecificValidation = { passed: true, failedRules: [], passedRules: [] };
  if (framework.primaryModule) {
    typeSpecificValidation = validateTypeSpecificRules(content, framework.primaryModule);
  }
  
  // Calculate overall score
  const universalScore = universalValidation.passed ? 50 : 0;
  const typeSpecificScore = typeSpecificValidation.passed ? 40 : 0;
  const bannedPatternsScore = bannedPatterns.hasBanned ? 0 : 10;
  const overallScore = universalScore + typeSpecificScore + bannedPatternsScore;
  
  const passed = overallScore >= 80 && !bannedPatterns.hasBanned;
  
  return {
    passed,
    universalValidation,
    typeSpecificValidation,
    bannedPatterns,
    overallScore
  };
}

/**
 * Log validation results
 */
export function logValidationResults(validation: any, enableLogging: boolean = true): void {
  if (!enableLogging) return;
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ CONTENT VALIDATION RESULTS');
  console.log('='.repeat(80));
  console.log(`\n📊 Overall Score: ${validation.overallScore}/100`);
  console.log(`${validation.passed ? '✅' : '❌'} Validation: ${validation.passed ? 'PASSED' : 'FAILED'}\n`);
  
  console.log('UNIVERSAL RULES:');
  console.log(`  ${validation.universalValidation.passed ? '✅' : '❌'} Status: ${validation.universalValidation.passed ? 'Passed' : 'Failed'}`);
  if (validation.universalValidation.failedRules.length > 0) {
    console.log('  Failed Rules:');
    validation.universalValidation.failedRules.forEach((rule: string) => {
      console.log(`    - ${rule}`);
    });
  }
  
  console.log('\nTYPE-SPECIFIC RULES:');
  console.log(`  ${validation.typeSpecificValidation.passed ? '✅' : '❌'} Status: ${validation.typeSpecificValidation.passed ? 'Passed' : 'Failed'}`);
  if (validation.typeSpecificValidation.failedRules.length > 0) {
    console.log('  Failed Rules:');
    validation.typeSpecificValidation.failedRules.forEach((rule: string) => {
      console.log(`    - ${rule}`);
    });
  }
  
  console.log('\nBANNED PATTERNS:');
  console.log(`  ${validation.bannedPatterns.hasBanned ? '❌' : '✅'} Status: ${validation.bannedPatterns.hasBanned ? 'Found' : 'None'}`);
  if (validation.bannedPatterns.matches.length > 0) {
    console.log('  Matches:');
    validation.bannedPatterns.matches.forEach((pattern: string) => {
      console.log(`    - ${pattern}`);
    });
  }
  
  console.log('='.repeat(80) + '\n');
}

/**
 * Get marketing angles for business type (universal + type-specific)
 */
export function getMarketingAnglesForType(framework: AdaptiveFrameworkResult): string[] {
  const universalAngles = [
    'Feature Angle',
    'Use-Case Angle',
    'Audience Segment Angle',
    'Problem-Solution Angle',
    'Benefit Level Angle',
    'Before/After Angle',
    'Social Proof Angle'
  ];
  
  const typeSpecificAngles = framework.primaryModule?.additionalAngles || [];
  
  return [...universalAngles, ...typeSpecificAngles];
}

