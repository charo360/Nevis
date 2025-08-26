'use server';

/**
 * Revo 2.0 Server Actions
 * Next-generation content creation with Imagen 4 integration
 */

import { generateRevo2Content, type Revo2GenerationInput } from '@/ai/flows/revo-2-generation';
import type { BrandProfile, Platform, BrandConsistencyPreferences, GeneratedPost } from '@/lib/types';

/**
 * Generate content with Revo 2.0 (Imagen 4)
 */
export async function generateRevo2ContentAction(
  brandProfile: BrandProfile,
  platform: Platform,
  brandConsistency: BrandConsistencyPreferences,
  prompt?: string,
  options?: {
    aspectRatio?: '1:1' | '16:9' | '9:16' | '21:9' | '4:5';
    style?: 'photographic' | 'artistic' | 'digital_art' | 'cinematic' | 'anime' | 'sketch';
    quality?: 'standard' | 'high' | 'ultra';
    mood?: 'professional' | 'energetic' | 'calm' | 'vibrant' | 'elegant' | 'bold';
  }
): Promise<GeneratedPost> {
  try {
    console.log('🌟 Starting Revo 2.0 content generation...');
    console.log(`📱 Platform: ${platform}`);
    console.log(`🎨 Style: ${options?.style || 'photographic'}`);
    console.log(`⚡ Quality: ${options?.quality || 'ultra'}`);

    // Generate content prompt if not provided
    const contentPrompt = prompt || generateContentPrompt(brandProfile, platform);

    // Prepare Revo 2.0 input
    const revo2Input: Revo2GenerationInput = {
      prompt: contentPrompt,
      platform,
      aspectRatio: options?.aspectRatio,
      brandProfile,
      brandConsistency,
      style: options?.style || 'photographic',
      quality: options?.quality || 'ultra',
      mood: options?.mood || 'professional',
      enhancePrompt: true
    };

    // Generate with Revo 2.0
    const result = await generateRevo2Content(revo2Input);

    console.log(`✅ Revo 2.0 generation completed!`);
    console.log(`🎯 Quality Score: ${result.qualityScore}/10`);
    console.log(`🚀 Enhancements: ${result.enhancementsApplied.length}`);

    // Convert to GeneratedPost format
    const generatedPost: GeneratedPost = {
      id: `revo2-${Date.now()}`,
      date: new Date().toISOString(),
      platform: platform.toLowerCase() as Platform, // Fix: Ensure lowercase for Firestore compatibility
      postType: 'post',
      imageUrl: result.imageUrl,
      content: result.caption, // Fix: Use 'content' instead of 'caption'
      hashtags: result.hashtags,
      status: 'generated',
      variants: [{
        platform: platform.toLowerCase() as Platform, // Fix: Ensure lowercase for Firestore compatibility
        imageUrl: result.imageUrl
      }],
      catchyWords: '', // Will be populated from result if available
      createdAt: new Date(),
      brandProfileId: brandProfile.id || 'unknown',
      qualityScore: result.qualityScore,
      metadata: {
        model: 'revo-2.0',
        qualityScore: result.qualityScore,
        processingTime: result.processingTime,
        enhancementsApplied: result.enhancementsApplied,
        aspectRatio: result.aspectRatio,
        ...result.metadata
      }
    };

    return generatedPost;

  } catch (error) {
    console.error('❌ Revo 2.0 content generation failed:', error);
    throw new Error(`Revo 2.0 generation failed: ${(error as Error).message}`);
  }
}

/**
 * Generate creative asset with Revo 2.0
 */
