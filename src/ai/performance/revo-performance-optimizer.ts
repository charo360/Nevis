/**
 * Revo 2.0 Performance Optimizer
 * Implements caching, parallel processing, and optimized AI calls
 */

import { LRUCache } from 'lru-cache';

// Performance monitoring
interface PerformanceMetrics {
  totalTime: number;
  businessIntelligence: number;
  contentGeneration: number;
  imageGeneration: number;
  validation: number;
  cacheHits: number;
  cacheMisses: number;
}

// Cache configurations
const CONTENT_CACHE = new LRUCache<string, any>({
  max: 1000,
  ttl: 1000 * 60 * 30, // 30 minutes
});

const BUSINESS_INTELLIGENCE_CACHE = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 60 * 2, // 2 hours
});

const ASSISTANT_RESPONSE_CACHE = new LRUCache<string, any>({
  max: 200,
  ttl: 1000 * 60 * 15, // 15 minutes
});

export class RevoPerformanceOptimizer {
  private metrics: PerformanceMetrics = {
    totalTime: 0,
    businessIntelligence: 0,
    contentGeneration: 0,
    imageGeneration: 0,
    validation: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  /**
   * Generate cache key for content requests
   */
  private generateContentCacheKey(options: any): string {
    const key = {
      businessName: options.brandProfile.businessName,
      businessType: options.businessType,
      platform: options.platform,
      location: options.brandProfile.location,
      // Include concept for uniqueness but not full details
      conceptType: options.concept?.concept?.substring(0, 50),
    };
    return JSON.stringify(key);
  }

  /**
   * Generate cache key for business intelligence
   */
  private generateBICacheKey(brandProfile: any): string {
    return JSON.stringify({
      businessName: brandProfile.businessName,
      website: brandProfile.website,
      description: brandProfile.description,
      industry: brandProfile.industry,
    });
  }

  /**
   * Optimized business intelligence gathering with caching
   */
  async getOptimizedBusinessIntelligence(brandProfile: any, businessType: string): Promise<any> {
    const startTime = Date.now();
    const cacheKey = this.generateBICacheKey(brandProfile);
    
    // Check cache first
    const cached = BUSINESS_INTELLIGENCE_CACHE.get(cacheKey);
    if (cached) {
      this.metrics.cacheHits++;
      console.log(`🚀 [Performance] Business Intelligence cache HIT (${Date.now() - startTime}ms)`);
      return cached;
    }

    this.metrics.cacheMisses++;
    console.log(`📊 [Performance] Business Intelligence cache MISS - generating...`);

    try {
      // Use faster business profile manager instead of enhanced BI gatherer
      const { BusinessProfileManager } = await import('../intelligence/business-profile-manager');
      const profileManager = new BusinessProfileManager();

      const businessProfile = await Promise.race([
        profileManager.getBusinessProfile(brandProfile),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Business profile timeout')), 5000) // Reduced from 10s
        )
      ]);

      const marketingInsights = profileManager.generateMarketingInsights(
        businessProfile,
        brandProfile.targetAudience
      );

      const result = {
        coreBusinessUnderstanding: {
          whatTheyDo: businessProfile.offerings[0]?.description || businessProfile.mission,
          whoItsFor: marketingInsights.primaryAudienceProfile,
          whyItMatters: businessProfile.mission
        },
        targetAudienceInsights: {
          primaryMotivations: marketingInsights.audienceMotivations,
          painPoints: marketingInsights.audiencePainPoints,
          emotionalTriggers: marketingInsights.emotionalTriggers
        },
        marketingRecommendations: {
          primaryAngles: marketingInsights.recommendedAngles,
          messagingTone: marketingInsights.toneOfVoice,
          contentThemes: marketingInsights.contentThemes
        },
        businessProfileInsights: profileManager.generatePromptInsights(businessProfile, brandProfile.targetAudience)
      };

      // Cache the result
      BUSINESS_INTELLIGENCE_CACHE.set(cacheKey, result);
      
      this.metrics.businessIntelligence += Date.now() - startTime;
      console.log(`✅ [Performance] Business Intelligence generated and cached (${Date.now() - startTime}ms)`);
      
      return result;
    } catch (error) {
      console.warn(`⚠️ [Performance] Business Intelligence failed, using minimal fallback:`, error);
      
      // Minimal fallback that's still useful
      const fallback = {
        coreBusinessUnderstanding: {
          whatTheyDo: brandProfile.description || `${businessType} services`,
          whoItsFor: brandProfile.targetAudience || 'customers',
          whyItMatters: `Quality ${businessType} solutions`
        },
        targetAudienceInsights: {
          primaryMotivations: ['quality', 'value', 'convenience'],
          painPoints: ['high costs', 'poor service', 'complexity'],
          emotionalTriggers: ['trust', 'success', 'peace of mind']
        },
        marketingRecommendations: {
          primaryAngles: ['value proposition', 'quality focus', 'customer service'],
          messagingTone: 'professional and approachable',
          contentThemes: ['expertise', 'reliability', 'customer success']
        },
        businessProfileInsights: `${brandProfile.businessName} provides ${businessType} services with focus on quality and customer satisfaction.`
      };

      // Cache fallback too (shorter TTL)
      BUSINESS_INTELLIGENCE_CACHE.set(cacheKey, fallback, { ttl: 1000 * 60 * 5 }); // 5 minutes
      
      this.metrics.businessIntelligence += Date.now() - startTime;
      return fallback;
    }
  }

