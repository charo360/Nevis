/**
 * Model Configurations
 * Centralized configuration for all Revo model versions
 */

import type { RevoModel, RevoModelId } from '../types/model-types';
import { modelCapabilities } from './capabilities';
import { modelPricing } from './pricing';

// Base configurations for different AI services
const baseConfigs = {
  'gemini-2.0': {
    aiService: 'gemini-2.0' as const,
    fallbackServices: ['gemini-2.5', 'openai'],
    maxRetries: 3,
    timeout: 30000,
    qualitySettings: {
      imageResolution: '1024x1024',
      compressionLevel: 85,
      enhancementLevel: 5
    },
    promptSettings: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      topK: 40
    }
  },
  'gemini-2.5': {
    aiService: 'gemini-2.5' as const,
    fallbackServices: ['gemini-2.0', 'openai'],
    maxRetries: 2,
    timeout: 45000,
    qualitySettings: {
      imageResolution: '1024x1024',
      compressionLevel: 90,
      enhancementLevel: 7
    },
    promptSettings: {
      temperature: 0.8,
      maxTokens: 4096,
      topP: 0.95,
      topK: 50
    }
  },
  'openai': {
    aiService: 'openai' as const,
    fallbackServices: ['gemini-2.5', 'gemini-2.0'],
    maxRetries: 3,
    timeout: 35000,
    qualitySettings: {
      imageResolution: '1024x1024',
      compressionLevel: 88,
      enhancementLevel: 6
    },
    promptSettings: {
      temperature: 0.7,
      maxTokens: 3000,
      topP: 0.9
    }
  },
  'imagen-4': {
    aiService: 'imagen-4' as const,
    fallbackServices: ['gemini-2.5', 'openai'],
    maxRetries: 2,
    timeout: 60000,
    qualitySettings: {
      imageResolution: '4096x4096',
      compressionLevel: 95,
      enhancementLevel: 10
    },
    promptSettings: {
      temperature: 0.6,
      maxTokens: 2048,
      topP: 0.85
    }
  }
};

// Model definitions
export const modelConfigs: Record<RevoModelId, RevoModel> = {
  'revo-1.0': {
    id: 'revo-1.0',
    name: 'Revo 1.0',
    version: '1.0.0',
    description: 'Standard Model - Stable Foundation',
    longDescription: 'Reliable AI engine with proven performance. Perfect for consistent, high-quality content generation with 1:1 aspect ratio images and core features.',
    icon: 'Zap',
    badge: 'Stable',
    badgeVariant: 'secondary',
    status: 'stable',
    capabilities: modelCapabilities['revo-1.0'],
    config: baseConfigs['gemini-2.0'],
    pricing: modelPricing['revo-1.0'],
    features: [
      'Reliable AI Engine',
      '1:1 Images',
      'Core Features',
      'Proven Performance',
      'Multi-platform Support',
      'Basic Brand Consistency'
    ],
    releaseDate: '2024-01-15',
    lastUpdated: '2024-12-01'
  },

  'revo-1.5': {
    id: 'revo-1.5',
    name: 'Revo 1.5',
    version: '1.5.0',
    description: 'Enhanced Model - Advanced Features',
    longDescription: 'Advanced AI engine with superior capabilities. Enhanced content generation algorithms, superior quality control, and professional design generation with improved brand integration.',
    icon: 'Sparkles',
    badge: 'Enhanced',
    badgeVariant: 'default',
    status: 'enhanced',
    capabilities: modelCapabilities['revo-1.5'],
    config: {
      ...baseConfigs['gemini-2.5'],
      qualitySettings: {
        ...baseConfigs['gemini-2.5'].qualitySettings,
        enhancementLevel: 8
      }
    },
    pricing: modelPricing['revo-1.5'],
    features: [
      'Advanced AI Engine',
      'Superior Quality',
      'Enhanced Design',
      'Smart Optimizations',
      'Professional Templates',
      'Advanced Brand Integration',
      'Real-time Context',
      'Trending Topics Integration'
    ],
    releaseDate: '2024-06-20',
    lastUpdated: '2024-12-15'
  },

  'revo-2.0': {
    id: 'revo-2.0',
    name: 'Revo 2.0',
    version: '2.0.0',
    description: 'Next Generation - Future Development',
    longDescription: 'Next-generation AI engine with revolutionary features. Multi aspect ratio support, advanced text rendering, smart content optimization, and breakthrough performance improvements.',
    icon: 'Rocket',
    badge: 'Next-Gen',
    badgeVariant: 'outline',
    status: 'development',
    capabilities: modelCapabilities['revo-2.0'],
    config: {
      ...baseConfigs['gemini-2.5'],
      timeout: 60000,
      qualitySettings: {
        ...baseConfigs['gemini-2.5'].qualitySettings,
        imageResolution: '2048x2048',
        enhancementLevel: 9
      },
      promptSettings: {
        ...baseConfigs['gemini-2.5'].promptSettings,
        temperature: 0.9,
        maxTokens: 6000
      }
    },
    pricing: modelPricing['revo-2.0'],
    features: [
      'Next-Gen AI Engine',
      'Multi Aspect Ratios',
      'Revolutionary Features',
      'Advanced UI',
      'A/B Testing Capabilities',
      'Performance Breakthroughs',
      'Advanced Text Rendering',
      'Smart Content Optimization'
    ],
    releaseDate: '2024-11-01',
    lastUpdated: '2024-12-19'
  },

  'imagen-4': {
    id: 'imagen-4',
    name: 'Imagen 4',
    version: '4.0.0',
    description: 'Google\'s most advanced image generation - 4K resolution, perfect text rendering',
    longDescription: 'Google\'s most advanced image generation model with 4K resolution support, perfect text rendering, superior photorealism, and advanced style controls for premium quality content.',
    icon: 'Diamond',
    badge: 'Premium',
    badgeVariant: 'default',
    status: 'enhanced',
    capabilities: modelCapabilities['imagen-4'],
    config: baseConfigs['imagen-4'],
    pricing: modelPricing['imagen-4'],
    features: [
      '4K Resolution',
      'Perfect Text Rendering',
      'Superior Photorealism',
      'Advanced Style Controls',
      'Premium Quality',
      'Brand Consistency',
      'Precise Prompt Following',
      'Professional Results'
    ],
    releaseDate: '2024-10-15',
    lastUpdated: '2024-12-10'
  }
};

