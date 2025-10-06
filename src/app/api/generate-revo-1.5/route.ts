/**
 * Revo 1.5 Enhanced Generation API Route
 * Uses enhanced content generation with advanced features
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateRevo15EnhancedDesign } from '@/ai/revo-1.5-enhanced-design';
import { verifyToken } from '@/lib/auth/jwt';
import { deductCreditsForRevo } from '@/app/actions/pricing-actions';
import type { BrandProfile } from '@/lib/types';

// Helper function to convert logo URL to base64 data URL for AI models (matching Revo 1.0)
async function convertLogoToDataUrl(logoUrl?: string): Promise<string | undefined> {
  if (!logoUrl) return undefined;

  // If it's already a data URL, return as is
  if (logoUrl.startsWith('data:')) {
    return logoUrl;
  }

  // If it's a Supabase Storage URL, fetch and convert to base64
  if (logoUrl.startsWith('http')) {
    try {
      console.log('🔄 [Revo 1.5 API] Converting logo URL to base64 for AI generation:', logoUrl.substring(0, 50) + '...');

      const response = await fetch(logoUrl);
      if (!response.ok) {
        console.warn('⚠️ [Revo 1.5 API] Failed to fetch logo from URL:', response.status);
        return undefined;
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/png';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      console.log('✅ [Revo 1.5 API] Logo converted to base64 successfully (' + buffer.byteLength + ' bytes)');
      return dataUrl;
    } catch (error) {
      console.error('❌ [Revo 1.5 API] Error converting logo URL to base64:', error);
      return undefined;
    }
  }

  return undefined;
}

export async function POST(request: NextRequest) {
  let body: any = {};

  try {
    // Get user ID from headers (would be set by middleware in production)
    const userId = 'test-user-id'; // TODO: Get from authentication

    body = await request.json();
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

    // Skip credits check for testing
    console.log('⚠️ [Revo 1.5] Skipping credits check for testing');

    console.log('Revo 1.5 Enhanced generation request:', {
      userId,
      businessType,
      platform,
      visualStyle: visualStyle || 'modern',
      aspectRatio: aspectRatio || '1:1'
    });

    // Convert logo URL to base64 data URL (matching Revo 1.0 approach)
    const convertedLogoDataUrl = await convertLogoToDataUrl(brandProfile.logoUrl || brandProfile.logoDataUrl);

    // Generate content with Revo 1.5
    const result = await generateRevo15EnhancedDesign({
      businessType,
      platform,
      visualStyle: visualStyle || 'modern',
      imageText: imageText || '',
      brandProfile: {
        ...brandProfile,
        logoDataUrl: convertedLogoDataUrl || brandProfile.logoDataUrl
      },
      aspectRatio,
      includePeopleInDesigns,
      useLocalLanguage,
      logoDataUrl: convertedLogoDataUrl || brandProfile.logoDataUrl,
      logoUrl: brandProfile.logoUrl
    });

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      model: result.model,
      qualityScore: result.qualityScore,
      processingTime: result.processingTime,
      enhancementsApplied: result.enhancementsApplied,
      designSpecs: result.designSpecs,
      // Include content fields that the test expects
      caption: result.caption,
      hashtags: result.hashtags,
      headline: result.headline,
      subheadline: result.subheadline,
      callToAction: result.callToAction,
      message: 'Revo 1.5 Enhanced content generated successfully'
    });

  } catch (error) {
    console.error('❌ [Revo 1.5 API] Generation failed:', error);
    console.error('❌ [Revo 1.5 API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ [Revo 1.5 API] Request data:', {
      businessType: body?.businessType || 'unknown',
      platform: body?.platform || 'unknown',
      visualStyle: body?.visualStyle || 'unknown',
      imageText: body?.imageText || 'unknown'
    });

    // Try to provide a fallback response instead of just failing
    try {
      console.log('🔄 [Revo 1.5 API] Attempting fallback response...');

      // Generate simple fallback content
      const fallbackCaption = `${body.brandProfile?.businessName || body.businessType || 'Our business'} provides quality services. Contact us to learn more about what we can do for you.`;
      const fallbackHashtags = ['#business', '#quality', '#service'];
      const fallbackHeadline = 'Quality Service';
      const fallbackSubheadline = 'Professional results you can trust';
      const fallbackCTA = 'Contact Us';

      const fallbackResult = {
        imageUrl: '/api/placeholder/400/400', // Placeholder image
        caption: fallbackCaption,
        hashtags: fallbackHashtags,
        headline: fallbackHeadline,
        subheadline: fallbackSubheadline,
        callToAction: fallbackCTA,
        model: 'revo-1.5-fallback',
        processingTime: 0,
        qualityScore: 5.0,
        enhancementsApplied: ['fallback-system'],
        designSpecs: { plan: 'Fallback design plan' }
      };

      console.log('✅ [Revo 1.5 API] Fallback response created');

      return NextResponse.json({
        success: true,
        imageUrl: fallbackResult.imageUrl,
        model: fallbackResult.model,
        qualityScore: fallbackResult.qualityScore,
        processingTime: fallbackResult.processingTime,
        enhancementsApplied: fallbackResult.enhancementsApplied,
        designSpecs: fallbackResult.designSpecs,
        caption: fallbackResult.caption,
        hashtags: fallbackResult.hashtags,
        headline: fallbackResult.headline,
        subheadline: fallbackResult.subheadline,
        callToAction: fallbackResult.callToAction,
        message: 'Revo 1.5 Enhanced content generated successfully (fallback)',
        fallback: true,
        originalError: error instanceof Error ? error.message : 'Unknown error'
      });

    } catch (fallbackError) {
      console.error('❌ [Revo 1.5 API] Fallback also failed:', fallbackError);

      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallbackError: fallbackError instanceof Error ? fallbackError.message : 'Fallback failed',
        timestamp: new Date().toISOString(),
        message: 'Revo 1.5 Enhanced generation failed'
      }, { status: 500 });
    }
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Revo 1.5 Enhanced Generation API',
    description: 'Use POST method to generate enhanced content with Revo 1.5',
    requiredFields: ['businessType', 'platform', 'brandProfile'],
    optionalFields: ['visualStyle', 'imageText', 'aspectRatio', 'includePeopleInDesigns', 'useLocalLanguage'],
    model: 'Gemini 2.5 Flash with Enhanced Design Planning',
    version: '1.5.0',
    features: [
      'Two-step design process',
      'Enhanced design planning',
      'Business intelligence integration',
      'Advanced creativity frameworks',
      'Logo integration support',
      'Cultural context awareness',
      'Premium visual quality'
    ]
  });
}