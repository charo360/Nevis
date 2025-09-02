/**
 * Test endpoint to debug AIML API connection issues
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    
    const apiKey = process.env.AIML_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'AIML_API_KEY not found in environment variables'
      }, { status: 500 });
    }


    // Test basic connection to AIML API
    const baseUrl = 'https://api.aimlapi.com/v1';
    
    try {
      
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        return NextResponse.json({
          success: false,
          error: `AIML API error: ${response.status} - ${errorText}`,
          status: response.status
        }, { status: 500 });
      }

      const models = await response.json();

      return NextResponse.json({
        success: true,
        message: 'AIML API connection successful',
        models: models,
        apiKey: apiKey.substring(0, 10) + '...'
      });

    } catch (fetchError) {
      
      return NextResponse.json({
        success: false,
        error: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
        type: 'network_error'
      }, { status: 500 });
    }

  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: 'general_error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, platform = 'instagram' } = body;

    if (!prompt) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required'
      }, { status: 400 });
    }

    const apiKey = process.env.AIML_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'AIML_API_KEY not found'
      }, { status: 500 });
    }


    // Test the actual image generation
    const response = await fetch('https://api.aimlapi.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'flux/kontext-max/text-to-image',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      return NextResponse.json({
        success: false,
        error: `FLUX generation failed: ${response.status} - ${errorText}`,
        status: response.status
      }, { status: 500 });
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: 'FLUX Kontext Max test successful',
      result: result
    });

  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
