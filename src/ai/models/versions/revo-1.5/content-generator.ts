/**
 * Revo 1.5 Content Generator
 * Enhanced content generation with advanced features
 */

import type {
  IContentGenerator,
  ContentGenerationRequest,
  GenerationResponse
} from '../../types/model-types';
import type { GeneratedPost } from '@/lib/types';
import { generatePostFromProfile } from '@/ai/flows/generate-post-from-profile';

export class Revo15ContentGenerator implements IContentGenerator {
  private readonly modelId = 'revo-1.5';

  /**
   * Generate enhanced content using Revo 1.5 specifications
   */
  async generateContent(request: ContentGenerationRequest): Promise<GenerationResponse<GeneratedPost>> {
    const startTime = Date.now();

    try {

      // Validate request
      if (!this.validateRequest(request)) {
        throw new Error('Invalid content generation request for Revo 1.5');
      }

      // Prepare enhanced generation parameters
      const generationParams = this.prepareEnhancedGenerationParams(request);

      // Generate content with enhanced features
      const postDetails = await generatePostFromProfile(generationParams);

      // Create the enhanced generated post
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
        // Enhanced features for Revo 1.5
        contentVariants: postDetails.contentVariants,
        hashtagAnalysis: postDetails.hashtagAnalysis,
        marketIntelligence: postDetails.marketIntelligence,
        localContext: postDetails.localContext,
        metadata: {
          modelId: this.modelId,
          modelVersion: '1.5.0',
          generationType: 'enhanced',
          processingTime: Date.now() - startTime,
          qualityLevel: 'enhanced',
          enhancedFeatures: this.getAppliedEnhancements(request),
          artifactsUsed: request.artifactIds?.length || 0
        }
      };

      const processingTime = Date.now() - startTime;
      const qualityScore = this.calculateEnhancedQualityScore(generatedPost);


      return {
        success: true,
        data: generatedPost,
        metadata: {
          modelId: this.modelId,
          processingTime,
          qualityScore,
          creditsUsed: 2, // Revo 1.5 uses 2 credits
          enhancementsApplied: [
            'enhanced-ai-engine',
            'real-time-context',
            'trending-topics',
            'advanced-prompting',
            'quality-optimization',
            ...(request.artifactIds?.length ? ['artifact-integration'] : [])
          ]
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;

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
   * Validate content generation request for Revo 1.5
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

    // Revo 1.5 supports artifacts - validate if provided
    if (request.artifactIds && request.artifactIds.length > 5) {
    }

    return true;
  }

  /**
   * Prepare enhanced generation parameters for Revo 1.5
   */
  private prepareEnhancedGenerationParams(request: ContentGenerationRequest) {
    const { profile, platform, brandConsistency } = request;
    const today = new Date();

    // Enhanced parameter preparation with more sophisticated processing
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
        aspectRatio: this.getOptimalAspectRatio(platform),
      }],
      services: servicesString,
      targetAudience: profile.targetAudience,
      keyFeatures: keyFeaturesString,
      competitiveAdvantages: competitiveAdvantagesString,
      brandConsistency: brandConsistency || { strictConsistency: false, followBrandColors: true },
      // Revo 1.5 enhanced features
      modelConstraints: {
        maxComplexity: 'enhanced',
        enhancedFeatures: true,
        realTimeContext: true,
        trendingTopics: true,
        artifactSupport: true,
        advancedPrompting: true,
        qualityLevel: 'enhanced'
      },
      // Artifact integration
      artifactIds: request.artifactIds?.slice(0, 5) || [], // Limit to 5 artifacts
      customInstructions: request.customInstructions
    };
  }

  /**
   * Get optimal aspect ratio for platform - ALL PLATFORMS USE 1:1 FOR HIGHEST QUALITY
   */
  private getOptimalAspectRatio(platform: string): string {
    // ALL PLATFORMS USE 1:1 SQUARE FOR MAXIMUM QUALITY
    // No cropping = No quality loss from Gemini's native 1024x1024
    return '1:1';
  }

  /**
   * Calculate enhanced quality score for generated content
   */
  private calculateEnhancedQualityScore(post: GeneratedPost): number {
    let score = 6; // Higher base score for Revo 1.5

    // Content quality checks
    if (post.content && post.content.length > 50) score += 0.5;
    if (post.content && post.content.length > 150) score += 0.5;

    // Enhanced content features
    if (post.subheadline && post.subheadline.trim().length > 0) score += 0.5;
    if (post.callToAction && post.callToAction.trim().length > 0) score += 0.5;

    // Hashtag quality and analysis
    if (post.hashtags && post.hashtags.length >= 8) score += 0.5;
    if (post.hashtagAnalysis) score += 0.5;

    // Advanced features
    if (post.contentVariants && post.contentVariants.length > 0) score += 0.5;
    if (post.marketIntelligence) score += 0.5;
    if (post.localContext) score += 0.5;

    // Image generation success
    if (post.variants && post.variants.length > 0 && post.variants[0].imageUrl) {
      score += 0.5;
    }

    // Cap at 10
    return Math.min(score, 10);
  }

  /**
   * Get applied enhancements for this generation
   */
  private getAppliedEnhancements(request: ContentGenerationRequest): string[] {
    const enhancements = ['enhanced-ai-engine', 'advanced-prompting'];

    if (request.artifactIds && request.artifactIds.length > 0) {
      enhancements.push('artifact-integration');
    }

    if (request.profile.location) {
      enhancements.push('local-context', 'real-time-context');
    }

    enhancements.push('trending-topics', 'quality-optimization', 'brand-consistency-advanced');

    return enhancements;
  }

  /**
   * Health check for enhanced content generator
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
        'Enhanced content generation',
        'Real-time context integration',
        'Trending topics analysis',
        'Advanced brand consistency',
        'Artifact support (up to 5)',
        'Content variants generation',
        'Hashtag analysis',
        'Market intelligence',
        'Local context optimization'
      ],
      limitations: [
        'Higher credit cost (2x)',
        'Longer processing times',
        'Requires more system resources'
      ],
      averageProcessingTime: '20-30 seconds',
      qualityRange: '7-9/10',
      costPerGeneration: 2,
      enhancedFeatures: this.getEnhancedFeaturesList()
    };
  }

  private getEnhancedFeaturesList() {
    return {
      realTimeContext: true,
      trendingTopics: true,
      artifactSupport: true,
      contentVariants: true,
      hashtagAnalysis: true,
      marketIntelligence: true,
      localOptimization: true,
      advancedPrompting: true,
      qualityOptimization: true
    };
  }
}
