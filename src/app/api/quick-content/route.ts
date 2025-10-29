// src/app/api/quick-content/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateContentAction } from '@/app/actions';
import { generateRevo15ContentAction } from '@/app/actions/revo-1.5-actions';
import type { BrandProfile, Platform, BrandConsistencyPreferences } from '@/lib/types';
import type { ScheduledService } from '@/services/calendar-service';
import { withCreditTracking, type ModelVersion } from '@/lib/credit-integration';
import { createClient as createServerSupabase } from '@/lib/supabase-server';
import { brandProfileSupabaseService } from '@/lib/supabase/services/brand-profile-service';
import { BusinessProfileResolver } from '@/ai/business-profile/resolver';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      revoModel,
      brandProfile,
      platform,
      brandConsistency,
      useLocalLanguage = false,
      scheduledServices = [],
      includePeopleInDesigns = true
    }: {
      revoModel: 'revo-1.0' | 'revo-1.5';
      brandProfile: BrandProfile;
      platform: Platform;
      brandConsistency?: BrandConsistencyPreferences;
      useLocalLanguage?: boolean;
      scheduledServices?: ScheduledService[];
      includePeopleInDesigns?: boolean;
    } = body;

    // Validate required parameters
    if (!brandProfile || !platform) {
      return NextResponse.json(
        { error: 'Missing required parameters: brandProfile and platform are required' },
        { status: 400 }
      );
    }

    // 🔄 FETCH FRESH BRAND PROFILE DATA FROM DATABASE
    // This ensures we always use the latest colors and data, not cached frontend data
    let freshBrandProfile: BrandProfile = brandProfile;

    if (brandProfile.id) {
      console.log('🔄 [QuickContent] Fetching fresh brand profile from database:', brandProfile.id);
      try {
        const latestProfile = await brandProfileSupabaseService.loadBrandProfile(brandProfile.id);
        if (latestProfile) {
          freshBrandProfile = latestProfile;
          console.log('✅ [QuickContent] Fresh brand profile loaded with colors:', {
            primaryColor: latestProfile.primaryColor,
            accentColor: latestProfile.accentColor,
            backgroundColor: latestProfile.backgroundColor,
            businessName: latestProfile.businessName
          });
        } else {
          console.warn('⚠️ [QuickContent] Could not load fresh profile, using provided data');
        }
      } catch (error) {
        console.error('❌ [QuickContent] Error loading fresh profile:', error);
        console.log('⚠️ [QuickContent] Falling back to provided brand profile data');
      }
    } else {
      console.log('⚠️ [QuickContent] No brand profile ID provided, using frontend data');
    }

    // Use passed services directly - brand filtering should happen on frontend
    let brandSpecificServices: ScheduledService[] = scheduledServices || [];

    let result;

    try {
      // Get user ID from headers (would be set by middleware in production)
      // Using test user ID for consistency with other Revo routes
      const userId = 'test-user-id'; // TODO: Get from authentication
      const user = { id: userId };

      const modelVersion: ModelVersion = revoModel === 'revo-1.5' ? 'revo-1.5' : 'revo-1.0';

      if (revoModel === 'revo-1.5') {
        // Use Revo 1.5 enhanced generation - Skip credits check for testing (consistent with other routes)
        result = await generateRevo15ContentAction(
          freshBrandProfile, // Use fresh data from database
          platform,
          brandConsistency || { strictConsistency: false, followBrandColors: true, includeContacts: false },
          '',
          {
            aspectRatio: '1:1',
            visualStyle: freshBrandProfile.visualStyle || 'modern',
            includePeopleInDesigns,
            useLocalLanguage
          },
          brandSpecificServices
        );
      } else {
        // Use Revo 1.0 with Business Profile Resolver (strict validation)
        const resolver = new BusinessProfileResolver();

        // Resolve business profile with strict validation
        let resolvedProfile;
        try {
          resolvedProfile = await resolver.resolveProfile(
            freshBrandProfile.id || freshBrandProfile.businessName || 'unknown',
            userId,
            freshBrandProfile as any,
            {
              allowExternalContext: false, // Disable external context by default
              requireContacts: true,
              strictValidation: true
            }
          );

          // Validate for generation
          const validation = resolver.validateForGeneration(resolvedProfile, {
            requireContacts: true,
            strictValidation: true
          });

          if (!validation.valid) {
            return NextResponse.json(
              { 
                error: `Business profile validation failed: ${validation.errors.join(', ')}`,
                details: 'Please complete your business profile with all required information.',
                missingFields: resolvedProfile.completeness.missingCritical
              },
              { status: 400 }
            );
          }

        } catch (error) {
          // Fallback for Paya testing
          if (freshBrandProfile.businessName?.toLowerCase().includes('paya')) {
            const sampleProfile = BusinessProfileResolver.getSampleProfile();
            resolvedProfile = {
              id: 'paya-sample',
              ...sampleProfile,
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
                brandVoice: 'missing',
                brandColors: 'user',
                logoUrl: 'missing',
                logoDataUrl: 'missing',
                designExamples: 'missing'
              },
              completeness: {
                score: 85,
                missingCritical: [],
                missingOptional: ['brandVoice', 'logoUrl']
              }
            };
          } else {
            return NextResponse.json(
              { 
                error: `Failed to resolve business profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
                details: 'Please ensure your business profile is complete and try again.'
              },
              { status: 400 }
            );
          }
        }

        const { generateRevo10Content } = await import('@/ai/revo-1.0-service');

        const today = new Date();
        const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
        const currentDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Convert services to string format
        const servicesString = resolvedProfile.services
          ? resolvedProfile.services.map(service => 
              `${service.name}: ${service.description || ''}`
            ).join('\n')
          : '';

        const keyFeaturesString = resolvedProfile.keyFeatures
          ? resolvedProfile.keyFeatures.join('\n')
          : '';

        const competitiveAdvantagesString = resolvedProfile.competitiveAdvantages
          ? resolvedProfile.competitiveAdvantages.join('\n')
          : '';

        // Format location
        const locationString = resolvedProfile.location
          ? `${resolvedProfile.location.city || ''}, ${resolvedProfile.location.country || ''}`.replace(/^,\s*|,\s*$/g, '')
          : '';

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
          visualStyle: freshBrandProfile.visualStyle || 'modern',
          // Include contact information for contacts toggle
          includeContacts: !!(resolvedProfile.contact?.phone || resolvedProfile.contact?.email),
          contactInfo: resolvedProfile.contact || {},
          websiteUrl: resolvedProfile.contact?.website || ''
        });

        // Generate image using Revo 1.0 image service
        const { generateRevo10Image } = await import('@/ai/revo-1.0-service');

        // Prepare structured text for image
        const imageTextComponents = [];
        if (revo10Result.catchyWords) imageTextComponents.push(revo10Result.catchyWords);
        if (revo10Result.subheadline) imageTextComponents.push(revo10Result.subheadline);
        if (revo10Result.callToAction) imageTextComponents.push(revo10Result.callToAction);

        const structuredImageText = imageTextComponents.join(' | ');

        // 🎨📞 ENHANCED VALIDATION FOR BRAND COLORS AND CONTACT INFO (using fresh data)
        const finalPrimaryColor = freshBrandProfile.primaryColor || '#3B82F6';
        const finalAccentColor = freshBrandProfile.accentColor || '#1E40AF';
        const finalBackgroundColor = freshBrandProfile.backgroundColor || '#FFFFFF';

        const finalContactInfo = {
          phone: freshBrandProfile.contactInfo?.phone || (freshBrandProfile as any).phone || '',
          email: freshBrandProfile.contactInfo?.email || (freshBrandProfile as any).email || '',
          address: freshBrandProfile.contactInfo?.address || freshBrandProfile.location || ''
        };

        const finalWebsiteUrl = freshBrandProfile.websiteUrl || (freshBrandProfile as any).websiteUrl || '';

        console.log('🎨 [QuickContent] Brand Colors Validation (Fresh Data):', {
          frontendPrimaryColor: brandProfile.primaryColor,
          frontendAccentColor: brandProfile.accentColor,
          frontendBackgroundColor: brandProfile.backgroundColor,
          freshPrimaryColor: freshBrandProfile.primaryColor,
          freshAccentColor: freshBrandProfile.accentColor,
          freshBackgroundColor: freshBrandProfile.backgroundColor,
          finalPrimaryColor,
          finalAccentColor,
          finalBackgroundColor,
          followBrandColors: brandConsistency?.followBrandColors,
          hasValidColors: !!(freshBrandProfile.primaryColor && freshBrandProfile.accentColor && freshBrandProfile.backgroundColor),
          colorsChanged: (brandProfile.primaryColor !== freshBrandProfile.primaryColor ||
            brandProfile.accentColor !== freshBrandProfile.accentColor ||
            brandProfile.backgroundColor !== freshBrandProfile.backgroundColor)
        });

        console.log('📞 [QuickContent] Contact Info Validation (Fresh Data):', {
          includeContacts: brandConsistency?.includeContacts,
          frontendContactInfo: brandProfile.contactInfo,
          freshContactInfo: freshBrandProfile.contactInfo,
          finalContactInfo,
          finalWebsiteUrl,
          hasValidContacts: !!(finalContactInfo.phone || finalContactInfo.email || finalWebsiteUrl)
        });

        // Skip credits check for testing (consistent with other Revo routes)
        try {
          // Enhanced brand color extraction with fallbacks (using fresh data)
          const brandColors = (freshBrandProfile as any).brand_colors || {};
          const primaryColor = brandColors.primaryColor || freshBrandProfile.primaryColor || '#3B82F6';
          const accentColor = brandColors.accentColor || freshBrandProfile.accentColor || '#1E40AF';
          const backgroundColor = brandColors.backgroundColor || freshBrandProfile.backgroundColor || '#FFFFFF';

          console.log('🎨 Brand colors for generation (Fresh Data):', {
            primaryColor,
            accentColor,
            backgroundColor,
            fromFreshProfile: true,
            brandId: freshBrandProfile.id
          });

          const imageResult = await generateRevo10Image({
            businessType: resolvedProfile.businessType,
            businessName: resolvedProfile.businessName,
            platform: platform.toLowerCase(),
            visualStyle: freshBrandProfile.visualStyle || 'modern',
            primaryColor: resolvedProfile.brandColors?.primary || finalPrimaryColor,
            accentColor: resolvedProfile.brandColors?.secondary || finalAccentColor,
            backgroundColor: finalBackgroundColor,
            imageText: structuredImageText,
            designDescription: `Professional ${resolvedProfile.businessType} content with structured headline, subheadline, and CTA for ${platform.toLowerCase()}`,
            logoDataUrl: resolvedProfile.logoDataUrl || freshBrandProfile.logoDataUrl,
            logoUrl: resolvedProfile.logoUrl || (freshBrandProfile as any).logoUrl,
            location: locationString,
            headline: revo10Result.catchyWords,
            subheadline: revo10Result.subheadline,
            callToAction: revo10Result.callToAction,
            includeContacts: !!(resolvedProfile.contact?.phone || resolvedProfile.contact?.email),
            contactInfo: resolvedProfile.contact || {},
            websiteUrl: resolvedProfile.contact?.website || '',
            includePeople: includePeopleInDesigns,
            scheduledServices: brandSpecificServices || [],
            // Brand colors toggle
            followBrandColors: brandConsistency?.followBrandColors !== false // Default to true
          });

          // Convert to GeneratedPost format
          result = {
            id: `revo10-${Date.now()}`,
            date: new Date().toISOString(),
            platform: platform.toLowerCase(),
            postType: 'post' as const,
            imageUrl: imageResult.imageUrl,
            content: revo10Result.content,
            hashtags: revo10Result.hashtags,
            status: 'generated' as const,
            variants: [{
              platform: platform.toLowerCase(),
              imageUrl: imageResult.imageUrl
            }],
            catchyWords: revo10Result.catchyWords,
            subheadline: revo10Result.subheadline,
            callToAction: revo10Result.callToAction,
            metadata: {
              model: 'Revo 1.0 Enhanced',
              aiService: 'gemini-2.5-flash-image-preview',
              // Preserve enhanced metadata from Revo 1.0 model
              ...(revo10Result.metadata || {}),
              qualityScore: revo10Result.qualityScore || 8.5,
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
          } as const;
        } catch (revo10Error) {
          console.error('❌ Revo 1.0 generation error:', revo10Error);
          throw revo10Error;
        }
      }
    } catch (generationError) {
      console.error(`❌ ${revoModel} generation failed:`, generationError);

      // Check if it's already a user-friendly error message
      if (generationError instanceof Error &&
        (generationError.message.includes('🚀') ||
          generationError.message.includes('🔧') ||
          generationError.message.includes('🎨'))) {
        throw generationError; // Pass through user-friendly messages
      }

      // Pass through the actual error message (no masking)
      throw generationError;
    }

    // Validate result before returning
    if (!result) {
      return NextResponse.json(
        { error: `${revoModel} generation returned null result` },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Quick Content API Error:', error);
    // Provide user-friendly error messages without re-reading the request body
    let errorMessage = 'Content generation failed';
    if (error instanceof Error) {
      if (error.message.includes('🚀') || error.message.includes('🔧') || error.message.includes('🎨')) {
        errorMessage = error.message;
      } else {
        errorMessage = `🚀 ${revoModel || 'The AI model'} is being updated! Try a different model or wait a moment for amazing results.`;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}