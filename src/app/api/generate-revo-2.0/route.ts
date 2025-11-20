/**
 * Revo 2.0 Enhanced Generation API Route
 * Uses sophisticated content generation with business intelligence
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateWithRevo20 } from '@/ai/revo-2.0-service';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from headers (would be set by middleware in production)
    const userId = 'test-user-id'; // TODO: Get from authentication

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

    // ========================================
    // BILINGUAL MODE STATUS (VISIBLE IN TERMINAL)
    // ========================================
    console.log('');
    console.log('🌍 ========================================');
    console.log('🌍 REVO 2.0 API - BILINGUAL MODE CHECK');
    console.log('🌍 ========================================');
    console.log(`🌍 Platform: ${platform}`);
    console.log(`🌍 Business Type: ${businessType}`);
    console.log(`🌍 Brand Location: ${brandProfile.location || '⚠️ Not set'}`);
    console.log(`🌍 Local Language Toggle: ${useLocalLanguage ? '✅ ON' : '❌ OFF'}`);
    console.log(`🌍 Include People: ${includePeopleInDesigns ? '✅ ON' : '❌ OFF'}`);
    console.log(`🌍 Include Contacts: ${includeContacts ? '✅ ON' : '❌ OFF'}`);

    if (useLocalLanguage && brandProfile.location) {
      console.log('');
      console.log('✅ ✅ ✅ BILINGUAL CONTENT GENERATION ACTIVE! ✅ ✅ ✅');
      console.log(`📝 Content will be: 70% English + 30% ${brandProfile.location} local language`);
      console.log(`🗣️ Expected local language elements for ${brandProfile.location}`);
      console.log('');
    } else if (useLocalLanguage && !brandProfile.location) {
      console.log('');
      console.log('⚠️ ⚠️ ⚠️ WARNING: Local language toggle is ON but no location is set! ⚠️ ⚠️ ⚠️');
      console.log('⚠️ Content will be generated in English only.');
      console.log('⚠️ Please set a location in your brand profile to enable bilingual content.');
      console.log('');
    } else {
      console.log('');
      console.log('📝 English-only mode (local language toggle is OFF)');
      console.log('📝 Content will be 100% English');
      console.log('');
    }
    console.log('🌍 ========================================');
    console.log('');

    // Validate required fields
    if (!businessType || !platform || !brandProfile) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: businessType, platform, brandProfile'
      }, { status: 400 });
    }

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

    // Enhanced error logging for debugging
    let errorMessage = 'Revo 2.0 Enhanced generation failed';
    let errorDetails = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack
      };
      console.error('❌ Full error stack:', error.stack);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
    }

    // Check for specific error types
    if (errorMessage.includes('Vertex AI')) {
      console.error('🔴 VERTEX AI ERROR - Check credentials and quota');
    } else if (errorMessage.includes('Supabase')) {
      console.error('🔴 SUPABASE ERROR - Check database connection');
    } else if (errorMessage.includes('timeout')) {
      console.error('🔴 TIMEOUT ERROR - Request took too long');
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      errorDetails: errorDetails,
      message: 'Revo 2.0 Enhanced generation failed',
      timestamp: new Date().toISOString()
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