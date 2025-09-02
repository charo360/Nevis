/**
 * Model Factory
 * Factory pattern for creating and configuring model instances
 */

import type { 
  RevoModelId, 
  IModelImplementation, 
  IModelFactory,
  ModelConfig
} from '../types/model-types';
import { modelRegistry } from './model-registry';

class ModelFactory implements IModelFactory {
  private instanceCache = new Map<RevoModelId, IModelImplementation>();
  private configOverrides = new Map<RevoModelId, Partial<ModelConfig>>();

  /**
   * Create a model instance by ID
   */
  async createModel(id: RevoModelId): Promise<IModelImplementation> {
    // Check cache first
    if (this.instanceCache.has(id)) {
      const cached = this.instanceCache.get(id)!;
      if (await cached.isAvailable()) {
        return cached;
      } else {
        // Remove unavailable model from cache
        this.instanceCache.delete(id);
      }
    }

    // Get model from registry
    const model = modelRegistry.getModel(id);
    if (!model) {
      throw new Error(`Model ${id} not found in registry`);
    }

    // Apply any configuration overrides
    const configOverride = this.configOverrides.get(id);
    if (configOverride) {
      const updatedModel = this.applyConfigOverride(model, configOverride);
      this.instanceCache.set(id, updatedModel);
      return updatedModel;
    }

    // Cache and return the model
    this.instanceCache.set(id, model);
    return model;
  }

  /**
   * Create a model from custom configuration
   */
  async createModelFromConfig(config: ModelConfig): Promise<IModelImplementation> {
    // This is a more advanced feature for custom model configurations
    // For now, we'll find the closest matching model and apply config overrides
    
    const allModels = modelRegistry.getAllModels();
    const matchingModel = allModels.find(m => 
      m.model.config.aiService === config.aiService
    );

    if (!matchingModel) {
      throw new Error(`No model found matching AI service: ${config.aiService}`);
    }

    return this.applyConfigOverride(matchingModel, config);
  }

  /**
   * Set configuration override for a specific model
   */
  setConfigOverride(modelId: RevoModelId, configOverride: Partial<ModelConfig>): void {
    this.configOverrides.set(modelId, configOverride);
    
    // Remove from cache to force recreation with new config
    this.instanceCache.delete(modelId);
    
  }

  /**
   * Clear configuration override for a model
   */
  clearConfigOverride(modelId: RevoModelId): void {
    this.configOverrides.delete(modelId);
    this.instanceCache.delete(modelId);
    
  }

  /**
   * Get all active configuration overrides
   */
  getConfigOverrides(): Map<RevoModelId, Partial<ModelConfig>> {
    return new Map(this.configOverrides);
  }

  /**
   * Create multiple models in batch
   */
  async createModels(ids: RevoModelId[]): Promise<Map<RevoModelId, IModelImplementation>> {
    const results = new Map<RevoModelId, IModelImplementation>();
    const errors: { id: RevoModelId; error: Error }[] = [];

    await Promise.allSettled(
      ids.map(async (id) => {
        try {
          const model = await this.createModel(id);
          results.set(id, model);
        } catch (error) {
          errors.push({ id, error: error as Error });
        }
      })
    );

    if (errors.length > 0) {
    }

    return results;
  }

  /**
   * Validate model configuration
   */
  validateConfig(config: ModelConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate AI service
    const validServices = ['gemini-2.0', 'gemini-2.5', 'openai', 'imagen-4'];
    if (!validServices.includes(config.aiService)) {
      errors.push(`Invalid AI service: ${config.aiService}`);
    }

    // Validate timeout
    if (config.timeout <= 0) {
      errors.push('Timeout must be positive');
    }

    // Validate max retries
    if (config.maxRetries < 0) {
      errors.push('Max retries cannot be negative');
    }

    // Validate quality settings
    if (config.qualitySettings.compressionLevel < 0 || config.qualitySettings.compressionLevel > 100) {
      errors.push('Compression level must be between 0 and 100');
    }

    if (config.qualitySettings.enhancementLevel < 0 || config.qualitySettings.enhancementLevel > 10) {
      errors.push('Enhancement level must be between 0 and 10');
    }

    // Validate prompt settings
    if (config.promptSettings.temperature < 0 || config.promptSettings.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }

    if (config.promptSettings.maxTokens <= 0) {
      errors.push('Max tokens must be positive');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Apply configuration override to a model
   */
  private applyConfigOverride(
    model: IModelImplementation, 
    configOverride: Partial<ModelConfig>
  ): IModelImplementation {
    // Create a new model instance with overridden configuration
    const newConfig = { ...model.model.config, ...configOverride };
    
    // Validate the new configuration
    const validation = this.validateConfig(newConfig);
    if (!validation.valid) {
      throw new Error(`Invalid configuration override: ${validation.errors.join(', ')}`);
    }

    // Create a new model with the updated configuration
    const updatedModel = {
      ...model,
      model: {
        ...model.model,
        config: newConfig
      }
    };

    return updatedModel;
  }

  /**
   * Get factory statistics
   */
  getFactoryStats() {
    return {
      cachedModels: this.instanceCache.size,
      configOverrides: this.configOverrides.size,
      cacheKeys: Array.from(this.instanceCache.keys()),
      overrideKeys: Array.from(this.configOverrides.keys())
    };
  }

  /**
   * Clear all caches and overrides
   */
  reset(): void {
    this.instanceCache.clear();
    this.configOverrides.clear();
  }

  /**
   * Preload commonly used models
   */
  async preloadModels(modelIds: RevoModelId[] = ['revo-1.5', 'revo-2.0']): Promise<void> {
    
    try {
      await this.createModels(modelIds);
    } catch (error) {
    }
  }

  /**
   * Health check for all cached models
   */
  async healthCheck(): Promise<{ healthy: RevoModelId[]; unhealthy: RevoModelId[] }> {
    const healthy: RevoModelId[] = [];
    const unhealthy: RevoModelId[] = [];

    for (const [id, model] of this.instanceCache) {
      try {
        const isAvailable = await model.isAvailable();
        if (isAvailable) {
          healthy.push(id);
        } else {
          unhealthy.push(id);
          this.instanceCache.delete(id); // Remove unhealthy models from cache
        }
      } catch (error) {
        unhealthy.push(id);
        this.instanceCache.delete(id);
      }
    }

    return { healthy, unhealthy };
  }
}

// Export singleton instance
export const modelFactory = new ModelFactory();

// Export class for testing
export { ModelFactory };
