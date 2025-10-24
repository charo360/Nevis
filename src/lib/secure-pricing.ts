/**
 * Secure Price Management System
 * Prevents price ID exposure while maintaining functionality
 * 
 * Frontend uses plan IDs, backend maps to actual Stripe price IDs
 */

import { getStripePrices } from './stripe-config';

// Public plan structure (safe to expose to frontend)
export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  description: string;
  features: string[];
  popular?: boolean;
}

// Frontend-safe pricing plans (no Stripe price IDs exposed)
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'try-free',
    name: 'Try Agent Free',
    price: 0,
    credits: 10,
    description: 'Perfect for trying out Crevo AI',
    features: [
      'Access to basic AI design generation',
      'Manual approval & download',
      'Limited support',
      '10 free credits (one-time)',
      'Images include watermark'
    ]
  },
  {
    id: 'starter',
    name: 'Starter Agent',
    price: 9.99,
    credits: 40,
    description: 'Great for small businesses',
    features: [
      'Advanced AI design generation',
      'Multiple design variations',
      'Priority support',
      'No watermarks',
      'Commercial license'
    ]
  },
  {
    id: 'growth',
    name: 'Growth Agent',
    price: 24.99,
    credits: 100,
    description: 'Perfect for growing businesses',
    popular: true,
    features: [
      'Everything in Starter',
      'Advanced customization',
      'Brand consistency tools',
      'Analytics dashboard',
      'API access'
    ]
  },
  {
    id: 'pro',
    name: 'Pro Agent',
    price: 59.99,
    credits: 250,
    description: 'For professional marketers',
    features: [
      'Everything in Growth',
      'Advanced AI models',
      'White-label options',
      'Priority processing',
      'Dedicated support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Agent',
    price: 199.99,
    credits: 1000,
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'Custom AI training',
      'Enterprise SSO',
      'SLA guarantees',
      'Account manager'
    ]
  }
];/**
 * SERVER-SIDE ONLY: Maps plan IDs to actual Stripe price IDs
 * This function should ONLY be called on the server-side
 * Never expose actual price IDs to the frontend
 */
export function getPlanToStripeMapping(): Record<string, string> {
  // Allow override with explicit environment variables for production stability
  const envMap: Record<string, string | undefined> = {
    'try-free': process.env.STRIPE_PRICE_TRY_FREE,
  'starter': process.env.STRIPE_PRICE_STARTER || 'price_1SKigfELJu3kIHjxCDb6h01E',
    'growth': process.env.STRIPE_PRICE_GROWTH,
    'pro': process.env.STRIPE_PRICE_PRO,
    'enterprise': process.env.STRIPE_PRICE_ENTERPRISE,
  };

  const prices = getStripePrices();

  return {
    // Support both frontend 'try-free' and server 'free' keys mapping to the same Stripe price
    'try-free': envMap['try-free'] || prices['try-free'],
    'free': envMap['try-free'] || prices['try-free'],
    'starter': envMap['starter'] || prices['starter'],
    'growth': envMap['growth'] || prices['growth'],
    'pro': envMap['pro'] || prices['pro'],
    'enterprise': envMap['enterprise'] || prices['enterprise']
  };
}

/**
 * Get plan details by ID (safe for frontend)
 */
export function getPlanById(planId: string): PricingPlan | null {
  return PRICING_PLANS.find(plan => plan.id === planId) || null;
}

/**
 * SERVER-SIDE ONLY: Convert plan ID to Stripe price ID
 */
export function planIdToStripePrice(planId: string): string | null {
  const mapping = getPlanToStripeMapping();
  return mapping[planId] || null;
}