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
 * Test Revo 2.0 content generation (SERVER-SIDE ONLY)
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
 * Test Revo 2.0 with different aspect ratios (SERVER-SIDE ONLY)
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
 * Run comprehensive Revo 2.0 test suite (SERVER-SIDE ONLY)
 */
export async function runRevo20TestSuite(): Promise<{
  basicTest: boolean;
  generationTest: boolean;
  aspectRatioTest: boolean;
  overallSuccess: boolean;
}> {
  console.log('🚀 Starting comprehensive Revo 2.0 test suite...');

  const results = {
    basicTest: false,
    generationTest: false,
    aspectRatioTest: false,
    overallSuccess: false
  };

  try {
    // Test 1: Basic availability
    console.log('\n1️⃣ Testing basic availability...');
    results.basicTest = await testRevo20Basic();

    // Test 2: Content generation
    console.log('\n2️⃣ Testing content generation...');
    results.generationTest = await testRevo20Generation();

    // Test 3: Aspect ratios
    console.log('\n3️⃣ Testing aspect ratios...');
    results.aspectRatioTest = await testRevo20AspectRatios();

    // Overall success
    results.overallSuccess = results.basicTest && results.generationTest && results.aspectRatioTest;

    console.log('\n📊 Test Results Summary:');
    console.log(`   Basic Test: ${results.basicTest ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Generation Test: ${results.generationTest ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Aspect Ratio Test: ${results.aspectRatioTest ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Overall: ${results.overallSuccess ? '🚀 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);

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
 * Quick test function (SERVER-SIDE ONLY)
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
