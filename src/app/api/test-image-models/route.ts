/**
 * Test different image generation models to find alternatives
 */

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  const modelsToTest = [
    'gemini-2.5-flash-image-preview',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro-vision'
  ];

  const results = [];
  const apiKey = process.env.GEMINI_API_KEY_REVO_2_0 || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'No API key found' }, { status: 400 });
  }

  const ai = new GoogleGenerativeAI(apiKey);

  for (const modelName of modelsToTest) {
    try {
      const model = ai.getGenerativeModel({ model: modelName });
      
      // Try a simple text request first
      const startTime = Date.now();
      const result = await model.generateContent('Create a simple test image with text "Hello World"');
      const endTime = Date.now();
      
      const response = await result.response;
      
      results.push({
        model: modelName,
        status: 'success',
        responseTime: endTime - startTime,
        supportsImages: true,
        hasResponse: !!response
      });

    } catch (error: any) {
      let errorInfo = {
        model: modelName,
        status: 'error',
        error: error.message.substring(0, 200),
        supportsImages: false
      };

      // Check if it's a quota error or model not found
      if (error.message.includes('quota')) {
        errorInfo = {
          ...errorInfo,
          errorType: 'quota',
          isPaidTier: !error.message.includes('free_tier')
        };
      } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
        errorInfo = {
          ...errorInfo,
          errorType: 'model_not_found'
        };
      } else {
        errorInfo = {
          ...errorInfo,
          errorType: 'other'
        };
      }

      results.push(errorInfo);
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    apiKeyUsed: apiKey.substring(0, 12) + '...',
    results
  });
}
