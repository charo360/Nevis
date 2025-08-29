/**
 * API endpoint to test Revo 2.0 (Gemini 2.5 Flash Image)
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
      model: 'Revo 2.0 (Gemini 2.5 Flash Image)',
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
    const { 
      testType = 'basic',
      businessType = 'Fintech',
      platform = 'instagram',
      imageText = 'Revo 2.0 Test',
      aspectRatio = '1:1'
    } = body;

    console.log(`🎨 Testing Revo 2.0 ${testType} generation...`);

    if (testType === 'basic') {
      const { testRevo20Availability } = await import('@/ai/revo-2.0-service');
      const isAvailable = await testRevo20Availability();
      
      return NextResponse.json({
        success: true,
        testType: 'basic',
        available: isAvailable,
        message: isAvailable ? 'Basic test passed' : 'Basic test failed'
      });
    }

    if (testType === 'generation') {
      const { generateWithRevo20 } = await import('@/ai/revo-2.0-service');
      
      const testBrandProfile = {
        businessName: 'Test Business',
        businessType,
        primaryColor: '#2563eb',
        accentColor: '#f59e0b',
        backgroundColor: '#ffffff',
        visualStyle: 'modern'
      };

      const result = await generateWithRevo20({
        businessType,
        platform,
        visualStyle: 'modern',
        imageText,
        brandProfile: testBrandProfile,
        aspectRatio: aspectRatio as any
      });

      return NextResponse.json({
        success: true,
        testType: 'generation',
        available: true,
        result: {
          hasImage: !!result.imageUrl,
          imageUrl: result.imageUrl ? result.imageUrl.substring(0, 100) + '...' : null,
          model: result.model,
          processingTime: result.processingTime,
          qualityScore: result.qualityScore,
          enhancementsApplied: result.enhancementsApplied,
          metadata: result.metadata
        },
        message: 'Generation test completed successfully'
      });
    }

    if (testType === 'comprehensive') {
      const { runRevo20TestSuite } = await import('@/ai/test-revo-2.0');
      const results = await runRevo20TestSuite();
      
      return NextResponse.json({
        success: true,
        testType: 'comprehensive',
        available: results.overallSuccess,
        results,
        message: results.overallSuccess 
          ? 'All tests passed! Revo 2.0 is fully operational.' 
          : 'Some tests failed. Check the details.'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid test type. Use: basic, generation, or comprehensive'
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
