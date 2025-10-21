import { NextRequest, NextResponse } from 'next/server';
import { SimpleV2PureAIContentGenerator, PureAIRequest } from '@/services/pure-ai-content-generator-simple-v2';

export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    const {
      businessType = 'Technology',
      businessName = 'Test Tech Solutions',
      platform = 'Instagram',
      services = 'Software development, web design, mobile apps',
      location = 'Nairobi, Kenya'
    } = body;

    const diagnostics = {
      timestamp: new Date().toISOString(),
      testRequest: {
        businessType,
        businessName,
        platform,
        services,
        location
      },
      environment: {
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
        GEMINI_API_KEY_REVO_1_5: !!process.env.GEMINI_API_KEY_REVO_1_5,
        GOOGLE_API_KEY: !!process.env.GOOGLE_API_KEY,
        GOOGLE_GENAI_API_KEY: !!process.env.GOOGLE_GENAI_API_KEY,
        OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      },
      tests: [] as any[],
      errors: [] as any[],
      success: false,
      finalResult: null as any
    };

    // Test 1: Check API Keys
    const geminiKey = process.env.GEMINI_API_KEY_REVO_1_5 || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

    if (!geminiKey) {
      diagnostics.errors.push('❌ No Gemini API key found');
      diagnostics.tests.push({
        test: 'API Key Check',
        status: 'FAILED',
        error: 'No Gemini API key available'
      });
    } else {
      diagnostics.tests.push({
        test: 'API Key Check',
        status: 'PASSED',
        keyLength: geminiKey.length,
        keyPrefix: geminiKey.substring(0, 10) + '...'
      });
    }

    // Test 2: Test Proxy-Only Google AI Service
    try {
      const { generateText } = await import('@/ai/google-ai-direct');

      const testResponse = await generateText('Test prompt: respond with "PROXY_OK"', {
        temperature: 0.1,
        maxOutputTokens: 50
      });

      diagnostics.tests.push({
        test: 'Proxy-Only Google AI',
        status: 'PASSED',
        response: testResponse.text.substring(0, 100),
        responseLength: testResponse.text.length
      });
    } catch (googleAIError) {
      diagnostics.errors.push(`❌ Proxy-Only Google AI failed: ${googleAIError instanceof Error ? googleAIError.message : 'Unknown error'}`);
      diagnostics.tests.push({
        test: 'Proxy-Only Google AI',
        status: 'FAILED',
        error: googleAIError instanceof Error ? googleAIError.message : 'Unknown error'
      });
    }

    // Test 3: Test Pure AI Content Generator (Primary - Gemini)
    const pureAIRequest: PureAIRequest = {
      businessType,
      businessName,
      services,
      platform,
      contentType: 'all',
      targetAudience: 'Small businesses and startups',
      location,
      websiteUrl: 'https://example.com',
      brandContext: {
        colors: ['#007bff', '#28a745'],
        personality: 'Professional and innovative',
        values: ['Quality', 'Innovation', 'Customer Success']
      }
    };

    try {
      const pureAIResult = await SimpleV2PureAIContentGenerator.generateContent(pureAIRequest);

      diagnostics.tests.push({
        test: 'Pure AI Gemini',
        status: 'PASSED',
        result: {
          headline: pureAIResult.headline,
          subheadline: pureAIResult.subheadline,
          cta: pureAIResult.cta,
          caption: pureAIResult.caption.substring(0, 100) + '...',
          hashtagCount: pureAIResult.hashtags.length,
          hashtags: pureAIResult.hashtags,
          confidence: pureAIResult.confidence,
          reasoning: pureAIResult.reasoning?.substring(0, 200) + '...'
        }
      });

      diagnostics.success = true;
      diagnostics.finalResult = pureAIResult;

    } catch (pureAIError) {
      console.error('❌ [Debug Pure AI] Pure AI Gemini failed:', pureAIError);
      diagnostics.errors.push(`❌ Pure AI Gemini failed: ${pureAIError instanceof Error ? pureAIError.message : 'Unknown error'}`);
      diagnostics.tests.push({
        test: 'Pure AI Gemini',
        status: 'FAILED',
        error: pureAIError instanceof Error ? pureAIError.message : 'Unknown error',
        stack: pureAIError instanceof Error ? pureAIError.stack : undefined
      });

      // Test 4: Test Pure AI with OpenAI Fallback
      if (process.env.OPENAI_API_KEY) {
        try {
          const openAIResult = await SimpleV2PureAIContentGenerator.generateContent(pureAIRequest);

          diagnostics.tests.push({
            test: 'Pure AI OpenAI',
            status: 'PASSED',
            result: {
              headline: openAIResult.headline,
              subheadline: openAIResult.subheadline,
              cta: openAIResult.cta,
              caption: openAIResult.caption.substring(0, 100) + '...',
              hashtagCount: openAIResult.hashtags.length,
              hashtags: openAIResult.hashtags,
              confidence: openAIResult.confidence,
              reasoning: openAIResult.reasoning?.substring(0, 200) + '...'
            }
          });

          diagnostics.success = true;
          diagnostics.finalResult = openAIResult;

        } catch (openAIError) {
          console.error('❌ [Debug Pure AI] Pure AI OpenAI failed:', openAIError);
          diagnostics.errors.push(`❌ Pure AI OpenAI failed: ${openAIError instanceof Error ? openAIError.message : 'Unknown error'}`);
          diagnostics.tests.push({
            test: 'Pure AI OpenAI',
            status: 'FAILED',
            error: openAIError instanceof Error ? openAIError.message : 'Unknown error',
            stack: openAIError instanceof Error ? openAIError.stack : undefined
          });
        }
      } else {
        diagnostics.tests.push({
          test: 'Pure AI OpenAI',
          status: 'SKIPPED',
          reason: 'No OpenAI API key available'
        });
      }
    }

    // Analysis and Recommendations
    const recommendations = [];

    if (diagnostics.errors.length === 0) {
      recommendations.push('✅ Pure AI system is working correctly');
    } else {
      if (!geminiKey) {
        recommendations.push('🔧 Add Gemini API key: GEMINI_API_KEY_REVO_1_5 or GEMINI_API_KEY');
      }
      if (!process.env.OPENAI_API_KEY) {
        recommendations.push('🔧 Add OpenAI API key for fallback: OPENAI_API_KEY');
      }
      if (diagnostics.errors.some(e => e.includes('quota') || e.includes('limit'))) {
        recommendations.push('💰 Check API quotas and billing');
      }
      if (diagnostics.errors.some(e => e.includes('parse') || e.includes('JSON'))) {
        recommendations.push('🔧 Prompt may be too complex or response format issues');
      }
    }

    return NextResponse.json({
      success: diagnostics.success,
      diagnostics,
      recommendations,
      summary: {
        testsRun: diagnostics.tests.length,
        testsPassed: diagnostics.tests.filter(t => t.status === 'PASSED').length,
        testsFailed: diagnostics.tests.filter(t => t.status === 'FAILED').length,
        testsSkipped: diagnostics.tests.filter(t => t.status === 'SKIPPED').length,
        errorsFound: diagnostics.errors.length,
        pureAIWorking: diagnostics.success
      }
    });

  } catch (error) {
    console.error('❌ [Debug Pure AI] Critical debugging error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      recommendation: '❌ Critical error in Pure AI debugging system'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Simple GET endpoint for quick testing
  return NextResponse.json({
    message: 'Pure AI Debug Endpoint',
    usage: 'POST to this endpoint with optional body: { businessType, businessName, platform, services, location }',
    example: {
      businessType: 'Technology',
      businessName: 'Test Tech Solutions',
      platform: 'Instagram',
      services: 'Software development, web design',
      location: 'Nairobi, Kenya'
    }
  });
}
