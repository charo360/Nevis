import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessType = searchParams.get('businessType') || 'restaurant';
    const businessName = searchParams.get('businessName') || 'Samaki Cookies';
    const location = searchParams.get('location') || 'Kenya';
    const platform = searchParams.get('platform') || 'instagram';
    const services = searchParams.get('services') || 'food production';
    const targetAudience = searchParams.get('targetAudience') || 'local community';

    // Try to import the viral hashtag engine dynamically to catch import errors
    let hashtagStrategy;
    try {
      const { viralHashtagEngine } = await import('@/ai/viral-hashtag-engine');

      // Test the new advanced hashtag system
      hashtagStrategy = await viralHashtagEngine.generateViralHashtags(
        businessType,
        businessName,
        location,
        platform,
        services,
        targetAudience
      );
    } catch (importError) {
      return NextResponse.json({
        success: false,
        error: 'Import error with viral hashtag engine',
        details: (importError as Error).message,
        stack: (importError as Error).stack,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    console.log('✅ Generated hashtag strategy:', {
      totalHashtags: hashtagStrategy.total.length,
      trending: hashtagStrategy.trending.length,
      viral: hashtagStrategy.viral.length,
      niche: hashtagStrategy.niche.length,
      location: hashtagStrategy.location.length,
      analytics: hashtagStrategy.analytics
    });

    return NextResponse.json({
      success: true,
      message: 'Advanced hashtag system test completed',
      input: {
        businessType,
        businessName,
        location,
        platform,
        services,
        targetAudience
      },
      results: {
        totalHashtags: hashtagStrategy.total,
        categories: {
          trending: hashtagStrategy.trending,
          viral: hashtagStrategy.viral,
          niche: hashtagStrategy.niche,
          location: hashtagStrategy.location,
          community: hashtagStrategy.community,
          seasonal: hashtagStrategy.seasonal,
          platform: hashtagStrategy.platform
        },
        analytics: hashtagStrategy.analytics
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Hashtag test failed:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
