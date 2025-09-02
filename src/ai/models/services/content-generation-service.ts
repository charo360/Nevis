/**
 * Unified Content Generation Service
 * Provides a unified interface for content generation across all model versions
 */

import type { 
  ContentGenerationRequest, 
  GenerationResponse,
  RevoModelId,
  ModelSelectionCriteria
} from '../types/model-types';
import type { GeneratedPost } from '@/lib/types';
import { modelRegistry } from '../registry/model-registry';
import { modelFactory } from '../registry/model-factory';

export interface IContentGenerationService {
  generateContent(request: ContentGenerationRequest): Promise<GenerationResponse<GeneratedPost>>;
  generateContentWithAutoSelection(
    request: Omit<ContentGenerationRequest, 'modelId'>,
    criteria?: ModelSelectionCriteria
  ): Promise<GenerationResponse<GeneratedPost>>;
  batchGenerateContent(requests: ContentGenerationRequest[]): Promise<GenerationResponse<GeneratedPost>[]>;
  getRecommendedModel(request: Omit<ContentGenerationRequest, 'modelId'>): Promise<RevoModelId | null>;
}

export class ContentGenerationService implements IContentGenerationService {
  private static instance: ContentGenerationService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ContentGenerationService {
    if (!ContentGenerationService.instance) {
      ContentGenerationService.instance = new ContentGenerationService();
    }
    return ContentGenerationService.instance;
  }

  /**
   * Generate content using specified model
   */
  async generateContent(request: ContentGenerationRequest): Promise<GenerationResponse<GeneratedPost>> {
    const startTime = Date.now();
    
    try {

      // Validate request
      if (!this.validateRequest(request)) {
        throw new Error('Invalid content generation request');
      }

      // Get model implementation
      const model = await modelFactory.createModel(request.modelId);
      if (!model) {
        throw new Error(`Model ${request.modelId} not available`);
      }

      // Check if model is available
      const isAvailable = await model.isAvailable();
      if (!isAvailable) {
        throw new Error(`Model ${request.modelId} is currently unavailable`);
      }

      // Validate request against model
      if (!model.validateRequest(request)) {
        throw new Error(`Request validation failed for model ${request.modelId}`);
      }

      // Generate content
      const result = await model.contentGenerator.generateContent(request);

      const totalTime = Date.now() - startTime;

      return result;

    } catch (error) {
      const totalTime = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          modelId: request.modelId,
          processingTime: totalTime,
          qualityScore: 0,
          creditsUsed: 0,
          enhancementsApplied: []
        }
      };
    }
  }

  /**
   * Generate content with automatic model selection
   */
  async generateContentWithAutoSelection(
    request: Omit<ContentGenerationRequest, 'modelId'>,
    criteria?: ModelSelectionCriteria
  ): Promise<GenerationResponse<GeneratedPost>> {
    try {

      // Determine best model
      const selectedModel = await this.getRecommendedModel(request, criteria);
      if (!selectedModel) {
        throw new Error('No suitable model found for content generation');
      }


      // Generate content with selected model
      return await this.generateContent({
        ...request,
        modelId: selectedModel
      });

    } catch (error) {
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Auto-selection failed',
        metadata: {
          modelId: 'auto-selection-failed' as RevoModelId,
          processingTime: 0,
          qualityScore: 0,
          creditsUsed: 0,
          enhancementsApplied: []
        }
      };
    }
  }

  /**
   * Generate multiple content pieces in batch
   */
  async batchGenerateContent(requests: ContentGenerationRequest[]): Promise<GenerationResponse<GeneratedPost>[]> {

    const results = await Promise.allSettled(
      requests.map(request => this.generateContent(request))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          error: result.reason instanceof Error ? result.reason.message : 'Batch generation failed',
          metadata: {
            modelId: requests[index].modelId,
            processingTime: 0,
            qualityScore: 0,
            creditsUsed: 0,
            enhancementsApplied: []
          }
        };
      }
    });
  }

  /**
   * Get recommended model for content generation
   */
  async getRecommendedModel(
    request: Omit<ContentGenerationRequest, 'modelId'>,
    criteria?: ModelSelectionCriteria
  ): Promise<RevoModelId | null> {
    try {
      // Build selection criteria
      const selectionCriteria: ModelSelectionCriteria = {
        requiredCapabilities: ['contentGeneration'],
        platform: request.platform,
        qualityPreference: 'balanced',
        ...criteria
      };

      // Add artifact requirement if artifacts are specified
      if (request.artifactIds && request.artifactIds.length > 0) {
        selectionCriteria.requiredCapabilities = [
          ...(selectionCriteria.requiredCapabilities || []),
          'artifactSupport'
        ];
      }

      // Select best model
      const selectedModel = await modelRegistry.selectBestModel(selectionCriteria);
      return selectedModel?.model.id || null;

    } catch (error) {
      return null;
    }
  }

  /**
   * Validate content generation request
   */
  private validateRequest(request: ContentGenerationRequest): boolean {
    // Check required fields
    if (!request.modelId || !request.profile || !request.platform) {
      return false;
    }

    // Check profile has minimum required information
    if (!request.profile.businessType || !request.profile.businessName) {
      return false;
    }

    return true;
  }

  /**
   * Get service statistics
   */
  getServiceStats() {
    return {
      serviceName: 'ContentGenerationService',
      version: '1.0.0',
      supportedModels: ['revo-1.0', 'revo-1.5', 'revo-2.0', 'imagen-4'],
      features: [
        'Single content generation',
        'Auto model selection',
        'Batch generation',
        'Model recommendation',
        'Request validation',
        'Error handling'
      ],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const availableModels = await modelRegistry.getAvailableModels();
      const contentCapableModels = availableModels.filter(
        model => model.model.capabilities.contentGeneration
      );

      return {
        healthy: contentCapableModels.length > 0,
        details: {
          totalModels: availableModels.length,
          contentCapableModels: contentCapableModels.length,
          availableModelIds: contentCapableModels.map(m => m.model.id),
          registryInitialized: modelRegistry.isInitialized(),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

// Export singleton instance
export const contentGenerationService = ContentGenerationService.getInstance();
