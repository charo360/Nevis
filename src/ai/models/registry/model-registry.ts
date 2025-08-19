/**
 * Model Registry
 * Central registry for managing all Revo model implementations
 */

import type { 
  RevoModelId, 
  ModelStatus, 
  IModelImplementation, 
  IModelRegistry,
  ModelSelectionCriteria,
  ModelCapabilities
} from '../types/model-types';

class ModelRegistry implements IModelRegistry {
  private models = new Map<RevoModelId, IModelImplementation>();
  private initialized = false;

  /**
   * Register a model implementation
   */
  registerModel(implementation: IModelImplementation): void {
    const modelId = implementation.model.id;
    
    if (this.models.has(modelId)) {
      console.warn(`⚠️ Model ${modelId} is already registered. Overwriting...`);
    }
    
    this.models.set(modelId, implementation);
    console.log(`✅ Registered model: ${implementation.model.name} (${modelId})`);
  }

  /**
   * Get a specific model implementation
   */
  getModel(id: RevoModelId): IModelImplementation | null {
    return this.models.get(id) || null;
  }

  /**
   * Get all registered models
   */
  getAllModels(): IModelImplementation[] {
    return Array.from(this.models.values());
  }

  /**
   * Get only available models (those that pass availability check)
   */
  async getAvailableModels(): Promise<IModelImplementation[]> {
    const allModels = this.getAllModels();
    const availabilityChecks = await Promise.allSettled(
      allModels.map(async (model) => ({
        model,
        available: await model.isAvailable()
      }))
    );

    return availabilityChecks
      .filter((result): result is PromiseFulfilledResult<{model: IModelImplementation, available: boolean}> => 
        result.status === 'fulfilled' && result.value.available
      )
      .map(result => result.value.model);
  }

  /**
   * Get models by status
   */
  getModelsByStatus(status: ModelStatus): IModelImplementation[] {
    return this.getAllModels().filter(impl => impl.model.status === status);
  }

  /**
   * Get models by capability
   */
  getModelsByCapability(capability: keyof ModelCapabilities): IModelImplementation[] {
    return this.getAllModels().filter(impl => impl.model.capabilities[capability]);
  }

  /**
   * Find the best model based on selection criteria
   */
  async selectBestModel(criteria: ModelSelectionCriteria): Promise<IModelImplementation | null> {
    const availableModels = await this.getAvailableModels();
    
    if (availableModels.length === 0) {
      console.warn('⚠️ No available models found');
      return null;
    }

    // If user has a preference, try to use it
    if (criteria.userPreference) {
      const preferredModel = availableModels.find(m => m.model.id === criteria.userPreference);
      if (preferredModel && this.meetsRequirements(preferredModel, criteria)) {
        return preferredModel;
      }
    }

    // Score models based on criteria
    const scoredModels = availableModels
      .map(model => ({
        model,
        score: this.scoreModel(model, criteria)
      }))
      .filter(({ score }) => score > 0) // Only models that meet minimum requirements
      .sort((a, b) => b.score - a.score); // Sort by score descending

    return scoredModels.length > 0 ? scoredModels[0].model : null;
  }

  /**
   * Check if a model meets the minimum requirements
   */
  private meetsRequirements(model: IModelImplementation, criteria: ModelSelectionCriteria): boolean {
    // Check required capabilities
    if (criteria.requiredCapabilities) {
      for (const capability of criteria.requiredCapabilities) {
        if (!model.model.capabilities[capability]) {
          return false;
        }
      }
    }

    // Check credit limit
    if (criteria.maxCredits && model.model.pricing.creditsPerGeneration > criteria.maxCredits) {
      return false;
    }

    // Check platform support
    if (criteria.platform && !model.model.capabilities.supportedPlatforms.includes(criteria.platform)) {
      return false;
    }

    return true;
  }

  /**
   * Score a model based on selection criteria
   */
  private scoreModel(model: IModelImplementation, criteria: ModelSelectionCriteria): number {
    let score = 0;

    // Base score for meeting requirements
    if (!this.meetsRequirements(model, criteria)) {
      return 0;
    }

    score += 50; // Base score for meeting requirements

    // Quality preference scoring
    if (criteria.qualityPreference) {
      switch (criteria.qualityPreference) {
        case 'quality':
          score += model.model.capabilities.maxQuality * 2;
          break;
        case 'speed':
          // Prefer models with faster processing (lower tier = faster)
          score += model.model.pricing.tier === 'basic' ? 20 : 
                   model.model.pricing.tier === 'premium' ? 10 : 5;
          break;
        case 'balanced':
          score += model.model.capabilities.maxQuality;
          score += model.model.pricing.tier === 'premium' ? 15 : 10;
          break;
      }
    }

    // Tier preference scoring
    if (criteria.preferredTier) {
      if (model.model.pricing.tier === criteria.preferredTier) {
        score += 20;
      }
    }

    // Credit efficiency scoring
    if (criteria.maxCredits) {
      const efficiency = criteria.maxCredits / model.model.pricing.creditsPerGeneration;
      score += Math.min(efficiency * 5, 15); // Cap at 15 points
    }

    // Status bonus
    switch (model.model.status) {
      case 'stable':
        score += 10;
        break;
      case 'enhanced':
        score += 15;
        break;
      case 'development':
        score += 5;
        break;
      case 'beta':
        score += 3;
        break;
    }

    return score;
  }

  /**
   * Get model statistics
   */
  getRegistryStats() {
    const models = this.getAllModels();
    const statusCounts = models.reduce((acc, model) => {
      acc[model.model.status] = (acc[model.model.status] || 0) + 1;
      return acc;
    }, {} as Record<ModelStatus, number>);

    const tierCounts = models.reduce((acc, model) => {
      acc[model.model.pricing.tier] = (acc[model.model.pricing.tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalModels: models.length,
      statusDistribution: statusCounts,
      tierDistribution: tierCounts,
      averageCreditsPerGeneration: models.reduce((sum, m) => sum + m.model.pricing.creditsPerGeneration, 0) / models.length,
      supportedPlatforms: [...new Set(models.flatMap(m => m.model.capabilities.supportedPlatforms))]
    };
  }

  /**
   * Initialize the registry with default models
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('🚀 Initializing Model Registry...');

    try {
      // Import and register all model implementations
      const { Revo10Implementation } = await import('../versions/revo-1.0');
      const { Revo15Implementation } = await import('../versions/revo-1.5');
      const { Revo20Implementation } = await import('../versions/revo-2.0');
      const { Imagen4Implementation } = await import('../versions/imagen-4');

      this.registerModel(new Revo10Implementation());
      this.registerModel(new Revo15Implementation());
      this.registerModel(new Revo20Implementation());
      this.registerModel(new Imagen4Implementation());

      this.initialized = true;
      console.log('✅ Model Registry initialized successfully');
      console.log('📊 Registry Stats:', this.getRegistryStats());
    } catch (error) {
      console.error('❌ Failed to initialize Model Registry:', error);
      throw error;
    }
  }

  /**
   * Check if registry is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Reset the registry (mainly for testing)
   */
  reset(): void {
    this.models.clear();
    this.initialized = false;
    console.log('🔄 Model Registry reset');
  }
}

// Export singleton instance
export const modelRegistry = new ModelRegistry();

// Export class for testing
export { ModelRegistry };
