/**
 * Revo 2.0 Generation API Route
 * Uses Gemini 2.5 Flash Image Preview for next-generation content creation
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

      businessType,
      platform,
      visualStyle: visualStyle || 'modern',
      aspectRatio: aspectRatio || '1:1'
    });

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
    optionalFields: ['visualStyle', 'imageText', 'aspectRatio'],
    model: 'Gemini 2.5 Flash Image Preview',
    version: '2.0.0'
  });
}
