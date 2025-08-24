/**
 * Core Model Types and Interfaces
 * Defines the structure and contracts for all Revo model versions
 */

import type { BrandProfile, Platform } from '@/lib/types';

// Core model identifier type
export type RevoModelId = 'revo-1.0' | 'revo-1.5' | 'imagen-4';

// Model status types
export type ModelStatus = 'stable' | 'enhanced' | 'development' | 'beta' | 'deprecated';

// Model capabilities interface
export interface ModelCapabilities {
  contentGeneration: boolean;
  designGeneration: boolean;
  videoGeneration: boolean;
  enhancedFeatures: boolean;
  artifactSupport: boolean;
  aspectRatios: string[];
  maxQuality: number;
  supportedPlatforms: Platform[];
  advancedPrompting: boolean;
  brandConsistency: boolean;
  realTimeContext: boolean;
}

// Model pricing configuration
export interface ModelPricing {
  creditsPerGeneration: number;
  creditsPerDesign: number;
  creditsPerVideo?: number;
  tier: 'basic' | 'premium' | 'enterprise';
}

// Model configuration interface
export interface ModelConfig {
  aiService: 'gemini-2.0' | 'gemini-2.5' | 'openai' | 'imagen-4';
  fallbackServices: string[];
  maxRetries: number;
  timeout: number;
  qualitySettings: {
    imageResolution: string;
    compressionLevel: number;
    enhancementLevel: number;
  };
  promptSettings: {
    temperature: number;
    maxTokens: number;
    topP?: number;
    topK?: number;
  };
}

// Main model interface
export interface RevoModel {
  id: RevoModelId;
  name: string;
  version: string;
  description: string;
  longDescription: string;
  icon: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  status: ModelStatus;
  capabilities: ModelCapabilities;
  config: ModelConfig;
  pricing: ModelPricing;
  features: string[];
  releaseDate: string;
  lastUpdated: string;
}

// Content generation request interface
export interface ContentGenerationRequest {
  profile: BrandProfile;
  platform: Platform;
  brandConsistency?: {
    strictConsistency: boolean;
    followBrandColors: boolean;
  };
  artifactIds?: string[];
  customInstructions?: string;
  modelId: RevoModelId;
}

// Design generation request interface
export interface DesignGenerationRequest {
  businessType: string;
  platform: string;
  visualStyle: string;
  imageText: string | {
    catchyWords: string;
    subheadline?: string;
    callToAction?: string;
  };
  brandProfile: BrandProfile;
  brandConsistency?: {
    strictConsistency: boolean;
    followBrandColors: boolean;
  };
  artifactInstructions?: string;
  modelId: RevoModelId;
}

// Generation response interfaces
export interface GenerationResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    modelId: RevoModelId;
    processingTime: number;
    qualityScore: number;
    creditsUsed: number;
    enhancementsApplied: string[];
  };
}

// Model generator interfaces
export interface IContentGenerator {
  generateContent(request: ContentGenerationRequest): Promise<GenerationResponse>;
}

export interface IDesignGenerator {
  generateDesign(request: DesignGenerationRequest): Promise<GenerationResponse>;
}

// Model implementation interface
export interface IModelImplementation {
  model: RevoModel;
  contentGenerator: IContentGenerator;
  designGenerator: IDesignGenerator;
  isAvailable(): Promise<boolean>;
  validateRequest(request: any): boolean;
}

// Model registry interface
export interface IModelRegistry {
  registerModel(implementation: IModelImplementation): void;
  getModel(id: RevoModelId): IModelImplementation | null;
  getAllModels(): IModelImplementation[];
  getAvailableModels(): Promise<IModelImplementation[]>;
  getModelsByStatus(status: ModelStatus): IModelImplementation[];
  getModelsByCapability(capability: keyof ModelCapabilities): IModelImplementation[];
}

// Model selection criteria
export interface ModelSelectionCriteria {
  requiredCapabilities?: (keyof ModelCapabilities)[];
  preferredTier?: 'basic' | 'premium' | 'enterprise';
  maxCredits?: number;
  platform?: Platform;
  qualityPreference?: 'speed' | 'quality' | 'balanced';
  userPreference?: RevoModelId;
}

// Model factory interface
export interface IModelFactory {
  createModel(id: RevoModelId): Promise<IModelImplementation>;
  createModelFromConfig(config: ModelConfig): Promise<IModelImplementation>;
}
