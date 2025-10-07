/**
 * Test script for Proxy-Only Gemini API
 * Run this to verify Proxy-Only Gemini is working properly
 */

import { testConnection, generateText, getAvailableModels, GEMINI_2_5_MODELS } from './google-ai-direct';
import { generateEnhancedDesign } from './gemini-2.5-design';
import { BrandProfile } from '@/lib/types';

/**
 * Test basic Gemini 2.5 connection
 */
export async function testBasicConnection(): Promise<boolean> {

  try {
    const isConnected = await testConnection();

    if (isConnected) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Test text generation with different models
 */
export async function testTextGeneration(): Promise<boolean> {

  try {
    const testPrompt = 'Write a creative tagline for a fintech company called "Indexfand" that helps SACCOs in Kenya with digital transformation.';

    // Test Flash model
    const flashResponse = await generateText(testPrompt, {
      model: GEMINI_2_5_MODELS.FLASH,
      maxOutputTokens: 100
    });

    // Test Pro model
    const proResponse = await generateText(testPrompt, {
      model: GEMINI_2_5_MODELS.PRO,
      maxOutputTokens: 100
    });

    return true;

  } catch (error) {
    return false;
  }
}

/**
 * Test design generation
 */
export async function testDesignGeneration(): Promise<boolean> {

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


    if (designResult.imageUrl && designResult.imageUrl.startsWith('data:image/svg+xml')) {
      return true;
    } else {
      return false;
    }

  } catch (error) {
    return false;
  }
}

/**
 * Run all tests
 */
export async function runAllTests(): Promise<void> {

  // Show available models
  const modelsInfo = getAvailableModels();

  const results = {
    connection: false,
    textGeneration: false,
    designGeneration: false
  };

  // Test 1: Basic Connection
  results.connection = await testBasicConnection();

  // Test 2: Text Generation (only if connection works)
  if (results.connection) {
    results.textGeneration = await testTextGeneration();
  }

  // Test 3: Design Generation (only if text generation works)
  if (results.textGeneration) {
    results.designGeneration = await testDesignGeneration();
  }

  // Summary

  const allPassed = Object.values(results).every(result => result === true);

  if (allPassed) {
  } else {
  }
}

/**
 * Quick test function for development
 */
export async function quickTest(): Promise<void> {

  try {
    const response = await generateText('Hello Gemini 2.5! Please confirm you are working.', {
      model: GEMINI_2_5_MODELS.FLASH,
      maxOutputTokens: 50
    });


  } catch (error) {
  }
}
