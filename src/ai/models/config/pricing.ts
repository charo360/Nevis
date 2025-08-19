/**
 * Model Pricing Configuration
 * Defines credit costs and pricing tiers for each model
 */

import type { ModelPricing, RevoModelId } from '../types/model-types';

// Pricing configuration for each model
export const modelPricing: Record<RevoModelId, ModelPricing> = {
  'revo-1.0': {
    creditsPerGeneration: 1,
    creditsPerDesign: 1,
    creditsPerVideo: 0, // Video not supported
    tier: 'basic'
  },

  'revo-1.5': {
    creditsPerGeneration: 2,
    creditsPerDesign: 2,
    creditsPerVideo: 0, // Video not supported yet
    tier: 'premium'
  },

  'revo-2.0': {
    creditsPerGeneration: 5,
    creditsPerDesign: 5,
    creditsPerVideo: 10, // Video generation available
    tier: 'premium'
  },

  'imagen-4': {
    creditsPerGeneration: 10,
    creditsPerDesign: 10,
    creditsPerVideo: 0, // Focus on premium image generation
    tier: 'enterprise'
  }
};

// Pricing tiers and their characteristics
export const pricingTiers = {
  basic: {
    name: 'Basic',
    description: 'Reliable and cost-effective',
    maxCreditsPerGeneration: 2,
    features: [
      'Standard quality generation',
      'Basic brand consistency',
      'Core platform support',
      'Standard processing speed'
    ],
    recommendedFor: [
      'Small businesses',
      'Personal brands',
      'Budget-conscious users',
      'Basic content needs'
    ]
  },
  premium: {
    name: 'Premium',
    description: 'Enhanced features and quality',
    maxCreditsPerGeneration: 10,
    features: [
      'Enhanced quality generation',
      'Advanced brand consistency',
      'Full platform support',
      'Artifact integration',
      'Real-time context',
      'Trending topics',
      'Multiple aspect ratios'
    ],
    recommendedFor: [
      'Growing businesses',
      'Marketing agencies',
      'Content creators',
      'Professional brands'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Maximum quality and features',
    maxCreditsPerGeneration: 20,
    features: [
      'Premium quality generation',
      '4K resolution support',
      'Perfect text rendering',
      'Advanced style controls',
      'Priority processing',
      'Dedicated support',
      'Custom integrations'
    ],
    recommendedFor: [
      'Large enterprises',
      'Premium brands',
      'High-volume users',
      'Quality-focused campaigns'
    ]
  }
} as const;

// Credit packages and their values
export const creditPackages = {
  starter: {
    name: 'Starter Pack',
    credits: 50,
    price: 9.99,
    pricePerCredit: 0.20,
    bestFor: 'revo-1.0',
    estimatedGenerations: {
      'revo-1.0': 50,
      'revo-1.5': 25,
      'revo-2.0': 10,
      'imagen-4': 5
    }
  },
  professional: {
    name: 'Professional Pack',
    credits: 200,
    price: 29.99,
    pricePerCredit: 0.15,
    bestFor: 'revo-1.5',
    estimatedGenerations: {
      'revo-1.0': 200,
      'revo-1.5': 100,
      'revo-2.0': 40,
      'imagen-4': 20
    }
  },
  business: {
    name: 'Business Pack',
    credits: 500,
    price: 59.99,
    pricePerCredit: 0.12,
    bestFor: 'revo-2.0',
    estimatedGenerations: {
      'revo-1.0': 500,
      'revo-1.5': 250,
      'revo-2.0': 100,
      'imagen-4': 50
    }
  },
  enterprise: {
    name: 'Enterprise Pack',
    credits: 1000,
    price: 99.99,
    pricePerCredit: 0.10,
    bestFor: 'imagen-4',
    estimatedGenerations: {
      'revo-1.0': 1000,
      'revo-1.5': 500,
      'revo-2.0': 200,
      'imagen-4': 100
    }
  }
} as const;

// Usage-based pricing calculations
export const usageCalculations = {
  // Calculate cost for a specific generation request
  calculateGenerationCost(modelId: RevoModelId, type: 'content' | 'design' | 'video' = 'content'): number {
    const pricing = modelPricing[modelId];
    
    switch (type) {
      case 'content':
        return pricing.creditsPerGeneration;
      case 'design':
        return pricing.creditsPerDesign;
      case 'video':
        return pricing.creditsPerVideo || 0;
      default:
        return pricing.creditsPerGeneration;
    }
  },

  // Calculate total cost for multiple generations
  calculateBatchCost(requests: { modelId: RevoModelId; type: 'content' | 'design' | 'video' }[]): number {
    return requests.reduce((total, request) => {
      return total + this.calculateGenerationCost(request.modelId, request.type);
    }, 0);
  },

  // Estimate monthly cost based on usage patterns
  estimateMonthlyCost(usage: {
    modelId: RevoModelId;
    generationsPerDay: number;
    designsPerDay: number;
    videosPerDay?: number;
  }): {
    dailyCost: number;
    monthlyCost: number;
    recommendedPackage: keyof typeof creditPackages;
  } {
    const pricing = modelPricing[usage.modelId];
    
    const dailyCost = 
      (usage.generationsPerDay * pricing.creditsPerGeneration) +
      (usage.designsPerDay * pricing.creditsPerDesign) +
      ((usage.videosPerDay || 0) * (pricing.creditsPerVideo || 0));
    
    const monthlyCost = dailyCost * 30;
    
    // Recommend package based on monthly cost
    let recommendedPackage: keyof typeof creditPackages = 'starter';
    if (monthlyCost > 400) recommendedPackage = 'enterprise';
    else if (monthlyCost > 150) recommendedPackage = 'business';
    else if (monthlyCost > 50) recommendedPackage = 'professional';
    
    return {
      dailyCost,
      monthlyCost,
      recommendedPackage
    };
  },

  // Check if user has enough credits for a request
  canAfford(userCredits: number, modelId: RevoModelId, type: 'content' | 'design' | 'video' = 'content'): boolean {
    const cost = this.calculateGenerationCost(modelId, type);
    return userCredits >= cost;
  },

  // Get the best model within budget
  getBestModelForBudget(availableCredits: number, type: 'content' | 'design' | 'video' = 'content'): RevoModelId[] {
    const affordableModels: RevoModelId[] = [];
    
    for (const [modelId, pricing] of Object.entries(modelPricing)) {
      const cost = type === 'content' ? pricing.creditsPerGeneration :
                   type === 'design' ? pricing.creditsPerDesign :
                   pricing.creditsPerVideo || 0;
      
      if (cost <= availableCredits && cost > 0) {
        affordableModels.push(modelId as RevoModelId);
      }
    }
    
    // Sort by quality (higher credit cost usually means higher quality)
    return affordableModels.sort((a, b) => {
      const costA = this.calculateGenerationCost(a, type);
      const costB = this.calculateGenerationCost(b, type);
      return costB - costA; // Descending order (highest quality first)
    });
  }
};

// Pricing display utilities
export const pricingDisplay = {
  // Format credits for display
  formatCredits(credits: number): string {
    if (credits >= 1000) {
      return `${(credits / 1000).toFixed(1)}K`;
    }
    return credits.toString();
  },

  // Format price for display
  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  },

  // Get pricing tier info
  getTierInfo(modelId: RevoModelId) {
    const pricing = modelPricing[modelId];
    return pricingTiers[pricing.tier];
  },

  // Get cost comparison between models
  compareCosts(modelA: RevoModelId, modelB: RevoModelId) {
    const costA = modelPricing[modelA].creditsPerGeneration;
    const costB = modelPricing[modelB].creditsPerGeneration;
    
    const difference = Math.abs(costA - costB);
    const percentDifference = ((difference / Math.min(costA, costB)) * 100).toFixed(0);
    
    return {
      cheaper: costA < costB ? modelA : modelB,
      moreExpensive: costA > costB ? modelA : modelB,
      difference,
      percentDifference: `${percentDifference}%`,
      ratio: `${Math.max(costA, costB)}:${Math.min(costA, costB)}`
    };
  },

  // Get value proposition for each model
  getValueProposition(modelId: RevoModelId) {
    const pricing = modelPricing[modelId];
    const tierInfo = pricingTiers[pricing.tier];
    
    return {
      model: modelId,
      tier: pricing.tier,
      creditsPerGeneration: pricing.creditsPerGeneration,
      valueScore: tierInfo.features.length / pricing.creditsPerGeneration, // Features per credit
      description: tierInfo.description,
      bestFor: tierInfo.recommendedFor
    };
  }
};

