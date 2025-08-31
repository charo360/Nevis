/**
 * Model Capabilities Configuration
 * Defines what each model version can do
 */

import type { ModelCapabilities, RevoModelId } from '../types/model-types';
import type { Platform } from '@/lib/types';

// Define capabilities for each model version
export const modelCapabilities: Record<RevoModelId, ModelCapabilities> = {
  'revo-1.0': {
    // Enhanced stable model capabilities with Gemini 2.5 Flash Image Preview
    contentGeneration: true,
    designGeneration: true,
    videoGeneration: false, // Not supported in 1.0
    enhancedFeatures: true, // Upgraded from false
    artifactSupport: false, // Basic model doesn't support artifacts
    aspectRatios: ['1:1'], // Only square images
    maxQuality: 9, // Upgraded from 7 for Gemini 2.5 Flash Image Preview
    supportedPlatforms: ['Instagram', 'Facebook', 'Twitter', 'LinkedIn'] as Platform[],
    advancedPrompting: true,
    brandConsistency: true, // Enhanced brand consistency
    realTimeContext: true, // Now enabled for better context
    perfectTextRendering: true, // NEW: Gemini 2.5 Flash Image Preview feature
    highResolution: true // NEW: 2048x2048 support
  },

  'revo-1.5': {
    // Enhanced model with advanced features
    contentGeneration: true,
    designGeneration: true,
    videoGeneration: false, // Video coming in 2.0
    enhancedFeatures: true,
    artifactSupport: true, // Full artifact support
    aspectRatios: ['1:1', '16:9', '9:16'], // Multiple aspect ratios
    maxQuality: 8, // Superior quality
    supportedPlatforms: ['Instagram', 'Facebook', 'Twitter', 'LinkedIn'] as Platform[],
    advancedPrompting: true,
    brandConsistency: true, // Advanced brand consistency
    realTimeContext: true // Real-time context and trends
  },



  'revo-2.0': {
    // Premium Next-Gen AI model
    contentGeneration: true,
    designGeneration: true,
    videoGeneration: false, // Focus on premium image generation
    enhancedFeatures: true,
    artifactSupport: true, // Premium artifact support
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'], // All aspect ratios
    maxQuality: 10, // Maximum quality with native image generation
    supportedPlatforms: ['Instagram', 'Facebook', 'Twitter', 'LinkedIn'] as Platform[],
    advancedPrompting: true,
    brandConsistency: true, // Perfect brand consistency with character consistency
    realTimeContext: true, // Premium real-time features
    characterConsistency: true, // NEW: Maintain character consistency across images
    intelligentEditing: true, // NEW: Inpainting, outpainting, targeted edits
    multimodalReasoning: true // NEW: Advanced visual context understanding
  }
};

// Capability comparison matrix
export const capabilityMatrix = {
  contentGeneration: {
    'revo-1.0': 'enhanced', // Upgraded from standard
    'revo-1.5': 'enhanced',
    'revo-2.0': 'premium'
  },
  designGeneration: {
    'revo-1.0': 'enhanced', // Upgraded from basic
    'revo-1.5': 'enhanced',
    'revo-2.0': 'premium'
  },
  videoGeneration: {
    'revo-1.0': 'none',
    'revo-1.5': 'none',
    'revo-2.0': 'none'
  },
  artifactSupport: {
    'revo-1.0': 'none',
    'revo-1.5': 'full',
    'revo-2.0': 'premium'
  },
  brandConsistency: {
    'revo-1.0': 'enhanced', // Upgraded from basic
    'revo-1.5': 'advanced',
    'revo-2.0': 'perfect'
  },
  characterConsistency: {
    'revo-1.0': 'none',
    'revo-1.5': 'none',
    'revo-2.0': 'advanced'
  },
  intelligentEditing: {
    'revo-1.0': 'none',
    'revo-1.5': 'none',
    'revo-2.0': 'advanced'
  }
} as const;

