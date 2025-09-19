/**
 * Revo 1.5 Enhanced Generation API Route
 * Uses enhanced content generation with advanced features
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateRevo15EnhancedDesign } from '@/ai/revo-1.5-enhanced-design';
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

    console.log('Revo 1.5 Enhanced generation request:', {
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
      message: 'Revo 1.5 Enhanced content generated successfully'
    });

  } catch (error) {
    console.error('Revo 1.5 generation error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Revo 1.5 Enhanced generation failed'
    }, { status: 500 });
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