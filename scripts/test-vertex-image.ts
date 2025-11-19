/**
 * Independent test script for Vertex AI image generation
 * Tests both primary and secondary accounts
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { getVertexAIClient } from '../src/lib/services/vertex-ai-client';

async function testVertexAIImage() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTING VERTEX AI IMAGE GENERATION');
  console.log('='.repeat(80) + '\n');

  const client = getVertexAIClient();

  // Test 1: Simple image generation with primary account
  console.log('📝 Test 1: Simple image generation (Primary Account)');
  console.log('-'.repeat(80));
  
  const simplePrompt = `Create a professional financial services advertisement image.
  
Show a modern, clean design with:
- A person using a mobile phone for banking
- Blue and green color scheme
- Professional, trustworthy atmosphere
- Text overlay: "Fast & Secure Banking"

Style: Modern, professional, clean, high-quality photography`;

  try {
    console.log('🔄 Calling Vertex AI with model: gemini-2.5-flash-image');
    console.log('📋 Prompt:', simplePrompt.substring(0, 100) + '...');
    
    const startTime = Date.now();
    const result = await client.generateImage(simplePrompt, 'gemini-2.5-flash-image', {
      temperature: 0.7,
      maxOutputTokens: 8192
    });
    const duration = Date.now() - startTime;

    console.log('✅ SUCCESS! Image generated in', duration, 'ms');
    console.log('📊 Result:', {
      mimeType: result.mimeType,
      imageDataLength: result.imageData.length,
      finishReason: result.finishReason
    });
    console.log('🖼️ Image data (first 100 chars):', result.imageData.substring(0, 100) + '...');
    
  } catch (error) {
    console.error('❌ FAILED:', error instanceof Error ? error.message : error);
    console.error('📋 Full error:', error);
  }

  console.log('\n' + '='.repeat(80));

  // Test 2: Image generation with logo
  console.log('\n📝 Test 2: Image generation with logo');
  console.log('-'.repeat(80));

  const logoPrompt = `Create a professional financial services advertisement image.

Show a modern, clean design with:
- A person checking their phone with a satisfied expression
- Blue and green color scheme
- Professional, trustworthy atmosphere
- Text overlay: "Save Money Today"

Style: Modern, professional, clean, high-quality photography

IMPORTANT: Include the brand logo in the top-right corner of the image.`;

  // Simple test logo (1x1 transparent PNG)
  const testLogoDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  try {
    console.log('🔄 Calling Vertex AI with logo');
    console.log('📋 Prompt:', logoPrompt.substring(0, 100) + '...');
    console.log('🎨 Logo data URL length:', testLogoDataUrl.length);
    
    const startTime = Date.now();
    const result = await client.generateImage(logoPrompt, 'gemini-2.5-flash-image', {
      temperature: 0.7,
      maxOutputTokens: 8192,
      logoImage: testLogoDataUrl
    });
    const duration = Date.now() - startTime;

    console.log('✅ SUCCESS! Image with logo generated in', duration, 'ms');
    console.log('📊 Result:', {
      mimeType: result.mimeType,
      imageDataLength: result.imageData.length,
      finishReason: result.finishReason
    });
    
  } catch (error) {
    console.error('❌ FAILED:', error instanceof Error ? error.message : error);
    console.error('📋 Full error:', error);
  }

  console.log('\n' + '='.repeat(80));

  // Test 3: Test with different model name (preview version)
  console.log('\n📝 Test 3: Test with gemini-2.5-flash-image-preview model');
  console.log('-'.repeat(80));

  try {
    console.log('🔄 Calling Vertex AI with model: gemini-2.5-flash-image-preview');
    
    const startTime = Date.now();
    const result = await client.generateImage(simplePrompt, 'gemini-2.5-flash-image-preview', {
      temperature: 0.7,
      maxOutputTokens: 8192
    });
    const duration = Date.now() - startTime;

    console.log('✅ SUCCESS! Image generated with preview model in', duration, 'ms');
    console.log('📊 Result:', {
      mimeType: result.mimeType,
      imageDataLength: result.imageData.length,
      finishReason: result.finishReason
    });
    
  } catch (error) {
    console.error('❌ FAILED:', error instanceof Error ? error.message : error);
    console.error('📋 Full error:', error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🏁 TEST COMPLETE');
  console.log('='.repeat(80) + '\n');
}

// Run the test
testVertexAIImage()
  .then(() => {
    console.log('✅ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });

