/**
 * Test Vertex AI Client
 * Verify that Vertex AI is properly configured and working
 */

import { NextResponse } from 'next/server';
import { getVertexAIClient } from '@/lib/services/vertex-ai-client';

export async function GET() {
  try {
    console.log('🧪 [Test Vertex AI] Starting test...');
    
    // Check environment variables
    const hasVertexEnabled = process.env.VERTEX_AI_ENABLED === 'true';
    const hasProjectId = !!process.env.VERTEX_AI_PROJECT_ID;
    const hasLocation = !!process.env.VERTEX_AI_LOCATION;
    const hasCredentials = !!process.env.VERTEX_AI_CREDENTIALS;
    
    console.log('🔍 [Test Vertex AI] Environment check:', {
      hasVertexEnabled,
      hasProjectId,
      hasLocation,
      hasCredentials,
      projectId: process.env.VERTEX_AI_PROJECT_ID,
      location: process.env.VERTEX_AI_LOCATION
    });
    
    if (!hasVertexEnabled) {
      return NextResponse.json({
        success: false,
        error: 'Vertex AI is not enabled',
        details: 'Set VERTEX_AI_ENABLED=true in .env.local'
      }, { status: 500 });
    }
    
    if (!hasCredentials) {
      return NextResponse.json({
        success: false,
        error: 'Vertex AI credentials not found',
        details: 'Set VERTEX_AI_CREDENTIALS in .env.local'
      }, { status: 500 });
    }
    
    // Try to initialize the client
    console.log('🔧 [Test Vertex AI] Initializing client...');
    const client = getVertexAIClient();
    console.log('✅ [Test Vertex AI] Client initialized successfully');
    
    // Try a simple text generation
    console.log('📝 [Test Vertex AI] Testing text generation...');
    const textResult = await client.generateText(
      'Say "Hello from Vertex AI" and nothing else.',
      'gemini-2.5-flash',
      {
        temperature: 0.7,
        maxOutputTokens: 100
      }
    );
    
    console.log('✅ [Test Vertex AI] Text generation successful:', textResult.text);
    
    return NextResponse.json({
      success: true,
      message: 'Vertex AI is working correctly',
      environment: {
        enabled: hasVertexEnabled,
        projectId: process.env.VERTEX_AI_PROJECT_ID,
        location: process.env.VERTEX_AI_LOCATION,
        hasCredentials: hasCredentials
      },
      textGeneration: {
        success: true,
        response: textResult.text,
        model: 'gemini-2.5-flash',
        finishReason: textResult.finishReason
      }
    });
    
  } catch (error) {
    console.error('❌ [Test Vertex AI] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      details: {
        vertexEnabled: process.env.VERTEX_AI_ENABLED,
        hasProjectId: !!process.env.VERTEX_AI_PROJECT_ID,
        hasLocation: !!process.env.VERTEX_AI_LOCATION,
        hasCredentials: !!process.env.VERTEX_AI_CREDENTIALS
      }
    }, { status: 500 });
  }
}

