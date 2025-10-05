// src/app/api/test-dynamic-routing/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const model = searchParams.get('model') || 'revo-2.0';

    // Test API key availability for each model
    const apiKeys = {
      'revo-1.0': process.env.GEMINI_API_KEY_REVO_1_0,
      'revo-1.5': process.env.GEMINI_API_KEY_REVO_1_5,
      'revo-2.0': process.env.GEMINI_API_KEY_REVO_2_0
    };

    const routing = {
      'revo-1.0': {
        endpoint: '/api/quick-content',
        apiKey: apiKeys['revo-1.0'],
        features: ['Basic AI functionality', 'Standard content generation', 'Reliable performance'],
        model: 'Genkit flows with GEMINI_API_KEY_REVO_1_0'
      },
      'revo-1.5': {
        endpoint: '/api/quick-content',
        apiKey: apiKeys['revo-1.5'],
        features: ['Professional design principles', 'GPT-5 Mini headlines', 'Brand color integration'],
        model: 'Direct API calls with GEMINI_API_KEY_REVO_1_5'
      },
      'revo-2.0': {
        endpoint: '/api/generate-revo-2.0',
        apiKey: apiKeys['revo-2.0'],
        features: ['Gemini 2.5 Flash Image Preview', 'Advanced image generation', 'Character consistency'],
        model: 'Direct API calls with GEMINI_API_KEY_REVO_2_0'
      }
    };

    const selectedRouting = routing[model as keyof typeof routing];

    return NextResponse.json({
      success: true,
      model,
      routing: selectedRouting,
      apiKeyStatus: {
        'revo-1.0': !!apiKeys['revo-1.0'],
        'revo-1.5': !!apiKeys['revo-1.5'],
        'revo-2.0': !!apiKeys['revo-2.0']
      },
      message: `Dynamic routing configured for ${model}`,
      implementation: {
        contentCalendar: 'Updated with dynamic model routing',
        quickContentAPI: 'Created for Revo 1.0 and 1.5',
        revo20API: 'Existing endpoint for Revo 2.0',
        genkitConfig: 'Uses GEMINI_API_KEY_REVO_2_0',
        revo15Config: 'Uses GEMINI_API_KEY_REVO_1_5'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Test failed' },
      { status: 500 }
    );
  }
}