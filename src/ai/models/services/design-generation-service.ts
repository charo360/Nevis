/**
 * Unified Design Generation Service
 * Provides a unified interface for design generation across all model versions
 */

import type { 
  DesignGenerationRequest, 
  GenerationResponse,
  RevoModelId,
  ModelSelectionCriteria
} from '../types/model-types';
import type { PostVariant } from '@/lib/types';
import { modelRegistry } from '../registry/model-registry';
import { modelFactory } from '../registry/model-factory';

export interface IDesignGenerationService {
  generateDesign(request: DesignGenerationRequest): Promise<GenerationResponse<PostVariant>>;
  generateDesignWithAutoSelection(
    request: Omit<DesignGenerationRequest, 'modelId'>,
    criteria?: ModelSelectionCriteria
  ): Promise<GenerationResponse<PostVariant>>;
  batchGenerateDesigns(requests: DesignGenerationRequest[]): Promise<GenerationResponse<PostVariant>[]>;
  getRecommendedModel(request: Omit<DesignGenerationRequest, 'modelId'>): Promise<RevoModelId | null>;
}

export class DesignGenerationService implements IDesignGenerationService {
  private static instance: DesignGenerationService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): DesignGenerationService {
    if (!DesignGenerationService.instance) {
      DesignGenerationService.instance = new DesignGenerationService();
    }
    return DesignGenerationService.instance;
  }

  /**
   * Generate design using specified model
   */
  async generateDesign(request: DesignGenerationRequest): Promise<GenerationResponse<PostVariant>> {
    const startTime = Date.now();
    
    try {
      console.log('🎨 Design Generation Service: Starting generation...');
      console.log('- Model:', request.modelId);
      console.log('- Platform:', request.platform);
      console.log('- Business Type:', request.businessType);

      // Validate request
      if (!this.validateRequest(request)) {
        throw new Error('Invalid design generation request');
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

      // Generate design
      const result = await model.designGenerator.generateDesign(request);

      const totalTime = Date.now() - startTime;
      console.log(`✅ Design generated successfully in ${totalTime}ms`);

      return result;

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error('❌ Design generation failed:', error);

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
   * Generate design with automatic model selection
   */
  async generateDesignWithAutoSelection(
    request: Omit<DesignGenerationRequest, 'modelId'>,
    criteria?: ModelSelectionCriteria
  ): Promise<GenerationResponse<PostVariant>> {
    try {
      console.log('🤖 Auto-selecting best model for design generation...');

      // Determine best model
      const selectedModel = await this.getRecommendedModel(request, criteria);
      if (!selectedModel) {
        throw new Error('No suitable model found for design generation');
      }

      console.log(`✅ Selected model: ${selectedModel}`);

      // Generate design with selected model
      return await this.generateDesign({
        ...request,
        modelId: selectedModel
      });

    } catch (error) {
      console.error('❌ Auto-selection design generation failed:', error);
      
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
   * Generate multiple designs in batch
   */
  async batchGenerateDesigns(requests: DesignGenerationRequest[]): Promise<GenerationResponse<PostVariant>[]> {
    console.log(`📦 Batch generating ${requests.length} designs...`);

    const results = await Promise.allSettled(
      requests.map(request => this.generateDesign(request))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`❌ Batch item ${index} failed:`, result.reason);
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
   * Get recommended model for design generation
   */
  async getRecommendedModel(
    request: Omit<DesignGenerationRequest, 'modelId'>,
    criteria?: ModelSelectionCriteria
  ): Promise<RevoModelId | null> {
    try {
      // Build selection criteria
      const selectionCriteria: ModelSelectionCriteria = {
        requiredCapabilities: ['designGeneration'],
        platform: request.platform as any, // Convert string to Platform type
        qualityPreference: 'quality', // Prefer quality for design
        ...criteria
      };

      // Add artifact requirement if artifacts are specified
      if (request.artifactInstructions) {
        selectionCriteria.requiredCapabilities = [
          ...(selectionCriteria.requiredCapabilities || []),
          'artifactSupport'
        ];
      }

      // Select best model
      const selectedModel = await modelRegistry.selectBestModel(selectionCriteria);
      return selectedModel?.model.id || null;

    } catch (error) {
      console.error('❌ Model recommendation failed:', error);
      return null;
    }
  }

  /**
   * Validate design generation request
   */
  private validateRequest(request: DesignGenerationRequest): boolean {
    // Check required fields
    if (!request.modelId || !request.businessType || !request.platform || !request.brandProfile) {
      return false;
    }

    // Check image text
    if (!request.imageText) {
      return false;
    }

    // Check brand profile has minimum required information
    if (!request.brandProfile.businessType || !request.brandProfile.businessName) {
      return false;
    }

    return true;
  }

  /**
   * Get optimal aspect ratio for platform and model
   */
  getOptimalAspectRatio(platform: string, modelId: RevoModelId): string {
    // Get model capabilities
    const model = modelRegistry.getModel(modelId);
    if (!model) {
      return '1:1'; // Default fallback
    }

    const supportedRatios = model.model.capabilities.aspectRatios;

    // Platform preferences
    const platformPreferences: Record<string, string[]> = {
      'Instagram': ['1:1', '9:16'],
      'Facebook': ['16:9', '1:1'],
      'Twitter': ['16:9', '1:1'],
      'LinkedIn': ['16:9', '1:1']
    };

    const preferred = platformPreferences[platform] || ['1:1'];
    
    // Find first supported ratio that matches platform preference
    for (const ratio of preferred) {
      if (supportedRatios.includes(ratio)) {
        return ratio;
      }
    }

    // Fallback to first supported ratio
    return supportedRatios[0] || '1:1';
  }

  /**
   * Get service statistics
   */
  getServiceStats() {
    return {
      serviceName: 'DesignGenerationService',
      version: '1.0.0',
      supportedModels: ['revo-1.0', 'revo-1.5', 'revo-2.0', 'imagen-4'],
      features: [
        'Single design generation',
        'Auto model selection',
        'Batch generation',
        'Model recommendation',
        'Aspect ratio optimization',
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
      const designCapableModels = availableModels.filter(
        model => model.model.capabilities.designGeneration
      );

      return {
        healthy: designCapableModels.length > 0,
        details: {
          totalModels: availableModels.length,
          designCapableModels: designCapableModels.length,
          availableModelIds: designCapableModels.map(m => m.model.id),
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
export const designGenerationService = DesignGenerationService.getInstance();
