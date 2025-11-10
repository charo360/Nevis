/**
 * Detailed test for Revo 1.0 to identify the exact error
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🧪 [Test Revo 1.0] Starting detailed test...');
    console.log('🧪 [Test Revo 1.0] Request body:', JSON.stringify(body, null, 2));
    
    // Import the action
    const { generateRevo1ContentAction } = await import('@/app/actions/revo-1-actions');
    
    const brandProfile = body.brandProfile || {
      businessName: 'Test Business',
      businessType: 'Restaurant',
      location: 'Nairobi, Kenya',
      visualStyle: 'modern',
      writingTone: 'professional',
      services: 'Food and beverages',
      primaryColor: '#FF5733',
      accentColor: '#FFFFFF',
      backgroundColor: '#000000'
    };
    
    const platform = body.platform || 'instagram';
    const brandConsistency = body.brandConsistency || {
      strictConsistency: false,
      followBrandColors: true,
      includeContacts: false
    };
    
    console.log('🧪 [Test Revo 1.0] Calling generateRevo1ContentAction...');
    
    const result = await generateRevo1ContentAction(
      brandProfile,
      platform,
      brandConsistency,
      '',
      {
        aspectRatio: '1:1',
        visualStyle: 'modern',
        includePeopleInDesigns: true,
        useLocalLanguage: false
      },
      []
    );
    
    console.log('✅ [Test Revo 1.0] Generation successful!');
    console.log('✅ [Test Revo 1.0] Result keys:', Object.keys(result));
    
    return NextResponse.json({
      success: true,
      message: 'Revo 1.0 test successful',
      result: {
        hasImageUrl: !!result.imageUrl,
        hasCaption: !!result.caption,
        hasHashtags: !!result.hashtags,
        imageUrlType: typeof result.imageUrl,
        imageUrlLength: result.imageUrl?.length || 0,
        captionLength: result.caption?.length || 0,
        hashtagsCount: result.hashtags?.length || 0
      }
    });
    
  } catch (error) {
    console.error('❌ [Test Revo 1.0] Error:', error);
    console.error('❌ [Test Revo 1.0] Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('❌ [Test Revo 1.0] Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('❌ [Test Revo 1.0] Error message:', error instanceof Error ? error.message : 'Unknown');
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      details: {
        vertexEnabled: process.env.VERTEX_AI_ENABLED,
        hasProjectId: !!process.env.VERTEX_AI_PROJECT_ID,
        hasCredentials: !!process.env.VERTEX_AI_CREDENTIALS
      }
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Revo 1.0 Detailed Test Endpoint',
    usage: 'POST with optional brandProfile, platform, brandConsistency',
    description: 'Tests Revo 1.0 generation with detailed error logging'
  });
}

