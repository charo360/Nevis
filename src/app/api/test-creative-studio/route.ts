import { NextRequest, NextResponse } from 'next/server';
import { generateCreativeAsset } from '@/ai/flows/generate-creative-asset';

export async function POST(request: NextRequest) {
  try {

    const body = await request.json();

    // Call the Creative Studio flow directly (bypassing auth for testing)
    const result = await generateCreativeAsset({
      prompt: body.prompt,
      outputType: body.outputType || 'image',
      referenceAssetUrl: body.referenceAssetUrl,
      useBrandProfile: body.useBrandProfile || false,
      brandProfile: body.brandProfile,
      maskDataUrl: body.maskDataUrl,
      aspectRatio: body.aspectRatio,
      preferredModel: body.preferredModel,
      designColors: body.designColors
    });
    
    
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
