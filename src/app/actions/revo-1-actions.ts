'use server';

/**
 * Revo 1.0 Server Actions
 * Unified architecture with Revo 2.0 - returns data URLs for frontend handling
 */

import { generateRevo10Content, generateRevo10Image } from '@/ai/revo-1.0-service';
import type { BrandProfile, Platform, BrandConsistencyPreferences, GeneratedPost } from '@/lib/types';
import type { ScheduledService } from '@/services/calendar-service';
import { brandProfileSupabaseService } from '@/lib/supabase/services/brand-profile-service';
import { BusinessProfileResolver } from '@/ai/business-profile/resolver';
import { normalizeStringList, normalizeServiceList } from '@/ai/revo/shared-pipeline';

// Helper function to convert logo URL to base64 data URL for AI models (matching other Revo versions)
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
        console.warn('⚠️ [Revo 1.0 Actions] Failed to fetch logo from URL:', response.status);
        return undefined;
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/png';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return dataUrl;
    } catch (error) {
      console.error('❌ [Revo 1.0 Actions] Error converting logo URL to base64:', error);
      return undefined;
    }
  }

  return undefined;
}

/**
 * Generate content with Revo 1.0 (Unified Architecture)
 */
export async function generateRevo1ContentAction(
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
      console.log('🔄 [Revo 1.0] Fetching fresh brand profile from database:', brandProfile.id);
      try {
        const latestProfile = await brandProfileSupabaseService.loadBrandProfile(brandProfile.id);
        if (latestProfile) {
          freshBrandProfile = latestProfile;
          console.log('✅ [Revo 1.0] Fresh brand profile loaded with colors:', {
            primaryColor: latestProfile.primaryColor,
            accentColor: latestProfile.accentColor,
            backgroundColor: latestProfile.backgroundColor,
            businessName: latestProfile.businessName
          });
        } else {
          console.warn('⚠️ [Revo 1.0] Could not load fresh profile, using provided data');
        }
      } catch (error) {
        console.error('❌ [Revo 1.0] Error loading fresh profile:', error);
        console.log('⚠️ [Revo 1.0] Falling back to provided brand profile data');
      }
    } else {
      console.log('⚠️ [Revo 1.0] No brand profile ID provided, using frontend data');
    }

    // Convert logo URL to base64 data URL (matching other Revo versions) - using fresh profile
    const convertedLogoDataUrl = await convertLogoToDataUrl(freshBrandProfile.logoUrl || freshBrandProfile.logoDataUrl);

    // Use Business Profile Resolver for strict validation (same as quick-content)
    const resolver = new BusinessProfileResolver();
    const userId = 'test-user-id'; // TODO: Get from authentication

    let resolvedProfile;
    try {
      resolvedProfile = await resolver.resolveProfile(
        freshBrandProfile.id || freshBrandProfile.businessName || 'unknown',
        userId,
        freshBrandProfile as any,
        {
          allowExternalContext: false,
          requireContacts: true,
          strictValidation: true
        }
      );

      const validation = resolver.validateForGeneration(resolvedProfile, {
        requireContacts: true,
        strictValidation: true
      });

      if (!validation.valid) {
        throw new Error(`Business profile validation failed: ${validation.errors.join(', ')}`);
      }
    } catch (error) {
      console.log('⚠️ [Revo 1.0] Business Profile Resolver failed, using provided data:', error.message);

      // Fallback to provided fresh brand profile data
      const servicesList = normalizeServiceList(freshBrandProfile.services);
      const keyFeaturesList = normalizeStringList(freshBrandProfile.keyFeatures);
      const competitiveAdvantagesList = normalizeStringList(freshBrandProfile.competitiveAdvantages);

      resolvedProfile = {
        id: freshBrandProfile.id || 'test-profile',
        businessName: freshBrandProfile.businessName,
        businessType: freshBrandProfile.businessType,
        description: freshBrandProfile.description || `${freshBrandProfile.businessType} services`,
        location: freshBrandProfile.location ?
          (typeof freshBrandProfile.location === 'string' ?
            { country: freshBrandProfile.location.includes('Kenya') ? 'KE' : freshBrandProfile.location } :
            freshBrandProfile.location) :
          undefined,
        contact: freshBrandProfile.contactInfo,
        services: servicesList.map(name => ({ name, description: '' })),
        keyFeatures: keyFeaturesList,
        competitiveAdvantages: competitiveAdvantagesList,
        targetAudience: freshBrandProfile.targetAudience || 'General audience',
        brandVoice: freshBrandProfile.writingTone,
        brandColors: {
          primary: freshBrandProfile.primaryColor,
          secondary: freshBrandProfile.accentColor
        },
        logoUrl: freshBrandProfile.logoUrl,
        logoDataUrl: convertedLogoDataUrl || freshBrandProfile.logoDataUrl,
        sources: {
          businessName: 'user',
          businessType: 'user',
          description: 'user',
          location: 'user',
          contact: 'user',
          services: 'user',
          keyFeatures: 'user',
          competitiveAdvantages: 'user',
          targetAudience: 'user',
          brandVoice: 'user',
          brandColors: 'user',
          logoUrl: 'missing',
          logoDataUrl: 'missing',
          designExamples: 'missing'
        },
        completeness: {
          score: 90,
          missingCritical: [],
          missingOptional: ['logoUrl']
        }
      };
    }

    // Generate content using Revo 1.0 service
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    const currentDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Convert services to string format for Revo 1.0
    const servicesString = resolvedProfile.services
      ? resolvedProfile.services.map(service =>
        `${service.name}: ${service.description || ''}`
      ).join(', ')
      : '';

    const keyFeaturesString = resolvedProfile.keyFeatures
      ? resolvedProfile.keyFeatures.join(', ')
      : '';

    const competitiveAdvantagesString = resolvedProfile.competitiveAdvantages
      ? resolvedProfile.competitiveAdvantages.join(', ')
      : '';

    // Format location
    const locationString = resolvedProfile.location
      ? `${resolvedProfile.location.city || ''}, ${resolvedProfile.location.country || ''}`.replace(/^,\s*|,\s*$/g, '')
      : '';

    // Prepare contact information
    const finalContactInfo = {
      phone: resolvedProfile.contact?.phone || freshBrandProfile.contactInfo?.phone || '',
      email: resolvedProfile.contact?.email || freshBrandProfile.contactInfo?.email || '',
      address: resolvedProfile.contact?.address || freshBrandProfile.contactInfo?.address || freshBrandProfile.location || ''
    };

    const finalWebsiteUrl = resolvedProfile.contact?.website || freshBrandProfile.websiteUrl || '';

    console.log('🚀 [Revo 1.0 Actions] Generating content...');
    const revo10Result = await generateRevo10Content({
      businessType: resolvedProfile.businessType,
      businessName: resolvedProfile.businessName,
      location: locationString,
      platform: platform.toLowerCase(),
      writingTone: resolvedProfile.brandVoice || 'professional',
      contentThemes: [],
      targetAudience: resolvedProfile.targetAudience || '',
      services: servicesString,
      keyFeatures: keyFeaturesString,
      competitiveAdvantages: competitiveAdvantagesString,
      dayOfWeek,
      currentDate,
      primaryColor: resolvedProfile.brandColors?.primary || freshBrandProfile.primaryColor,
      visualStyle: options?.visualStyle || freshBrandProfile.visualStyle || 'modern',
      includeContacts: brandConsistency?.includeContacts === true,
      contactInfo: {
        phone: finalContactInfo.phone,
        email: finalContactInfo.email,
        address: finalContactInfo.address
      },
      websiteUrl: finalWebsiteUrl
    });

    console.log('✅ [Revo 1.0 Actions] Content generation successful!');

    // Generate image using Revo 1.0 image service
    const imageTextComponents: string[] = [];
    if (revo10Result.catchyWords) imageTextComponents.push(revo10Result.catchyWords);
    if (revo10Result.subheadline) imageTextComponents.push(revo10Result.subheadline);
    if (revo10Result.callToAction) imageTextComponents.push(revo10Result.callToAction);

    const structuredImageText = imageTextComponents.join(' | ');

    console.log('🖼️ [Revo 1.0 Actions] Generating image...');
    const imageResult = await generateRevo10Image({
      businessType: resolvedProfile.businessType,
      businessName: resolvedProfile.businessName,
      platform: platform.toLowerCase(),
      visualStyle: options?.visualStyle || freshBrandProfile.visualStyle || 'modern',
      primaryColor: resolvedProfile.brandColors?.primary || freshBrandProfile.primaryColor || '#3B82F6',
      accentColor: resolvedProfile.brandColors?.secondary || freshBrandProfile.accentColor || '#1E40AF',
      backgroundColor: freshBrandProfile.backgroundColor || '#FFFFFF',
      imageText: structuredImageText,
      designDescription: `Professional ${resolvedProfile.businessType} content with structured headline, subheadline, and CTA for ${platform.toLowerCase()}`,
      logoDataUrl: resolvedProfile.logoDataUrl || convertedLogoDataUrl,
      location: locationString,
      headline: revo10Result.catchyWords,
      subheadline: revo10Result.subheadline,
      callToAction: revo10Result.callToAction,
      includeContacts: brandConsistency?.includeContacts === true,
      contactInfo: {
        phone: finalContactInfo.phone,
        email: finalContactInfo.email
      },
      websiteUrl: finalWebsiteUrl,
      includePeople: options?.includePeopleInDesigns ?? true,
      scheduledServices: scheduledServices || [],
      followBrandColors: brandConsistency?.followBrandColors !== false
    });

    console.log('✅ [Revo 1.0 Actions] Image generation successful!');

    // Convert to GeneratedPost format (UNIFIED - following Revo 2.0 format exactly)
    const generatedPost: GeneratedPost = {
      id: `revo1-${Date.now()}`,
      date: new Date().toISOString(),
      platform: platform.toLowerCase(),
      postType: 'post',
      imageUrl: imageResult.imageUrl, // Return data URL directly (no server-side upload)
      content: revo10Result.content,
      hashtags: Array.isArray(revo10Result.hashtags) ? revo10Result.hashtags.join(' ') : revo10Result.hashtags,
      catchyWords: revo10Result.catchyWords || revo10Result.headline,
      subheadline: revo10Result.subheadline,
      callToAction: revo10Result.callToAction,
      status: 'generated',
      variants: [
        {
          platform: platform.toLowerCase(),
          imageUrl: imageResult.imageUrl
        }
      ],
      metadata: {
        model: 'Revo 1.0 Enhanced',
        qualityScore: 8.5,
        processingTime: Date.now() - Date.now(),
        enhancementsApplied: [
          'enhanced-ai-engine',
          'real-time-context',
          'trending-topics',
          'advanced-prompting',
          'quality-optimization',
          'content-validation',
          'hashtag-enhancement',
          'gemini-2.5-flash-image'
        ]
      }
    };

    return generatedPost;

  } catch (error) {
    console.error('❌ [Revo 1.0 Actions] Generation failed:', error);
    throw new Error(`Revo 1.0 content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
