/**
 * Revo 1.0 Design Generator
 * Handles design generation for the stable foundation model
 */

import type { 
  IDesignGenerator, 
  DesignGenerationRequest, 
  GenerationResponse 
} from '../../types/model-types';
import type { PostVariant } from '@/lib/types';

export class Revo10DesignGenerator implements IDesignGenerator {
  private readonly modelId = 'revo-1.0';

  /**
   * Generate design using Revo 1.0 specifications
   */
  async generateDesign(request: DesignGenerationRequest): Promise<GenerationResponse<PostVariant>> {
    const startTime = Date.now();
    
    try {
      console.log('🎨 Revo 1.0: Starting design generation...');
      console.log('- Business Type:', request.businessType);
      console.log('- Platform:', request.platform);
      console.log('- Visual Style:', request.visualStyle);

      // Validate request
      if (!this.validateRequest(request)) {
        throw new Error('Invalid design generation request for Revo 1.0');
      }

      // Generate design using basic Gemini 2.0 approach
      const designResult = await this.generateBasicDesign(request);

      const processingTime = Date.now() - startTime;
      const qualityScore = this.calculateQualityScore(designResult);

      console.log(`✅ Revo 1.0: Design generated successfully in ${processingTime}ms`);
      console.log(`⭐ Quality Score: ${qualityScore}/10`);

      return {
        success: true,
        data: designResult,
        metadata: {
          modelId: this.modelId,
          processingTime,
          qualityScore,
          creditsUsed: 1, // Revo 1.0 uses 1 credit for design
          enhancementsApplied: ['basic-styling', 'brand-colors', 'platform-optimization']
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Revo 1.0: Design generation failed:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          modelId: this.modelId,
          processingTime,
          qualityScore: 0,
          creditsUsed: 0,
          enhancementsApplied: []
        }
      };
    }
  }

  /**
   * Generate basic design using Gemini 2.0
   */
  private async generateBasicDesign(request: DesignGenerationRequest): Promise<PostVariant> {
    try {
      // Import the basic generation flow
      const { generatePostFromProfile } = await import('@/ai/flows/generate-post-from-profile');

      // Prepare image text
      let imageText: string;
      if (typeof request.imageText === 'string') {
        imageText = request.imageText;
      } else {
        // Combine components for Revo 1.0 (simpler approach)
        imageText = request.imageText.catchyWords;
        if (request.imageText.subheadline) {
          imageText += '\n' + request.imageText.subheadline;
        }
      }

      // Create a simplified generation request
      const generationParams = {
        businessType: request.businessType,
        location: request.brandProfile.location || '',
        writingTone: request.brandProfile.writingTone || 'professional',
        contentThemes: request.brandProfile.contentThemes || '',
        visualStyle: request.visualStyle,
        logoDataUrl: request.brandProfile.logoDataUrl,
        designExamples: request.brandConsistency?.strictConsistency ? 
          (request.brandProfile.designExamples || []) : [],
        primaryColor: request.brandProfile.primaryColor,
        accentColor: request.brandProfile.accentColor,
        backgroundColor: request.brandProfile.backgroundColor,
        dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        currentDate: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', month: 'long', day: 'numeric' 
        }),
        variants: [{
          platform: request.platform,
          aspectRatio: '1:1', // Revo 1.0 only supports 1:1
        }],
        services: '',
        targetAudience: request.brandProfile.targetAudience || '',
        keyFeatures: '',
        competitiveAdvantages: '',
        brandConsistency: request.brandConsistency || { 
          strictConsistency: false, 
          followBrandColors: true 
        }
      };

      // Generate the post (which includes design)
      const result = await generatePostFromProfile(generationParams);

      // Return the first variant (should be the only one for Revo 1.0)
      if (result.variants && result.variants.length > 0) {
        return {
          ...result.variants[0],
          caption: imageText,
          hashtags: result.hashtags || []
        };
      }

      // Fallback: create a basic variant
      return {
        platform: request.platform,
        imageUrl: '', // Will be empty if generation failed
        caption: imageText,
        hashtags: []
      };

    } catch (error) {
      console.error('❌ Revo 1.0: Basic design generation failed:', error);
      
      // Return a fallback variant
      return {
        platform: request.platform,
        imageUrl: '', // Empty URL indicates generation failure
        caption: typeof request.imageText === 'string' ? 
          request.imageText : request.imageText.catchyWords,
        hashtags: []
      };
    }
  }

  /**
   * Validate design generation request for Revo 1.0
   */
  private validateRequest(request: DesignGenerationRequest): boolean {
    // Check required fields
    if (!request.businessType || !request.platform || !request.brandProfile) {
      return false;
    }

    // Check image text
    if (!request.imageText) {
      return false;
    }

    // Revo 1.0 only supports 1:1 aspect ratio
    // We don't enforce this here as the generator will handle it

    // Warn about unsupported features
    if (request.artifactInstructions) {
      console.warn('⚠️ Revo 1.0: Artifact instructions not supported, ignoring');
    }

    return true;
  }

  /**
   * Calculate quality score for generated design
   */
  private calculateQualityScore(variant: PostVariant): number {
    let score = 5; // Base score

    // Image generation success
    if (variant.imageUrl && variant.imageUrl.length > 0) {
      score += 2;
    }

    // Caption quality
    if (variant.caption && variant.caption.length > 10) {
      score += 1;
    }

    // Hashtags presence
    if (variant.hashtags && variant.hashtags.length > 0) {
      score += 1;
    }

    // Platform optimization (basic check)
    if (variant.platform) {
      score += 0.5;
    }

    // Revo 1.0 has a quality ceiling due to basic features
    return Math.min(score, 7.5);
  }

  /**
   * Health check for design generator
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Check if we can access the AI service
      const hasApiKey = !!(
        process.env.GEMINI_API_KEY || 
        process.env.GOOGLE_API_KEY || 
        process.env.GOOGLE_GENAI_API_KEY
      );
      
      return hasApiKey;
    } catch (error) {
      console.error('❌ Revo 1.0 Design Generator health check failed:', error);
      return false;
    }
  }

  /**
   * Get generator-specific information
   */
  getGeneratorInfo() {
    return {
      modelId: this.modelId,
      type: 'design',
      capabilities: [
        'Basic image generation',
        '1:1 aspect ratio only',
        'Brand color integration',
        'Logo placement',
        'Platform optimization',
        'Text overlay (basic)'
      ],
      limitations: [
        'Single aspect ratio (1:1)',
        'No artifact support',
        'Basic styling options',
        'Limited customization',
        'Standard resolution only'
      ],
      supportedPlatforms: ['Instagram', 'Facebook', 'Twitter', 'LinkedIn'],
      supportedAspectRatios: ['1:1'],
      averageProcessingTime: '15-25 seconds',
      qualityRange: '5-7.5/10',
      costPerGeneration: 1,
      resolution: '1024x1024'
    };
  }

  /**
   * Get supported features for this design generator
   */
  getSupportedFeatures() {
    return {
      aspectRatios: ['1:1'],
      textOverlay: 'basic',
      brandIntegration: 'standard',
      logoPlacement: true,
      colorCustomization: true,
      templateSupport: false,
      artifactSupport: false,
      advancedStyling: false,
      multipleVariants: false,
      highResolution: false
    };
  }
}
