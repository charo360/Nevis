'use server';

/**
 * Revo 2.0 Server Actions
 * Next-generation content creation with Gemini 2.5 Flash Image Preview
 */

import { generateWithRevo20, testRevo20Availability, type Revo20GenerationOptions } from '@/ai/revo-2.0-service';
import type { BrandProfile, Platform, BrandConsistencyPreferences, GeneratedPost } from '@/lib/types';
import type { ScheduledService } from '@/services/calendar-service';
import { brandProfileSupabaseService } from '@/lib/supabase/services/brand-profile-service';

/**
 * Generate content with Revo 2.0 (Gemini 2.5 Flash Image Preview)
 */
export async function generateRevo2ContentAction(
  brandProfile: BrandProfile,
  platform: Platform,
  brandConsistency: BrandConsistencyPreferences,
  prompt?: string,
  options?: {
    aspectRatio?: '1:1' | '16:9' | '9:16' | '21:9' | '4:5';
    visualStyle?: 'modern' | 'minimalist' | 'bold' | 'elegant' | 'playful' | 'professional';
    includePeopleInDesigns?: boolean;
    useLocalLanguage?: boolean;
  },
  scheduledServices?: ScheduledService[] // NEW: Scheduled services parameter
): Promise<GeneratedPost> {
  try {
    // 🔄 FETCH FRESH BRAND PROFILE DATA FROM DATABASE
    // This ensures we always use the latest colors and data, not cached frontend data
    let freshBrandProfile: BrandProfile = brandProfile;

    if (brandProfile.id) {
      console.log('🔄 [Revo 2.0] Fetching fresh brand profile from database:', brandProfile.id);
      try {
        const latestProfile = await brandProfileSupabaseService.loadBrandProfile(brandProfile.id);
        if (latestProfile) {
          freshBrandProfile = latestProfile;
          console.log('✅ [Revo 2.0] Fresh brand profile loaded with colors:', {
            primaryColor: latestProfile.primaryColor,
            accentColor: latestProfile.accentColor,
            backgroundColor: latestProfile.backgroundColor,
            businessName: latestProfile.businessName
          });
        } else {
          console.warn('⚠️ [Revo 2.0] Could not load fresh profile, using provided data');
        }
      } catch (error) {
        console.error('❌ [Revo 2.0] Error loading fresh profile:', error);
        console.log('⚠️ [Revo 2.0] Falling back to provided brand profile data');
      }
    } else {
      console.log('⚠️ [Revo 2.0] No brand profile ID provided, using frontend data');
    }

    // Log scheduled services integration

    // Prepare Revo 2.0 generation options
    const revo2Options: Revo20GenerationOptions = {
      businessType: freshBrandProfile.businessType || 'Business',
      platform,
      visualStyle: options?.visualStyle || 'modern',
      imageText: prompt || '',
      brandProfile: freshBrandProfile, // Use fresh data from database
      aspectRatio: options?.aspectRatio || '1:1',
      includePeopleInDesigns: options?.includePeopleInDesigns || false,
      useLocalLanguage: options?.useLocalLanguage || false,
      includeContacts: !!brandConsistency?.includeContacts,
      followBrandColors: brandConsistency?.followBrandColors !== false, // Default to true
      scheduledServices: scheduledServices // NEW: Pass scheduled services to Revo 2.0
    };

    // Generate with Revo 2.0
    const result = await generateWithRevo20(revo2Options);

    // Convert to GeneratedPost format (UNIFIED across all Revo versions)
    const generatedPost: GeneratedPost = {
      id: `revo2-${Date.now()}`,
      date: new Date().toISOString(),
      platform: platform.toLowerCase(),
      postType: 'post',
      imageUrl: result.imageUrl,
      content: result.caption,
      hashtags: Array.isArray(result.hashtags) ? result.hashtags.join(' ') : result.hashtags,
      catchyWords: result.headline,
      subheadline: result.subheadline,
      callToAction: result.cta,
      status: 'generated',
      variants: [
        {
          platform: platform.toLowerCase(),
          imageUrl: result.imageUrl
        }
      ],
      metadata: {
        model: result.model,
        qualityScore: result.qualityScore,
        processingTime: result.processingTime,
        enhancementsApplied: result.enhancementsApplied
      }
    };

    return generatedPost;

  } catch (error) {
    throw new Error(`Revo 2.0 content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate creative asset with Revo 2.0
 */
export async function generateRevo2CreativeAssetAction(
  brandProfile: BrandProfile,
  platform: Platform,
  prompt: string,
  brandConsistency: BrandConsistencyPreferences,
  options?: {
    aspectRatio?: '1:1' | '16:9' | '9:16' | '21:9' | '4:5';
    visualStyle?: 'modern' | 'minimalist' | 'bold' | 'elegant' | 'playful' | 'professional';
    includePeopleInDesigns?: boolean;
  }
): Promise<{
  success: boolean;
  imageUrl?: string;
  model?: string;
  qualityScore?: number;
  processingTime?: number;
  enhancementsApplied?: string[];
  error?: string;
}> {
  try {

    const revo2Options: Revo20GenerationOptions = {
      businessType: brandProfile.businessType || 'Business',
      platform,
      visualStyle: options?.visualStyle || 'modern',
      imageText: prompt,
      brandProfile,
      aspectRatio: options?.aspectRatio || '1:1',
      includePeopleInDesigns: options?.includePeopleInDesigns || false,
      useLocalLanguage: false,
      includeContacts: !!brandConsistency?.includeContacts
    };

    const result = await generateWithRevo20(revo2Options);

    return {
      success: true,
      imageUrl: result.imageUrl,
      model: result.model,
      qualityScore: result.qualityScore,
      processingTime: result.processingTime,
      enhancementsApplied: result.enhancementsApplied
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get Revo 2.0 capabilities
 */
export async function getRevo2CapabilitiesAction(): Promise<{
  name: string;
  description: string;
  features: string[];
  supportedPlatforms: string[];
  qualityRange: string;
  status: string;
}> {
  return {
    name: 'Revo 2.0',
    description: 'Next-generation AI content creation with Gemini 2.5 Flash Image Preview',
    features: [
      'Gemini 2.5 Flash Image Preview integration',
      'Multi-aspect ratio support (1:1, 16:9, 9:16, 21:9, 4:5)',
      'Advanced style control (6 styles)',
      'Professional mood settings',
      'Brand color integration',
      'Platform-optimized generation',
      'Enhanced prompt engineering',
      'Ultra-high quality output',
      'Smart caption generation',
      'Intelligent hashtag strategy'
    ],
    supportedPlatforms: [
      'Instagram',
      'Facebook',
      'Twitter',
      'LinkedIn'
    ],
    qualityRange: '8.0-10.0/10',
    status: 'Next-Generation'
  };
}

/**
 * Test Revo 2.0 availability
 */
export async function testRevo2AvailabilityAction(): Promise<{
  available: boolean;
  model: string;
  message: string;
}> {
  try {
    const isAvailable = await testRevo20Availability();

    return {
      available: isAvailable,
      model: 'Revo 2.0 (Gemini 2.5 Flash Image Preview)',
      message: isAvailable
        ? 'Revo 2.0 is available and ready!'
        : 'Revo 2.0 is not available. Check API key and model access.'
    };
  } catch (error) {
    return {
      available: false,
      model: 'Revo 2.0 (Gemini 2.5 Flash Image Preview)',
      message: `Revo 2.0 test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
