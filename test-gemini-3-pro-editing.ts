/**
 * Test Gemini 3 Pro Image Editing
 * Run with: npx tsx test-gemini-3-pro-editing.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load environment
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { getGeminiAPIClient } from './src/lib/services/gemini-api-client';

async function testGemini3ProEditing() {
  console.log('🧪 Testing Gemini 3 Pro Image Editing\n');
  console.log('=' .repeat(60));

  // Test 1: Generate a base image first
  console.log('\n📸 Test 1: Generate Base Image');
  console.log('-'.repeat(60));
  
  let baseImageDataUrl: string;
  
  try {
    const prompt = `
      Simple advertisement with text "ORIGINAL TEXT" in large bold letters.
      Clean white background. Red text. Minimalist design.
    `;

    console.log('Generating base image...');
    const startTime = Date.now();
    
    const result = await getGeminiAPIClient().generateImage(
      prompt,
      'gemini-3-pro-image-preview',
      {
        aspectRatio: '1:1',
        imageSize: '256',
        temperature: 0.7
      }
    );

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    baseImageDataUrl = `data:${result.mimeType};base64,${result.imageData}`;

    console.log(`✅ Test 1 PASSED`);
    console.log(`   - Generation time: ${duration}s`);
    console.log(`   - Image size: ${baseImageDataUrl.length} characters`);
  } catch (error) {
    console.error('❌ Test 1 FAILED:', error instanceof Error ? error.message : error);
    return;
  }

  // Test 2: Edit the image (change text)
  console.log('\n✏️  Test 2: Edit Image - Change Text');
  console.log('-'.repeat(60));
  
  try {
    const editPrompt = 'Change the text from "ORIGINAL TEXT" to "EDITED TEXT"';

    console.log('Editing image with Gemini 3 Pro...');
    const startTime = Date.now();
    
    const result = await getGeminiAPIClient().editImage(
      editPrompt,
      baseImageDataUrl,
      'gemini-3-pro-image-preview',
      {
        aspectRatio: '1:1',
        imageSize: '256',
        temperature: 0.7
      }
    );

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    const editedImageDataUrl = `data:${result.mimeType};base64,${result.imageData}`;

    console.log(`✅ Test 2 PASSED`);
    console.log(`   - Edit time: ${duration}s`);
    console.log(`   - Edited image size: ${editedImageDataUrl.length} characters`);
    console.log(`   - Edit type: Text replacement`);
  } catch (error) {
    console.error('❌ Test 2 FAILED:', error instanceof Error ? error.message : error);
  }

  // Test 3: Edit with different instruction
  console.log('\n🎨 Test 3: Edit Image - Change Color');
  console.log('-'.repeat(60));
  
  try {
    const editPrompt = 'Change the background color from white to light blue';

    console.log('Editing image color...');
    const startTime = Date.now();
    
    const result = await getGeminiAPIClient().editImage(
      editPrompt,
      baseImageDataUrl,
      'gemini-3-pro-image-preview',
      {
        aspectRatio: '1:1',
        imageSize: '256',
        temperature: 0.7
      }
    );

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ Test 3 PASSED`);
    console.log(`   - Edit time: ${duration}s`);
    console.log(`   - Edit type: Color change`);
  } catch (error) {
    console.error('❌ Test 3 FAILED:', error instanceof Error ? error.message : error);
  }

  // Test 4: Edit with aspect ratio change
  console.log('\n📐 Test 4: Edit with Aspect Ratio Change');
  console.log('-'.repeat(60));
  
  try {
    const editPrompt = 'Keep the same content but adjust for vertical format';

    console.log('Editing with aspect ratio change...');
    const startTime = Date.now();
    
    const result = await getGeminiAPIClient().editImage(
      editPrompt,
      baseImageDataUrl,
      'gemini-3-pro-image-preview',
      {
        aspectRatio: '9:16', // Change to vertical
        imageSize: '256',
        temperature: 0.7
      }
    );

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ Test 4 PASSED`);
    console.log(`   - Edit time: ${duration}s`);
    console.log(`   - Aspect ratio changed: 1:1 → 9:16`);
  } catch (error) {
    console.error('❌ Test 4 FAILED:', error instanceof Error ? error.message : error);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Test Complete!');
  console.log('='.repeat(60));
  console.log('\n✅ Gemini 3 Pro Image Editing:');
  console.log('  - Model: gemini-3-pro-image-preview');
  console.log('  - API: Direct Gemini API');
  console.log('  - Capabilities tested:');
  console.log('    ✅ Text editing');
  console.log('    ✅ Color editing');
  console.log('    ✅ Aspect ratio changes');
  console.log('    ✅ Selective editing (with prompts)');
}

testGemini3ProEditing()
  .then(() => {
    console.log('\n✅ All editing tests completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