// Export utility functions
export function getModelPricing(modelId: RevoModelId): ModelPricing {
  return modelPricing[modelId];
}

export function getAllPricing(): Record<RevoModelId, ModelPricing> {
  return modelPricing;
}

export function getModelsByTier(tier: 'basic' | 'premium' | 'enterprise'): RevoModelId[] {
  return Object.entries(modelPricing)
    .filter(([_, pricing]) => pricing.tier === tier)
    .map(([modelId]) => modelId as RevoModelId);
}

export function getCheapestModel(): RevoModelId {
  return Object.entries(modelPricing)
    .reduce((cheapest, [modelId, pricing]) => {
      const currentCheapest = modelPricing[cheapest as RevoModelId];
      return pricing.creditsPerGeneration < currentCheapest.creditsPerGeneration ? 
        modelId as RevoModelId : cheapest as RevoModelId;
    }, 'revo-1.0' as RevoModelId);
}

export function getMostExpensiveModel(): RevoModelId {
  return Object.entries(modelPricing)
    .reduce((mostExpensive, [modelId, pricing]) => {
      const currentMostExpensive = modelPricing[mostExpensive as RevoModelId];
      return pricing.creditsPerGeneration > currentMostExpensive.creditsPerGeneration ? 
        modelId as RevoModelId : mostExpensive as RevoModelId;
    }, 'revo-1.0' as RevoModelId);
}
