/**
 * Gemini 3 Pro Image Generation Service
 * High-resolution image generation with aspect ratio and size control
 * Uses direct Gemini API (AI Studio) for Gemini 3 Pro access
 */

import { getGeminiAPIClient } from './gemini-api-client';

export interface Gemini3ProImageOptions {
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  imageSize?: '256' | '512' | '1K' | '2K';
  temperature?: number;
  logoImage?: string; // Base64 data URL for brand logo
}

/**
 * Generate high-resolution image using Gemini 3 Pro
 * @param prompt - The image generation prompt with scene description
 * @param options - Configuration options for aspect ratio, size, etc.
 * @returns Base64 encoded image data URL
 */
export async function generateGemini3ProImage(
  prompt: string,
  options: Gemini3ProImageOptions = {}
): Promise<string> {
  const {
    aspectRatio = '3:4', // Default to Instagram portrait
    imageSize = '1K', // Default to high resolution
    temperature = 0.7,
    logoImage
  } = options;

  console.log('🎨 [Gemini 3 Pro] Generating image with config:', {
    aspectRatio,
    imageSize,
    temperature,
    hasLogo: !!logoImage
  });

  // Enhanced prompt with quality instructions
  const enhancedPrompt = `${prompt}. Cinematic lighting, 8k resolution, trending on Instagram, shot on 35mm lens, highly detailed, photorealistic.`;

  const result = await getGeminiAPIClient().generateImage(
    enhancedPrompt,
    'gemini-3-pro-image-preview', // Using direct Gemini API for Gemini 3 Pro
    {
      temperature,
      aspectRatio,
      imageSize,
      logoImage
    }
  );

  // Return as data URL
  return `data:${result.mimeType};base64,${result.imageData}`;
}

/**
 * Generate influencer-style image with consistent persona
 * @param personaDescription - Physical description of the persona (from AI analysis)
 * @param scenario - The scene/scenario to generate
 * @param options - Configuration options
 * @returns Base64 encoded image data URL
 */
export async function generateInfluencerImage(
  personaDescription: string,
  scenario: string,
  options: Gemini3ProImageOptions = {}
): Promise<string> {
  // Combine persona description with scenario
  const prompt = `${personaDescription}. Scene: ${scenario}. Cinematic lighting, 8k resolution, trending on Instagram, shot on 35mm lens, highly detailed, photorealistic.`;

  return generateGemini3ProImage(prompt, {
    aspectRatio: '3:4', // Instagram portrait ratio
    imageSize: '1K', // High resolution
    ...options
  });
}

/**
 * Generate product/service ad image for Revo 2.0
 * @param adPrompt - Complete ad generation prompt
 * @param platform - Social media platform (determines aspect ratio)
 * @param options - Additional configuration options
 * @returns Base64 encoded image data URL
 */
export async function generateRevo2AdImage(
  adPrompt: string,
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok' = 'instagram',
  options: Omit<Gemini3ProImageOptions, 'aspectRatio'> = {}
): Promise<string> {
  // Platform-specific aspect ratios
  const aspectRatios: Record<string, '1:1' | '3:4' | '4:3' | '9:16' | '16:9'> = {
    instagram: '3:4', // Portrait
    facebook: '4:3', // Landscape
    twitter: '16:9', // Wide
    linkedin: '4:3', // Landscape
    tiktok: '9:16' // Vertical
  };

  return generateGemini3ProImage(adPrompt, {
    aspectRatio: aspectRatios[platform],
    imageSize: '1K', // High resolution for ads
    ...options
  });
}

/**
 * Batch generate multiple variations of the same ad
 * @param adPrompt - Base ad prompt
 * @param count - Number of variations to generate
 * @param options - Configuration options
 * @returns Array of base64 encoded image data URLs
 */
export async function generateAdVariations(
  adPrompt: string,
  count: number = 3,
  options: Gemini3ProImageOptions = {}
): Promise<string[]> {
  console.log(`🎨 [Gemini 3 Pro] Generating ${count} ad variations`);

  const promises = Array.from({ length: count }, (_, index) => {
    // Add slight variation to each prompt
    const variedPrompt = `${adPrompt}. Variation ${index + 1}: unique composition and styling.`;
    return generateGemini3ProImage(variedPrompt, options);
  });

  return Promise.all(promises);
}
