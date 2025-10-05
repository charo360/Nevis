/**
 * Test API endpoint for AI fallback system
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiFallbackService } from '@/lib/services/ai-fallback-service';
import { isOpenRouterEnabled } from '@/lib/services/openrouter-client';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing AI Fallback System...');

    // Health check for all services
    const healthCheck = await aiFallbackService.healthCheck();
    
    console.log('🔍 Health Check Results:', healthCheck);

    return NextResponse.json({
      success: true,
      message: 'AI Fallback System Test',
      data: {
        healthCheck,
        openRouterEnabled: isOpenRouterEnabled(),
        environment: {
          AI_PROXY_ENABLED: process.env.AI_PROXY_ENABLED,
          AI_PROXY_URL: process.env.AI_PROXY_URL,
          OPENROUTER_ENABLED: process.env.OPENROUTER_ENABLED,
          OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
          GEMINI_API_KEY: !!process.env.GEMINI_API_KEY
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Fallback system test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model, type } = body;

    if (!prompt || !model) {
      return NextResponse.json({
        success: false,
        error: 'Prompt and model are required'
      }, { status: 400 });
    }

    console.log(`🧪 Testing ${type || 'text'} generation with fallback system...`);
    console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);
    console.log(`🤖 Model: ${model}`);

    const isImageGeneration = type === 'image';
    
    const result = await aiFallbackService.generateWithFallback({
      prompt,
      model,
      isImageGeneration,
      user_id: 'test_user',
      user_tier: 'basic'
    });

    console.log(`✅ Generation result:`, {
      success: result.success,
      provider: result.provider,
      hasContent: !!result.content,
      hasImageUrl: !!result.imageUrl,
      error: result.error
    });

    return NextResponse.json({
      success: true,
      message: `${type || 'text'} generation test completed`,
      data: {
        result,
        testInfo: {
          prompt: prompt.substring(0, 100) + '...',
          model,
          type: type || 'text',
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Fallback generation test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
