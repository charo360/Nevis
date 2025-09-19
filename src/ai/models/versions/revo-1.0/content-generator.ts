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
import { generateRevo10Content } from '@/ai/revo-1.0-service';

export class Revo10ContentGenerator implements IContentGenerator {
  private readonly modelId = 'revo-1.0';

  /**
   * Generate content using Revo 1.0 specifications
   */
  async generateContent(request: ContentGenerationRequest): Promise<GenerationResponse<GeneratedPost>> {
    const startTime = Date.now();

    try {

      // Validate request
      if (!this.validateRequest(request)) {
        throw new Error('Invalid content generation request for Revo 1.0');
      }

      // Prepare generation parameters for Revo 1.0
      const generationParams = this.prepareGenerationParams(request);

      // Generate content using Revo 1.0 service with Gemini 2.5 Flash Image Preview
      const postDetails = await generateRevo10Content({
        businessType: generationParams.businessType,
        businessName: generationParams.businessName || 'Business',
        location: generationParams.location || '',
        platform: generationParams.variants[0]?.platform || 'instagram',
        writingTone: generationParams.writingTone || 'professional',
        contentThemes: generationParams.contentThemes || [],
        targetAudience: generationParams.targetAudience || 'General',
        services: generationParams.services || '',
        keyFeatures: generationParams.keyFeatures || '',
        competitiveAdvantages: generationParams.competitiveAdvantages || '',
        dayOfWeek: generationParams.dayOfWeek || 'Monday',
        currentDate: generationParams.currentDate || new Date().toLocaleDateString(),
        primaryColor: generationParams.primaryColor,
        visualStyle: generationParams.visualStyle
      });

      // Generate image using the catchy words and brand profile data

      const { generateRevo10Image } = await import('@/ai/revo-1.0-service');
      // Prepare structured text for image
      const imageTextComponents = [];
      if (postDetails.catchyWords) imageTextComponents.push(postDetails.catchyWords);
      if (postDetails.subheadline) imageTextComponents.push(postDetails.subheadline);
      if (postDetails.callToAction) imageTextComponents.push(postDetails.callToAction);

      const structuredImageText = imageTextComponents.join(' | ');

      // Get real-time context for enhanced design
      const realTimeContext = (postDetails as any).realTimeContext || null;

      const imageResult = await generateRevo10Image({
        businessType: generationParams.businessType,
        businessName: generationParams.businessName || 'Business',
        platform: generationParams.variants[0]?.platform || 'instagram',
        visualStyle: generationParams.visualStyle || 'modern',
        primaryColor: generationParams.primaryColor || '#3B82F6',
        accentColor: generationParams.accentColor || '#1E40AF',
        backgroundColor: generationParams.backgroundColor || '#FFFFFF',
        imageText: structuredImageText,
        designDescription: `Professional ${generationParams.businessType} content with structured headline, subheadline, and CTA for ${generationParams.variants[0]?.platform || 'instagram'}`,
        logoDataUrl: generationParams.logoDataUrl,
        logoUrl: (generationParams as any).logoUrl, // Pass logoUrl to image generation
        location: generationParams.location,
        headline: postDetails.catchyWords,
        subheadline: postDetails.subheadline,
        callToAction: postDetails.callToAction,
        realTimeContext: realTimeContext,
        creativeContext: (postDetails as any).creativeContext // 🎨 Pass creative context to image generation
      });

      // Update variants with the generated image
      postDetails.variants = postDetails.variants.map(variant => ({
        ...variant,
        imageUrl: imageResult.imageUrl
      }));

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


      return {
        success: true,
        data: generatedPost,
        metadata: {
          modelId: this.modelId,
          processingTime,
          qualityScore,
          creditsUsed: 1.5, // Revo 1.0 now uses 1.5 credits for enhanced capabilities
          enhancementsApplied: ['enhanced-optimization', 'platform-formatting', 'gemini-2.5-flash-image']
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
    }

    return true;
  }

  /**
   * Prepare generation parameters optimized for Revo 1.0
   */
  private prepareGenerationParams(request: ContentGenerationRequest) {
    const { profile, platform, brandConsistency } = request;
    const today = new Date();

    // Debug logging for contact information
    console.log('🔍 [Revo 1.0 Content Generator] Contact Information Debug:', {
      includeContacts: (request as any).includeContacts,
      contactInfo: (request as any).contactInfo,
      websiteUrl: (request as any).websiteUrl,
      profileContactInfo: profile.contactInfo,
      profileWebsiteUrl: profile.websiteUrl
    });

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
      businessName: profile.businessName || profile.name || 'Business', // Add business name
      businessType: profile.businessType,
      location: profile.location,
      writingTone: profile.writingTone,
      contentThemes: Array.isArray(profile.contentThemes) ? profile.contentThemes : [],
      visualStyle: profile.visualStyle,
      logoDataUrl: profile.logoDataUrl,
      logoUrl: (profile as any).logoUrl, // Support Supabase storage URLs
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
      // Contact information for brand consistency
      includeContacts: (request as any).includeContacts || false,
      contactInfo: (request as any).contactInfo || profile.contactInfo || {},
      websiteUrl: (request as any).websiteUrl || profile.websiteUrl || '',
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
    let score = 7; // Base score (upgraded from 5 for Gemini 2.5 Flash Image Preview)

    // Content quality checks
    if (post.content && post.content.length > 50) score += 1;
    if (post.content && post.content.length > 100) score += 0.5;

    // Hashtag quality
    if (post.hashtags && post.hashtags.length >= 5) score += 1;
    if (post.hashtags && post.hashtags.length >= 10) score += 0.5;

    // Catchy words presence
    if (post.catchyWords && post.catchyWords.trim().length > 0) score += 1;

    // Image generation success (enhanced for Gemini 2.5 Flash Image Preview)
    if (post.variants && post.variants.length > 0 && post.variants[0].imageUrl) {
      score += 1.5; // Increased from 1 for better image quality
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
        'Enhanced content generation with Gemini 2.5 Flash Image Preview',
        'Platform-specific formatting',
        'Hashtag generation',
        'Catchy words creation',
        'Brand consistency (enhanced)',
        'Perfect text rendering',
        'High-resolution image support'
      ],
      limitations: [
        'No real-time context',
        'No trending topics',
        'No artifact support',
        'Enhanced quality optimization',
        'Limited customization'
      ],
      averageProcessingTime: '20-30 seconds (enhanced for quality)',
      qualityRange: '8-9/10 (upgraded from 6-8/10)',
      costPerGeneration: 1.5 // Upgraded from 1 for enhanced capabilities
    };
  }
}
