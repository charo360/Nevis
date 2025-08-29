/**
 * API endpoint to test available Gemini models
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Testing available Gemini models...');
    
    const { testAvailableGeminiModels } = await import('@/ai/test-gemini-models');
    
    const availableModels = await testAvailableGeminiModels();
    
    return NextResponse.json({
      success: true,
      availableModels,
      count: availableModels.length,
      message: `Found ${availableModels.length} available Gemini models`
    });

  } catch (error) {
    console.error('❌ Gemini models test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to test Gemini models'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = 'find-best' } = body;

    if (action === 'find-best') {
      console.log('🔍 Finding best model for Revo 2.0...');
      
      const { findBestRevo20Model } = await import('@/ai/test-gemini-models');
      const bestModel = await findBestRevo20Model();
      
      return NextResponse.json({
        success: true,
        bestModel,
        available: !!bestModel,
        message: bestModel 
          ? `Best model found: ${bestModel}` 
          : 'No suitable model found for Revo 2.0'
      });
    }

    if (action === 'test-specific') {
      const { modelName } = body;
      
      if (!modelName) {
        return NextResponse.json({
          success: false,
          error: 'Model name is required'
        }, { status: 400 });
      }

      console.log(`🎨 Testing specific model: ${modelName}`);
      
      const { testModelImageGeneration } = await import('@/ai/test-gemini-models');
      const supportsImages = await testModelImageGeneration(modelName);
      
      return NextResponse.json({
        success: true,
        modelName,
        supportsImages,
        message: supportsImages 
          ? `${modelName} supports image generation` 
          : `${modelName} does not support image generation`
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: find-best or test-specific'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Gemini model test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Gemini model test failed'
    }, { status: 500 });
  }
}
