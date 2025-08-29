/**
 * Test Revo 2.0 (Gemini 2.5 Flash Image) Availability
 * Comprehensive testing suite for the new nano-banana model
 */

import { testRevo20Availability, generateWithRevo20 } from './revo-2.0-service';
import { BrandProfile } from '@/lib/types';

/**
 * Test basic Revo 2.0 availability
 */
export async function testRevo20Basic(): Promise<boolean> {
  console.log('🧪 Testing Revo 2.0 basic availability...');
  
  try {
    const isAvailable = await testRevo20Availability();
    
    if (isAvailable) {
      console.log('✅ Revo 2.0 basic test PASSED');
      return true;
    } else {
      console.log('❌ Revo 2.0 basic test FAILED');
      return false;
    }
  } catch (error) {
    console.error('❌ Revo 2.0 basic test error:', error);
    return false;
  }
}

/**
 * Test Revo 2.0 content generation
 */
export async function testRevo20Generation(): Promise<boolean> {
  console.log('🎨 Testing Revo 2.0 content generation...');
  
  try {
    // Create test brand profile
    const testBrandProfile: BrandProfile = {
      businessName: 'Test Fintech',
      businessType: 'Fintech',
      primaryColor: '#2563eb',
      accentColor: '#f59e0b',
      backgroundColor: '#ffffff',
      visualStyle: 'modern'
    };

    // Test generation
    const result = await generateWithRevo20({
      businessType: 'Fintech',
      platform: 'instagram',
      visualStyle: 'modern',
      imageText: 'Revo 2.0 Test - Digital Banking Revolution',
      brandProfile: testBrandProfile,
      aspectRatio: '1:1'
    });

    if (result.imageUrl && result.imageUrl.startsWith('data:image')) {
      console.log('✅ Revo 2.0 generation test PASSED');
      console.log('🖼️ Image generated successfully');
      console.log('⭐ Quality Score:', result.qualityScore);
      console.log('⚡ Processing Time:', result.processingTime + 'ms');
      console.log('🔧 Enhancements:', result.enhancementsApplied.join(', '));
      return true;
    } else {
      console.log('❌ Revo 2.0 generation test FAILED - No image URL');
      return false;
    }

  } catch (error) {
    console.error('❌ Revo 2.0 generation test error:', error);
    return false;
  }
}

/**
 * Test Revo 2.0 with different aspect ratios
 */
export async function testRevo20AspectRatios(): Promise<boolean> {
  console.log('📐 Testing Revo 2.0 aspect ratios...');
  
  const aspectRatios: Array<'1:1' | '16:9' | '9:16'> = ['1:1', '16:9', '9:16'];
  let successCount = 0;

  const testBrandProfile: BrandProfile = {
    businessName: 'Test Business',
    businessType: 'Technology',
    primaryColor: '#10b981',
    visualStyle: 'modern'
  };

  for (const aspectRatio of aspectRatios) {
    try {
      console.log(`📱 Testing ${aspectRatio} aspect ratio...`);
      
      const result = await generateWithRevo20({
        businessType: 'Technology',
        platform: 'instagram',
        visualStyle: 'modern',
        imageText: `${aspectRatio} Test`,
        brandProfile: testBrandProfile,
        aspectRatio
      });

      if (result.imageUrl) {
        console.log(`✅ ${aspectRatio} test PASSED`);
        successCount++;
      } else {
        console.log(`❌ ${aspectRatio} test FAILED`);
      }

    } catch (error) {
      console.error(`❌ ${aspectRatio} test error:`, error);
    }
  }

  const allPassed = successCount === aspectRatios.length;
  console.log(`📊 Aspect ratio tests: ${successCount}/${aspectRatios.length} passed`);
  
  return allPassed;
}

/**
 * Run comprehensive Revo 2.0 test suite
 */
export async function runRevo20TestSuite(): Promise<{
  basicTest: boolean;
  generationTest: boolean;
  aspectRatioTest: boolean;
  overallSuccess: boolean;
}> {
  console.log('🚀 Starting comprehensive Revo 2.0 test suite...');
  console.log('🍌 Testing Gemini 2.5 Flash Image (nano-banana) integration');
  
  const results = {
    basicTest: false,
    generationTest: false,
    aspectRatioTest: false,
    overallSuccess: false
  };

  try {
    // Test 1: Basic availability
    console.log('\n--- Test 1: Basic Availability ---');
    results.basicTest = await testRevo20Basic();

    if (!results.basicTest) {
      console.log('❌ Basic test failed, skipping other tests');
      return results;
    }

    // Test 2: Content generation
    console.log('\n--- Test 2: Content Generation ---');
    results.generationTest = await testRevo20Generation();

    // Test 3: Aspect ratios
    console.log('\n--- Test 3: Aspect Ratios ---');
    results.aspectRatioTest = await testRevo20AspectRatios();

    // Overall result
    results.overallSuccess = results.basicTest && results.generationTest && results.aspectRatioTest;

    console.log('\n🎯 REVO 2.0 TEST SUITE RESULTS:');
    console.log('✅ Basic Availability:', results.basicTest ? 'PASSED' : 'FAILED');
    console.log('✅ Content Generation:', results.generationTest ? 'PASSED' : 'FAILED');
    console.log('✅ Aspect Ratios:', results.aspectRatioTest ? 'PASSED' : 'FAILED');
    console.log('🎉 Overall Success:', results.overallSuccess ? 'PASSED' : 'FAILED');

    if (results.overallSuccess) {
      console.log('\n🚀 Revo 2.0 is fully operational and ready for production!');
    } else {
      console.log('\n⚠️ Some Revo 2.0 tests failed. Check the logs above for details.');
    }

  } catch (error) {
    console.error('❌ Test suite error:', error);
  }

  return results;
}

/**
 * Quick test function for browser console
 */
export async function quickTestRevo20(): Promise<void> {
  console.log('⚡ Quick Revo 2.0 test...');
  
  const basicTest = await testRevo20Basic();
  
  if (basicTest) {
    console.log('🎉 Revo 2.0 is available! Run runRevo20TestSuite() for full testing.');
  } else {
    console.log('❌ Revo 2.0 is not available. Check your API key and model access.');
  }
}

// Export for global access in development
if (typeof window !== 'undefined') {
  (window as any).testRevo20Basic = testRevo20Basic;
  (window as any).testRevo20Generation = testRevo20Generation;
  (window as any).testRevo20AspectRatios = testRevo20AspectRatios;
  (window as any).runRevo20TestSuite = runRevo20TestSuite;
  (window as any).quickTestRevo20 = quickTestRevo20;
  
  // Auto-display instructions
  console.log('🍌 Revo 2.0 (Gemini 2.5 Flash Image) testing functions loaded!');
  console.log('📋 Available functions:');
  console.log('  - quickTestRevo20() - Quick availability test');
  console.log('  - runRevo20TestSuite() - Comprehensive test suite');
  console.log('  - testRevo20Basic() - Basic availability only');
  console.log('  - testRevo20Generation() - Test content generation');
}
