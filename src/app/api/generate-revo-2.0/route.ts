import { NextRequest, NextResponse } from 'next/server';
import { generateWithRevo20 } from '@/ai/revo-2.0-service';
import { BrandProfile } from '@/lib/types';

/**
 * API route for Revo 2.0 content generation
 * This keeps server-side modules on the server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessType,
      platform,
      visualStyle,
      imageText,
      brandProfile,
      aspectRatio = '1:1',
      includePeopleInDesigns = true,
      useLocalLanguage = false
    } = body;

    console.log('🚀 API: Generating content with Revo 2.0...');

    // Validate required fields
    if (!businessType || !platform || !brandProfile) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: businessType, platform, or brandProfile'
      }, { status: 400 });
    }

    // Generate content with Revo 2.0
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

    console.log('✅ API: Revo 2.0 generation completed successfully');

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      model: result.model,
      qualityScore: result.qualityScore,
      processingTime: result.processingTime,
      enhancementsApplied: result.enhancementsApplied,
      caption: result.caption,
      hashtags: result.hashtags,
      message: 'Revo 2.0 content generated successfully'
    });

  } catch (error) {
    console.error('❌ API: Revo 2.0 generation error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Revo 2.0 generation failed'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Revo 2.0 Generation API',
    description: 'Use POST method to generate content with Revo 2.0',
    requiredFields: ['businessType', 'platform', 'brandProfile'],
    optionalFields: ['visualStyle', 'imageText', 'aspectRatio']
  });
}
