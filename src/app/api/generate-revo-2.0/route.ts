/**
 * Revo 2.0 Enhanced Generation API Route
 * Uses sophisticated content generation with business intelligence
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateWithRevo20 } from '@/ai/revo-2.0-service';
import { withSubscriptionGuard } from '@/lib/middleware/subscription-guard-server';
import { SubscriptionService } from '@/lib/subscription/subscription-service';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from headers (would be set by middleware in production)
    const userId = 'test-user-id'; // TODO: Get from authentication

    const body = await request.json();
    const {
      businessType,
      platform,
      brandProfile,
      visualStyle,
      imageText,
      aspectRatio,
      includePeopleInDesigns,
      useLocalLanguage,
      includeContacts,
      scheduledServices // NEW: Extract scheduled services from request
    } = body;

    // Validate required fields
    if (!businessType || !platform || !brandProfile) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: businessType, platform, brandProfile'
      }, { status: 400 });
    }

    console.log('Revo 2.0 Enhanced generation request:', {
      userId,
      businessType,
      platform,
      visualStyle: visualStyle || 'modern',
      aspectRatio: aspectRatio || '1:1'
    });

    console.log('🌍 Brand Profile Location Check:', {
      location: brandProfile?.location,
      hasLocation: !!brandProfile?.location,
      locationType: typeof brandProfile?.location,
      brandProfileKeys: Object.keys(brandProfile || {})
    });

    // Log scheduled services integration
    console.log('📅 [Revo 2.0 API] Scheduled Services Integration:', {
      hasScheduledServices: !!(scheduledServices && scheduledServices.length > 0),
      scheduledServicesCount: scheduledServices?.length || 0,
      todaysServicesCount: scheduledServices?.filter((s: any) => s.isToday).length || 0,
      upcomingServicesCount: scheduledServices?.filter((s: any) => s.isUpcoming).length || 0,
      scheduledServiceNames: scheduledServices?.map((s: any) => s.serviceName) || [],
      todaysServiceNames: scheduledServices?.filter((s: any) => s.isToday).map((s: any) => s.serviceName) || [],
      upcomingServiceNames: scheduledServices?.filter((s: any) => s.isUpcoming).map((s: any) => s.serviceName) || []
    });

    // Generate content with Revo 2.0 Enhanced
    const result = await generateWithRevo20({
      businessType,
      platform,
      visualStyle: visualStyle || 'modern',
      imageText: imageText || '',
      brandProfile,
      aspectRatio,
      includePeopleInDesigns,
      useLocalLanguage,
      includeContacts: !!includeContacts,
      scheduledServices: scheduledServices // NEW: Pass scheduled services to Revo 2.0
    });


    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      model: result.model,
      qualityScore: result.qualityScore,
      processingTime: result.processingTime,
      enhancementsApplied: result.enhancementsApplied,
      headline: result.headline,
      subheadline: result.subheadline,
      caption: result.caption,
      captionVariations: result.captionVariations,
      cta: result.cta,
      hashtags: result.hashtags,
      businessIntelligence: result.businessIntelligence,
      message: 'Revo 2.0 Enhanced content generated successfully'
    });

  } catch (error) {

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Revo 2.0 Enhanced generation failed'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Revo 2.0 Enhanced Generation API',
    description: 'Use POST method to generate sophisticated content with Revo 2.0',
    requiredFields: ['businessType', 'platform', 'brandProfile'],
    optionalFields: ['visualStyle', 'imageText', 'aspectRatio'],
    model: 'Gemini 2.5 Flash Image Preview with Business Intelligence',
    version: '2.0.1',
    features: [
      'Business-specific headlines',
      'Strategic subheadlines',
      'Sophisticated captions',
      'Compelling CTAs',
      'AI-powered hashtags',
      'Business intelligence analysis'
    ]
  });
}