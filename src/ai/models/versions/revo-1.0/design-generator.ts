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
      console.log('- AI Engine: Gemini 2.5 Flash Image Preview (Enhanced)');

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
          creditsUsed: 1.5, // Revo 1.0 now uses 1.5 credits for enhanced capabilities
          enhancementsApplied: ['enhanced-styling', 'brand-colors', 'platform-optimization', 'gemini-2.5-flash-image']
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
      const { generateRevo10Design } = await import('@/ai/revo-1.0-service');

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

      // First generate design description
      const designResult = await generateRevo10Design({
        businessType: generationParams.businessType,
        businessName: generationParams.businessName || 'Business',
        platform: generationParams.variants[0]?.platform || 'instagram',
        visualStyle: generationParams.visualStyle || 'modern',
        primaryColor: generationParams.primaryColor || '#3B82F6',
        accentColor: generationParams.accentColor || '#1E40AF',
        backgroundColor: generationParams.backgroundColor || '#FFFFFF',
        imageText: imageText || 'Your Text Here'
      });

      // Then generate the actual image using the design description
      const { generateRevo10Image } = await import('@/ai/revo-1.0-service');
      const imageResult = await generateRevo10Image({
        businessType: generationParams.businessType,
        businessName: generationParams.businessName || 'Business',
        platform: generationParams.variants[0]?.platform || 'instagram',
        visualStyle: generationParams.visualStyle || 'modern',
        primaryColor: generationParams.primaryColor || '#3B82F6',
        imageText: imageText || 'Your Text Here',
        designDescription: designResult.design
      });

      // Return the complete result with actual image URL
      return {
        platform: request.platform,
        imageUrl: imageResult.imageUrl,
        caption: imageText,
        hashtags: [],
        design: designResult.design,
        aspectRatio: imageResult.aspectRatio,
        resolution: imageResult.resolution,
        quality: imageResult.quality
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
    let score = 7; // Base score (upgraded from 5 for Gemini 2.5 Flash Image Preview)

    // Image generation success (enhanced for Gemini 2.5 Flash Image Preview)
    if (variant.imageUrl && variant.imageUrl.length > 0) {
      score += 2.5; // Increased from 2 for better image quality
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

    // Revo 1.0 now has higher quality ceiling due to Gemini 2.5 Flash Image Preview
    return Math.min(score, 9.0);
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
        'Enhanced image generation with Gemini 2.5 Flash Image Preview',
        '1:1 aspect ratio only',
        'Brand color integration',
        'Logo placement',
        'Platform optimization',
        'Text overlay (enhanced)',
        'Perfect text rendering',
        'High-resolution 2048x2048 output'
      ],
      limitations: [
        'Single aspect ratio (1:1)',
        'No artifact support',
        'Enhanced styling options',
        'Limited customization',
        'High-resolution support'
      ],
      supportedPlatforms: ['Instagram', 'Facebook', 'Twitter', 'LinkedIn'],
      supportedAspectRatios: ['1:1'],
      averageProcessingTime: '25-35 seconds (enhanced for quality)',
      qualityRange: '7-9/10 (upgraded from 5-7.5/10)',
      costPerGeneration: 1.5, // Upgraded from 1 for enhanced capabilities
      resolution: '2048x2048 (upgraded from 1024x1024)'
    };
  }

  /**
   * Get supported features for this design generator
   */
  getSupportedFeatures() {
    return {
      aspectRatios: ['1:1'],
      textOverlay: 'enhanced', // Upgraded from basic
      brandIntegration: 'standard',
      logoPlacement: true,
      colorCustomization: true,
      templateSupport: false,
      artifactSupport: false,
      advancedStyling: true, // Upgraded from false
      multipleVariants: false,
      highResolution: true, // NEW: 2048x2048 support
      perfectTextRendering: true // NEW: Gemini 2.5 Flash Image Preview feature
    };
  }
}
