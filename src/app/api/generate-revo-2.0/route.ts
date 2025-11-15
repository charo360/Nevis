/**
 * Revo 2.0 Enhanced Generation API Route
 * Uses sophisticated content generation with business intelligence
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateWithRevo20 } from '@/ai/revo-2.0-service';
import { deductCreditsForRevo } from '@/app/actions/pricing-actions';

export async function POST(request: NextRequest) {
  try {
    // Get user authentication from Supabase session
    let userId: string | undefined;
    
    try {
      const { cookies } = await import('next/headers');
      const { createServerClient } = await import('@supabase/ssr');

      const cookieStore = await cookies();

      const supabaseServer = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll() {
              // API routes can't modify cookies
            },
          },
        }
      );

      const { data: { session } } = await supabaseServer.auth.getSession();
      userId = session?.user?.id;
    } catch (authError) {
      console.warn('⚠️ [Revo 2.0 API] Authentication failed:', authError);
    }

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();

    const {
      businessType,
      platform,
      brandProfile,
      visualStyle,
      imageText,
      aspectRatio,
      includePeopleInDesigns,
      useLocalLanguage,
      includeContacts,
      scheduledServices // NEW: Extract scheduled services from request
    } = body;

    // Validate required fields
    if (!businessType || !platform || !brandProfile) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: businessType, platform, brandProfile'
      }, { status: 400 });
    }

    // Deduct credits BEFORE generation
    const creditResult = await deductCreditsForRevo(userId, 'revo-2.0', 1);
    
    if (!creditResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient credits',
        remainingCredits: creditResult.remainingCredits,
        creditsCost: creditResult.creditsCost
      }, { status: 402 }); // 402 Payment Required
    }

    console.log(`✅ [Revo 2.0 API] Credits deducted: ${creditResult.creditsCost}, Remaining: ${creditResult.remainingCredits}`);

    // Log scheduled services integration

    // Generate content with Revo 2.0 Enhanced with error handling
    let result;
    try {
      result = await generateWithRevo20({
        businessType,
        platform,
        visualStyle: visualStyle || 'modern',
        imageText: imageText || '',
        brandProfile,
        aspectRatio,
        includePeopleInDesigns,
        useLocalLanguage,
        includeContacts: !!includeContacts,
        scheduledServices: scheduledServices // NEW: Pass scheduled services to Revo 2.0
      });
    } catch (generationError) {
      console.error('❌ Revo 2.0 generation failed:', generationError);
      console.error('❌ Full error details:', {
        message: generationError instanceof Error ? generationError.message : 'Unknown error',
        stack: generationError instanceof Error ? generationError.stack : 'No stack trace',
        name: generationError instanceof Error ? generationError.name : 'Unknown'
      });
      // Show actual error for debugging
      const errorMessage = generationError instanceof Error ? generationError.message : 'Unknown error';
      throw new Error(`Revo 2.0 Debug Error: ${errorMessage}`);
    }

    // Extract content source for client-side logging
    const contentSource = result.businessIntelligence?.contentSource || 'unknown';

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      model: result.model,
      qualityScore: result.qualityScore,
      processingTime: result.processingTime,
      enhancementsApplied: result.enhancementsApplied,
      headline: result.headline,
      subheadline: result.subheadline,
      caption: result.caption,
      captionVariations: result.captionVariations,
      cta: result.cta,
      hashtags: result.hashtags,
      businessIntelligence: result.businessIntelligence,
      contentSource: contentSource, // Add to top level for easy access
      message: `Revo 2.0 content generated using ${contentSource}`
    });

  } catch (error) {
    console.error('❌ Revo 2.0 API Error:', error);

    // Show actual error for debugging
    let errorMessage = 'Revo 2.0 Enhanced generation failed';
    if (error instanceof Error) {
      errorMessage = `Debug Error: ${error.message}`;
      console.error('❌ Full error stack:', error.stack);
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
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
      'Business-specific headlines',
      'Strategic subheadlines',
      'Sophisticated captions',
      'Compelling CTAs',
      'AI-powered hashtags',
      'Business intelligence analysis'
    ]
  });
}