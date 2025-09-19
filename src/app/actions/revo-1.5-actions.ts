'use server';

/**
 * Revo 1.5 Server Actions
 * Enhanced content creation with advanced features and logo support
 */

import { generateRevo15EnhancedDesign } from '@/ai/revo-1.5-enhanced-design';
import type { BrandProfile, Platform, BrandConsistencyPreferences, GeneratedPost } from '@/lib/types';

// Helper function to convert logo URL to base64 data URL for AI models (matching Revo 1.0)
async function convertLogoToDataUrl(logoUrl?: string): Promise<string | undefined> {
  if (!logoUrl) return undefined;

  // If it's already a data URL, return as is
  if (logoUrl.startsWith('data:')) {
    return logoUrl;
  }

  // If it's a Supabase Storage URL, fetch and convert to base64
  if (logoUrl.startsWith('http')) {
    try {
      console.log('🔄 [Revo 1.5 Actions] Converting logo URL to base64 for AI generation:', logoUrl.substring(0, 50) + '...');

      const response = await fetch(logoUrl);
      if (!response.ok) {
        console.warn('⚠️ [Revo 1.5 Actions] Failed to fetch logo from URL:', response.status);
        return undefined;
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/png';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      console.log('✅ [Revo 1.5 Actions] Logo converted to base64 successfully (' + buffer.byteLength + ' bytes)');
      return dataUrl;
    } catch (error) {
      console.error('❌ [Revo 1.5 Actions] Error converting logo URL to base64:', error);
      return undefined;
    }
  }

  return undefined;
}

/**
 * Generate content with Revo 1.5 (Enhanced Design with Logo Support)
 */
export async function generateRevo15ContentAction(
  brandProfile: BrandProfile,
  platform: Platform,
  brandConsistency: BrandConsistencyPreferences,
  prompt?: string,
  options?: {
    aspectRatio?: '1:1' | '16:9' | '9:16' | '21:9' | '4:5';
    visualStyle?: 'modern' | 'minimalist' | 'bold' | 'elegant' | 'playful' | 'professional';
    includePeopleInDesigns?: boolean;
    useLocalLanguage?: boolean;
  }
): Promise<GeneratedPost> {
  try {
    console.log('🎨 Revo 1.5: Starting content generation with logo support');
    console.log('🔍 Brand Profile Logo Check:', {
      businessName: brandProfile.businessName,
      hasLogoDataUrl: !!brandProfile.logoDataUrl,
      hasLogoUrl: !!brandProfile.logoUrl,
      logoDataUrlLength: brandProfile.logoDataUrl?.length || 0,
      logoUrlLength: brandProfile.logoUrl?.length || 0
    });

    // Convert logo URL to base64 data URL (matching Revo 1.0 approach)
    const convertedLogoDataUrl = await convertLogoToDataUrl(brandProfile.logoUrl || brandProfile.logoDataUrl);

    // Generate with Revo 1.5
    const result = await generateRevo15EnhancedDesign({
      businessType: brandProfile.businessType || 'Business',
      platform,
      visualStyle: options?.visualStyle || 'modern',
      imageText: prompt || '',
      brandProfile: {
        ...brandProfile,
        logoDataUrl: convertedLogoDataUrl || brandProfile.logoDataUrl
      },
      brandConsistency, // pass through to enable includeContacts handling
      aspectRatio: options?.aspectRatio || '1:1',
      includePeopleInDesigns: options?.includePeopleInDesigns || false,
      useLocalLanguage: options?.useLocalLanguage || false,
      logoDataUrl: convertedLogoDataUrl || brandProfile.logoDataUrl,
      logoUrl: brandProfile.logoUrl
    });

    console.log('✅ Revo 1.5: Content generation completed');
    console.log('📊 Result summary:', {
      hasImageUrl: !!result.imageUrl,
      model: result.model,
      qualityScore: result.qualityScore,
      processingTime: result.processingTime
    });

    // Convert to GeneratedPost format
    const generatedPost: GeneratedPost = {
      id: `revo-1.5-${Date.now()}`,
      date: new Date().toISOString(),
      platform: platform.toLowerCase(),
      postType: 'post',
      imageUrl: result.imageUrl,
      content: result.caption || `Enhanced ${brandProfile.businessName || brandProfile.businessType} content with Revo 1.5 technology`,
      hashtags: result.hashtags ? result.hashtags.join(' ') : '#enhanced #AI #design #premium #quality',
      catchyWords: result.headline || `Premium ${brandProfile.businessName} Solutions`,
      subheadline: result.subheadline || `Experience the future of ${brandProfile.businessType?.toLowerCase()} with ${brandProfile.businessName}`,
      callToAction: result.callToAction || `Discover ${brandProfile.businessName} Today`,
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
    console.error('❌ Revo 1.5 content generation failed:', error);

    // Extract user-friendly message if it exists
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // If it's already a user-friendly message, use it directly
    if (errorMessage.includes('😅') || errorMessage.includes('🤖') || errorMessage.includes('😔')) {
      throw new Error(errorMessage);
    }

    // Otherwise, make it friendly
    throw new Error('Revo 1.5 is having some trouble right now! 😅 Try switching to Revo 2.0 for great results while we get things sorted out.');
  }
}

/**
 * Test Revo 1.5 logo integration
 */
export async function testRevo15LogoIntegrationAction(brandProfile: BrandProfile): Promise<{
  success: boolean;
  logoProcessed: boolean;
  logoSource: 'dataUrl' | 'storageUrl' | 'none';
  logoSize: number;
  message: string;
}> {
  try {
    console.log('🧪 Testing Revo 1.5 logo integration...');

    let logoProcessed = false;
    let logoSource: 'dataUrl' | 'storageUrl' | 'none' = 'none';
    let logoSize = 0;

    // Check logo availability
    if (brandProfile.logoDataUrl) {
      logoProcessed = true;
      logoSource = 'dataUrl';
      logoSize = brandProfile.logoDataUrl.length;
    } else if (brandProfile.logoUrl) {
      logoProcessed = true;
      logoSource = 'storageUrl';
      logoSize = brandProfile.logoUrl.length;
    }

    const message = logoProcessed
      ? `Logo ready for Revo 1.5 integration from ${logoSource} (${logoSize} chars)`
      : 'No logo found for Revo 1.5 integration';

    return {
      success: true,
      logoProcessed,
      logoSource,
      logoSize,
      message
    };

  } catch (error) {
    return {
      success: false,
      logoProcessed: false,
      logoSource: 'none',
      logoSize: 0,
      message: `Logo integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Get Revo 1.5 capabilities
 */
export async function getRevo15CapabilitiesAction(): Promise<{
  name: string;
  description: string;
  features: string[];
  supportedPlatforms: string[];
  qualityRange: string;
  status: string;
  logoSupport: boolean;
}> {
  return {
    name: 'Revo 1.5',
    description: 'Enhanced AI content creation with advanced features and logo support',
    features: [
      'Two-step design process with planning and generation',
      'Enhanced creativity frameworks',
      'Business intelligence integration',
      'Logo integration from storage URLs and base64',
      'Cultural context awareness',
      'Premium visual quality (9.8/10)',
      'Advanced prompt engineering',
      'Industry-specific design intelligence'
    ],
    supportedPlatforms: [
      'Instagram',
      'Facebook',
      'Twitter',
      'LinkedIn'
    ],
    qualityRange: '7.5-9.8/10',
    status: 'Enhanced',
    logoSupport: true
  };
}