/**
 * Revo 2.0 Testing API Route
 * Tests Gemini 2.5 Flash Image Preview availability and functionality
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Testing Revo 2.0 availability via API...');

    const { testRevo20Availability } = await import('@/ai/revo-2.0-service');

    const isAvailable = await testRevo20Availability();

    return NextResponse.json({
      success: true,
      available: isAvailable,
      model: 'Revo 2.0 (Gemini 2.5 Flash Image Preview)',
      message: isAvailable
        ? 'Revo 2.0 is available and ready!'
        : 'Revo 2.0 is not available. Check API key and model access.'
    });

  } catch (error) {
    console.error('❌ Revo 2.0 test API error:', error);

    return NextResponse.json({
      success: false,
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Revo 2.0 test failed'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType = 'basic' } = body;

    console.log(`🧪 Running ${testType} Revo 2.0 test...`);

    if (testType === 'basic') {
      const { testRevo20Availability } = await import('@/ai/revo-2.0-service');
      const isAvailable = await testRevo20Availability();

      return NextResponse.json({
        success: true,
        testType: 'basic',
        available: isAvailable,
        model: 'Revo 2.0 (Gemini 2.5 Flash Image Preview)',
        message: isAvailable
          ? 'Basic test passed! Revo 2.0 is available.'
          : 'Basic test failed. Revo 2.0 is not available.'
      });
    }

    if (testType === 'generation') {
      const { generateWithRevo20 } = await import('@/ai/revo-2.0-service');
      
      const testOptions = {
        businessType: 'Restaurant',
        platform: 'Instagram' as const,
        visualStyle: 'modern' as const,
        imageText: 'Test Generation',
        brandProfile: {
          businessName: 'Test Restaurant',
          businessType: 'Restaurant',
          location: 'Test City',
          description: 'Test description'
        },
        aspectRatio: '1:1' as const,
        includePeopleInDesigns: false,
        useLocalLanguage: false
      };

      const result = await generateWithRevo20(testOptions);

      return NextResponse.json({
        success: true,
        testType: 'generation',
        available: true,
        result: {
          model: result.model,
          qualityScore: result.qualityScore,
          processingTime: result.processingTime,
          enhancementsApplied: result.enhancementsApplied.length,
          hasImage: !!result.imageUrl,
          hasCaption: !!result.caption,
          hasHashtags: result.hashtags.length > 0
        },
        message: 'Generation test passed! Revo 2.0 is fully functional.'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid test type. Use: basic or generation'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Revo 2.0 test error:', error);

    return NextResponse.json({
      success: false,
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Revo 2.0 test failed'
    }, { status: 500 });
  }
}
