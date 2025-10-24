// src/app/api/quick-content/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateContentAction } from '@/app/actions';
import { generateRevo15ContentAction } from '@/app/actions/revo-1.5-actions';
import type { BrandProfile, Platform, BrandConsistencyPreferences } from '@/lib/types';
import type { ScheduledService } from '@/services/calendar-service';
import { withCreditTracking, type ModelVersion } from '@/lib/credit-integration';
import { createClient as createServerSupabase } from '@/lib/supabase-server';

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

    // Use passed services directly - brand filtering should happen on frontend
    let brandSpecificServices: ScheduledService[] = scheduledServices || [];


    let result;

    try {
      // Resolve authenticated user for credit deduction
      let user;
      try {
        const supabase = await createServerSupabase();
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error('❌ [QuickContent] Auth error:', error);
          return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
        }
        user = data?.user;
      } catch (authError) {
        console.error('❌ [QuickContent] Supabase client error:', authError);
        return NextResponse.json({ error: 'Server authentication error' }, { status: 500 });
      }

      if (!user?.id) {
        console.error('❌ [QuickContent] No user found in session');
        return NextResponse.json({ error: 'Unauthorized - please login' }, { status: 401 });
      }

      const modelVersion: ModelVersion = revoModel === 'revo-1.5' ? 'revo-1.5' : 'revo-1.0';

      if (revoModel === 'revo-1.5') {
        // Use Revo 1.5 enhanced generation (no fallback - fix the real issue)
        const wrapped = await withCreditTracking(
          {
            userId: user.id,
            modelVersion,
            feature: 'social_media_content',
            generationType: 'quick_content',
            metadata: { platform, brandId: (brandProfile as any)?.id }
          },
          async () =>
            await generateRevo15ContentAction(
              brandProfile,
              platform,
              brandConsistency || { strictConsistency: false, followBrandColors: true, includeContacts: false },
              '',
              {
                aspectRatio: '1:1',
                visualStyle: brandProfile.visualStyle || 'modern',
                includePeopleInDesigns,
                useLocalLanguage
              },
              brandSpecificServices
            )
        );
        if (!wrapped.success) {
          return NextResponse.json({ error: wrapped.error || wrapped.creditInfo?.message || 'Credit deduction failed' }, { status: 402 });
        }
        result = wrapped.result;
      } else {
        // Use Revo 1.0 direct generation (same as working /api/advanced-content)
        const { generateRevo10Content } = await import('@/ai/revo-1.0-service');

        const today = new Date();
        const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
        const currentDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const revo10Result = await generateRevo10Content({
          businessType: brandProfile.businessType || 'Business',
          businessName: brandProfile.businessName || brandProfile.name || 'Business',
          location: brandProfile.location || '',
          platform: platform.toLowerCase(),
          writingTone: brandProfile.writingTone || 'professional',
          contentThemes: Array.isArray(brandProfile.contentThemes) ? brandProfile.contentThemes : [brandProfile.contentThemes || ''],
          targetAudience: brandProfile.targetAudience || 'General audience',
          services: brandProfile.services || '',
          keyFeatures: brandProfile.keyFeatures || '',
          competitiveAdvantages: brandProfile.competitiveAdvantages || '',
          dayOfWeek,
          currentDate,
          primaryColor: brandProfile.primaryColor,
          visualStyle: brandProfile.visualStyle,
          // Include contact information for contacts toggle
          includeContacts: brandConsistency?.includeContacts || false,
          contactInfo: brandProfile.contactInfo || {},
          websiteUrl: brandProfile.websiteUrl || ''
        });

        // Generate image using Revo 1.0 image service
        const { generateRevo10Image } = await import('@/ai/revo-1.0-service');

        // Prepare structured text for image
        const imageTextComponents = [];
        if (revo10Result.catchyWords) imageTextComponents.push(revo10Result.catchyWords);
        if (revo10Result.subheadline) imageTextComponents.push(revo10Result.subheadline);
        if (revo10Result.callToAction) imageTextComponents.push(revo10Result.callToAction);

        const structuredImageText = imageTextComponents.join(' | ');

        // 🎨📞 ENHANCED VALIDATION FOR BRAND COLORS AND CONTACT INFO
        const finalPrimaryColor = brandProfile.primaryColor || '#3B82F6';
        const finalAccentColor = brandProfile.accentColor || '#1E40AF';
        const finalBackgroundColor = brandProfile.backgroundColor || '#FFFFFF';

        const finalContactInfo = {
          phone: brandProfile.contactInfo?.phone || (brandProfile as any).phone || '',
          email: brandProfile.contactInfo?.email || (brandProfile as any).email || '',
          address: brandProfile.contactInfo?.address || brandProfile.location || ''
        };

        const finalWebsiteUrl = brandProfile.websiteUrl || (brandProfile as any).websiteUrl || '';

        console.log('🎨 [QuickContent] Brand Colors Validation:', {
          originalPrimaryColor: brandProfile.primaryColor,
          originalAccentColor: brandProfile.accentColor,
          originalBackgroundColor: brandProfile.backgroundColor,
          finalPrimaryColor,
          finalAccentColor,
          finalBackgroundColor,
          followBrandColors: brandConsistency?.followBrandColors,
          hasValidColors: !!(brandProfile.primaryColor && brandProfile.accentColor && brandProfile.backgroundColor)
        });

        console.log('📞 [QuickContent] Contact Info Validation:', {
          includeContacts: brandConsistency?.includeContacts,
          originalContactInfo: brandProfile.contactInfo,
          finalContactInfo,
          finalWebsiteUrl,
          hasValidContacts: !!(finalContactInfo.phone || finalContactInfo.email || finalWebsiteUrl)
        });

        // Wrap image+content generation under credit tracking to ensure deduction
        const wrapped = await withCreditTracking(
          {
            userId: user.id,
            modelVersion,
            feature: 'social_media_content',
            generationType: 'quick_content',
            metadata: { platform, brandId: (brandProfile as any)?.id }
          },
          async () => {
            // Enhanced brand color extraction with fallbacks
            const brandColors = (brandProfile as any).brand_colors || {};
            const primaryColor = brandColors.primaryColor || brandProfile.primaryColor || '#3B82F6';
            const accentColor = brandColors.accentColor || brandProfile.accentColor || '#1E40AF';
            const backgroundColor = brandColors.backgroundColor || brandProfile.backgroundColor || '#FFFFFF';

            console.log('🎨 Brand colors for generation:', { primaryColor, accentColor, backgroundColor });

            const imageResult = await generateRevo10Image({
              businessType: brandProfile.businessType || 'Business',
              businessName: brandProfile.businessName || brandProfile.name || 'Business',
              platform: platform.toLowerCase(),
              visualStyle: brandProfile.visualStyle || 'modern',
              primaryColor: finalPrimaryColor,
              accentColor: finalAccentColor,
              backgroundColor: finalBackgroundColor,
              imageText: structuredImageText,
              designDescription: `Professional ${brandProfile.businessType} content with structured headline, subheadline, and CTA for ${platform.toLowerCase()}`,
              logoDataUrl: brandProfile.logoDataUrl,
              logoUrl: (brandProfile as any).logoUrl,
              location: brandProfile.location,
              headline: revo10Result.catchyWords,
              subheadline: revo10Result.subheadline,
              callToAction: revo10Result.callToAction,
              includeContacts: brandConsistency?.includeContacts || false,
              contactInfo: finalContactInfo,
              websiteUrl: finalWebsiteUrl,
              includePeople: includePeopleInDesigns,
              scheduledServices: brandSpecificServices || []
            });

            // Convert to GeneratedPost format
            return {
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
                aiService: 'gemini-2.5-flash-image-preview'
              }
            } as const;
          }
        );
        if (!wrapped.success) {
          return NextResponse.json({ error: wrapped.error || wrapped.creditInfo?.message || 'Credit deduction failed' }, { status: 402 });
        }
        result = wrapped.result;
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