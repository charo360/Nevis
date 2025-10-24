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
    const isAvailable = await testRevo20Availability();

    if (isAvailable) {
      return true;
    } else {
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

    if (hasImage && hasCaption && hasHashtags && hasQualityScore) {
      return true;
    } else {
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
      } else {
      }

    } catch (error) {
      console.error(`❌ Error testing aspect ratio ${aspectRatio}:`, error);
    }
  }

  const success = successCount === aspectRatios.length;

  if (success) {
  } else {
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

    // Test 1: Basic availability
    results.basicTest = await testRevo20Basic();

    // Test 2: Generation functionality (only if basic test passes)
    if (results.basicTest) {
      results.generationTest = await testRevo20Generation();
    } else {
    }

    // Test 3: Aspect ratio support (only if generation test passes)
    if (results.generationTest) {
      results.aspectRatioTest = await testRevo20AspectRatios();
    } else {
    }

    // Overall success
    results.overallSuccess = results.basicTest && results.generationTest && results.aspectRatioTest;

    if (results.overallSuccess) {
    } else {
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

  const basicTest = await testRevo20Basic();

  if (basicTest) {
  } else {
  }
}
