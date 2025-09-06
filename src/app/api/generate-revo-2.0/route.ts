/**
 * Revo 2.0 Enhanced Generation API Route
 * Uses sophisticated content generation with business intelligence
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateWithRevo20 } from '@/ai/revo-2.0-service';

export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    const {
      businessType,
      platform,
      brandProfile,
      visualStyle,
      imageText,
      aspectRatio,
      includePeopleInDesigns,
      useLocalLanguage
    } = body;

    // Validate required fields
    if (!businessType || !platform || !brandProfile) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: businessType, platform, brandProfile'
      }, { status: 400 });
    }

    console.log('Revo 2.0 Enhanced generation request:', {
      businessType,
      platform,
      visualStyle: visualStyle || 'modern',
      aspectRatio: aspectRatio || '1:1'
    });

    // Generate content with Revo 2.0 Enhanced
    const result = await generateWithRevo20({
      businessType,
      platform,
      visualStyle: visualStyle || 'modern',
      imageText: imageText || `${brandProfile.businessName || businessType} - Premium Content`,
      brandProfile,
      aspectRatio,
      includePeopleInDesigns,
      useLocalLanguage
    });


    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      model: result.model,
      qualityScore: result.qualityScore,
      processingTime: result.processingTime,
      enhancementsApplied: result.enhancementsApplied,
<<<<<<< HEAD
      headline: result.headline,
      subheadline: result.subheadline,
      caption: result.caption,
      cta: result.cta,
      hashtags: result.hashtags,
      businessIntelligence: result.businessIntelligence,
=======
      caption: result.caption,
      hashtags: result.hashtags,
>>>>>>> 46f32151ed9503d241dab0f668e479a278288e2c
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
<<<<<<< HEAD
      'Business-specific headlines',
      'Strategic subheadlines',
      'Sophisticated captions',
      'Compelling CTAs',
      'AI-powered hashtags',
      'Business intelligence analysis'
=======
      'Creative concept generation',
      'Enhanced prompt engineering',
      'Brand consistency optimization',
      'Platform-specific formatting',
      'Cultural relevance integration',
      'AI-powered captions',
      'Smart hashtag generation'
>>>>>>> 46f32151ed9503d241dab0f668e479a278288e2c
    ]
  });
}