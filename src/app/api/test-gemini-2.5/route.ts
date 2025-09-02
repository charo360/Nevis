/**
 * API endpoint to test Gemini 2.5 functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { runAllTests, quickTest } from '@/ai/test-gemini-2.5';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'quick';


    if (testType === 'full') {
      // Run comprehensive tests
      await runAllTests();
      return NextResponse.json({
        success: true,
        message: 'Full Gemini 2.5 tests completed. Check server logs for detailed results.',
        testType: 'full'
      });
    } else {
      // Run quick test
      await quickTest();
      return NextResponse.json({
        success: true,
        message: 'Quick Gemini 2.5 test completed successfully!',
        testType: 'quick'
      });
    }

  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Gemini 2.5 test failed. Check server logs for details.'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model = 'gemini-2.5-flash' } = body;

    if (!prompt) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required'
      }, { status: 400 });
    }

    const { generateText, GEMINI_2_5_MODELS } = await import('@/ai/google-ai-direct');
    
    const response = await generateText(prompt, {
      model: model as any,
      maxOutputTokens: 500
    });

    return NextResponse.json({
      success: true,
      response: response.text,
      model: model,
      finishReason: response.finishReason
    });

  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
