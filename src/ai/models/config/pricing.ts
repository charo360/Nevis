/**
 * Clean pricing config (single source of truth)
 */

import type { ModelPricing, RevoModelId } from '../types/model-types';

export const modelPricing: Record<RevoModelId, ModelPricing> = {
  'revo-1.0': { creditsPerGeneration: 2, creditsPerDesign: 2, creditsPerVideo: 0, tier: 'basic' },
  'revo-1.5': { creditsPerGeneration: 3, creditsPerDesign: 3, creditsPerVideo: 0, tier: 'enhanced' },
  'revo-2.0': { creditsPerGeneration: 3.5, creditsPerDesign: 3.5, creditsPerVideo: 0, tier: 'premium' }
};

export const creditPackages = {
  free: { name: 'Try Agent Free', credits: 10, price: 0, pricePerCredit: 0, bestFor: 'revo-1.0' },
  starter: { name: 'Starter Pack', credits: 40, price: 9.99, pricePerCredit: 0.25, bestFor: 'revo-1.0' },
  growth: { name: 'Growth Pack', credits: 100, price: 24.99, pricePerCredit: 0.25, bestFor: 'revo-1.5' },
  pro: { name: 'Pro Pack', credits: 250, price: 59.99, pricePerCredit: 0.24, bestFor: 'revo-1.5' },
  enterprise: { name: 'Enterprise Pack', credits: 1000, price: 199.99, pricePerCredit: 0.20, bestFor: 'revo-2.0' }
} as const;

export function getModelPricing(modelId: RevoModelId): ModelPricing {
  return modelPricing[modelId];
}

export default modelPricing;
