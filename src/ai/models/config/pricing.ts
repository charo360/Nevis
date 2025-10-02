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
  starter: { name: 'Starter Pack', credits: 40, price: 10, pricePerCredit: 0.20, bestFor: 'revo-1.0' },
  growth: { name: 'Growth Pack', credits: 120, price: 29, pricePerCredit: 0.19, bestFor: 'revo-1.5' },
  pro: { name: 'Pro Pack', credits: 220, price: 49, pricePerCredit: 0.196, bestFor: 'revo-1.5' },
  power: { name: 'Power Users Pack', credits: 500, price: 99, pricePerCredit: 0.18, bestFor: 'revo-2.0' }
} as const;

export function getModelPricing(modelId: RevoModelId): ModelPricing {
  return modelPricing[modelId];
}

export default modelPricing;
