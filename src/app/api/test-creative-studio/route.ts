import { NextRequest, NextResponse } from 'next/server';
import { generateCreativeAssetAction } from '@/app/actions';

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json();
    
    // Call the actual Creative Studio action
    const result = await generateCreativeAssetAction(
      body.prompt,
      body.outputType,
      body.referenceAssetUrl,
      body.useBrandProfile,
      body.brandProfile,
      body.maskDataUrl,
      body.aspectRatio,
      body.preferredModel
    );
    
    
    return NextResponse.json({
      success: true,
      result: {
        imageUrl: result.imageUrl,
        videoUrl: result.videoUrl,
        aiExplanation: result.aiExplanation,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ [Test Creative Studio] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
