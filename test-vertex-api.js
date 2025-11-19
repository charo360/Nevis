/**
 * Vertex AI API Test Script
 * Tests all Vertex AI endpoints to verify they're working
 */

const { getVertexAIClient } = require('./src/lib/services/vertex-ai-client');

async function testVertexAPI() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 VERTEX AI API TEST');
  console.log('='.repeat(80) + '\n');

  const client = getVertexAIClient();
  const results = {
    textGeneration: false,
    imageGeneration: false,
    primaryAccount: false,
    secondaryAccount: false
  };

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
    results.textGeneration = true;
    results.primaryAccount = true;
  } catch (error) {
    console.error('❌ Text Generation: FAILED');
    console.error('   Error:', error.message);
  }
  console.log('');

  // Test 2: Image Generation (Primary Account)
  console.log('🖼️  Test 2: Image Generation - Primary Account (gemini-2.5-flash-image)');
  console.log('-'.repeat(80));
  try {
    const imageResult = await client.generateImage(
      'Create a simple test image with the text "API Test" on a blue gradient background',
      'gemini-2.5-flash-image',
      { temperature: 0.7, maxOutputTokens: 8192 }
    );
    console.log('✅ Image Generation (Primary): SUCCESS');
    console.log('   Image data length:', imageResult.imageData?.length || 0, 'characters');
    console.log('   MIME type:', imageResult.mimeType);
    results.imageGeneration = true;
    results.primaryAccount = true;
  } catch (error) {
    console.error('❌ Image Generation (Primary): FAILED');
    console.error('   Error:', error.message);
    
    // Check if it's a quota error
    if (error.message.includes('429') || error.message.includes('Resource exhausted')) {
      console.warn('   ⚠️  Quota exhausted - this is expected if you hit daily limits');
    }
    
    // Check if secondary fallback was attempted
    if (error.message.includes('Secondary')) {
      console.log('   ℹ️  Secondary account was attempted');
      results.secondaryAccount = error.message.includes('403') ? false : true;
    }
  }
  console.log('');

  // Test 3: Check Environment Variables
  console.log('🔑 Test 3: Environment Configuration');
  console.log('-'.repeat(80));
  const envChecks = {
    'VERTEX_AI_ENABLED': process.env.VERTEX_AI_ENABLED === 'true',
    'VERTEX_AI_CREDENTIALS': !!process.env.VERTEX_AI_CREDENTIALS,
    'VERTEX_AI_PROJECT_ID': !!process.env.VERTEX_AI_PROJECT_ID,
    'VERTEX_AI_LOCATION': !!process.env.VERTEX_AI_LOCATION,
    'VERTEX_AI_SECONDARY_ENABLED': process.env.VERTEX_AI_SECONDARY_ENABLED === 'true',
    'VERTEX_FALLBACK_ENABLED': process.env.VERTEX_FALLBACK_ENABLED === 'true'
  };

  for (const [key, value] of Object.entries(envChecks)) {
    console.log(`   ${value ? '✅' : '❌'} ${key}: ${value ? 'SET' : 'NOT SET'}`);
  }
  console.log('');

  // Summary
  console.log('='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`   Text Generation:        ${results.textGeneration ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Image Generation:       ${results.imageGeneration ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Primary Account:        ${results.primaryAccount ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Secondary Account:      ${results.secondaryAccount ? '✅ WORKING' : '⚠️  NOT TESTED/FAILED'}`);
  console.log('='.repeat(80) + '\n');

  // Overall status
  if (results.textGeneration && results.imageGeneration) {
    console.log('🎉 ALL TESTS PASSED - Vertex AI is fully operational!\n');
    process.exit(0);
  } else if (results.textGeneration) {
    console.log('⚠️  PARTIAL SUCCESS - Text works but image generation failed (likely quota issue)\n');
    process.exit(1);
  } else {
    console.log('❌ TESTS FAILED - Vertex AI is not working properly\n');
    process.exit(1);
  }
}

// Run tests
testVertexAPI().catch(error => {
  console.error('\n❌ FATAL ERROR:', error);
  process.exit(1);
});
