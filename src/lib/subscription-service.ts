/**
 * Subscription Service - Monthly Credit Reset System
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  monthlyCredits: number;
  features: string[];
  revoAccess: string[];
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 19,
    monthlyCredits: 50,
    features: ['Basic templates', 'Email support', 'Monthly credit reset'],
    revoAccess: ['revo-1.0']
  },
  business: {
    id: 'business', 
    name: 'Business',
    price: 49,
    monthlyCredits: 200,
    features: ['Cultural intelligence', 'Logo integration', 'Priority support', 'Advanced analytics'],
    revoAccess: ['revo-1.0', 'revo-1.5']
  },
  agency: {
    id: 'agency',
    name: 'Agency', 
    price: 99,
    monthlyCredits: 500,
    features: ['All Revo models', 'White-label', 'API access', 'Dedicated support'],
    revoAccess: ['revo-1.0', 'revo-1.5', 'revo-2.0']
  }
};

export class SubscriptionService {
  /**
   * Check if user's credits should reset (monthly)
   */
  static shouldResetCredits(lastResetDate: Date): boolean {
    const now = new Date();
    const lastReset = new Date(lastResetDate);
    
    // Reset if it's been more than 30 days
    const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceReset >= 30;
  }

  /**
   * Get next reset date (30 days from last reset)
   */
  static getNextResetDate(lastResetDate: Date): Date {
    const nextReset = new Date(lastResetDate);
    nextReset.setDate(nextReset.getDate() + 30);
    return nextReset;
  }

  /**
   * Calculate overage charges
   */
  static calculateOverage(usedCredits: number, planCredits: number): number {
    const overage = Math.max(0, usedCredits - planCredits);
    return overage * 0.50; // $0.50 per extra generation
  }

  /**
   * Check if user can access specific Revo model
   */
  static canAccessRevoModel(userPlan: string, revoModel: string): boolean {
    const plan = SUBSCRIPTION_PLANS[userPlan];
    return plan?.revoAccess.includes(revoModel) || false;
  }

  /**
   * Get plan upgrade recommendations
   */
  static getUpgradeRecommendation(usedCredits: number, currentPlan: string): string | null {
    const current = SUBSCRIPTION_PLANS[currentPlan];
    if (!current) return null;

    // If user is consistently over 80% usage, recommend upgrade
    const usagePercent = (usedCredits / current.monthlyCredits) * 100;
    
    if (usagePercent > 80) {
      if (currentPlan === 'starter') return 'business';
      if (currentPlan === 'business') return 'agency';
    }
    
    return null;
  }
}