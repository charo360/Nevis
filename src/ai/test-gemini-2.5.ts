/**
 * Test script for Gemini 2.5 Direct API
 * Run this to verify Gemini 2.5 is working properly
 */

import { testConnection, generateText, getAvailableModels, GEMINI_2_5_MODELS } from './google-ai-direct';
import { generateEnhancedDesign } from './gemini-2.5-design';
import { BrandProfile } from '@/lib/types';

/**
 * Test basic Gemini 2.5 connection
 */
export async function testBasicConnection(): Promise<boolean> {
  console.log('🔌 Testing basic Gemini 2.5 connection...');
  
  try {
    const isConnected = await testConnection();
    
    if (isConnected) {
      console.log('✅ Basic connection test PASSED');
      return true;
    } else {
      console.log('❌ Basic connection test FAILED');
      return false;
    }
  } catch (error) {
    console.error('❌ Connection test error:', error);
    return false;
  }
}

/**
 * Test text generation with different models
 */
export async function testTextGeneration(): Promise<boolean> {
  console.log('📝 Testing text generation with Gemini 2.5 models...');
  
  try {
    const testPrompt = 'Write a creative tagline for a fintech company called "Indexfand" that helps SACCOs in Kenya with digital transformation.';
    
    // Test Flash model
    console.log('Testing Gemini 2.5 Flash...');
    const flashResponse = await generateText(testPrompt, {
      model: GEMINI_2_5_MODELS.FLASH,
      maxOutputTokens: 100
    });
    console.log('Flash response:', flashResponse.text.substring(0, 100) + '...');
    
    // Test Pro model
    console.log('Testing Gemini 2.5 Pro...');
    const proResponse = await generateText(testPrompt, {
      model: GEMINI_2_5_MODELS.PRO,
      maxOutputTokens: 100
    });
    console.log('Pro response:', proResponse.text.substring(0, 100) + '...');
    
    console.log('✅ Text generation test PASSED');
    return true;
    
  } catch (error) {
    console.error('❌ Text generation test FAILED:', error);
    return false;
  }
}

/**
 * Test design generation
 */
export async function testDesignGeneration(): Promise<boolean> {
  console.log('🎨 Testing design generation with Gemini 2.5...');
  
  try {
    const mockBrandProfile: BrandProfile = {
      id: 'test-brand',
      userId: 'test-user',
      businessName: 'Indexfand',
      businessType: 'Fintech',
      targetAudience: 'SACCOs in Kenya',
      writingTone: 'Professional and approachable',
      visualStyle: 'Modern and trustworthy',
      primaryColor: '#1e40af',
      accentColor: '#3b82f6',
      backgroundColor: '#ffffff',
      services: ['Digital transformation', 'SACCO management', 'Financial technology'],
      description: 'Empowering SACCOs with digital transformation solutions',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const designInput = {
      businessType: 'Fintech',
      platform: 'Instagram',
      visualStyle: 'Modern professional',
      imageText: 'Transform Your SACCO Today',
      brandProfile: mockBrandProfile,
      brandConsistency: {
        strictConsistency: true,
        followBrandColors: true
      }
    };

    const designResult = await generateEnhancedDesign(designInput);
    
    console.log('Design generation results:');
    console.log('- Quality Score:', designResult.qualityScore);
    console.log('- Processing Time:', designResult.processingTime + 'ms');
    console.log('- Model Used:', designResult.model);
    console.log('- Enhancements Applied:', designResult.enhancementsApplied.join(', '));
    console.log('- Image URL length:', designResult.imageUrl.length);
    
    if (designResult.imageUrl && designResult.imageUrl.startsWith('data:image/svg+xml')) {
      console.log('✅ Design generation test PASSED');
      return true;
    } else {
      console.log('❌ Design generation test FAILED - Invalid image URL');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Design generation test FAILED:', error);
    return false;
  }
}

/**
 * Run all tests
 */
export async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Gemini 2.5 comprehensive tests...\n');
  
  // Show available models
  const modelsInfo = getAvailableModels();
  console.log('📋 Available Models:', Object.values(modelsInfo.models));
  console.log('');
  
  const results = {
    connection: false,
    textGeneration: false,
    designGeneration: false
  };
  
  // Test 1: Basic Connection
  results.connection = await testBasicConnection();
  console.log('');
  
  // Test 2: Text Generation (only if connection works)
  if (results.connection) {
    results.textGeneration = await testTextGeneration();
    console.log('');
  }
  
  // Test 3: Design Generation (only if text generation works)
  if (results.textGeneration) {
    results.designGeneration = await testDesignGeneration();
    console.log('');
  }
  
  // Summary
  console.log('📊 TEST RESULTS SUMMARY:');
  console.log('========================');
  console.log(`Connection Test: ${results.connection ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Text Generation: ${results.textGeneration ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Design Generation: ${results.designGeneration ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! Gemini 2.5 is ready for production use.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the logs above for details.');
  }
}

/**
 * Quick test function for development
 */
export async function quickTest(): Promise<void> {
  console.log('⚡ Running quick Gemini 2.5 test...');
  
  try {
    const response = await generateText('Hello Gemini 2.5! Please confirm you are working.', {
      model: GEMINI_2_5_MODELS.FLASH,
      maxOutputTokens: 50
    });
    
    console.log('Response:', response.text);
    console.log('✅ Quick test completed successfully!');
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
  }
}
