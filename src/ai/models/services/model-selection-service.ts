/**
 * Model Selection Service
 * Intelligent model selection and recommendation system
 */

import type { 
  RevoModelId, 
  ModelSelectionCriteria,
  IModelImplementation
} from '../types/model-types';
import type { Platform } from '@/lib/types';
import { modelRegistry } from '../registry/model-registry';
import { getModelPricing, usageCalculations } from '../config/pricing';
import { hasCapability, getCapabilityLevel } from '../config/capabilities';

export interface IModelSelectionService {
  selectBestModel(criteria: ModelSelectionCriteria): Promise<RevoModelId | null>;
  recommendModelForUser(userProfile: UserProfile): Promise<ModelRecommendation>;
  compareModels(modelIds: RevoModelId[]): ModelComparison;
  getModelSuggestions(context: SelectionContext): ModelSuggestion[];
}

export interface UserProfile {
  budget?: number; // Available credits
  usagePattern?: {
    generationsPerDay: number;
    designsPerDay: number;
    videosPerDay?: number;
  };
  qualityPreference?: 'speed' | 'quality' | 'balanced';
  platforms?: Platform[];
  businessType?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  features?: string[]; // Required features
}

export interface ModelRecommendation {
  primaryModel: RevoModelId;
  alternativeModels: RevoModelId[];
  reasoning: string;
  costAnalysis: {
    dailyCost: number;
    monthlyCost: number;
    costEfficiency: 'low' | 'medium' | 'high';
  };
  qualityExpectation: number; // 1-10
  suitabilityScore: number; // 1-100
}

export interface ModelComparison {
  models: RevoModelId[];
  comparison: {
    [key: string]: {
      quality: number;
      cost: number;
      speed: number;
      features: string[];
      bestFor: string[];
    };
  };
  recommendation: RevoModelId;
  summary: string;
}

export interface SelectionContext {
  platform?: Platform;
  contentType?: 'content' | 'design' | 'video';
  urgency?: 'low' | 'medium' | 'high';
  qualityRequirement?: 'basic' | 'standard' | 'premium';
  budget?: number;
  features?: string[];
}

export interface ModelSuggestion {
  modelId: RevoModelId;
  confidence: number; // 0-1
  reasoning: string;
  pros: string[];
  cons: string[];
  bestFor: string[];
}

export class ModelSelectionService implements IModelSelectionService {
  private static instance: ModelSelectionService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ModelSelectionService {
    if (!ModelSelectionService.instance) {
      ModelSelectionService.instance = new ModelSelectionService();
    }
    return ModelSelectionService.instance;
  }

  /**
   * Select the best model based on criteria
   */
  async selectBestModel(criteria: ModelSelectionCriteria): Promise<RevoModelId | null> {
    try {
      
      // Use the registry's selection logic
      const selectedModel = await modelRegistry.selectBestModel(criteria);
      
      if (selectedModel) {
        return selectedModel.model.id;
      }
      
      return null;
      
    } catch (error) {
      return null;
    }
  }

  /**
   * Recommend model based on user profile
   */
  async recommendModelForUser(userProfile: UserProfile): Promise<ModelRecommendation> {
    try {
      
      const availableModels = await modelRegistry.getAvailableModels();
      const scoredModels = availableModels.map(model => ({
        model,
        score: this.scoreModelForUser(model, userProfile)
      })).sort((a, b) => b.score - a.score);

      if (scoredModels.length === 0) {
        throw new Error('No available models found');
      }

      const primaryModel = scoredModels[0].model.model.id;
      const alternativeModels = scoredModels.slice(1, 3).map(m => m.model.model.id);

      // Calculate cost analysis
      const costAnalysis = this.calculateCostAnalysis(primaryModel, userProfile.usagePattern);
      
      // Generate reasoning
      const reasoning = this.generateRecommendationReasoning(scoredModels[0].model, userProfile);

      return {
        primaryModel,
        alternativeModels,
        reasoning,
        costAnalysis,
        qualityExpectation: scoredModels[0].model.model.capabilities.maxQuality,
        suitabilityScore: Math.round(scoredModels[0].score)
      };

    } catch (error) {
      
      // Fallback recommendation
      return {
        primaryModel: 'revo-1.5', // Safe default
        alternativeModels: ['revo-1.0', 'revo-2.0'],
        reasoning: 'Default recommendation due to analysis error',
        costAnalysis: {
          dailyCost: 10,
          monthlyCost: 300,
          costEfficiency: 'medium'
        },
        qualityExpectation: 8,
        suitabilityScore: 70
      };
    }
  }

