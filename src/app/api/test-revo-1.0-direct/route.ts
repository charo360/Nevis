/**
 * Direct test for Revo 1.0 service (bypassing actions)
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [Test Revo 1.0 Direct] Starting test...');
    
    // Import the service directly
    const { generateRevo10Content } = await import('@/ai/revo-1.0-service');
    
    const testInput = {
      businessType: 'Restaurant',
      businessName: 'Test Restaurant',
      location: 'Nairobi, Kenya',
      platform: 'instagram',
      writingTone: 'professional',
      contentThemes: [],
      targetAudience: 'Food lovers',
      services: 'Fine dining, takeaway',
      keyFeatures: 'Fresh ingredients, local cuisine',
      competitiveAdvantages: 'Best prices in town',
      dayOfWeek: 'Monday',
      currentDate: new Date().toLocaleDateString(),
      primaryColor: '#FF5733',
      visualStyle: 'modern',
      includeContacts: false,
      contactInfo: {
        phone: '+254 700 000 000',
        email: 'test@test.com',
        address: 'Nairobi'
      },
      websiteUrl: 'https://test.com'
    };
    
    console.log('🧪 [Test Revo 1.0 Direct] Calling generateRevo10Content...');
    console.log('🧪 [Test Revo 1.0 Direct] Input:', JSON.stringify(testInput, null, 2));
    
    const result = await generateRevo10Content(testInput);
    
    console.log('✅ [Test Revo 1.0 Direct] Generation successful!');
    console.log('✅ [Test Revo 1.0 Direct] Result keys:', Object.keys(result));
    
    return NextResponse.json({
      success: true,
      message: 'Revo 1.0 direct test successful',
      result: {
        hasContent: !!result.content,
        hasHeadline: !!result.headline,
        hasSubheadline: !!result.subheadline,
        hasCTA: !!result.callToAction,
        hasHashtags: !!result.hashtags,
        contentLength: result.content?.length || 0,
        headlineLength: result.headline?.length || 0
      }
    });
    
  } catch (error) {
    console.error('❌ [Test Revo 1.0 Direct] Error:', error);
    console.error('❌ [Test Revo 1.0 Direct] Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('❌ [Test Revo 1.0 Direct] Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('❌ [Test Revo 1.0 Direct] Error message:', error instanceof Error ? error.message : 'Unknown');
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 10).join('\n') : undefined,
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
    message: 'Revo 1.0 Direct Test Endpoint',
    usage: 'POST to test Revo 1.0 service directly',
    description: 'Bypasses actions and calls generateRevo10Content directly'
  });
}

