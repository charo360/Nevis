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

    // Log scheduled services integration

    // Generate content with Revo 2.0 Enhanced with error handling
    let result;
    try {
      result = await generateWithRevo20({
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
    } catch (generationError) {
      console.error('❌ Revo 2.0 generation failed:', generationError);
      console.error('❌ Full error details:', {
        message: generationError instanceof Error ? generationError.message : 'Unknown error',
        stack: generationError instanceof Error ? generationError.stack : 'No stack trace',
        name: generationError instanceof Error ? generationError.name : 'Unknown'
      });
      // Show actual error for debugging
      const errorMessage = generationError instanceof Error ? generationError.message : 'Unknown error';
      throw new Error(`Revo 2.0 Debug Error: ${errorMessage}`);
    }

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
    console.error('❌ Revo 2.0 API Error:', error);

    // Provide user-friendly error messages
    let errorMessage = 'Revo 2.0 Enhanced generation failed';
    if (error instanceof Error) {
      if (error.message.includes('🚀') || error.message.includes('🔧') || error.message.includes('😴')) {
        errorMessage = error.message;
      } else {
        errorMessage = '🚀 Revo 2.0 is being enhanced with new features! Please try again in a moment.';
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
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