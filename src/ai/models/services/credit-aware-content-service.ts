/**
 * Credit-Aware Content Generation Service
 * 
 * This service wraps the existing content generation service with credit management.
 * It automatically checks credits, deducts them, and tracks usage for all generations.
 */

import { ContentGenerationService } from '@/ai/models/services/content-generation-service';
import type { 
  ContentGenerationRequest, 
  GenerationResponse,
  RevoModelId,
  ModelSelectionCriteria
} from '@/ai/models/types/model-types';
import type { GeneratedPost } from '@/lib/types';
import { 
  withCreditTracking, 
  deductCreditsForGeneration,
  hasEnoughCreditsForModel,
  recordFailedGeneration,
  ModelVersion,
  GenerationFeature,
  CreditUsageParams
} from '@/lib/credit-integration';

// Map Revo model IDs to credit system model versions
const MODEL_VERSION_MAP: Record<RevoModelId, ModelVersion> = {
  'revo-1.0': 'revo-1.0',
  'revo-1.5': 'revo-1.5', 
  'revo-2.0': 'revo-2.0'
};

export interface CreditAwareGenerationRequest extends ContentGenerationRequest {
  userId: string;
  feature?: GenerationFeature;
}

export interface CreditAwareGenerationResponse<T> extends GenerationResponse<T> {
  creditInfo?: {
    creditsDeducted: number;
    remainingCredits: number;
    modelVersion: ModelVersion;
  };
}

export class CreditAwareContentGenerationService {
  private static instance: CreditAwareContentGenerationService;
  private contentService: ContentGenerationService;

  private constructor() {
    this.contentService = ContentGenerationService.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CreditAwareContentGenerationService {
    if (!CreditAwareContentGenerationService.instance) {
      CreditAwareContentGenerationService.instance = new CreditAwareContentGenerationService();
    }
    return CreditAwareContentGenerationService.instance;
  }

  /**
   * Generate content with automatic credit management
   */
  async generateContent(request: CreditAwareGenerationRequest): Promise<CreditAwareGenerationResponse<GeneratedPost>> {
    const { userId, feature = 'social_media_content', ...generationRequest } = request;
    const modelVersion = MODEL_VERSION_MAP[request.modelId];

    if (!modelVersion) {
      return {
        success: false,
        error: `Invalid model ID: ${request.modelId}`,
        metadata: {
          modelId: request.modelId,
          processingTime: 0,
          qualityScore: 0,
          creditsUsed: 0,
          enhancementsApplied: []
        }
      };
    }

    // Check if user has enough credits
    const creditCheck = await hasEnoughCreditsForModel(userId, modelVersion);
    
    if (!creditCheck.hasCredits) {
      return {
        success: false,
        error: `Insufficient credits. Need ${creditCheck.requiredCredits} credits, but only have ${creditCheck.remainingCredits}.`,
        metadata: {
          modelId: request.modelId,
          processingTime: 0,
          qualityScore: 0,
          creditsUsed: 0,
          enhancementsApplied: []
        },
        creditInfo: {
          creditsDeducted: 0,
          remainingCredits: creditCheck.remainingCredits,
          modelVersion
        }
      };
    }

    // Use the credit tracking wrapper
    const result = await withCreditTracking(
      {
        userId,
        modelVersion,
        feature,
        generationType: request.contentType || 'social_media',
        metadata: {
          modelId: request.modelId,
          prompt: request.prompt,
          platform: request.platform,
          tone: request.tone
        }
      },
      async () => {
        return await this.contentService.generateContent(generationRequest);
      }
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Generation failed',
        metadata: {
          modelId: request.modelId,
          processingTime: 0,
          qualityScore: 0,
          creditsUsed: 0,
          enhancementsApplied: []
        },
        creditInfo: result.creditInfo ? {
          creditsDeducted: result.creditInfo.costDeducted || 0,
          remainingCredits: result.creditInfo.remainingCredits || 0,
          modelVersion
        } : undefined
      };
    }

    const generationResult = result.result!;
    
    return {
      ...generationResult,
      creditInfo: result.creditInfo ? {
        creditsDeducted: result.creditInfo.costDeducted || 0,
        remainingCredits: result.creditInfo.remainingCredits || 0,
        modelVersion
      } : undefined
    };
  }