  /**
   * Optimized assistant content generation with caching and reduced timeouts
   */
  async getOptimizedAssistantContent(request: any): Promise<any> {
    const startTime = Date.now();
    const cacheKey = this.generateContentCacheKey(request);
    
    // Check cache first
    const cached = ASSISTANT_RESPONSE_CACHE.get(cacheKey);
    if (cached) {
      this.metrics.cacheHits++;
      console.log(`🚀 [Performance] Assistant content cache HIT (${Date.now() - startTime}ms)`);
      return cached;
    }

    this.metrics.cacheMisses++;
    console.log(`🤖 [Performance] Assistant content cache MISS - generating...`);

    try {
      const { assistantManager } = await import('../assistants/assistant-manager');
      
      // Optimized request with reduced timeout and no file uploads for speed
      const optimizedRequest = {
        ...request,
        // Remove documents for faster processing (can be added back if needed)
        brandProfile: {
          ...request.brandProfile,
          documents: [] // Skip document upload for speed
        }
      };

      const result = await Promise.race([
        assistantManager.generateContent(optimizedRequest),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Assistant timeout')), 30000) // Reduced from 90s to 30s
        )
      ]);

      // Cache successful result
      ASSISTANT_RESPONSE_CACHE.set(cacheKey, result);
      
      this.metrics.contentGeneration += Date.now() - startTime;
      console.log(`✅ [Performance] Assistant content generated and cached (${Date.now() - startTime}ms)`);
      
      return result;
    } catch (error) {
      this.metrics.contentGeneration += Date.now() - startTime;
      console.warn(`⚠️ [Performance] Assistant generation failed (${Date.now() - startTime}ms):`, error);
      throw error;
    }
  }

  /**
   * Optimized content generation with streamlined prompts
   */
  async getOptimizedClaudeContent(options: any, concept: any): Promise<any> {
    const startTime = Date.now();
    const cacheKey = this.generateContentCacheKey({ ...options, concept });
    
    // Check cache first
    const cached = CONTENT_CACHE.get(cacheKey);
    if (cached) {
      this.metrics.cacheHits++;
      console.log(`🚀 [Performance] Claude content cache HIT (${Date.now() - startTime}ms)`);
      return cached;
    }

    this.metrics.cacheMisses++;
    console.log(`📝 [Performance] Claude content cache MISS - generating...`);

    try {
      // Use streamlined prompt instead of the massive 2900-line prompt
      const streamlinedPrompt = this.buildStreamlinedPrompt(options, concept);
      
      const { defaultClaudeGenerator } = await import('../revo-2.0-service');
      
      const result = await Promise.race([
        defaultClaudeGenerator.generate(streamlinedPrompt, {
          temperature: 0.8,
          maxTokens: 800 // Reduced from 1000
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Claude timeout')), 15000) // Reduced from 30s
        )
      ]);

      // Parse and validate quickly
      const content = this.parseContentQuickly(result.text, options);
      
      // Cache successful result
      CONTENT_CACHE.set(cacheKey, content);
      
      this.metrics.contentGeneration += Date.now() - startTime;
      console.log(`✅ [Performance] Claude content generated and cached (${Date.now() - startTime}ms)`);
      
      return content;
    } catch (error) {
      this.metrics.contentGeneration += Date.now() - startTime;
      console.warn(`⚠️ [Performance] Claude generation failed (${Date.now() - startTime}ms):`, error);
      throw error;
    }
  }

  /**
   * Build streamlined prompt (much shorter than original)
   */
  private buildStreamlinedPrompt(options: any, concept: any): string {
    const { businessType, brandProfile, platform } = options;
    const hashtagCount = platform.toLowerCase() === 'instagram' ? 5 : 3;

    return `Create engaging ${platform} content for ${brandProfile.businessName} (${businessType}).

BUSINESS: ${brandProfile.businessName}
INDUSTRY: ${businessType}
LOCATION: ${brandProfile.location || 'Global'}
CONCEPT: ${concept.concept}

REQUIREMENTS:
1. HEADLINE (max 6 words): Compelling and specific to business
2. SUBHEADLINE (max 12 words): Supports headline message
3. CAPTION (50-80 words): Clear value proposition, no poetry
4. CTA (2-4 words): Action-oriented
5. HASHTAGS (exactly ${hashtagCount}): Relevant and strategic

RULES:
- Focus on specific benefits, not generic promises
- Use clear, professional language
- Match content to business type and location
- No corporate jargon or flowery language
- Make it scroll-stopping and actionable

Format as JSON:
{
  "headline": "...",
  "subheadline": "...", 
  "caption": "...",
  "cta": "...",
  "hashtags": ["#tag1", "#tag2", ...]
}`;
  }

  /**
   * Quick content parsing with minimal validation
   */
  private parseContentQuickly(text: string, options: any): any {
    try {
      // Extract JSON quickly
      let cleanContent = text.trim();
      if (cleanContent.includes('```json')) {
        cleanContent = cleanContent.split('```json')[1].split('```')[0].trim();
      } else if (cleanContent.includes('```')) {
        cleanContent = cleanContent.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(cleanContent);

      // Quick validation - just check required fields exist
      if (!parsed.headline || !parsed.caption || !parsed.hashtags) {
        throw new Error('Missing required fields');
      }

      // Enforce platform-specific hashtag limits
      const normalizedPlatform = String(options.platform).toLowerCase();
      const maxHashtags = normalizedPlatform === 'instagram' ? 5 : 3;
      let hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];

      if (hashtags.length > maxHashtags) {
        console.log(`📊 [Performance Optimizer] Trimming hashtags from ${hashtags.length} to ${maxHashtags} for ${options.platform}`);
        hashtags = hashtags.slice(0, maxHashtags);
      }

      console.log(`#️⃣ [Performance Optimizer] Final hashtag count: ${hashtags.length} for ${options.platform}`);

      return {
        caption: parsed.caption,
        hashtags: hashtags,
        headline: parsed.headline,
        subheadline: parsed.subheadline || '',
        cta: parsed.cta || 'Learn More',
        captionVariations: [parsed.caption]
      };
    } catch (error) {
      console.warn(`⚠️ [Performance] Quick parse failed, using fallback`);

      // Ultra-fast fallback with platform-specific hashtag limits
      const normalizedPlatform = String(options.platform).toLowerCase();
      const maxHashtags = normalizedPlatform === 'instagram' ? 5 : 3;
      const fallbackHashtags = [`#${options.brandProfile.businessName.replace(/\s+/g, '')}`, `#${options.businessType.replace(/\s+/g, '')}`, '#Quality'];

      return {
        caption: `Discover quality services at ${options.brandProfile.businessName}. ${options.brandProfile.location ? `Serving ${options.brandProfile.location}` : 'Serving you'} with excellence.`,
        hashtags: fallbackHashtags.slice(0, maxHashtags),
        headline: options.brandProfile.businessName,
        subheadline: `Quality ${options.businessType} services`,
        cta: 'Learn More',
        captionVariations: []
      };
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalTime: 0,
      businessIntelligence: 0,
      contentGeneration: 0,
      imageGeneration: 0,
      validation: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    CONTENT_CACHE.clear();
    BUSINESS_INTELLIGENCE_CACHE.clear();
    ASSISTANT_RESPONSE_CACHE.clear();
    console.log('🧹 [Performance] All caches cleared');
  }
}

// Export singleton instance
export const revoPerformanceOptimizer = new RevoPerformanceOptimizer();
