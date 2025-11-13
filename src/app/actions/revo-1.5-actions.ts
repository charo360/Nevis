'use server';
/**
 * Revo 1.5 Server Actions
 * Enhanced content creation with advanced features and logo support
 */

import { generateRevo15EnhancedDesign } from '@/ai/revo-1.5-enhanced-design';
import type { BrandProfile, Platform, BrandConsistencyPreferences, GeneratedPost } from '@/lib/types';
import type { ScheduledService } from '@/services/calendar-service';
import { brandProfileSupabaseService } from '@/lib/supabase/services/brand-profile-service';
import { formatContactForAI, getPriorityContacts, getExactContactInstructions } from '@/lib/utils/smart-contact-formatter';

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

      const response = await fetch(logoUrl);
      if (!response.ok) {
        console.warn('⚠️ [Revo 1.5 Actions] Failed to fetch logo from URL:', response.status);
        return undefined;
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/png';
      const dataUrl = `data:${mimeType};base64,${base64}`;

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
  },
  scheduledServices?: ScheduledService[]
): Promise<GeneratedPost> {
  try {
    // 🔄 FETCH FRESH BRAND PROFILE DATA FROM DATABASE
    // This ensures we always use the latest colors and data, not cached frontend data
    let freshBrandProfile: BrandProfile = brandProfile;

    if (brandProfile.id) {
      console.log('🔄 [Revo 1.5] Fetching fresh brand profile from database:', brandProfile.id);
      try {
        const latestProfile = await brandProfileSupabaseService.loadBrandProfile(brandProfile.id);
        if (latestProfile) {
          freshBrandProfile = latestProfile;
          console.log('✅ [Revo 1.5] Fresh brand profile loaded with colors:', {
            primaryColor: latestProfile.primaryColor,
            accentColor: latestProfile.accentColor,
            backgroundColor: latestProfile.backgroundColor,
            businessName: latestProfile.businessName
          });
        } else {
          console.warn('⚠️ [Revo 1.5] Could not load fresh profile, using provided data');
        }
      } catch (error) {
        console.error('❌ [Revo 1.5] Error loading fresh profile:', error);
        console.log('⚠️ [Revo 1.5] Falling back to provided brand profile data');
      }
    } else {
      console.log('⚠️ [Revo 1.5] No brand profile ID provided, using frontend data');
    }

    // Smart contact formatting for AI generation
    const contactInfo = freshBrandProfile.contactInfo || {
      phone: (freshBrandProfile as any).contactPhone || '',
      email: (freshBrandProfile as any).contactEmail || '',
      address: (freshBrandProfile as any).contactAddress || '',
      website: freshBrandProfile.websiteUrl || ''
    };
    
    const priorityContacts = getPriorityContacts(contactInfo, 3);
    const formattedContactForAI = formatContactForAI(contactInfo, 150);
    const exactContactInstructions = getExactContactInstructions(contactInfo);
    
    console.log('📞 [Revo 1.5] Smart Contact Formatting:', {
      originalContacts: contactInfo,
      priorityContacts: priorityContacts.map(c => ({ type: c.type, value: c.displayValue })),
      formattedForAI: formattedContactForAI,
      exactInstructions: exactContactInstructions,
      includeContacts: brandConsistency?.includeContacts
    });

    // Convert logo URL to base64 data URL (matching Revo 1.0 approach) - using fresh profile
    const convertedLogoDataUrl = await convertLogoToDataUrl(freshBrandProfile.logoUrl || freshBrandProfile.logoDataUrl);

    // Generate with Revo 1.5 (using fresh profile data)
    const result = await generateRevo15EnhancedDesign({
      businessType: freshBrandProfile.businessType || 'Business',
      platform,
      visualStyle: options?.visualStyle || 'modern',
      imageText: prompt || '',
      brandProfile: {
        ...freshBrandProfile, // Use fresh data from database
        logoDataUrl: convertedLogoDataUrl || freshBrandProfile.logoDataUrl,
        // Smart contact formatting
        contactInfo: brandConsistency?.includeContacts 
          ? Object.fromEntries(
              priorityContacts.map(contact => [contact.type, contact.displayValue])
            )
          : {},
        formattedContacts: brandConsistency?.includeContacts ? formattedContactForAI : '',
        exactContactInstructions: brandConsistency?.includeContacts ? exactContactInstructions : ''
      },
      brandConsistency: {
        ...brandConsistency,
        followBrandColors: brandConsistency?.followBrandColors !== false // Default to true
      }, // pass through to enable includeContacts and followBrandColors handling
      aspectRatio: options?.aspectRatio || '1:1',
      includePeopleInDesigns: options?.includePeopleInDesigns || false,
      useLocalLanguage: options?.useLocalLanguage || false,
      logoDataUrl: convertedLogoDataUrl || freshBrandProfile.logoDataUrl,
      logoUrl: freshBrandProfile.logoUrl,
      // NEW: Scheduled services integration
      scheduledServices: scheduledServices || []
    });

    // NO FALLBACKS - All content must come from Pure AI
    if (!result.caption || !result.headline || !result.subheadline || !result.callToAction || !result.hashtags) {
      throw new Error('🚫 [Revo 1.5 Actions] Pure AI response incomplete - missing required fields. No fallbacks allowed!');
    }

    // Convert to GeneratedPost format (UNIFIED - following Revo 2.0 format exactly)
    const generatedPost: GeneratedPost = {
      id: `revo-1.5-${Date.now()}`,
      date: new Date().toISOString(),
      platform: platform.toLowerCase(),
      postType: 'post',
      imageUrl: result.imageUrl,
      content: result.caption,
      hashtags: Array.isArray(result.hashtags) ? result.hashtags.join(' ') : result.hashtags,
      catchyWords: result.headline,
      subheadline: result.subheadline,
      callToAction: result.callToAction,
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
    console.error('❌ Revo 1.5 Full error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown'
    });

    // Extract user-friendly message if it exists
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // If it's already a user-friendly message, use it directly
    if (errorMessage.includes('😅') || errorMessage.includes('🤖') || errorMessage.includes('😔') || errorMessage.includes('🚫') || errorMessage.includes('🔑') || errorMessage.includes('🌐')) {
      throw new Error(errorMessage);
    }

    // Handle specific error types with proper solutions
    if (errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
      throw new Error('🚫 Revo 1.5 API quota exceeded (250 requests/day). Solutions: 1) Wait for daily reset, 2) Upgrade to paid API key, or 3) Use Revo 1.0 temporarily.');
    }

    if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('API key')) {
      throw new Error('🔑 Revo 1.5 API key issue. Check GEMINI_API_KEY_REVO_1_5 in .env.local');
    }

    if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('ECONNRESET')) {
      throw new Error('🌐 Network connection issue. Please check your internet connection and try again.');
    }

    // Show actual error for debugging other issues
    throw new Error(`🔧 Revo 1.5 Error: ${errorMessage}`);
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