// Helper functions
export function getModelConfig(modelId: RevoModelId): RevoModel {
  const config = modelConfigs[modelId];
  if (!config) {
    throw new Error(`Model configuration not found for: ${modelId}`);
  }
  return config;
}

export function getAllModelConfigs(): RevoModel[] {
  return Object.values(modelConfigs);
}

export function getModelsByStatus(status: RevoModel['status']): RevoModel[] {
  return getAllModelConfigs().filter(model => model.status === status);
}

export function getModelsByTier(tier: 'basic' | 'premium' | 'enterprise'): RevoModel[] {
  return getAllModelConfigs().filter(model => model.pricing.tier === tier);
}

export function getLatestModels(): RevoModel[] {
  return getAllModelConfigs()
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 3);
}

export function getRecommendedModel(): RevoModel {
  // Return Revo 1.5 as the recommended balanced option
  return modelConfigs['revo-1.5'];
}

export function getModelForBudget(maxCredits: number): RevoModel[] {
  return getAllModelConfigs()
    .filter(model => model.pricing.creditsPerGeneration <= maxCredits)
    .sort((a, b) => a.pricing.creditsPerGeneration - b.pricing.creditsPerGeneration);
}

// Model comparison utilities
export function compareModels(modelA: RevoModelId, modelB: RevoModelId) {
  const configA = getModelConfig(modelA);
  const configB = getModelConfig(modelB);

  return {
    quality: {
      a: configA.capabilities.maxQuality,
      b: configB.capabilities.maxQuality,
      winner: configA.capabilities.maxQuality > configB.capabilities.maxQuality ? modelA : modelB
    },
    cost: {
      a: configA.pricing.creditsPerGeneration,
      b: configB.pricing.creditsPerGeneration,
      winner: configA.pricing.creditsPerGeneration < configB.pricing.creditsPerGeneration ? modelA : modelB
    },
    features: {
      a: configA.features.length,
      b: configB.features.length,
      winner: configA.features.length > configB.features.length ? modelA : modelB
    },
    status: {
      a: configA.status,
      b: configB.status,
      recommendation: configA.status === 'stable' || configB.status === 'stable' ? 
        (configA.status === 'stable' ? modelA : modelB) : modelA
    }
  };
}
