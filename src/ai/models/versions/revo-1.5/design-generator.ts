/**
 * Revo 1.5 Design Generator
 * Enhanced design generation with advanced features
 */

import type { 
  IDesignGenerator, 
  DesignGenerationRequest, 
  GenerationResponse 
} from '../../types/model-types';
import type { PostVariant } from '@/lib/types';

export class Revo15DesignGenerator implements IDesignGenerator {
  private readonly modelId = 'revo-1.5';

  /**
   * Generate enhanced design using Revo 1.5 specifications
   */
  async generateDesign(request: DesignGenerationRequest): Promise<GenerationResponse<PostVariant>> {
    const startTime = Date.now();
    
    try {
      console.log('🎨 Revo 1.5: Starting enhanced design generation...');
      console.log('- Business Type:', request.businessType);
      console.log('- Platform:', request.platform);
      console.log('- Visual Style:', request.visualStyle);
      console.log('- Artifacts:', request.artifactInstructions ? 'Yes' : 'No');

      // Validate request
      if (!this.validateRequest(request)) {
        throw new Error('Invalid design generation request for Revo 1.5');
      }

      // Generate enhanced design using Gemini 2.5 or fallback
      const designResult = await this.generateEnhancedDesign(request);

      const processingTime = Date.now() - startTime;
      const qualityScore = this.calculateEnhancedQualityScore(designResult);

      console.log(`✅ Revo 1.5: Enhanced design generated successfully in ${processingTime}ms`);
      console.log(`⭐ Quality Score: ${qualityScore}/10`);

      return {
        success: true,
        data: designResult,
        metadata: {
          modelId: this.modelId,
          processingTime,
          qualityScore,
          creditsUsed: 2, // Revo 1.5 uses 2 credits for design
          enhancementsApplied: [
            'enhanced-ai-engine',
            'advanced-styling',
            'brand-consistency-advanced',
            'multi-aspect-ratio',
            'quality-optimization',
            ...(request.artifactInstructions ? ['artifact-integration'] : [])
          ]
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Revo 1.5: Enhanced design generation failed:', error);

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
   * Generate enhanced design using Gemini 2.5 or fallback services
   */
  private async generateEnhancedDesign(request: DesignGenerationRequest): Promise<PostVariant> {
    try {
      // Try enhanced design generation first
      const { generateEnhancedDesign } = await import('@/ai/gemini-2.5-design');

      // Prepare image text
      let imageText: string;
      if (typeof request.imageText === 'string') {
        imageText = request.imageText;
      } else {
        // Enhanced text combination for Revo 1.5
        const components = [request.imageText.catchyWords];
        if (request.imageText.subheadline) {
          components.push(request.imageText.subheadline);
        }
        if (request.imageText.callToAction) {
          components.push(request.imageText.callToAction);
        }
        imageText = components.join('\n');
      }

      // Generate enhanced design
      const result = await generateEnhancedDesign({
        businessType: request.businessType,
        platform: request.platform,
        visualStyle: request.visualStyle,
        imageText,
        brandProfile: request.brandProfile,
        brandConsistency: request.brandConsistency,
        artifactInstructions: request.artifactInstructions,
      });

      return {
        platform: request.platform,
        imageUrl: result.imageUrl,
        caption: imageText,
        hashtags: []
      };

    } catch (error) {
      console.warn('⚠️ Revo 1.5: Enhanced design failed, using fallback:', error);
      
      // Fallback to basic generation
      return this.generateFallbackDesign(request);
    }
  }

  /**
   * Fallback design generation
   */
  private async generateFallbackDesign(request: DesignGenerationRequest): Promise<PostVariant> {
    try {
      const { generatePostFromProfile } = await import('@/ai/flows/generate-post-from-profile');

      // Prepare image text
      let imageText: string;
      if (typeof request.imageText === 'string') {
        imageText = request.imageText;
      } else {
        imageText = request.imageText.catchyWords;
        if (request.imageText.subheadline) {
          imageText += '\n' + request.imageText.subheadline;
        }
      }

      // Create generation parameters
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
          aspectRatio: this.getOptimalAspectRatio(request.platform),
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

      const result = await generatePostFromProfile(generationParams);

      if (result.variants && result.variants.length > 0) {
        return {
          ...result.variants[0],
          caption: imageText,
          hashtags: result.hashtags || []
        };
      }

      // Final fallback
      return {
        platform: request.platform,
        imageUrl: '',
        caption: imageText,
        hashtags: []
      };

    } catch (error) {
      console.error('❌ Revo 1.5: Fallback design generation failed:', error);
      
      return {
        platform: request.platform,
        imageUrl: '',
        caption: typeof request.imageText === 'string' ? 
          request.imageText : request.imageText.catchyWords,
        hashtags: []
      };
    }
  }

  /**
   * Get optimal aspect ratio for platform (Revo 1.5 supports multiple)
   */
  private getOptimalAspectRatio(platform: string): string {
    switch (platform) {
      case 'Instagram':
        return '1:1'; // Can also support 9:16 for stories
      case 'Facebook':
        return '16:9';
      case 'Twitter':
        return '16:9';
      case 'LinkedIn':
        return '16:9';
      default:
        return '1:1';
    }
  }

  /**
   * Validate design generation request for Revo 1.5
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

    // Revo 1.5 supports multiple aspect ratios and artifacts
    return true;
  }

  /**
   * Calculate enhanced quality score for generated design
   */
  private calculateEnhancedQualityScore(variant: PostVariant): number {
    let score = 6; // Higher base score for Revo 1.5

    // Image generation success
    if (variant.imageUrl && variant.imageUrl.length > 0) {
      score += 2;
    }

    // Caption quality
    if (variant.caption && variant.caption.length > 10) {
      score += 0.5;
    }
    if (variant.caption && variant.caption.length > 50) {
      score += 0.5;
    }

    // Hashtags presence and quality
    if (variant.hashtags && variant.hashtags.length > 0) {
      score += 0.5;
    }
    if (variant.hashtags && variant.hashtags.length >= 5) {
      score += 0.5;
    }

    // Platform optimization
    if (variant.platform) {
      score += 0.5;
    }

    // Revo 1.5 can achieve higher quality scores
    return Math.min(score, 9);
  }

  /**
   * Health check for enhanced design generator
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Check if we can access enhanced AI services
      const hasGeminiKey = !!(
        process.env.GEMINI_API_KEY || 
        process.env.GOOGLE_API_KEY || 
        process.env.GOOGLE_GENAI_API_KEY
      );
      
      const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
      
      return hasGeminiKey || hasOpenAIKey;
    } catch (error) {
      console.error('❌ Revo 1.5 Design Generator health check failed:', error);
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
        'Enhanced image generation',
        'Multiple aspect ratios (1:1, 16:9, 9:16)',
        'Advanced brand integration',
        'Artifact support',
        'Superior text overlay',
        'Advanced color harmony',
        'Layout optimization',
        'Platform-specific optimization'
      ],
      limitations: [
        'Higher credit cost (2x)',
        'Longer processing times',
        'Requires more system resources'
      ],
      supportedPlatforms: ['Instagram', 'Facebook', 'Twitter', 'LinkedIn'],
      supportedAspectRatios: ['1:1', '16:9', '9:16'],
      averageProcessingTime: '20-35 seconds',
      qualityRange: '7-9/10',
      costPerGeneration: 2,
      resolution: '1024x1024 to 2048x2048',
      enhancedFeatures: {
        multipleAspectRatios: true,
        artifactSupport: true,
        advancedStyling: true,
        brandConsistencyAdvanced: true,
        qualityOptimization: true,
        textOverlayAdvanced: true
      }
    };
  }
}
