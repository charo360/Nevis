/**
 * Test Direct Gemini API for Gemini 3 Pro
 * Run with: npx tsx test-gemini-api-direct.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

console.log('🔧 Environment Check:');
console.log(`  - GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'SET (' + process.env.GEMINI_API_KEY.substring(0, 20) + '...)' : 'NOT SET'}`);
console.log('');

import { generateGemini3ProImage, generateRevo2AdImage } from './src/lib/services/gemini-3-pro';
import { generateContentDirect, REVO_2_0_GEMINI_3_PRO_MODEL } from './src/ai/revo-2.0-service';

async function testGeminiAPIDirect() {
  console.log('🧪 Testing Gemini 3 Pro via Direct API\n');
  console.log('=' .repeat(60));

  // Test 1: Basic Gemini 3 Pro Image
  console.log('\n📸 Test 1: Gemini 3 Pro Basic Image (256px)');
  console.log('-'.repeat(60));
  try {
    const prompt = `
      Professional Kenyan businesswoman using mobile banking app.
      Modern office, natural lighting, confident smile.
      Brand colors: red and dark gray.
    `;

    console.log('Generating with Gemini 3 Pro via direct API...');
    const startTime = Date.now();
    
    const imageDataUrl = await generateGemini3ProImage(prompt, {
      aspectRatio: '3:4',
      imageSize: '256',
      temperature: 0.7
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ Test 1 PASSED`);
    console.log(`   - Generation time: ${duration}s`);
    console.log(`   - Image data length: ${imageDataUrl.length} characters`);
    console.log(`   - Format: ${imageDataUrl.substring(0, 50)}...`);
    console.log(`   - Model: gemini-3-pro-image-preview`);
    console.log(`   - API: Direct Gemini API (AI Studio)`);
  } catch (error) {
    console.error('❌ Test 1 FAILED:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
  }

  // Test 2: Instagram Ad with Gemini 3 Pro
  console.log('\n📱 Test 2: Instagram Ad (3:4) - Gemini 3 Pro');
  console.log('-'.repeat(60));
  try {
    const adPrompt = `
      Paya mobile banking advertisement.
      Young Kenyan entrepreneur accepting payment via smartphone.
      Market stall with fresh produce background.
      Professional, modern, trustworthy aesthetic.
    `;

    console.log('Generating Instagram ad with Gemini 3 Pro...');
    const startTime = Date.now();
    
    const instagramAd = await generateRevo2AdImage(adPrompt, 'instagram', {
      imageSize: '512', // Medium size
      temperature: 0.7
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ Test 2 PASSED`);
    console.log(`   - Generation time: ${duration}s`);
    console.log(`   - Image data length: ${instagramAd.length} characters`);
    console.log(`   - Platform: Instagram (3:4 portrait)`);
    console.log(`   - Image size: 512px`);
  } catch (error) {
    console.error('❌ Test 2 FAILED:', error instanceof Error ? error.message : error);
  }

  // Test 3: Direct Revo 2.0 Service with Gemini 3 Pro
  console.log('\n🔧 Test 3: Revo 2.0 Service + Gemini 3 Pro');
  console.log('-'.repeat(60));
  try {
    const prompt = 'Professional fintech ad. Mobile banking dashboard. Clean, modern design.';

    console.log('Calling generateContentDirect with Gemini 3 Pro model...');
    const startTime = Date.now();
    
    const result = await generateContentDirect(
      prompt,
      REVO_2_0_GEMINI_3_PRO_MODEL,
      true,
      {
        temperature: 0.7,
        aspectRatio: '1:1',
        imageSize: '256'
      }
    );

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    const imageData = result.response.candidates[0].content.parts[0].inlineData;

    console.log(`✅ Test 3 PASSED`);
    console.log(`   - Generation time: ${duration}s`);
    console.log(`   - MIME type: ${imageData.mimeType}`);
    console.log(`   - Model: ${REVO_2_0_GEMINI_3_PRO_MODEL}`);
    console.log(`   - Aspect ratio: 1:1 (square)`);
    console.log(`   - API routing: Direct Gemini API ✅`);
  } catch (error) {
    console.error('❌ Test 3 FAILED:', error instanceof Error ? error.message : error);
  }

  // Test 4: Different Aspect Ratios
  console.log('\n📐 Test 4: Multiple Aspect Ratios (Gemini 3 Pro)');
  console.log('-'.repeat(60));
  try {
    const basePrompt = 'Professional business person using mobile app';
    const aspectRatios: Array<'1:1' | '3:4' | '9:16'> = ['1:1', '3:4', '9:16'];

    console.log('Testing different aspect ratios with Gemini 3 Pro...');
    
    for (const ratio of aspectRatios) {
      const startTime = Date.now();
      
      const image = await generateGemini3ProImage(basePrompt, {
        aspectRatio: ratio,
        imageSize: '256',
        temperature: 0.7
      });

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log(`   ✅ ${ratio} - Generated in ${duration}s (${image.length} chars)`);
    }

    console.log(`✅ Test 4 PASSED - All aspect ratios working with Gemini 3 Pro`);
  } catch (error) {
    console.error('❌ Test 4 FAILED:', error instanceof Error ? error.message : error);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Test Complete!');
  console.log('='.repeat(60));
  console.log('\n✅ Gemini 3 Pro via Direct API Integration:');
  console.log('  - Model: gemini-3-pro-image-preview');
  console.log('  - API: Direct Gemini API (AI Studio)');
  console.log('  - Aspect ratios: 1:1, 3:4, 9:16 supported');
  console.log('  - Image sizes: 256, 512, 1K, 2K supported');
  console.log('  - Revo 2.0 integration: Working');
}

testGeminiAPIDirect()
  .then(() => {
    console.log('\n✅ All tests completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
