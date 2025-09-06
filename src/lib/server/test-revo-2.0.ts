/**
 * Server-Only Revo 2.0 Testing Suite
 * This file should NEVER be imported on the client side
 */

import { testRevo20Availability, generateWithRevo20 } from '@/ai/revo-2.0-service';
import { BrandProfile } from '@/lib/types';

/**
 * Test basic Revo 2.0 availability (SERVER-SIDE ONLY)
 */
export async function testRevo20Basic(): Promise<boolean> {

  try {
    console.log('🧪 Testing Revo 2.0 basic availability...');
    const isAvailable = await testRevo20Availability();

    if (isAvailable) {
      console.log('✅ Revo 2.0 is available');
      return true;
    } else {
      console.log('❌ Revo 2.0 is not available');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing Revo 2.0 availability:', error);
    return false;
  }
}

/**
 * Test Revo 2.0 generation functionality (SERVER-SIDE ONLY)
 */
export async function testRevo20Generation(): Promise<boolean> {

  try {
    console.log('🧪 Testing Revo 2.0 generation functionality...');

    const testBrandProfile: BrandProfile = {
      businessName: 'Test Restaurant',
      businessType: 'Restaurant',
      location: 'Test City',
      description: 'A test restaurant for Revo 2.0 testing',
      logoDataUrl: 'data:image/png;base64,test',
      visualStyle: 'modern',
      writingTone: 'professional',
      contentThemes: 'food,dining,restaurant'
    };

    const testOptions = {
      businessType: 'Restaurant',
      platform: 'Instagram' as const,
      visualStyle: 'modern' as const,
      imageText: 'Revo 2.0 Test Generation',
      brandProfile: testBrandProfile,
      aspectRatio: '1:1' as const,
      includePeopleInDesigns: false,
      useLocalLanguage: false
    };

    const result = await generateWithRevo20(testOptions);

    // Validate result
    const hasImage = !!result.imageUrl;
    const hasCaption = !!result.caption;
    const hasHashtags = result.hashtags && result.hashtags.length > 0;
    const hasQualityScore = result.qualityScore > 0;

    console.log('📊 Generation result validation:', {
      hasImage,
      hasCaption,
      hasHashtags,
      hasQualityScore,
      qualityScore: result.qualityScore
    });

    if (hasImage && hasCaption && hasHashtags && hasQualityScore) {
      console.log('✅ Revo 2.0 generation test passed');
      return true;
    } else {
      console.log('❌ Revo 2.0 generation test failed - missing required properties');
      return false;
    }

  } catch (error) {
    console.error('❌ Error testing Revo 2.0 generation:', error);
    return false;
  }
}

/**
 * Test Revo 2.0 with different aspect ratios (SERVER-SIDE ONLY)
 */
export async function testRevo20AspectRatios(): Promise<boolean> {

  const aspectRatios: Array<'1:1' | '16:9' | '9:16' | '21:9' | '4:5'> = ['1:1', '16:9', '9:16'];
  let successCount = 0;

  console.log('🧪 Testing Revo 2.0 aspect ratios:', aspectRatios);

  const testBrandProfile: BrandProfile = {
    businessName: 'Test Business',
    businessType: 'Business',
    location: 'Test Location',
    description: 'Test business for aspect ratio testing',
    logoDataUrl: 'data:image/png;base64,test',
    visualStyle: 'modern',
    writingTone: 'professional',
    contentThemes: 'business,professional,corporate'
  };

  for (const aspectRatio of aspectRatios) {
    try {
      console.log(`📐 Testing aspect ratio: ${aspectRatio}`);

      const result = await generateWithRevo20({
        businessType: 'Business',
        platform: 'Instagram',
        visualStyle: 'modern',
        imageText: `Test ${aspectRatio} aspect ratio`,
        brandProfile: testBrandProfile,
        aspectRatio,
        includePeopleInDesigns: false,
        useLocalLanguage: false
      });

      if (result.imageUrl) {
        successCount++;
        console.log(`✅ Aspect ratio ${aspectRatio} test passed`);
      } else {
        console.log(`❌ Aspect ratio ${aspectRatio} test failed - no image URL`);
      }

    } catch (error) {
      console.error(`❌ Error testing aspect ratio ${aspectRatio}:`, error);
    }
  }

  const success = successCount === aspectRatios.length;

  if (success) {
    console.log('✅ All aspect ratio tests passed');
  } else {
    console.log(`❌ Aspect ratio tests failed: ${successCount}/${aspectRatios.length} passed`);
  }

  return success;
}

/**
 * Run comprehensive Revo 2.0 test suite (SERVER-SIDE ONLY)
 */
export async function runRevo20TestSuite(): Promise<{
  basicTest: boolean;
  generationTest: boolean;
  aspectRatioTest: boolean;
  overallSuccess: boolean;
}> {

  const results = {
    basicTest: false,
    generationTest: false,
    aspectRatioTest: false,
    overallSuccess: false
  };

  try {
    console.log('🚀 Starting comprehensive Revo 2.0 test suite...');

    // Test 1: Basic availability
    console.log('📋 Test 1: Basic availability');
    results.basicTest = await testRevo20Basic();

    // Test 2: Generation functionality (only if basic test passes)
    if (results.basicTest) {
      console.log('📋 Test 2: Generation functionality');
      results.generationTest = await testRevo20Generation();
    } else {
      console.log('⏭️ Skipping generation test - basic test failed');
    }

    // Test 3: Aspect ratio support (only if generation test passes)
    if (results.generationTest) {
      console.log('📋 Test 3: Aspect ratio support');
      results.aspectRatioTest = await testRevo20AspectRatios();
    } else {
      console.log('⏭️ Skipping aspect ratio test - generation test failed');
    }

    // Overall success
    results.overallSuccess = results.basicTest && results.generationTest && results.aspectRatioTest;

    console.log('📊 Test suite results:', results);

    if (results.overallSuccess) {
      console.log('🎉 All Revo 2.0 tests passed successfully!');
    } else {
      console.log('⚠️ Some Revo 2.0 tests failed - check logs above for details');
    }

  } catch (error) {
    console.error('❌ Error running Revo 2.0 test suite:', error);
  }

  return results;
}

/**
 * Quick test function (SERVER-SIDE ONLY)
 */
export async function quickTestRevo20(): Promise<void> {
  console.log('⚡ Running quick Revo 2.0 test...');

  const basicTest = await testRevo20Basic();

  if (basicTest) {
    console.log('✅ Quick test passed - Revo 2.0 is operational');
  } else {
    console.log('❌ Quick test failed - Revo 2.0 is not available');
  }
}
