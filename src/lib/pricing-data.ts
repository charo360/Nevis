import { Star, Zap, Crown, Rocket } from 'lucide-react';

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  costPerCredit: number;
  icon: string; // Icon name for dynamic loading
  popular?: boolean;
  features: string[];
  bonuses?: string[];
  description: string;
  stripePriceId?: string; // For future Stripe integration
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  period: 'month' | 'year' | 'one-time';
  available: boolean;
  stripePriceId?: string;
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Try Agent Free',
    price: 0,
    credits: 10,
    costPerCredit: 0,
    icon: 'star',
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
    costPerCredit: 0.25,
    icon: 'zap',
    description: 'Ideal for occasional users or testers',
    features: [
      'HD image generation',
      'No watermark on images',
      'Basic templates',
      'Email support'
    ]
  },
  {
    id: 'growth',
    name: 'Growth Agent',
    price: 24.99,
    credits: 100,
    costPerCredit: 0.25,
    icon: 'rocket',
    popular: true,
    description: 'Most popular for growing businesses',
    features: [
      'HD images without watermark',
      'Advanced AI models',
      'Brand consistency tools',
      'Priority support'
    ],
    bonuses: ['Priority generation speed']
  },
  {
    id: 'pro',
    name: 'Pro Agent',
    price: 59.99,
    credits: 250,
    costPerCredit: 0.24,
    icon: 'crown',
    description: 'For professional content creators',
    features: [
      'All Growth Pack features',
      'Advanced customization',
      'Bulk generation',
      'API access'
    ],
    bonuses: ['Early access to new features']
  },
  {
    id: 'enterprise',
    name: 'Enterprise Agent',
    price: 199.99,
    credits: 1000,
    costPerCredit: 0.20,
    icon: 'crown',
    description: 'For agencies and power users',
    features: [
      'All Pro Pack features',
      'White-label options',
      'Team collaboration',
      'Custom integrations'
    ],
    bonuses: ['Dedicated support', 'Request custom styles']
  }
];

export const addOns: AddOn[] = [
  {
    id: 'auto-posting',
    name: 'Auto-Posting',
    description: 'Automatically post to your social media accounts',
    price: 5,
    period: 'month',
    available: false // Coming soon
  },
  {
    id: 'extra-storage',
    name: 'Extra Storage',
    description: 'Store more designs and brand assets',
    price: 3,
    period: 'month',
    available: false // Coming soon
  }
];

export const revoCreditCosts = {
  'revo-1.0': 2,    // Enhanced basic (updated)
  'revo-1.5': 3,    // Enhanced with artifacts (updated)
  'revo-2.0': 3.5   // Premium quality (updated)
} as const;

export const pricingFeatures = {
  keyBenefits: [
    'Variable Credit Cost by AI Model',
    'Credits Never Expire',
    'No Monthly Commitment'
  ],
  faq: [
    {
      question: 'How do credits work?',
        answer: 'Credits vary by AI model: Revo 1.0 = 2 credits, Revo 1.5 = 3 credits, Revo 2.0 = 3.5 credits per generation. Regenerating costs the same amount per attempt.'
    },
    {
      question: 'Do credits expire?',
      answer: 'No! Your credits never expire. Use them whenever you need them.'
    },
    {
      question: 'Can I upgrade anytime?',
      answer: 'Yes! You can purchase additional credit packs anytime. Credits stack up.'
    },
    {
      question: "What's included in HD generation?",
      answer: 'High-resolution images optimized for social media platforms with professional quality.'
    },
    {
      question: 'What are the different Revo versions?',
      answer: 'Revo 1.0 (2 credits) - Enhanced basic, Revo 1.5 (3 credits) - Enhanced with artifacts, Revo 2.0 (3.5 credits) - Premium quality models with highest fidelity.'
    },
    {
      question: 'Can I get a refund?',
      answer: 'We offer a 7-day money-back guarantee if you\'re not satisfied with your purchase.'
    },
    {
      question: 'Do you offer discounts for bulk purchases?',
      answer: 'Yes! Larger credit packs automatically include better per-credit pricing. Contact us for enterprise pricing.'
    }
  ]
};

// Helper functions
export function getPlanById(planId: string): PricingPlan | undefined {
  return pricingPlans.find(plan => plan.id === planId);
}

export function calculateSavings(planId: string): number {
  const plan = getPlanById(planId);
  if (!plan || plan.price === 0) return 0;

  const starterPlan = getPlanById('starter');
  if (!starterPlan) return 0;

  const regularPrice = plan.credits * starterPlan.costPerCredit;
  const savings = regularPrice - plan.price;

  return Math.max(0, savings);
}

export function getBestValuePlan(): PricingPlan {
  return pricingPlans.find(plan => plan.popular) || pricingPlans[2];
}

export function getCreditCostForRevo(revoVersion: string): number {
  return revoCreditCosts[revoVersion as keyof typeof revoCreditCosts] || 1;
}

export function calculateGenerationCost(revoVersion: string, generations: number = 1): number {
  const costPerGeneration = getCreditCostForRevo(revoVersion);
  return costPerGeneration * generations;
}

export function canAffordGeneration(userCredits: number, revoVersion: string, generations: number = 1): boolean {
  const totalCost = calculateGenerationCost(revoVersion, generations);
  return userCredits >= totalCost;
}
