/**
 * Generation Types and Interfaces
 * Defines request/response types for content and design generation
 */

import type { GeneratedPost, PostVariant, CreativeAsset } from '@/lib/types';
import type { RevoModelId } from './model-types';

// Base generation context
export interface GenerationContext {
  timestamp: string;
  sessionId?: string;
  userId?: string;
  requestId: string;
}

// Content generation specific types
export interface ContentGenerationOptions {
  includeHashtags: boolean;
  includeCatchyWords: boolean;
  includeSubheadline: boolean;
  includeCallToAction: boolean;
  contentLength: 'short' | 'medium' | 'long';
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative';
  includeEmojis: boolean;
  localContext: boolean;
  trendingTopics: boolean;
}

export interface ContentGenerationResult {
  post: GeneratedPost;
  alternatives?: GeneratedPost[];
  confidence: number;
  processingSteps: string[];
}

// Design generation specific types
export interface DesignGenerationOptions {
  aspectRatio: string;
  resolution: 'standard' | 'hd' | '4k';
  style: 'photorealistic' | 'illustration' | 'minimalist' | 'artistic';
  colorScheme: 'brand' | 'complementary' | 'monochrome' | 'vibrant';
  textPlacement: 'overlay' | 'integrated' | 'none';
  backgroundType: 'solid' | 'gradient' | 'image' | 'pattern';
}

export interface DesignGenerationResult {
  variant: PostVariant;
  alternatives?: PostVariant[];
  designSpecs: {
    colors: string[];
    fonts: string[];
    layout: string;
    elements: string[];
  };
  confidence: number;
  processingSteps: string[];
}

// Video generation specific types
export interface VideoGenerationOptions {
  duration: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
  quality: 'standard' | 'hd' | '4k';
  style: 'cinematic' | 'social' | 'promotional' | 'educational';
  includeAudio: boolean;
  transitions: boolean;
}

export interface VideoGenerationResult {
  asset: CreativeAsset;
  alternatives?: CreativeAsset[];
  videoSpecs: {
    duration: number;
    resolution: string;
    frameRate: number;
    codec: string;
  };
  confidence: number;
  processingSteps: string[];
}

// Enhanced generation request (combines multiple types)
export interface EnhancedGenerationRequest {
  modelId: RevoModelId;
  type: 'content' | 'design' | 'video' | 'combined';
  context: GenerationContext;
  
  // Content options
  contentOptions?: ContentGenerationOptions;
  
  // Design options
  designOptions?: DesignGenerationOptions;
  
  // Video options
  videoOptions?: VideoGenerationOptions;
  
  // Advanced options
  useArtifacts: boolean;
  artifactIds?: string[];
  customPrompt?: string;
  referenceImages?: string[];
  
  // Quality and performance
  qualityLevel: 1 | 2 | 3 | 4 | 5;
  speedPreference: 'fast' | 'balanced' | 'quality';
  
  // Experimental features
  experimentalFeatures?: {
    advancedPrompting: boolean;
    multiModalGeneration: boolean;
    realTimeOptimization: boolean;
  };
}

// Enhanced generation response
export interface EnhancedGenerationResponse {
  success: boolean;
  requestId: string;
  modelId: RevoModelId;
  
  // Results
  contentResult?: ContentGenerationResult;
  designResult?: DesignGenerationResult;
  videoResult?: VideoGenerationResult;
  
  // Metadata
  metadata: {
    processingTime: number;
    creditsUsed: number;
    qualityScore: number;
    confidenceScore: number;
    enhancementsApplied: string[];
    fallbacksUsed: string[];
    warnings?: string[];
  };
  
  // Performance metrics
  performance: {
    aiServiceUsed: string;
    responseTime: number;
    retryCount: number;
    cacheHit: boolean;
  };
  
  // Error information
  error?: {
    code: string;
    message: string;
    details?: any;
    recoverable: boolean;
  };
}

// Batch generation types
export interface BatchGenerationRequest {
  requests: EnhancedGenerationRequest[];
  batchOptions: {
    parallel: boolean;
    maxConcurrency: number;
    failFast: boolean;
    priority: 'low' | 'normal' | 'high';
  };
}

export interface BatchGenerationResponse {
  success: boolean;
  results: EnhancedGenerationResponse[];
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalCreditsUsed: number;
    totalProcessingTime: number;
    averageQualityScore: number;
  };
}

// Generation analytics types
export interface GenerationAnalytics {
  modelId: RevoModelId;
  timestamp: string;
  requestType: 'content' | 'design' | 'video';
  success: boolean;
  processingTime: number;
  creditsUsed: number;
  qualityScore: number;
  userSatisfaction?: number;
  errorCode?: string;
  metadata: Record<string, any>;
}

// Model performance metrics
export interface ModelPerformanceMetrics {
  modelId: RevoModelId;
  period: {
    start: string;
    end: string;
  };
  metrics: {
    totalRequests: number;
    successRate: number;
    averageProcessingTime: number;
    averageQualityScore: number;
    averageCreditsUsed: number;
    userSatisfactionScore: number;
    errorRate: number;
    mostCommonErrors: string[];
  };
}
