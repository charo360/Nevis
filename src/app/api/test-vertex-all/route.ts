/**
 * Vertex AI Comprehensive Test Endpoint
 * Tests all Vertex AI capabilities
 */

import { NextResponse } from 'next/server';
import { getVertexAIClient } from '@/lib/services/vertex-ai-client';

export async function GET() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 VERTEX AI COMPREHENSIVE TEST');
  console.log('='.repeat(80) + '\n');

  const results = {
    textGeneration: { success: false, error: null as string | null, response: null as any },
    imageGeneration: { success: false, error: null as string | null, response: null as any },
    primaryAccount: { success: false, error: null as string | null },
    secondaryAccount: { tested: false, success: false, error: null as string | null }
  };

  const client = getVertexAIClient();

  // Test 1: Text Generation
  console.log('📝 Test 1: Text Generation (gemini-2.5-flash)');
  console.log('-'.repeat(80));
  try {
    const textResult = await client.generateText(
      'Say "Hello from Vertex AI" in exactly 5 words.',
      'gemini-2.5-flash',
      { temperature: 0.7, maxOutputTokens: 50 }
    );
    console.log('✅ Text Generation: SUCCESS');
    console.log('   Response:', textResult.text);
    results.textGeneration.success = true;
    results.textGeneration.response = textResult.text;
    results.primaryAccount.success = true;
  } catch (error: any) {
    console.error('❌ Text Generation: FAILED');
    console.error('   Error:', error.message);
    results.textGeneration.error = error.message;
    results.primaryAccount.error = error.message;
  }
  console.log('');

  // Test 2: Image Generation
  console.log('🖼️  Test 2: Image Generation (gemini-2.5-flash-image)');
  console.log('-'.repeat(80));
  try {
    const imageResult = await client.generateImage(
      'Create a simple test image with the text "API Test" on a blue gradient background',
      'gemini-2.5-flash-image',
      { temperature: 0.7, maxOutputTokens: 8192 }
    );
    console.log('✅ Image Generation: SUCCESS');
    console.log('   Image data length:', imageResult.imageData?.length || 0, 'characters');
    console.log('   MIME type:', imageResult.mimeType);
    results.imageGeneration.success = true;
    results.imageGeneration.response = {
      imageDataLength: imageResult.imageData?.length || 0,
      mimeType: imageResult.mimeType
    };
    results.primaryAccount.success = true;
  } catch (error: any) {
    console.error('❌ Image Generation: FAILED');
    console.error('   Error:', error.message);
    results.imageGeneration.error = error.message;

    // Check if it's a quota error
    if (error.message.includes('429') || error.message.includes('Resource exhausted')) {
      console.warn('   ⚠️  Quota exhausted - this is expected if you hit daily limits');
    }

    // Check if secondary fallback was attempted
    if (error.message.includes('Secondary') || error.message.includes('secondary')) {
      console.log('   ℹ️  Secondary account was attempted');
      results.secondaryAccount.tested = true;
      results.secondaryAccount.success = !error.message.includes('403');
      results.secondaryAccount.error = error.message;
    }
  }
  console.log('');

  // Test 3: Environment Configuration
  console.log('🔑 Test 3: Environment Configuration');
  console.log('-'.repeat(80));
  const envConfig = {
    VERTEX_AI_ENABLED: process.env.VERTEX_AI_ENABLED === 'true',
    VERTEX_AI_CREDENTIALS: !!process.env.VERTEX_AI_CREDENTIALS,
    VERTEX_AI_PROJECT_ID: !!process.env.VERTEX_AI_PROJECT_ID,
    VERTEX_AI_LOCATION: !!process.env.VERTEX_AI_LOCATION,
    VERTEX_AI_SECONDARY_ENABLED: process.env.VERTEX_AI_SECONDARY_ENABLED === 'true',
    VERTEX_FALLBACK_ENABLED: process.env.VERTEX_FALLBACK_ENABLED === 'true'
  };

  for (const [key, value] of Object.entries(envConfig)) {
    console.log(`   ${value ? '✅' : '❌'} ${key}: ${value ? 'SET' : 'NOT SET'}`);
  }
  console.log('');

  // Summary
  console.log('='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`   Text Generation:        ${results.textGeneration.success ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Image Generation:       ${results.imageGeneration.success ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Primary Account:        ${results.primaryAccount.success ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Secondary Account:      ${results.secondaryAccount.tested ? (results.secondaryAccount.success ? '✅ WORKING' : '❌ FAILED') : '⚠️  NOT TESTED'}`);
  console.log('='.repeat(80) + '\n');

  // Overall status
  let overallStatus = 'FAILED';
  let statusEmoji = '❌';
  
  if (results.textGeneration.success && results.imageGeneration.success) {
    overallStatus = 'ALL TESTS PASSED';
    statusEmoji = '🎉';
    console.log('🎉 ALL TESTS PASSED - Vertex AI is fully operational!\n');
  } else if (results.textGeneration.success) {
    overallStatus = 'PARTIAL SUCCESS';
    statusEmoji = '⚠️';
    console.log('⚠️  PARTIAL SUCCESS - Text works but image generation failed (likely quota issue)\n');
  } else {
    console.log('❌ TESTS FAILED - Vertex AI is not working properly\n');
  }

  return NextResponse.json({
    status: overallStatus,
    emoji: statusEmoji,
    timestamp: new Date().toISOString(),
    results,
    envConfig
  });
}