export async function generateRevo2CreativeAssetAction(
  prompt: string,
  brandProfile?: BrandProfile,
  options?: {
    platform?: Platform;
    aspectRatio?: '1:1' | '16:9' | '9:16' | '21:9' | '4:5';
    style?: 'photographic' | 'artistic' | 'digital_art' | 'cinematic' | 'anime' | 'sketch';
    quality?: 'standard' | 'high' | 'ultra';
    mood?: 'professional' | 'energetic' | 'calm' | 'vibrant' | 'elegant' | 'bold';
  }
): Promise<{
  imageUrl: string;
  aiExplanation: string;
  qualityScore: number;
  processingTime: number;
  enhancementsApplied: string[];
}> {
  try {
    console.log('🎨 Starting Revo 2.0 creative asset generation...');
    console.log(`🎯 Prompt: ${prompt}`);
    console.log(`🎨 Style: ${options?.style || 'photographic'}`);

    // Prepare Revo 2.0 input
    const revo2Input: Revo2GenerationInput = {
      prompt,
      platform: options?.platform || 'Instagram',
      aspectRatio: options?.aspectRatio,
      brandProfile,
      style: options?.style || 'photographic',
      quality: options?.quality || 'ultra',
      mood: options?.mood || 'professional',
      enhancePrompt: true
    };

    // Generate with Revo 2.0
    const result = await generateRevo2Content(revo2Input);

    // Create AI explanation
    const aiExplanation = `🌟 Revo 2.0 Ultra Generation Complete!

🎯 Quality Score: ${result.qualityScore}/10
⚡ Processing Time: ${result.processingTime}ms
🎨 Style: ${result.metadata.style}
📐 Aspect Ratio: ${result.aspectRatio}
🔧 Model: ${result.metadata.model}

🚀 Enhancements Applied:
${result.enhancementsApplied.map(enhancement => `• ${enhancement}`).join('\n')}

This image was created using our next-generation AI engine with revolutionary capabilities, delivering ultra-high quality results with advanced style control and professional optimization.`;

    console.log(`✅ Revo 2.0 creative asset completed!`);
    console.log(`🎯 Quality Score: ${result.qualityScore}/10`);

    return {
      imageUrl: result.imageUrl,
      aiExplanation,
      qualityScore: result.qualityScore,
      processingTime: result.processingTime,
      enhancementsApplied: result.enhancementsApplied
    };

  } catch (error) {
    console.error('❌ Revo 2.0 creative asset generation failed:', error);
    throw new Error(`Revo 2.0 creative asset generation failed: ${(error as Error).message}`);
  }
}

/**
 * Generate content prompt based on brand profile and platform
 */
function generateContentPrompt(brandProfile: BrandProfile, platform: Platform): string {
  const businessType = brandProfile.businessType || 'business';
  const visualStyle = brandProfile.visualStyle || 'modern';

  const platformPrompts = {
    Instagram: `Create an engaging Instagram post for a ${businessType} with ${visualStyle} style`,
    Facebook: `Design a shareable Facebook post for a ${businessType} with ${visualStyle} aesthetic`,
    Twitter: `Generate a Twitter-optimized image for a ${businessType} with ${visualStyle} design`,
    LinkedIn: `Create a professional LinkedIn post for a ${businessType} with ${visualStyle} style`,
  };

  let prompt = platformPrompts[platform] || platformPrompts.Instagram;

  // Add brand-specific context
  if (brandProfile.businessName) {
    prompt += ` for ${brandProfile.businessName}`;
  }

  if (brandProfile.targetAudience) {
    prompt += `, targeting ${brandProfile.targetAudience}`;
  }

  if (brandProfile.primaryColor) {
    prompt += `, incorporating ${brandProfile.primaryColor} brand color`;
  }

  return prompt;
}

/**
 * Get Revo 2.0 capabilities
 */
export async function getRevo2CapabilitiesAction() {
  return {
    name: 'Revo 2.0',
    description: 'Next-generation AI content creation with revolutionary capabilities',
    features: [
      'Ultra-high quality image generation',
      'Multi-aspect ratio support (1:1, 16:9, 9:16, 21:9, 4:5)',
      'Advanced style control (6 professional styles)',
      'Professional mood settings',
      'Brand color integration',
      'Platform-optimized generation',
      'Enhanced prompt engineering',
      'Revolutionary AI engine',
      'Smart caption generation',
      'Intelligent hashtag strategy'
    ],
    styles: [
      { id: 'photographic', name: 'Photographic', description: 'Professional photography style' },
      { id: 'artistic', name: 'Artistic', description: 'Creative artistic interpretation' },
      { id: 'digital_art', name: 'Digital Art', description: 'Modern digital art style' },
      { id: 'cinematic', name: 'Cinematic', description: 'Movie-like cinematic quality' },
      { id: 'anime', name: 'Anime', description: 'Anime art style' },
      { id: 'sketch', name: 'Sketch', description: 'Hand-drawn sketch aesthetic' }
    ],
    qualities: [
      { id: 'standard', name: 'Standard', description: 'Good quality, fast generation' },
      { id: 'high', name: 'High', description: 'High quality, balanced performance' },
      { id: 'ultra', name: 'Ultra', description: 'Maximum quality, premium results' }
    ],
    aspectRatios: [
      { id: '1:1', name: 'Square', description: 'Perfect for Instagram posts' },
      { id: '16:9', name: 'Landscape', description: 'Great for Facebook, YouTube' },
      { id: '9:16', name: 'Portrait', description: 'Ideal for TikTok, Stories' },
      { id: '21:9', name: 'Ultra Wide', description: 'Cinematic wide format' },
      { id: '4:5', name: 'Tall', description: 'Perfect for Pinterest' }
    ],
    supportedPlatforms: ['Instagram', 'Facebook', 'Twitter', 'LinkedIn'],
    qualityRange: '8.5-10.0/10',
    status: 'Revolutionary'
  };
}
