/**
 * Revo 1.5 Model Implementation
 * Enhanced Model - Advanced Features
 */

import type {
  IModelImplementation,
  IContentGenerator,
  IDesignGenerator,
  ContentGenerationRequest,
  DesignGenerationRequest,
  GenerationResponse
} from '../../types/model-types';
import { getModelConfig } from '../../config/model-configs';
import { Revo15ContentGenerator } from './content-generator';
import { Revo15DesignGenerator } from './design-generator';

export class Revo15Implementation implements IModelImplementation {
  public readonly model = getModelConfig('revo-1.5');
  public readonly contentGenerator: IContentGenerator;
  public readonly designGenerator: IDesignGenerator;

  constructor() {
    this.contentGenerator = new Revo15ContentGenerator();
    this.designGenerator = new Revo15DesignGenerator();
  }

  /**
   * Check if the model is available and ready to use
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Check if Gemini 2.5 (preferred) or fallback services are available
      const hasGeminiKey = !!(
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        process.env.GOOGLE_GENAI_API_KEY
      );

      const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

      // Revo 1.5 needs at least one advanced AI service
      return hasGeminiKey || hasOpenAIKey;
    } catch (error) {
      console.error('❌ Revo 1.5 availability check failed:', error);
      return false;
    }
  }

  /**
   * Validate a generation request for this model
   */
  validateRequest(request: ContentGenerationRequest | DesignGenerationRequest): boolean {
    try {
      // Basic validation
      if (!request || !request.modelId) {
        return false;
      }

      // Check if this is the correct model
      if (request.modelId !== 'revo-1.5') {
        return false;
      }

      // Content generation validation
      if ('profile' in request) {
        const contentRequest = request as ContentGenerationRequest;
        return !!(
          contentRequest.profile &&
          contentRequest.platform &&
          contentRequest.profile.businessType
        );
      }

      // Design generation validation
      if ('businessType' in request) {
        const designRequest = request as DesignGenerationRequest;
        return !!(
          designRequest.businessType &&
          designRequest.platform &&
          designRequest.visualStyle &&
          designRequest.brandProfile
        );
      }

      return false;
    } catch (error) {
      console.error('❌ Revo 1.5 request validation failed:', error);
      return false;
    }
  }

  /**
   * Get model-specific information
   */
  getModelInfo() {
    return {
      id: this.model.id,
      name: this.model.name,
      version: this.model.version,
      description: this.model.description,
      status: this.model.status,
      capabilities: this.model.capabilities,
      pricing: this.model.pricing,
      features: this.model.features,
      strengths: [
        'Advanced AI engine with superior capabilities',
        'Enhanced content generation algorithms',
        'Superior quality control and consistency',
        'Professional design generation',
        'Improved brand integration',
        'Real-time context and trending topics',
        'Full artifact support',
        'Multiple aspect ratios'
      ],
      limitations: [
        'Higher credit cost than Revo 1.0',
        'Longer processing times',
        'No video generation (coming in 2.0)',
        'Requires more system resources'
      ],
      bestUseCases: [
        'Growing businesses',
        'Marketing agencies',
        'Content creators',
        'Professional brands',
        'Users wanting enhanced quality',
        'Artifact-based workflows',
        'Multi-platform campaigns'
      ]
    };
  }

  /**
   * Get performance metrics for this model
   */
  async getPerformanceMetrics() {
    return {
      modelId: this.model.id,
      averageProcessingTime: 25000, // 25 seconds
      successRate: 0.92, // 92% success rate
      averageQualityScore: 8.1,
      costEfficiency: 'medium',
      reliability: 'very good',
      userSatisfaction: 4.4, // out of 5
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Health check for this specific model
   */
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const isAvailable = await this.isAvailable();
      const contentGeneratorHealthy = await this.contentGenerator.healthCheck?.() ?? true;
      const designGeneratorHealthy = await this.designGenerator.healthCheck?.() ?? true;

      const healthy = isAvailable && contentGeneratorHealthy && designGeneratorHealthy;

      return {
        healthy,
        details: {
          modelAvailable: isAvailable,
          contentGenerator: contentGeneratorHealthy,
          designGenerator: designGeneratorHealthy,
          enhancedFeaturesEnabled: true,
          artifactSupportEnabled: true,
          realTimeContextEnabled: true,
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

  /**
   * Get enhanced features specific to Revo 1.5
   */
  getEnhancedFeatures() {
    return {
      artifactSupport: {
        enabled: true,
        supportedTypes: ['image', 'text', 'reference'],
        maxArtifacts: 5,
        features: ['exact-use', 'reference', 'text-overlay']
      },
      realTimeContext: {
        enabled: true,
        features: ['weather', 'events', 'trending-topics', 'local-optimization']
      },
      advancedDesign: {
        enabled: true,
        aspectRatios: ['1:1', '16:9', '9:16'],
        qualityEnhancements: ['color-harmony', 'layout-optimization', 'brand-consistency'],
        textOverlay: 'advanced'
      },
      contentEnhancements: {
        enabled: true,
        features: ['content-variants', 'hashtag-analysis', 'market-intelligence'],
        qualityLevel: 'enhanced'
      }
    };
  }
}

// Export generators for direct use if needed
export { Revo15ContentGenerator } from './content-generator';
export { Revo15DesignGenerator } from './design-generator';
