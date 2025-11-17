/**
 * OpenAI Fallback Test API
 * 
 * GET /api/openai/test-fallback
 * Tests the OpenAI fallback system by making a simple API call
 */

import { NextRequest, NextResponse } from 'next/server';
import { EnhancedOpenAIClient } from '@/lib/services/openai-client-enhanced';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testType = searchParams.get('type') || 'text';
  
  try {
    let result: any;
    const startTime = Date.now();

    switch (testType) {
      case 'text':
        console.log('🧪 [OpenAI Test] Testing text generation with fallback...');
        result = await EnhancedOpenAIClient.generateText(
          'Say "Hello from OpenAI fallback system!" and explain in one sentence what you are.',
          'gpt-3.5-turbo',
          { maxTokens: 100 }
        );
        break;

      case 'models':
        console.log('🧪 [OpenAI Test] Testing model listing with fallback...');
        const models = await EnhancedOpenAIClient.listModels();
        result = {
          modelCount: models.data.length,
          availableModels: models.data.slice(0, 5).map(m => m.id),
          message: 'Successfully retrieved model list'
        };
        break;

      case 'chat':
        console.log('🧪 [OpenAI Test] Testing chat completion with fallback...');
        const chatResponse = await EnhancedOpenAIClient.createChatCompletion([
          { role: 'user', content: 'Respond with exactly: "OpenAI fallback system is working!"' }
        ], { model: 'gpt-3.5-turbo', maxTokens: 50 });
        
        result = {
          message: chatResponse.choices[0]?.message?.content || 'No response',
          usage: chatResponse.usage
        };
        break;

      default:
        throw new Error(`Unknown test type: ${testType}`);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Get current health status
    const healthStatus = EnhancedOpenAIClient.getKeyHealthStatus();
    const healthyKeys = healthStatus.filter(key => key.isHealthy).length;

    return NextResponse.json({
      success: true,
      testType,
      duration: `${duration}ms`,
      result,
      keyHealth: {
        totalKeys: healthStatus.length,
        healthyKeys,
        lastUsedKey: healthStatus.find(key => 
          key.lastUsed.getTime() === Math.max(...healthStatus.map(k => k.lastUsed.getTime()))
        )?.keyId
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ [OpenAI Test] ${testType} test failed:`, error);
    
    // Get health status even on failure
    const healthStatus = EnhancedOpenAIClient.getKeyHealthStatus();
    
    return NextResponse.json({
      success: false,
      testType,
      error: error instanceof Error ? error.message : 'Unknown error',
      keyHealth: {
        totalKeys: healthStatus.length,
        healthyKeys: healthStatus.filter(key => key.isHealthy).length,
        errorDetails: healthStatus.map(key => ({
          keyId: key.keyId,
          isHealthy: key.isHealthy,
          errorCount: key.errorCount,
          lastError: key.lastError
        }))
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/openai/test-fallback
 * Test with custom prompt
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model = 'gpt-3.5-turbo', maxTokens = 150 } = body;

    if (!prompt) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required'
      }, { status: 400 });
    }

    console.log('🧪 [OpenAI Test] Testing custom prompt with fallback...');
    const startTime = Date.now();

    const result = await EnhancedOpenAIClient.generateText(prompt, model, { maxTokens });
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Get current health status
    const healthStatus = EnhancedOpenAIClient.getKeyHealthStatus();

    return NextResponse.json({
      success: true,
      prompt,
      model,
      duration: `${duration}ms`,
      result,
      keyHealth: {
        totalKeys: healthStatus.length,
        healthyKeys: healthStatus.filter(key => key.isHealthy).length,
        lastUsedKey: healthStatus.find(key => 
          key.lastUsed.getTime() === Math.max(...healthStatus.map(k => k.lastUsed.getTime()))
        )?.keyId
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [OpenAI Test] Custom prompt test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
