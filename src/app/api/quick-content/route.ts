// src/app/api/quick-content/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateContentAction } from '@/app/actions';
import { generateRevo15ContentAction } from '@/app/actions/revo-1.5-actions';
import type { BrandProfile, Platform, BrandConsistencyPreferences } from '@/lib/types';
import type { ScheduledService } from '@/services/calendar-service';

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

    console.log(`🚀 Quick Content API: Processing ${revoModel} request for ${platform}`);
    console.log(`🔍 Brand Profile ID: ${(brandProfile as any)?.id || 'No ID'}`);
    console.log(`📅 Scheduled Services Count: ${scheduledServices?.length || 0}`);
    console.log(`📋 Scheduled Services: ${scheduledServices?.map(s => s.serviceName).join(', ') || 'None'}`);

    // Validate required parameters
    if (!brandProfile || !platform) {
      return NextResponse.json(
        { error: 'Missing required parameters: brandProfile and platform are required' },
        { status: 400 }
      );
    }

    // Use passed services directly - brand filtering should happen on frontend
    let brandSpecificServices: ScheduledService[] = scheduledServices || [];
    console.log(`✅ Using provided services:`, {
      serviceCount: brandSpecificServices.length,
      serviceNames: brandSpecificServices.map(s => s.serviceName)
    });

    let result;

    try {
      if (revoModel === 'revo-1.5') {
        // Use Revo 1.5 enhanced generation (no fallback - fix the real issue)
        result = await generateRevo15ContentAction(
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
        );
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
          visualStyle: brandProfile.visualStyle
        });

        // Generate image using Revo 1.0 image service
        const { generateRevo10Image } = await import('@/ai/revo-1.0-service');

        // Prepare structured text for image
        const imageTextComponents = [];
        if (revo10Result.catchyWords) imageTextComponents.push(revo10Result.catchyWords);
        if (revo10Result.subheadline) imageTextComponents.push(revo10Result.subheadline);
        if (revo10Result.callToAction) imageTextComponents.push(revo10Result.callToAction);

        const structuredImageText = imageTextComponents.join(' | ');

        const imageResult = await generateRevo10Image({
          businessType: brandProfile.businessType || 'Business',
          businessName: brandProfile.businessName || brandProfile.name || 'Business',
          platform: platform.toLowerCase(),
          visualStyle: brandProfile.visualStyle || 'modern',
          primaryColor: brandProfile.primaryColor || '#3B82F6',
          accentColor: brandProfile.accentColor || '#1E40AF',
          backgroundColor: brandProfile.backgroundColor || '#FFFFFF',
          imageText: structuredImageText,
          designDescription: `Professional ${brandProfile.businessType} content with structured headline, subheadline, and CTA for ${platform.toLowerCase()}`,
          logoDataUrl: brandProfile.logoDataUrl,
          logoUrl: (brandProfile as any).logoUrl,
          location: brandProfile.location,
          headline: revo10Result.catchyWords,
          subheadline: revo10Result.subheadline,
          callToAction: revo10Result.callToAction,
          includeContacts: brandConsistency?.includeContacts || false,
          contactInfo: {
            phone: (brandProfile as any).phone,
            email: (brandProfile as any).email,
            address: brandProfile.location
          },
          websiteUrl: (brandProfile as any).websiteUrl || '',
          includePeople: includePeopleInDesigns,
          scheduledServices: brandSpecificServices || []
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
            aiService: 'gemini-2.5-flash-image-preview'
          }
        };
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

    console.log(`✅ Quick Content API: ${revoModel} generation successful`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Quick Content API Error:', error);

    // Extract revoModel from request body for error messages
    let requestRevoModel = 'The AI model';
    try {
      const body = await request.json();
      requestRevoModel = body.revoModel || 'The AI model';
    } catch {
      // If we can't parse the body, use default
    }

    // Provide user-friendly error messages
    let errorMessage = 'Content generation failed';
    if (error instanceof Error) {
      if (error.message.includes('🚀') || error.message.includes('🔧') || error.message.includes('🎨')) {
        errorMessage = error.message;
      } else {
        errorMessage = `🚀 ${requestRevoModel} is being updated! Try a different model or wait a moment for amazing results.`;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}