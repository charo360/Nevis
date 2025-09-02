/**
 * Advanced Content Generation API
 * Tests the new advanced content generation system
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateRevo10Content } from '@/ai/revo-1.0-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    
    // Default test data if not provided
    const testData = {
      businessType: body.businessType || 'restaurant',
      businessName: body.businessName || 'Bella Vista Restaurant',
      location: body.location || 'New York, NY',
      platform: body.platform || 'instagram',
      writingTone: body.writingTone || 'friendly',
      contentThemes: body.contentThemes || ['food', 'dining', 'experience'],
      targetAudience: body.targetAudience || 'food lovers and families',
      services: body.services || 'Fine dining, catering, private events',
      keyFeatures: body.keyFeatures || 'Fresh ingredients, authentic recipes, cozy atmosphere',
      competitiveAdvantages: body.competitiveAdvantages || 'Family-owned, locally sourced, 20+ years experience',
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      currentDate: new Date().toLocaleDateString(),
      primaryColor: body.primaryColor || '#D97706',
      visualStyle: body.visualStyle || 'warm and inviting',
      ...body
    };


    // Generate advanced content
    const result = await generateRevo10Content(testData);


    // Return enhanced response with analysis
    return NextResponse.json({
      success: true,
      data: {
        // Core content
        headline: result.headline,
        subheadline: result.subheadline,
        caption: result.content,
        cta: result.callToAction,
        hashtags: result.hashtags,
        
        // Advanced intelligence insights
        intelligence: result.businessIntelligence,
        
        // Generation metadata
        metadata: {
          businessName: testData.businessName,
          businessType: testData.businessType,
          location: testData.location,
          platform: testData.platform,
          generatedAt: new Date().toISOString(),
          model: 'Revo 1.0 Enhanced',
          aiService: 'gemini-2.5-flash-image-preview'
        },

        // Performance insights
        performance: {
          hashtagCount: result.hashtags.length,
          captionLength: result.content.length,
          headlineLength: result.headline?.length || 0,
          trendingKeywords: result.businessIntelligence?.trendingKeywords?.length || 0,
          recommendations: result.businessIntelligence?.performanceRecommendations?.length || 0
        },

        // Quality metrics
        quality: {
          hasHeadline: !!result.headline,
          hasSubheadline: !!result.subheadline,
          hasCTA: !!result.callToAction,
          hashtagOptimized: result.hashtags.length >= 5 && result.hashtags.length <= 15,
          captionOptimized: result.content.length >= 50 && result.content.length <= 500,
          trendingIntegrated: (result.businessIntelligence?.trendingKeywords?.length || 0) > 0,
          performanceAnalyzed: (result.businessIntelligence?.performanceRecommendations?.length || 0) > 0
        }
      }
    });

  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate advanced content',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessType = searchParams.get('businessType') || 'restaurant';
    const platform = searchParams.get('platform') || 'instagram';
    const location = searchParams.get('location') || 'New York, NY';

    // Quick test generation
    const testData = {
      businessType,
      businessName: `Test ${businessType.charAt(0).toUpperCase() + businessType.slice(1)}`,
      location,
      platform,
      writingTone: 'professional',
      contentThemes: ['quality', 'service', 'experience'],
      targetAudience: 'local customers',
      services: 'Professional services',
      keyFeatures: 'Quality and reliability',
      competitiveAdvantages: 'Local expertise',
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      currentDate: new Date().toLocaleDateString(),
      primaryColor: '#3B82F6',
      visualStyle: 'modern'
    };

    const result = await generateRevo10Content(testData);

    return NextResponse.json({
      success: true,
      message: 'Advanced content generation test successful',
      data: {
        headline: result.headline,
        caption: result.content.substring(0, 200) + '...',
        hashtagCount: result.hashtags.length,
        trendingKeywords: result.businessIntelligence?.trendingKeywords?.slice(0, 5) || [],
        recommendations: result.businessIntelligence?.performanceRecommendations?.slice(0, 3) || []
      }
    });

  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test advanced content generation',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
