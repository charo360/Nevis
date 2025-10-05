/**
 * API Key Diagnostic Tool
 * Helps diagnose issues with Google AI API keys and quota limits
 */

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      apiKeys: {
        GEMINI_API_KEY: {
          exists: !!process.env.GEMINI_API_KEY,
          prefix: process.env.GEMINI_API_KEY?.substring(0, 12) + '...',
          length: process.env.GEMINI_API_KEY?.length || 0
        },
        GEMINI_API_KEY_REVO_1_5: {
          exists: !!process.env.GEMINI_API_KEY_REVO_1_5,
          prefix: process.env.GEMINI_API_KEY_REVO_1_5?.substring(0, 12) + '...',
          length: process.env.GEMINI_API_KEY_REVO_1_5?.length || 0
        },
        GEMINI_API_KEY_REVO_2_0: {
          exists: !!process.env.GEMINI_API_KEY_REVO_2_0,
          prefix: process.env.GEMINI_API_KEY_REVO_2_0?.substring(0, 12) + '...',
          length: process.env.GEMINI_API_KEY_REVO_2_0?.length || 0
        }
      },
      tests: []
    };

    // Test each API key
    const keysToTest = [
      { name: 'GEMINI_API_KEY', key: process.env.GEMINI_API_KEY },
      { name: 'GEMINI_API_KEY_REVO_1_5', key: process.env.GEMINI_API_KEY_REVO_1_5 },
      { name: 'GEMINI_API_KEY_REVO_2_0', key: process.env.GEMINI_API_KEY_REVO_2_0 }
    ];

    for (const { name, key } of keysToTest) {
      if (!key) {
        diagnostics.tests.push({
          keyName: name,
          status: 'missing',
          error: 'API key not found in environment variables'
        });
        continue;
      }

      try {
        // Test with text generation (lower quota usage)
        const ai = new GoogleGenerativeAI(key);
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        const startTime = Date.now();
        const result = await model.generateContent('Hello, this is a test. Please respond with "API key working".');
        const endTime = Date.now();
        
        const response = await result.response;
        const text = response.text();

        diagnostics.tests.push({
          keyName: name,
          status: 'success',
          responseTime: endTime - startTime,
          responseText: text.substring(0, 100),
          model: 'gemini-2.5-flash'
        });

      } catch (error: any) {
        let errorDetails = {
          keyName: name,
          status: 'error',
          error: error.message,
          model: 'gemini-2.5-flash'
        };

        // Parse quota error details
        if (error.message.includes('quota')) {
          const quotaMatch = error.message.match(/limit: (\d+)/g);
          const retryMatch = error.message.match(/retry in ([\d.]+)s/);
          
          errorDetails = {
            ...errorDetails,
            quotaLimits: quotaMatch || [],
            retryAfter: retryMatch ? retryMatch[1] : null,
            isPaidTier: !error.message.includes('free_tier'),
            quotaType: error.message.includes('free_tier') ? 'free' : 'paid'
          };
        }

        diagnostics.tests.push(errorDetails);
      }
    }

    return NextResponse.json(diagnostics);

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Diagnostic test failed'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Test image generation specifically
    const imageTests = [];
    
    const keysToTest = [
      { name: 'GEMINI_API_KEY_REVO_1_5', key: process.env.GEMINI_API_KEY_REVO_1_5 },
      { name: 'GEMINI_API_KEY_REVO_2_0', key: process.env.GEMINI_API_KEY_REVO_2_0 }
    ];

    for (const { name, key } of keysToTest) {
      if (!key) {
        imageTests.push({
          keyName: name,
          status: 'missing',
          error: 'API key not found'
        });
        continue;
      }

      try {
        const ai = new GoogleGenerativeAI(key);
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        
        const startTime = Date.now();
        const result = await model.generateContent('Create a simple test image with blue background and white text saying "Test"');
        const endTime = Date.now();
        
        const response = await result.response;
        
        imageTests.push({
          keyName: name,
          status: 'success',
          responseTime: endTime - startTime,
          model: 'gemini-2.5-flash-image-preview',
          hasResponse: !!response
        });

      } catch (error: any) {
        let errorDetails = {
          keyName: name,
          status: 'error',
          error: error.message,
          model: 'gemini-2.5-flash-image-preview'
        };

        // Parse detailed error information
        if (error.message.includes('quota')) {
          const quotaMatch = error.message.match(/limit: (\d+)/g);
          const retryMatch = error.message.match(/retry in ([\d.]+)s/);
          
          errorDetails = {
            ...errorDetails,
            quotaLimits: quotaMatch || [],
            retryAfter: retryMatch ? retryMatch[1] : null,
            isPaidTier: !error.message.includes('free_tier'),
            quotaType: error.message.includes('free_tier') ? 'free' : 'paid'
          };
        }

        imageTests.push(errorDetails);
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      testType: 'image_generation',
      results: imageTests
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Image generation diagnostic failed'
    }, { status: 500 });
  }
}