  /**
   * Generate content with auto-selection and credit management
   */
  async generateContentWithAutoSelection(
    request: Omit<CreditAwareGenerationRequest, 'modelId'>,
    criteria?: ModelSelectionCriteria
  ): Promise<CreditAwareGenerationResponse<GeneratedPost>> {
    try {
      // Get recommended model first
      const recommendedModel = await this.contentService.getRecommendedModel(request, criteria);
      
      if (!recommendedModel) {
        return {
          success: false,
          error: 'No suitable model found for content generation',
          metadata: {
            modelId: 'auto-selection-failed' as RevoModelId,
            processingTime: 0,
            qualityScore: 0,
            creditsUsed: 0,
            enhancementsApplied: []
          }
        };
      }

      // Generate content with the recommended model
      return await this.generateContent({
        ...request,
        modelId: recommendedModel
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
   * Batch generation with credit management
   */
  async batchGenerateContent(
    requests: CreditAwareGenerationRequest[]
  ): Promise<CreditAwareGenerationResponse<GeneratedPost>[]> {
    // Process each request sequentially to ensure proper credit management
    const results: CreditAwareGenerationResponse<GeneratedPost>[] = [];
    
    for (const request of requests) {
      const result = await this.generateContent(request);
      results.push(result);
      
      // If any generation fails due to insufficient credits, stop the batch
      if (!result.success && result.error?.includes('Insufficient credits')) {
        // Fill remaining results with credit error
        for (let i = results.length; i < requests.length; i++) {
          results.push({
            success: false,
            error: 'Batch stopped due to insufficient credits in previous generation',
            metadata: {
              modelId: requests[i].modelId,
              processingTime: 0,
              qualityScore: 0,
              creditsUsed: 0,
              enhancementsApplied: []
            }
          });
        }
        break;
      }
    }
    
    return results;
  }

  /**
   * Check if user can afford a specific generation
   */
  async canAffordGeneration(
    userId: string, 
    modelId: RevoModelId
  ): Promise<{ canAfford: boolean; requiredCredits: number; availableCredits: number }> {
    const modelVersion = MODEL_VERSION_MAP[modelId];
    
    if (!modelVersion) {
      return { canAfford: false, requiredCredits: 0, availableCredits: 0 };
    }

    const creditCheck = await hasEnoughCreditsForModel(userId, modelVersion);
    
    return {
      canAfford: creditCheck.hasCredits,
      requiredCredits: creditCheck.requiredCredits,
      availableCredits: creditCheck.remainingCredits
    };
  }

  /**
   * Get cost estimate for a generation
   */
  getGenerationCost(modelId: RevoModelId): number {
    const modelVersion = MODEL_VERSION_MAP[modelId];
    if (!modelVersion) return 0;
    
    const costs = {
      'revo-1.0': 2,
      'revo-1.5': 3,
      'revo-2.0': 4
    };
    
    return costs[modelVersion];
  }

  /**
   * Get recommended model based on user's credit balance
   */
  async getRecommendedModelWithinBudget(
    userId: string,
    maxCredits?: number
  ): Promise<{ modelId: RevoModelId; cost: number } | null> {
    const models: { id: RevoModelId; cost: number }[] = [
      { id: 'revo-1.0', cost: 2 },
      { id: 'revo-1.5', cost: 3 },
      { id: 'revo-2.0', cost: 4 }
    ];

    // Check user's available credits
    const creditCheck = await hasEnoughCreditsForModel(userId, 'revo-1.0'); // Get balance
    const availableCredits = creditCheck.remainingCredits;
    const budget = maxCredits || availableCredits;

    // Find the best model within budget (highest quality that fits)
    for (const model of models.reverse()) { // Start with highest quality
      if (model.cost <= budget) {
        const canAfford = await this.canAffordGeneration(userId, model.id);
        if (canAfford.canAfford) {
          return model;
        }
      }
    }

    return null;
  }
}

// Export singleton instance
export const creditAwareContentService = CreditAwareContentGenerationService.getInstance();