/**
 * Revo 1.0 Content Generator
 * Handles content generation for the stable foundation model
 */

import type {
  IContentGenerator,
  ContentGenerationRequest,
  GenerationResponse
} from '../../types/model-types';
import type { GeneratedPost } from '@/lib/types';
import { generatePostFromProfile } from '@/ai/flows/generate-post-from-profile';

export class Revo10ContentGenerator implements IContentGenerator {
  private readonly modelId = 'revo-1.0';

  /**
   * Generate content using Revo 1.0 specifications
   */
  async generateContent(request: ContentGenerationRequest): Promise<GenerationResponse<GeneratedPost>> {
    const startTime = Date.now();

    try {
      console.log('📝 Revo 1.0: Starting content generation...');
      console.log('- Platform:', request.platform);
      console.log('- Business:', request.profile.businessName);

      // Validate request
      if (!this.validateRequest(request)) {
        throw new Error('Invalid content generation request for Revo 1.0');
      }

      // Prepare generation parameters for Revo 1.0
      const generationParams = this.prepareGenerationParams(request);

      // Generate content using the existing flow but with Revo 1.0 constraints
      const postDetails = await generatePostFromProfile(generationParams);

      // Create the generated post
      const generatedPost: GeneratedPost = {
        id: new Date().toISOString(),
        date: new Date().toISOString(),
        content: postDetails.content,
        hashtags: postDetails.hashtags,
        status: 'generated',
        variants: postDetails.variants,
        catchyWords: postDetails.catchyWords,
        subheadline: postDetails.subheadline,
        callToAction: postDetails.callToAction,
        // Revo 1.0 doesn't include advanced features
        contentVariants: undefined,
        hashtagAnalysis: undefined,
        marketIntelligence: undefined,
        localContext: undefined,
        metadata: {
          modelId: this.modelId,
          modelVersion: '1.0.0',
          generationType: 'standard',
          processingTime: Date.now() - startTime,
          qualityLevel: 'standard'
        }
      };

      const processingTime = Date.now() - startTime;
      const qualityScore = this.calculateQualityScore(generatedPost);

      console.log(`✅ Revo 1.0: Content generated successfully in ${processingTime}ms`);
      console.log(`⭐ Quality Score: ${qualityScore}/10`);

      return {
        success: true,
        data: generatedPost,
        metadata: {
          modelId: this.modelId,
          processingTime,
          qualityScore,
          creditsUsed: 1, // Revo 1.0 uses 1 credit
          enhancementsApplied: ['basic-optimization', 'platform-formatting']
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Revo 1.0: Content generation failed:', error);

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
   * Validate content generation request for Revo 1.0
   */
  private validateRequest(request: ContentGenerationRequest): boolean {
    // Check required fields
    if (!request.profile || !request.platform) {
      return false;
    }

    // Check if profile has minimum required information
    if (!request.profile.businessType || !request.profile.businessName) {
      return false;
    }

    // Revo 1.0 doesn't support artifacts
    if (request.artifactIds && request.artifactIds.length > 0) {
      console.warn('⚠️ Revo 1.0: Artifacts not supported, ignoring artifact IDs');
    }

    return true;
  }

  /**
   * Prepare generation parameters optimized for Revo 1.0
   */
  private prepareGenerationParams(request: ContentGenerationRequest) {
    const { profile, platform, brandConsistency } = request;
    const today = new Date();

    // Convert arrays to strings for AI processing
    const keyFeaturesString = Array.isArray(profile.keyFeatures)
      ? profile.keyFeatures.join('\n')
      : profile.keyFeatures || '';

    const competitiveAdvantagesString = Array.isArray(profile.competitiveAdvantages)
      ? profile.competitiveAdvantages.join('\n')
      : profile.competitiveAdvantages || '';

    const servicesString = Array.isArray(profile.services)
      ? profile.services.map(service =>
        typeof service === 'object' && service.name
          ? `${service.name}: ${service.description || ''}`
          : service
      ).join('\n')
      : profile.services || '';

    return {
      businessType: profile.businessType,
      location: profile.location,
      writingTone: profile.writingTone,
      contentThemes: profile.contentThemes,
      visualStyle: profile.visualStyle,
      logoDataUrl: profile.logoDataUrl,
      designExamples: brandConsistency?.strictConsistency ? (profile.designExamples || []) : [],
      primaryColor: profile.primaryColor,
      accentColor: profile.accentColor,
      backgroundColor: profile.backgroundColor,
      dayOfWeek: today.toLocaleDateString('en-US', { weekday: 'long' }),
      currentDate: today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      variants: [{
        platform: platform,
        aspectRatio: '1:1', // Revo 1.0 only supports 1:1
      }],
      services: servicesString,
      targetAudience: profile.targetAudience,
      keyFeatures: keyFeaturesString,
      competitiveAdvantages: competitiveAdvantagesString,
      brandConsistency: brandConsistency || { strictConsistency: false, followBrandColors: true },
      // Revo 1.0 specific constraints (updated to match config)
      modelConstraints: {
        maxComplexity: 'enhanced', // Upgraded from basic
        enhancedFeatures: true,    // Now enabled
        realTimeContext: true,     // Now enabled
        trendingTopics: true,      // Now enabled
        artifactSupport: false     // Keep disabled for Revo 1.0
      }
    };
  }

  /**
   * Calculate quality score for generated content
   */
  private calculateQualityScore(post: GeneratedPost): number {
    let score = 5; // Base score

    // Content quality checks
    if (post.content && post.content.length > 50) score += 1;
    if (post.content && post.content.length > 100) score += 0.5;

    // Hashtag quality
    if (post.hashtags && post.hashtags.length >= 5) score += 1;
    if (post.hashtags && post.hashtags.length >= 10) score += 0.5;

    // Catchy words presence
    if (post.catchyWords && post.catchyWords.trim().length > 0) score += 1;

    // Image generation success
    if (post.variants && post.variants.length > 0 && post.variants[0].imageUrl) {
      score += 1;
    }

    // Cap at 10
    return Math.min(score, 10);
  }

  /**
   * Health check for content generator
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
      console.error('❌ Revo 1.0 Content Generator health check failed:', error);
      return false;
    }
  }

  /**
   * Get generator-specific information
   */
  getGeneratorInfo() {
    return {
      modelId: this.modelId,
      type: 'content',
      capabilities: [
        'Basic content generation',
        'Platform-specific formatting',
        'Hashtag generation',
        'Catchy words creation',
        'Brand consistency (basic)'
      ],
      limitations: [
        'No real-time context',
        'No trending topics',
        'No artifact support',
        'Basic quality optimization',
        'Limited customization'
      ],
      averageProcessingTime: '10-20 seconds',
      qualityRange: '6-8/10',
      costPerGeneration: 1
    };
  }
}
