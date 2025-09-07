import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      textElements,
      assets,
      template,
      brandProfile,
      aspectRatio = '1:1'
    } = body;

    if (!prompt) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required'
      }, { status: 400 });
    }

    console.log('Professional Studio generation request:', {
      prompt: prompt.substring(0, 100) + '...',
      textElements: textElements?.length || 0,
      assets: assets?.length || 0,
      template,
      brandProfile: brandProfile?.businessName || 'none'
    });

    // Check if required environment variables are available
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!geminiKey) {
      throw new Error('Gemini API key not found in environment variables');
    }

    // Use the creative asset generation flow
    const { generateCreativeAsset } = await import('@/ai/flows/generate-creative-asset');

    console.log('Calling generateCreativeAsset with:', {
      outputType: 'image',
      useBrandProfile: !!brandProfile,
      preferredModel: 'gemini-2.5-flash-image-preview',
      hasReferenceAsset: !!(assets?.[0]?.url)
    });

    const result = await generateCreativeAsset({
      prompt,
      outputType: 'image',
      referenceAssetUrl: assets?.[0]?.url || null,
      useBrandProfile: !!brandProfile,
      brandProfile: brandProfile,
      maskDataUrl: null,
      preferredModel: 'gemini-2.5-flash-image-preview',
      aspectRatio: aspectRatio === '1:1' ? undefined : aspectRatio // Let it auto-detect for 1:1
    });

    console.log('generateCreativeAsset result:', {
      hasImageUrl: !!result.imageUrl,
      imageUrlLength: result.imageUrl?.length || 0
    });

    if (!result.imageUrl) {
      throw new Error('No image URL returned from AI generation');
    }

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      message: 'Professional design generated successfully'
    });

  } catch (error) {
    console.error('Professional Studio generation failed:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to generate professional design',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Professional Studio API',
    description: 'Use POST method to generate professional designs',
    requiredFields: ['prompt'],
    optionalFields: ['textElements', 'assets', 'template', 'brandProfile', 'aspectRatio'],
    model: 'Gemini 2.5 Flash Image Preview',
    version: '1.0.0'
  });
}
