/**
 * AI Models Module - Main Export
 * Centralized exports for the entire model system
 */

// Core types
export type {
  RevoModelId,
  ModelStatus,
  ModelCapabilities,
  ModelPricing,
  ModelConfig,
  RevoModel,
  ContentGenerationRequest,
  DesignGenerationRequest,
  GenerationResponse,
  IContentGenerator,
  IDesignGenerator,
  IModelImplementation,
  IModelRegistry,
  ModelSelectionCriteria,
  IModelFactory
} from './types/model-types';

export type {
  GenerationContext,
  ContentGenerationOptions,
  ContentGenerationResult,
  DesignGenerationOptions,
  DesignGenerationResult,
  VideoGenerationOptions,
  VideoGenerationResult,
  EnhancedGenerationRequest,
  EnhancedGenerationResponse,
  BatchGenerationRequest,
  BatchGenerationResponse,
  GenerationAnalytics,
  ModelPerformanceMetrics
} from './types/generation-types';

export type {
  CapabilityCategory,
  CapabilityLevel,
  ContentCapabilities,
  DesignCapabilities,
  VideoCapabilities,
  AnalysisCapabilities,
  EnhancementCapabilities,
  IntegrationCapabilities,
  PlatformCapabilities,
  ModelCapabilitySet,
  CapabilityComparison,
  CapabilityRequirements,
  CapabilityValidationResult,
  CapabilityEvolution
} from './types/capability-types';

// Registry and factory
export { modelRegistry, ModelRegistry } from './registry/model-registry';
export { modelFactory, ModelFactory } from './registry/model-factory';

// Configuration
export {
  modelConfigs,
  getModelConfig,
  getAllModelConfigs,
  getModelsByStatus,
  getModelsByTier,
  getLatestModels,
  getRecommendedModel,
  getModelForBudget,
  compareModels
} from './config/model-configs';

export {
  modelCapabilities,
  capabilityMatrix,
  featureAvailability,
  platformCapabilities,
  hasCapability,
  getCapabilityLevel,
  hasFeature,
  getModelsByFeature,
  getPlatformCapabilities,
  getMaxQualityForPlatform,
  getSupportedAspectRatios
} from './config/capabilities';

export {
  modelPricing,
  pricingTiers,
  creditPackages,
  usageCalculations,
  pricingDisplay,
  getModelPricing,
  getAllPricing,
  getModelsByTier as getPricingModelsByTier,
  getCheapestModel,
  getMostExpensiveModel
} from './config/pricing';

// Services (will be created next)
export type { IContentGenerationService } from './services/content-generation-service';
export type { IDesignGenerationService } from './services/design-generation-service';
export type { IModelSelectionService } from './services/model-selection-service';

// Model versions (will be created next)
export type { Revo10Implementation } from './versions/revo-1.0';
export type { Revo15Implementation } from './versions/revo-1.5';

// Utility functions
export async function initializeModelSystem(): Promise<void> {

  try {
    // Import the registry and factory here to avoid circular dependencies
    const { modelRegistry } = await import('./registry/model-registry');
    const { modelFactory } = await import('./registry/model-factory');

    // Initialize the model registry
    await modelRegistry.initialize();

    // Preload commonly used models
    await modelFactory.preloadModels(['revo-1.5', 'revo-2.0']);

  } catch (error) {
    throw error;
  }
}

export async function getSystemHealth(): Promise<{
  registryStatus: 'healthy' | 'unhealthy';
  factoryStatus: 'healthy' | 'unhealthy';
  availableModels: string[];
  unavailableModels: string[];
  totalModels: number;
}> {
  try {
    const { modelRegistry } = await import('./registry/model-registry');
    const { modelFactory } = await import('./registry/model-factory');

    const registryStats = modelRegistry.getRegistryStats();
    const factoryHealth = await modelFactory.healthCheck();
    const availableModels = await modelRegistry.getAvailableModels();

    return {
      registryStatus: modelRegistry.isInitialized() ? 'healthy' : 'unhealthy',
      factoryStatus: factoryHealth.healthy.length > 0 ? 'healthy' : 'unhealthy',
      availableModels: factoryHealth.healthy,
      unavailableModels: factoryHealth.unhealthy,
      totalModels: registryStats.totalModels
    };
  } catch (error) {
    return {
      registryStatus: 'unhealthy',
      factoryStatus: 'unhealthy',
      availableModels: [],
      unavailableModels: [],
      totalModels: 0
    };
  }
}

export async function getSystemStats() {
  try {
    const { modelRegistry } = await import('./registry/model-registry');
    const { modelFactory } = await import('./registry/model-factory');

    const registryStats = modelRegistry.getRegistryStats();
    const factoryStats = modelFactory.getFactoryStats();

    return {
      registry: registryStats,
      factory: factoryStats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      registry: {},
      factory: {},
      timestamp: new Date().toISOString()
    };
  }
}

// Quick access functions for common operations
export async function selectBestModel(criteria: any) {
  try {
    const { modelRegistry } = await import('./registry/model-registry');
    return await modelRegistry.selectBestModel(criteria);
  } catch (error) {
    return null;
  }
}

export async function createModel(modelId: string) {
  try {
    const { modelFactory } = await import('./registry/model-factory');
    return await modelFactory.createModel(modelId as any);
  } catch (error) {
    return null;
  }
}

export async function getModelInfo(modelId: string) {
  try {
    const { getModelConfig } = await import('./config/model-configs');
    const { modelCapabilities } = await import('./config/capabilities');
    const { getModelPricing } = await import('./config/pricing');

    const config = getModelConfig(modelId as any);
    const capabilities = modelCapabilities[modelId as any];
    const pricing = getModelPricing(modelId as any);

    return {
      ...config,
      capabilities,
      pricing
    };
  } catch (error) {
    return null;
  }
}

// Development and testing utilities
export async function resetSystem(): Promise<void> {
  try {
    const { modelRegistry } = await import('./registry/model-registry');
    const { modelFactory } = await import('./registry/model-factory');

    modelRegistry.reset();
    modelFactory.reset();
  } catch (error) {
  }
}

export async function validateSystem(): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const { modelRegistry } = await import('./registry/model-registry');
    const { getAllModelConfigs } = await import('./config/model-configs');

    // Check if registry is initialized
    if (!modelRegistry.isInitialized()) {
      errors.push('Model registry is not initialized');
    }

    // Check if all models are properly configured
    const allModels = getAllModelConfigs();
    for (const model of allModels) {
      if (!model.id || !model.name || !model.version) {
        errors.push(`Model ${model.id} is missing required fields`);
      }

      if (!model.capabilities || !model.config || !model.pricing) {
        errors.push(`Model ${model.id} is missing configuration`);
      }
    }

    // Check model availability
    const availableModels = await modelRegistry.getAvailableModels();
    if (availableModels.length === 0) {
      warnings.push('No models are currently available');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    errors.push(`System validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      valid: false,
      errors,
      warnings
    };
  }
}
