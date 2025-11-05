/**
 * Adaptive Marketing Framework
 * 
 * Export all components of the adaptive system
 */

// Business Type Detection
export {
  detectBusinessType,
  getBusinessTypeName,
  logBusinessTypeDetection,
  type BusinessTypeCategory,
  type BusinessTypeDetection
} from './business-type-detector';

// Universal Rules
export {
  UNIVERSAL_RULES,
  UNIVERSAL_REQUIREMENTS,
  UNIVERSAL_BANNED_PATTERNS,
  UNIVERSAL_OVERUSED_WORDS,
  validateUniversalRules,
  containsBannedPatterns,
  stripOverusedWords,
  generateUniversalRulesPrompt,
  type UniversalRule
} from './universal-rules';

// Type-Specific Rules
export {
  RETAIL_MODULE,
  SERVICE_MODULE,
  SAAS_MODULE,
  FOOD_MODULE,
  FINANCE_MODULE,
  HEALTHCARE_MODULE,
  getTypeSpecificModule,
  generateTypeSpecificPrompt,
  validateTypeSpecificRules,
  type TypeSpecificRule,
  type TypeSpecificModule
} from './type-specific-rules';

// Adaptive Framework Orchestrator
export {
  initializeAdaptiveFramework,
  validateAdaptiveContent,
  logValidationResults,
  getMarketingAnglesForType,
  type AdaptiveFrameworkConfig,
  type AdaptiveFrameworkResult
} from './adaptive-framework';

