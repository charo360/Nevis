import { NextRequest, NextResponse } from 'next/server';
import { generateCreativeAssetAction } from '@/app/actions';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [Test Creative Studio] API endpoint called');
    
    const body = await request.json();
    console.log('📤 [Test Creative Studio] Request payload:', {
      prompt: body.prompt,
      outputType: body.outputType,
      preferredModel: body.preferredModel,
      useBrandProfile: body.useBrandProfile
    });
    
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
    
    console.log('✅ [Test Creative Studio] Action completed successfully');
    console.log('📊 [Test Creative Studio] Result:', {
      hasImageUrl: !!result.imageUrl,
      hasVideoUrl: !!result.videoUrl,
      aiExplanation: result.aiExplanation?.substring(0, 100) + '...'
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
