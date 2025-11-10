// src/app/api/quick-content/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateContentAction } from '@/app/actions';
import { generateRevo15ContentAction } from '@/app/actions/revo-1.5-actions';
import { generateRevo1ContentAction } from '@/app/actions/revo-1-actions';
import type { BrandProfile, Platform, BrandConsistencyPreferences } from '@/lib/types';

import type { ScheduledService } from '@/services/calendar-service';
import { withCreditTracking, type ModelVersion } from '@/lib/credit-integration';
import { createClient as createServerSupabase } from '@/lib/supabase-server';
import { brandProfileSupabaseService } from '@/lib/supabase/services/brand-profile-service';
import { BusinessProfileResolver } from '@/ai/business-profile/resolver';
import { normalizeStringList, normalizeServiceList } from '@/ai/revo/shared-pipeline';

type ExtendedBrandProfile = BrandProfile & {
  id?: string;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
  brandColors?: {
    primary?: string;
    secondary?: string;
    background?: string;
  };
  brandVoice?: string;
};

type LooseBrandProfile = ExtendedBrandProfile | Record<string, unknown> | null | undefined;

const normalizeBrandProfileInput = (input: LooseBrandProfile): ExtendedBrandProfile => {
  const record = (input ?? {}) as Record<string, any>;

  const toString = (value: unknown, fallback = ''): string => {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return fallback;
    return String(value);
  };

  const normalizeLocation = (): string => {
    const value = record.location;
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      const { city, region, country } = value as Record<string, string>;
      return [city, region, country].filter(Boolean).join(', ');
    }
    return '';
  };

  const servicesList = normalizeServiceList(record.services);
  const keyFeaturesList = normalizeStringList(record.keyFeatures);
  const competitiveAdvantagesList = normalizeStringList(record.competitiveAdvantages);

  const idValue = toString(record.id || record.brandId || '');

  return {
    businessName: toString(record.businessName),
    businessType: toString(record.businessType),
    location: normalizeLocation(),
    visualStyle: toString(record.visualStyle || 'modern'),
    writingTone: toString(record.writingTone || 'professional'),
    contentThemes: toString(record.contentThemes || ''),
    websiteUrl: toString(record.websiteUrl || record.website || ''),
    description: toString(record.description || ''),
    services: servicesList.join('\n'),
    targetAudience: toString(record.targetAudience || ''),
    keyFeatures: keyFeaturesList.join('\n'),
    competitiveAdvantages: competitiveAdvantagesList.join('\n'),
    contactInfo: {
      phone: toString(record.contactInfo?.phone ?? record.contact?.phone ?? ''),
      email: toString(record.contactInfo?.email ?? record.contact?.email ?? ''),
      address: toString(record.contactInfo?.address ?? record.contact?.address ?? ''),
    },
    contact: record.contact as ExtendedBrandProfile['contact'],
    brandVoice: toString(record.brandVoice || record.writingTone || ''),
    socialMedia: record.socialMedia as BrandProfile['socialMedia'],
    primaryColor: toString(record.primaryColor ?? record.brandColors?.primary ?? ''),
    accentColor: toString(record.accentColor ?? record.brandColors?.secondary ?? ''),
    backgroundColor: toString(record.backgroundColor ?? record.brandColors?.background ?? ''),
    brandColors: record.brandColors as ExtendedBrandProfile['brandColors'],
    designExamples: Array.isArray(record.designExamples) ? record.designExamples : undefined,
    productImages: Array.isArray(record.productImages) ? record.productImages as BrandProfile['productImages'] : undefined,
    productImageDescriptions: record.productImageDescriptions as BrandProfile['productImageDescriptions'],
    logoUrl: toString(record.logoUrl ?? record.logo_url ?? ''),
    logoDataUrl: toString(record.logoDataUrl ?? record.logo_data_url ?? ''),
    id: idValue || undefined,
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 [QuickContent] Raw request body:', body);
    const {
      revoModel,
      brandProfile: rawBrandProfile,
      platform,
      brandConsistency,
      useLocalLanguage = false,
      scheduledServices = [],
      includePeopleInDesigns = true
    } = body as {
      revoModel: 'revo-1.0' | 'revo-1.5';
      brandProfile: LooseBrandProfile;
      platform: Platform;
      brandConsistency?: BrandConsistencyPreferences;
      useLocalLanguage?: boolean;
      scheduledServices?: ScheduledService[];
      includePeopleInDesigns?: boolean;
    };

    // Validate required parameters
    if (!rawBrandProfile || !platform) {
      return NextResponse.json(
        { error: 'Missing required parameters: brandProfile and platform are required' },
        { status: 400 }
      );
    }

    // Normalize incoming profile so downstream logic always works with expected structure
    const normalizedBrandProfile = normalizeBrandProfileInput(rawBrandProfile);

    // 🔄 FETCH FRESH BRAND PROFILE DATA FROM DATABASE
    // This ensures we always use the latest colors and data, not cached frontend data
    let freshBrandProfile: ExtendedBrandProfile = normalizedBrandProfile;

    if (normalizedBrandProfile.id) {
      console.log('🔄 [QuickContent] Fetching fresh brand profile from database:', normalizedBrandProfile.id);
      try {
        const latestProfile = await brandProfileSupabaseService.loadBrandProfile(normalizedBrandProfile.id);
        if (latestProfile) {
          freshBrandProfile = normalizeBrandProfileInput(latestProfile as unknown as ExtendedBrandProfile);
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
      console.log(' [QuickContent] No brand profile ID provided, using frontend data');
    }

    const normalizedFrontendProfile = normalizedBrandProfile;

    type VisualStyleOption = 'bold' | 'modern' | 'minimalist' | 'elegant' | 'playful' | 'professional';
    const allowedVisualStyles: VisualStyleOption[] = ['bold', 'modern', 'minimalist', 'elegant', 'playful', 'professional'];

    const getSafeVisualStyle = (value: string | undefined): VisualStyleOption => {
      if (value && allowedVisualStyles.includes(value as VisualStyleOption)) {
        return value as VisualStyleOption;
      }
      return 'modern';
    };

    // Use passed services directly - brand filtering should happen on frontend
    let brandSpecificServices: ScheduledService[] = scheduledServices || [];

    let result;

    try {
      // Get user ID from headers (would be set by middleware in production)
      // Using test user ID for consistency with other Revo routes
      const userId = 'test-user-id'; // TODO: Get from authentication
      const user = { id: userId };

      const modelVersion: ModelVersion = revoModel === 'revo-1.5' ? 'revo-1.5' : revoModel === 'revo-2.0' ? 'revo-2.0' : 'revo-1.0';

      if (revoModel === 'revo-2.0') {
        // Use Revo 2.0 unified architecture (perfect format that others should follow)
        const { generateRevo2ContentAction } = await import('@/app/actions/revo-2-actions');
        result = await generateRevo2ContentAction(
          freshBrandProfile as BrandProfile,
          platform,
          brandConsistency || { strictConsistency: false, followBrandColors: true, includeContacts: false },
          '',
          {
            aspectRatio: '1:1',
            visualStyle: getSafeVisualStyle(freshBrandProfile.visualStyle),
            includePeopleInDesigns,
            useLocalLanguage
          },
          brandSpecificServices
        );
      } else if (revoModel === 'revo-1.5') {
        // Use Revo 1.5 enhanced generation - Skip credits check for testing (consistent with other routes)
        result = await generateRevo15ContentAction(
          freshBrandProfile as BrandProfile, // Use fresh data from database
          platform,
          brandConsistency || { strictConsistency: false, followBrandColors: true, includeContacts: false },
          '',
          {
            aspectRatio: '1:1',
            visualStyle: getSafeVisualStyle(freshBrandProfile.visualStyle),
            includePeopleInDesigns,
            useLocalLanguage
          },
          brandSpecificServices
        );

        // 🔄 UPLOAD REVO 1.5 IMAGE TO SUPABASE STORAGE (Fix broken images)
        if (result && result.imageUrl && result.imageUrl.startsWith('data:')) {
          try {
            console.log('📤 [QuickContent] Uploading Revo 1.5 image to Supabase...');

            // Check if Supabase is properly configured
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            console.log('🔍 [QuickContent] Revo 1.5 Supabase config check:', {
              hasUrl: !!supabaseUrl,
              urlLength: supabaseUrl?.length || 0,
              hasKey: !!supabaseKey,
              keyLength: supabaseKey?.length || 0
            });

            if (!supabaseUrl || !supabaseKey || supabaseKey === 'REPLACE_WITH_REAL_ANON_KEY_FROM_SUPABASE_DASHBOARD') {
              console.warn('⚠️ [QuickContent] Supabase not configured - keeping data URL for Revo 1.5');
              console.warn('⚠️ [QuickContent] URL present:', !!supabaseUrl);
              console.warn('⚠️ [QuickContent] Key present:', !!supabaseKey);
              // Keep data URL - images will work in current session but not persist
            } else {
              console.log('📤 [QuickContent] Revo 1.5 Data URL length:', result.imageUrl.length);
              console.log('📤 [QuickContent] User ID:', userId);
              console.log('📤 [QuickContent] Brand ID:', freshBrandProfile.id);

              const { SupabasePostStorageService } = await import('@/lib/services/supabase-post-storage');
              const storageService = new SupabasePostStorageService();

              const uploadResult = await storageService.uploadImageFromDataUrl(
                result.imageUrl,
                userId,
                freshBrandProfile.id || 'unknown-brand',
                `revo15-${Date.now()}.png`
              );

              console.log('📤 [QuickContent] Revo 1.5 Upload result:', {
                success: uploadResult.success,
                url: uploadResult.url?.substring(0, 100) + '...',
                error: uploadResult.error
              });

              if (uploadResult.success && uploadResult.url) {
                console.log('✅ [QuickContent] Revo 1.5 image uploaded successfully:', uploadResult.url);
                result.imageUrl = uploadResult.url; // Replace data URL with hosted URL

                // Also update variants if they exist
                if (result.variants) {
                  result.variants = result.variants.map(variant => ({
                    ...variant,
                    imageUrl: uploadResult.url
                  }));
                }
              } else {
                console.warn('⚠️ [QuickContent] Revo 1.5 image upload failed, keeping data URL:', uploadResult.error);
              }
            }
          } catch (uploadError) {
            console.error('❌ [QuickContent] Revo 1.5 image upload error:', uploadError);
            console.error('❌ [QuickContent] Revo 1.5 Upload error stack:', uploadError instanceof Error ? uploadError.stack : 'No stack');
          }
        }
      } else {
        // Use Revo 1.0 unified architecture (same pattern as Revo 2.0)
        result = await generateRevo1ContentAction(
          freshBrandProfile as BrandProfile, // Use fresh data from database
          platform,
          brandConsistency || { strictConsistency: false, followBrandColors: true, includeContacts: false },
          '',
          {
            aspectRatio: '1:1',
            visualStyle: getSafeVisualStyle(freshBrandProfile.visualStyle),
            includePeopleInDesigns,
            useLocalLanguage
          },
          brandSpecificServices
        );
      }
    } catch (generationError) {
      console.error(` [QuickContent] ${revoModel} generation failed:`, generationError);
      console.error(` [QuickContent] ${revoModel} error stack:`, generationError instanceof Error ? generationError.stack : 'No stack');
      console.error(` [QuickContent] ${revoModel} error details:`, JSON.stringify(generationError, null, 2));

      const errorMessage = generationError instanceof Error
        ? generationError.message
        : 'Unknown error occurred during content generation';

      return NextResponse.json(
        {
          error: errorMessage,
          details: generationError instanceof Error ? {
            message: generationError.message,
            stack: generationError.stack,
            name: generationError.name
          } : generationError,
          message: `${revoModel} generation failed`,
        },
        { status: 500 }
      );
    }

    // Validate result before returning
    if (!result) {
      return NextResponse.json(
        { error: `${revoModel} generation returned null result` },
        { status: 500 }
      );
    }

    const diagnostics = {
      supabaseConfig: {
        hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        hasKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length ?? 0,
        keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length ?? 0,
        urlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 20) || 'missing',
        keyPreview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10) || 'missing'
      }
    };

    console.log('✅ [QuickContent] Returning result with imageUrl type:', typeof result.imageUrl);
    console.log('✅ [QuickContent] ImageUrl starts with data:', result.imageUrl?.startsWith('data:'));
    console.log('✅ [QuickContent] ImageUrl starts with http:', result.imageUrl?.startsWith('http'));
    console.log('✅ [QuickContent] ImageUrl length:', result.imageUrl?.length || 0);
    console.log('✅ [QuickContent] Diagnostics:', diagnostics);

    return NextResponse.json({
      ...result,
      diagnostics
    });
  } catch (error) {
    console.error('❌ Quick Content API Error:', error);
    console.error('❌ Quick Content Error Details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    // DEVELOPMENT MODE: Show actual error
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
          details: error
        },
        { status: 500 }
      );
    }
    
    // Provide user-friendly error messages without re-reading the request body
    let errorMessage = 'Content generation failed';
    if (error instanceof Error) {
      if (error.message.includes('🚀') || error.message.includes('🔧') || error.message.includes('🎨')) {
        errorMessage = error.message;
      } else {
        errorMessage = '🚀 The AI model is being updated! Try a different model or wait a moment for amazing results.';
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}