  /**
   * Compare multiple models
   */
  compareModels(modelIds: RevoModelId[]): ModelComparison {
    const comparison: ModelComparison['comparison'] = {};
    
    for (const modelId of modelIds) {
      const model = modelRegistry.getModel(modelId);
      if (!model) continue;

      const pricing = getModelPricing(modelId);
      
      comparison[modelId] = {
        quality: model.model.capabilities.maxQuality,
        cost: pricing.creditsPerGeneration,
        speed: this.getSpeedScore(modelId),
        features: model.model.features,
        bestFor: this.getBestUseCases(modelId)
      };
    }

    // Determine recommendation
    const recommendation = this.selectBestFromComparison(comparison);
    
    // Generate summary
    const summary = this.generateComparisonSummary(comparison, recommendation);

    return {
      models: modelIds,
      comparison,
      recommendation,
      summary
    };
  }

  /**
   * Get model suggestions for a specific context
   */
  getModelSuggestions(context: SelectionContext): ModelSuggestion[] {
    const allModels: RevoModelId[] = ['revo-1.0', 'revo-1.5', 'revo-2.0', 'imagen-4'];
    
    return allModels.map(modelId => {
      const confidence = this.calculateContextConfidence(modelId, context);
      const reasoning = this.generateContextReasoning(modelId, context);
      const { pros, cons, bestFor } = this.getModelCharacteristics(modelId);

      return {
        modelId,
        confidence,
        reasoning,
        pros,
        cons,
        bestFor
      };
    }).sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Score a model for a specific user
   */
  private scoreModelForUser(model: IModelImplementation, userProfile: UserProfile): number {
    let score = 50; // Base score

    // Budget considerations
    if (userProfile.budget) {
      const pricing = getModelPricing(model.model.id);
      if (pricing.creditsPerGeneration <= userProfile.budget) {
        score += 20;
      } else {
        score -= 30; // Heavily penalize unaffordable models
      }
    }

    // Quality preference
    if (userProfile.qualityPreference) {
      switch (userProfile.qualityPreference) {
        case 'quality':
          score += model.model.capabilities.maxQuality * 3;
          break;
        case 'speed':
          score += (10 - model.model.capabilities.maxQuality) * 2; // Prefer faster models
          break;
        case 'balanced':
          score += model.model.capabilities.maxQuality * 2;
          break;
      }
    }

    // Experience level
    if (userProfile.experienceLevel) {
      switch (userProfile.experienceLevel) {
        case 'beginner':
          if (model.model.id === 'revo-1.0') score += 15; // Prefer simple model
          break;
        case 'intermediate':
          if (model.model.id === 'revo-1.5') score += 15; // Prefer balanced model
          break;
        case 'advanced':
          if (model.model.id === 'revo-2.0' || model.model.id === 'imagen-4') score += 15;
          break;
      }
    }

    // Platform support
    if (userProfile.platforms) {
      const supportedPlatforms = model.model.capabilities.supportedPlatforms;
      const matchingPlatforms = userProfile.platforms.filter(p => supportedPlatforms.includes(p));
      score += (matchingPlatforms.length / userProfile.platforms.length) * 10;
    }

    // Feature requirements
    if (userProfile.features) {
      const modelFeatures = model.model.features.map(f => f.toLowerCase());
      const matchingFeatures = userProfile.features.filter(f => 
        modelFeatures.some(mf => mf.includes(f.toLowerCase()))
      );
      score += (matchingFeatures.length / userProfile.features.length) * 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate cost analysis for a model and usage pattern
   */
  private calculateCostAnalysis(modelId: RevoModelId, usagePattern?: UserProfile['usagePattern']) {
    if (!usagePattern) {
      return {
        dailyCost: 0,
        monthlyCost: 0,
        costEfficiency: 'medium' as const
      };
    }

    const result = usageCalculations.estimateMonthlyCost({
      modelId,
      generationsPerDay: usagePattern.generationsPerDay,
      designsPerDay: usagePattern.designsPerDay,
      videosPerDay: usagePattern.videosPerDay
    });

    return {
      dailyCost: result.dailyCost,
      monthlyCost: result.monthlyCost,
      costEfficiency: result.monthlyCost < 100 ? 'high' : 
                     result.monthlyCost < 300 ? 'medium' : 'low'
    };
  }

  /**
   * Generate recommendation reasoning
   */
  private generateRecommendationReasoning(model: IModelImplementation, userProfile: UserProfile): string {
    const reasons = [];
    
    if (userProfile.qualityPreference === 'quality' && model.model.capabilities.maxQuality >= 8) {
      reasons.push('high quality output matches your preference');
    }
    
    if (userProfile.experienceLevel === 'beginner' && model.model.id === 'revo-1.0') {
      reasons.push('simple and reliable for beginners');
    }
    
    if (userProfile.budget && getModelPricing(model.model.id).creditsPerGeneration <= userProfile.budget) {
      reasons.push('fits within your budget');
    }

    return reasons.length > 0 ? 
      `Recommended because it offers ${reasons.join(', ')}.` :
      'Best overall match for your requirements.';
  }

  /**
   * Get speed score for a model (higher = faster)
   */
  private getSpeedScore(modelId: RevoModelId): number {
    const speedMap: Record<RevoModelId, number> = {
      'revo-1.0': 9,
      'revo-1.5': 7,
      'revo-2.0': 5,
      'imagen-4': 3
    };
    return speedMap[modelId] || 5;
  }

  /**
   * Get best use cases for a model
   */
  private getBestUseCases(modelId: RevoModelId): string[] {
    const useCases: Record<RevoModelId, string[]> = {
      'revo-1.0': ['Small businesses', 'Budget-conscious users', 'Basic content'],
      'revo-1.5': ['Growing businesses', 'Marketing agencies', 'Professional content'],
      'revo-2.0': ['Advanced users', 'Video content', 'Cutting-edge features'],
      'imagen-4': ['Premium brands', 'High-quality campaigns', '4K content']
    };
    return useCases[modelId] || [];
  }

  /**
   * Select best model from comparison
   */
  private selectBestFromComparison(comparison: ModelComparison['comparison']): RevoModelId {
    let bestModel: RevoModelId = 'revo-1.5'; // Default
    let bestScore = 0;

    for (const [modelId, data] of Object.entries(comparison)) {
      // Balanced scoring: quality * 0.4 + (10-cost) * 0.3 + speed * 0.3
      const score = data.quality * 0.4 + (10 - data.cost) * 0.3 + data.speed * 0.3;
      if (score > bestScore) {
        bestScore = score;
        bestModel = modelId as RevoModelId;
      }
    }

    return bestModel;
  }

  /**
   * Generate comparison summary
   */
  private generateComparisonSummary(comparison: ModelComparison['comparison'], recommendation: RevoModelId): string {
    const recommended = comparison[recommendation];
    return `${recommendation} is recommended for its balanced combination of quality (${recommended.quality}/10), cost efficiency, and feature set.`;
  }

  /**
   * Calculate confidence for a model in a specific context
   */
  private calculateContextConfidence(modelId: RevoModelId, context: SelectionContext): number {
    let confidence = 0.5; // Base confidence

    // Quality requirement matching
    if (context.qualityRequirement) {
      const model = modelRegistry.getModel(modelId);
      if (model) {
        const quality = model.model.capabilities.maxQuality;
        if (context.qualityRequirement === 'premium' && quality >= 9) confidence += 0.3;
        else if (context.qualityRequirement === 'standard' && quality >= 7) confidence += 0.2;
        else if (context.qualityRequirement === 'basic' && quality >= 5) confidence += 0.1;
      }
    }

    // Budget considerations
    if (context.budget) {
      const pricing = getModelPricing(modelId);
      if (pricing.creditsPerGeneration <= context.budget) {
        confidence += 0.2;
      } else {
        confidence -= 0.3;
      }
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Generate reasoning for context-based suggestion
   */
  private generateContextReasoning(modelId: RevoModelId, context: SelectionContext): string {
    const model = modelRegistry.getModel(modelId);
    if (!model) return 'Model information unavailable';

    const reasons = [];
    
    if (context.qualityRequirement === 'premium' && model.model.capabilities.maxQuality >= 9) {
      reasons.push('meets premium quality requirements');
    }
    
    if (context.urgency === 'high' && this.getSpeedScore(modelId) >= 7) {
      reasons.push('offers fast processing for urgent needs');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'general purpose model';
  }

  /**
   * Get model characteristics
   */
  private getModelCharacteristics(modelId: RevoModelId) {
    const characteristics: Record<RevoModelId, { pros: string[]; cons: string[]; bestFor: string[] }> = {
      'revo-1.0': {
        pros: ['Fast processing', 'Low cost', 'Reliable'],
        cons: ['Limited features', 'Basic quality', 'Single aspect ratio'],
        bestFor: ['Beginners', 'Budget users', 'Simple content']
      },
      'revo-1.5': {
        pros: ['Enhanced quality', 'Artifact support', 'Multiple aspect ratios'],
        cons: ['Higher cost', 'Longer processing'],
        bestFor: ['Professional use', 'Marketing agencies', 'Quality content']
      },
      'revo-2.0': {
        pros: ['Cutting-edge features', 'Video generation', 'Advanced capabilities'],
        cons: ['Highest cost', 'Experimental', 'Complex'],
        bestFor: ['Advanced users', 'Video content', 'Innovation']
      },
      'imagen-4': {
        pros: ['Maximum quality', '4K resolution', 'Perfect text rendering'],
        cons: ['Very expensive', 'Slow processing', 'No video'],
        bestFor: ['Premium brands', 'High-end campaigns', 'Print quality']
      }
    };

    return characteristics[modelId] || { pros: [], cons: [], bestFor: [] };
  }
}

// Export singleton instance
export const modelSelectionService = ModelSelectionService.getInstance();