// Feature availability by model
export const featureAvailability = {
  // Content features
  hashtagGeneration: ['revo-1.0', 'revo-1.5', 'revo-2.0'],
  catchyWords: ['revo-1.0', 'revo-1.5', 'revo-2.0'],
  subheadlines: ['revo-1.5', 'revo-2.0'],
  callToAction: ['revo-1.5', 'revo-2.0'],
  contentVariants: ['revo-1.5', 'revo-2.0'],

  // Design features
  logoIntegration: ['revo-1.0', 'revo-1.5', 'revo-2.0'],
  brandColors: ['revo-1.0', 'revo-1.5', 'revo-2.0'],
  designExamples: ['revo-1.5', 'revo-2.0'],
  textOverlay: ['revo-1.5', 'revo-2.0'],
  multipleAspectRatios: ['revo-1.5', 'revo-2.0'],

  // Advanced features
  realTimeContext: ['revo-1.5', 'revo-2.0'],
  trendingTopics: ['revo-1.5', 'revo-2.0'],
  marketIntelligence: ['revo-1.5', 'revo-2.0'],
  competitorAnalysis: ['revo-2.0'],

  // Revo 2.0 exclusive features
  characterConsistency: ['revo-2.0'],
  intelligentEditing: ['revo-2.0'],
  inpainting: ['revo-2.0'],
  outpainting: ['revo-2.0'],
  multimodalReasoning: ['revo-2.0'],

  // Revo 1.0 enhanced features (NEW with Gemini 2.5 Flash Image Preview)
  perfectTextRendering: ['revo-1.0', 'revo-2.0'],
  highResolution: ['revo-1.0', 'revo-2.0'],

  // Artifact features
  artifactReference: ['revo-1.5'],
  exactUseArtifacts: ['revo-1.5'],
  textOverlayArtifacts: ['revo-1.5']
} as const;

// Platform-specific capabilities
export const platformCapabilities = {
  Instagram: {
    'revo-1.0': {
      aspectRatios: ['1:1'],
      maxQuality: 7,
      features: ['basic-design', 'hashtags']
    },
    'revo-1.5': {
      aspectRatios: ['1:1', '9:16'],
      maxQuality: 8,
      features: ['enhanced-design', 'hashtags', 'stories', 'reels-ready']
    }
  },
  Facebook: {
    'revo-1.0': {
      aspectRatios: ['16:9'],
      maxQuality: 7,
      features: ['basic-design', 'page-posts']
    },
    'revo-1.5': {
      aspectRatios: ['16:9', '1:1'],
      maxQuality: 8,
      features: ['enhanced-design', 'page-posts', 'stories']
    }
  },
  Twitter: {
    'revo-1.0': {
      aspectRatios: ['16:9'],
      maxQuality: 7,
      features: ['basic-design', 'tweets']
    },
    'revo-1.5': {
      aspectRatios: ['16:9', '1:1'],
      maxQuality: 8,
      features: ['enhanced-design', 'tweets', 'threads']
    }
  },
  LinkedIn: {
    'revo-1.0': {
      aspectRatios: ['16:9'],
      maxQuality: 7,
      features: ['basic-design', 'professional-posts']
    },
    'revo-1.5': {
      aspectRatios: ['16:9', '1:1'],
      maxQuality: 8,
      features: ['enhanced-design', 'professional-posts', 'articles']
    }
  }
} as const;

// Utility functions
export function hasCapability(modelId: RevoModelId, capability: keyof ModelCapabilities): boolean {
  return modelCapabilities[modelId][capability] as boolean;
}

export function getCapabilityLevel(modelId: RevoModelId, capability: keyof typeof capabilityMatrix): string {
  return capabilityMatrix[capability][modelId];
}

export function hasFeature(modelId: RevoModelId, feature: keyof typeof featureAvailability): boolean {
  return featureAvailability[feature].includes(modelId);
}

export function getModelsByFeature(feature: keyof typeof featureAvailability): RevoModelId[] {
  return [...featureAvailability[feature]] as RevoModelId[];
}

export function getPlatformCapabilities(modelId: RevoModelId, platform: Platform) {
  return platformCapabilities[platform]?.[modelId] || null;
}

export function getMaxQualityForPlatform(modelId: RevoModelId, platform: Platform): number {
  const platformCaps = getPlatformCapabilities(modelId, platform);
  return platformCaps?.maxQuality || modelCapabilities[modelId].maxQuality;
}

export function getSupportedAspectRatios(modelId: RevoModelId, platform?: Platform): string[] {
  if (platform) {
    const platformCaps = getPlatformCapabilities(modelId, platform);
    return platformCaps?.aspectRatios ? [...platformCaps.aspectRatios] : [...modelCapabilities[modelId].aspectRatios];
  }
  return [...modelCapabilities[modelId].aspectRatios];
}
