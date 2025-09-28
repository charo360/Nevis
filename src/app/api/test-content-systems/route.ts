import { NextRequest, NextResponse } from 'next/server';
import { PureAIContentGenerator, PureAIRequest } from '@/services/pure-ai-content-generator';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [Content Systems Test] Starting comprehensive content system testing...');

    const body = await request.json();
    const {
      businessType = 'Restaurant',
      businessName = 'Mama\'s Kitchen',
      platform = 'Instagram',
      services = 'Traditional African cuisine, catering, takeaway',
      location = 'Nairobi, Kenya'
    } = body;

    const testResults = {
      timestamp: new Date().toISOString(),
      testRequest: {
        businessType,
        businessName,
        platform,
        services,
        location
      },
      systems: [] as any[],
      summary: {
        totalSystems: 0,
        workingSystems: 0,
        failedSystems: 0,
        recommendedSystem: 'None'
      }
    };

    // Test 1: Pure AI Gemini System
    console.log('🧪 [Content Systems Test] Testing Pure AI Gemini...');
    try {
      const pureAIRequest: PureAIRequest = {
        businessType,
        businessName,
        services,
        platform,
        contentType: 'all',
        targetAudience: 'Food lovers and families',
        location,
        websiteUrl: 'https://example.com',
        brandContext: {
          colors: ['#FF6B35', '#F7931E'],
          personality: 'Warm and welcoming',
          values: ['Authentic flavors', 'Family traditions', 'Quality ingredients']
        }
      };

      const pureAIResult = await PureAIContentGenerator.generateContent(pureAIRequest);
      
      // Check for repetitive patterns
      const contentText = `${pureAIResult.headline} ${pureAIResult.subheadline} ${pureAIResult.caption}`.toLowerCase();
      const repetitiveWords = ['upgrade', 'transform', 'solutions', 'excellence', 'revolutionize'];
      const hasRepetitive = repetitiveWords.some(word => contentText.includes(word));
      
      testResults.systems.push({
        name: 'Pure AI Gemini',
        status: 'SUCCESS',
        result: {
          headline: pureAIResult.headline,
          subheadline: pureAIResult.subheadline,
          cta: pureAIResult.cta,
          caption: pureAIResult.caption.substring(0, 100) + '...',
          hashtagCount: pureAIResult.hashtags.length,
          confidence: pureAIResult.confidence
        },
        qualityCheck: {
          hasRepetitivePatterns: hasRepetitive,
          mentionsBusinessName: contentText.includes(businessName.toLowerCase()),
          isBusinessSpecific: contentText.includes(businessName.toLowerCase()) && !hasRepetitive
        }
      });
      
      testResults.summary.workingSystems++;
      if (!hasRepetitive) {
        testResults.summary.recommendedSystem = 'Pure AI Gemini';
      }
      
    } catch (pureAIError) {
      console.error('❌ [Content Systems Test] Pure AI Gemini failed:', pureAIError);
      testResults.systems.push({
        name: 'Pure AI Gemini',
        status: 'FAILED',
        error: pureAIError instanceof Error ? pureAIError.message : 'Unknown error'
      });
      testResults.summary.failedSystems++;
    }

    // Test 2: Pure AI OpenAI System
    console.log('🧪 [Content Systems Test] Testing Pure AI OpenAI...');
    try {
      const pureAIRequest: PureAIRequest = {
        businessType,
        businessName,
        services,
        platform,
        contentType: 'all',
        targetAudience: 'Food lovers and families',
        location,
        websiteUrl: 'https://example.com',
        brandContext: {
          colors: ['#FF6B35', '#F7931E'],
          personality: 'Warm and welcoming',
          values: ['Authentic flavors', 'Family traditions', 'Quality ingredients']
        }
      };

      const openAIResult = await PureAIContentGenerator.generateContentWithOpenAI(pureAIRequest);
      
      // Check for repetitive patterns
      const contentText = `${openAIResult.headline} ${openAIResult.subheadline} ${openAIResult.caption}`.toLowerCase();
      const repetitiveWords = ['upgrade', 'transform', 'solutions', 'excellence', 'revolutionize'];
      const hasRepetitive = repetitiveWords.some(word => contentText.includes(word));
      
      testResults.systems.push({
        name: 'Pure AI OpenAI',
        status: 'SUCCESS',
        result: {
          headline: openAIResult.headline,
          subheadline: openAIResult.subheadline,
          cta: openAIResult.cta,
          caption: openAIResult.caption.substring(0, 100) + '...',
          hashtagCount: openAIResult.hashtags.length,
          confidence: openAIResult.confidence
        },
        qualityCheck: {
          hasRepetitivePatterns: hasRepetitive,
          mentionsBusinessName: contentText.includes(businessName.toLowerCase()),
          isBusinessSpecific: contentText.includes(businessName.toLowerCase()) && !hasRepetitive
        }
      });
      
      testResults.summary.workingSystems++;
      if (!hasRepetitive && testResults.summary.recommendedSystem === 'None') {
        testResults.summary.recommendedSystem = 'Pure AI OpenAI';
      }
      
    } catch (openAIError) {
      console.error('❌ [Content Systems Test] Pure AI OpenAI failed:', openAIError);
      testResults.systems.push({
        name: 'Pure AI OpenAI',
        status: 'FAILED',
        error: openAIError instanceof Error ? openAIError.message : 'Unknown error'
      });
      testResults.summary.failedSystems++;
    }

    testResults.summary.totalSystems = testResults.systems.length;

    // Generate recommendations
    const recommendations = [];
    
    if (testResults.summary.workingSystems === 0) {
      recommendations.push('❌ All content systems are failing - check API keys and network connectivity');
      recommendations.push('🔧 Verify GEMINI_API_KEY_REVO_1_5 and OPENAI_API_KEY environment variables');
      recommendations.push('💰 Check API quotas and billing status');
    } else {
      const workingSystems = testResults.systems.filter(s => s.status === 'SUCCESS');
      const qualitySystems = workingSystems.filter(s => s.qualityCheck?.isBusinessSpecific);
      
      if (qualitySystems.length > 0) {
        recommendations.push(`✅ ${qualitySystems.length} system(s) working with good quality`);
        recommendations.push(`🎯 Recommended: ${testResults.summary.recommendedSystem}`);
      } else {
        recommendations.push('⚠️ Systems are working but generating repetitive content');
        recommendations.push('🔧 Check prompt engineering and temperature settings');
      }
    }

    console.log('🔍 [Content Systems Test] Testing complete:', {
      totalSystems: testResults.summary.totalSystems,
      workingSystems: testResults.summary.workingSystems,
      failedSystems: testResults.summary.failedSystems,
      recommendedSystem: testResults.summary.recommendedSystem
    });

    return NextResponse.json({
      success: testResults.summary.workingSystems > 0,
      testResults,
      recommendations,
      message: testResults.summary.workingSystems > 0 
        ? `${testResults.summary.workingSystems} content system(s) working properly`
        : 'All content systems are currently failing'
    });

  } catch (error) {
    console.error('❌ [Content Systems Test] Critical testing error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Content systems testing failed completely'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Content Systems Test Endpoint',
    usage: 'POST to test all content generation systems',
    description: 'Tests Pure AI Gemini, Pure AI OpenAI, and Enhanced Simple AI systems',
    example: {
      businessType: 'Restaurant',
      businessName: 'Mama\'s Kitchen',
      platform: 'Instagram',
      services: 'Traditional African cuisine, catering, takeaway',
      location: 'Nairobi, Kenya'
    }
  });
}