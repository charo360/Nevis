/**
 * Model Capability Types and Definitions
 * Defines what each model can do and how capabilities are structured
 */

import type { Platform } from '@/lib/types';

// Core capability categories
export type CapabilityCategory = 
  | 'content'
  | 'design' 
  | 'video'
  | 'analysis'
  | 'enhancement'
  | 'integration';

// Capability levels
export type CapabilityLevel = 'none' | 'basic' | 'standard' | 'advanced' | 'premium';

// Content generation capabilities
export interface ContentCapabilities {
  textGeneration: CapabilityLevel;
  hashtagGeneration: CapabilityLevel;
  captionOptimization: CapabilityLevel;
  toneAdaptation: CapabilityLevel;
  languageSupport: string[];
  maxContentLength: number;
  supportedFormats: string[];
  realTimeContext: boolean;
  trendingTopics: boolean;
  localOptimization: boolean;
  brandVoiceConsistency: CapabilityLevel;
}

// Design generation capabilities
export interface DesignCapabilities {
  imageGeneration: CapabilityLevel;
  styleConsistency: CapabilityLevel;
  brandIntegration: CapabilityLevel;
  textOverlay: CapabilityLevel;
  colorHarmony: CapabilityLevel;
  layoutOptimization: CapabilityLevel;
  supportedAspectRatios: string[];
  maxResolution: string;
  supportedFormats: string[];
  templateSupport: boolean;
  customStyling: boolean;
  logoIntegration: CapabilityLevel;
}

// Video generation capabilities
export interface VideoCapabilities {
  videoGeneration: CapabilityLevel;
  animationSupport: CapabilityLevel;
  transitionEffects: CapabilityLevel;
  audioIntegration: CapabilityLevel;
  maxDuration: number;
  supportedResolutions: string[];
  supportedFormats: string[];
  frameRateOptions: number[];
  customAnimations: boolean;
  templateSupport: boolean;
}

// Analysis capabilities
export interface AnalysisCapabilities {
  brandAnalysis: CapabilityLevel;
  competitorAnalysis: CapabilityLevel;
  marketTrends: CapabilityLevel;
  audienceInsights: CapabilityLevel;
  performancePrediction: CapabilityLevel;
  contentOptimization: CapabilityLevel;
  sentimentAnalysis: CapabilityLevel;
  engagementPrediction: CapabilityLevel;
}

// Enhancement capabilities
export interface EnhancementCapabilities {
  qualityUpscaling: CapabilityLevel;
  colorEnhancement: CapabilityLevel;
  textImprovement: CapabilityLevel;
  layoutOptimization: CapabilityLevel;
  brandConsistency: CapabilityLevel;
  performanceOptimization: CapabilityLevel;
  accessibilityFeatures: CapabilityLevel;
  multiLanguageSupport: CapabilityLevel;
}

// Integration capabilities
export interface IntegrationCapabilities {
  artifactSupport: CapabilityLevel;
  externalAPIs: string[];
  webhookSupport: boolean;
  batchProcessing: CapabilityLevel;
  realTimeGeneration: boolean;
  cloudStorage: boolean;
  analyticsIntegration: boolean;
  thirdPartyTools: string[];
}

// Platform-specific capabilities
export interface PlatformCapabilities {
  [key: string]: {
    supported: boolean;
    optimized: boolean;
    aspectRatios: string[];
    maxFileSize: number;
    recommendedFormats: string[];
    specialFeatures: string[];
  };
}

// Complete capability set for a model
export interface ModelCapabilitySet {
  content: ContentCapabilities;
  design: DesignCapabilities;
  video: VideoCapabilities;
  analysis: AnalysisCapabilities;
  enhancement: EnhancementCapabilities;
  integration: IntegrationCapabilities;
  platforms: PlatformCapabilities;
  
  // Overall model characteristics
  overallQuality: CapabilityLevel;
  processingSpeed: CapabilityLevel;
  reliability: CapabilityLevel;
  costEfficiency: CapabilityLevel;
  
  // Version-specific features
  experimentalFeatures: string[];
  betaFeatures: string[];
  deprecatedFeatures: string[];
}

// Capability comparison interface
export interface CapabilityComparison {
  modelA: string;
  modelB: string;
  category: CapabilityCategory;
  differences: {
    feature: string;
    modelALevel: CapabilityLevel;
    modelBLevel: CapabilityLevel;
    significance: 'minor' | 'moderate' | 'major';
  }[];
  recommendation: string;
}

// Capability requirements for specific use cases
export interface CapabilityRequirements {
  useCase: string;
  required: {
    category: CapabilityCategory;
    feature: string;
    minimumLevel: CapabilityLevel;
  }[];
  preferred: {
    category: CapabilityCategory;
    feature: string;
    preferredLevel: CapabilityLevel;
  }[];
  optional: {
    category: CapabilityCategory;
    feature: string;
    desiredLevel: CapabilityLevel;
  }[];
}

// Capability validation result
export interface CapabilityValidationResult {
  modelId: string;
  useCase: string;
  meetsRequirements: boolean;
  score: number; // 0-100
  details: {
    required: {
      feature: string;
      required: CapabilityLevel;
      actual: CapabilityLevel;
      passes: boolean;
    }[];
    preferred: {
      feature: string;
      preferred: CapabilityLevel;
      actual: CapabilityLevel;
      score: number;
    }[];
    optional: {
      feature: string;
      desired: CapabilityLevel;
      actual: CapabilityLevel;
      bonus: number;
    }[];
  };
  recommendations: string[];
}

// Capability evolution tracking
export interface CapabilityEvolution {
  modelId: string;
  version: string;
  changes: {
    category: CapabilityCategory;
    feature: string;
    previousLevel: CapabilityLevel;
    newLevel: CapabilityLevel;
    changeType: 'upgrade' | 'downgrade' | 'new' | 'removed';
    impact: 'low' | 'medium' | 'high';
    description: string;
  }[];
  overallImpact: 'minor' | 'moderate' | 'major';
  migrationRequired: boolean;
  migrationGuide?: string;
}
