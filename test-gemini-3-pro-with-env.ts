/**
 * Test Script for Gemini 3 Pro Integration with Environment Loading
 * Run with: npx tsx test-gemini-3-pro-with-env.ts
 */

// Load environment variables first
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

console.log('🔧 Environment Check:');
console.log(`  - VERTEX_AI_ENABLED: ${process.env.VERTEX_AI_ENABLED}`);
console.log(`  - VERTEX_AI_PROJECT_ID: ${process.env.VERTEX_AI_PROJECT_ID}`);
console.log(`  - VERTEX_AI_LOCATION: ${process.env.VERTEX_AI_LOCATION}`);
console.log(`  - VERTEX_AI_CREDENTIALS: ${process.env.VERTEX_AI_CREDENTIALS ? 'SET (' + process.env.VERTEX_AI_CREDENTIALS.length + ' chars)' : 'NOT SET'}`);
console.log('');

import { generateGemini3ProImage, generateRevo2AdImage } from './src/lib/services/gemini-3-pro';
import { generateContentDirect, REVO_2_0_GEMINI_3_PRO_MODEL } from './src/ai/revo-2.0-service';

async function testGemini3ProWithEnv() {
  console.log('🧪 Testing Gemini 3 Pro Integration (With Environment)\n');
  console.log('=' .repeat(60));

  // Test 1: Basic Image Generation
  console.log('\n📸 Test 1: Basic Image Generation (256px for speed)');
  console.log('-'.repeat(60));
  try {
    const prompt = `
      Professional Kenyan businesswoman using mobile banking app.
      Modern office, natural lighting, confident smile.
    `;

    console.log('Generating image with Gemini 3 Pro...');
    const startTime = Date.now();
    
    const imageDataUrl = await generateGemini3ProImage(prompt, {
      aspectRatio: '3:4',
      imageSize: '256', // Small size for fast testing
      temperature: 0.7
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ Test 1 PASSED`);
    console.log(`   - Generation time: ${duration}s`);
    console.log(`   - Image data length: ${imageDataUrl.length} characters`);
    console.log(`   - Format: ${imageDataUrl.substring(0, 50)}...`);
    console.log(`   - Aspect ratio: 3:4`);
    console.log(`   - Image size: 256px`);
  } catch (error) {
    console.error('❌ Test 1 FAILED:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
    }
  }

  // Test 2: Platform-Specific Ad
  console.log('\n📱 Test 2: Instagram Ad (3:4 aspect ratio)');
  console.log('-'.repeat(60));
  try {
    const adPrompt = `
      Paya mobile banking ad. Young entrepreneur with smartphone.
      Market background. Professional aesthetic.
    `;

    console.log('Generating Instagram ad...');
    const startTime = Date.now();
    
    const instagramAd = await generateRevo2AdImage(adPrompt, 'instagram', {
      imageSize: '256', // Small for testing
      temperature: 0.7
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ Test 2 PASSED`);
    console.log(`   - Generation time: ${duration}s`);
    console.log(`   - Image data length: ${instagramAd.length} characters`);
    console.log(`   - Platform: Instagram (3:4 portrait)`);
  } catch (error) {
    console.error('❌ Test 2 FAILED:', error instanceof Error ? error.message : error);
  }

  // Test 3: Direct Service Call
  console.log('\n🔧 Test 3: Direct Revo 2.0 Service Call');
  console.log('-'.repeat(60));
  try {
    const prompt = 'Professional fintech ad. Mobile banking dashboard.';

    console.log('Calling generateContentDirect...');
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
  } catch (error) {
    console.error('❌ Test 3 FAILED:', error instanceof Error ? error.message : error);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Test Complete!');
  console.log('='.repeat(60));
}

testGemini3ProWithEnv()
  .then(() => {
    console.log('\n✅ Testing finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
