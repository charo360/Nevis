'use server';

import { getPlanById, getCreditCostForRevo, calculateGenerationCost, canAffordGeneration } from '@/lib/pricing-data';
import { CreditService } from '@/lib/credits/credit-service';

export interface PurchaseResult {
  success: boolean;
  message: string;
  checkoutUrl?: string;
  error?: string;
}

export interface UserCredits {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  lastUpdated: Date;
}

/**
 * Initiate purchase for a pricing plan
 * TODO: Integrate with Stripe or payment processor
 */
export async function initiatePurchase(planId: string, userId: string): Promise<PurchaseResult> {
  try {
    const plan = getPlanById(planId);

    if (!plan) {
      return {
        success: false,
        message: 'Invalid pricing plan selected',
        error: 'INVALID_PLAN'
      };
    }

    if (!userId) {
      return {
        success: false,
        message: 'User authentication required',
        error: 'AUTH_REQUIRED'
      };
    }

    // For free plan, directly add credits
    if (plan.price === 0) {
      const result = await addCreditsToUser(userId, plan.credits);
      return {
        success: result.success,
        message: result.success
          ? `${plan.credits} free credits added to your account!`
          : 'Failed to add free credits'
      };
    }

    // TODO: Create Stripe checkout session
    // const checkoutSession = await createStripeCheckout(plan, userId);

    // For now, simulate payment process

    return {
      success: true,
      message: 'Redirecting to payment...',
      checkoutUrl: `/payment/checkout?plan=${planId}&user=${userId}` // Placeholder
    };

  } catch (error) {
    return {
      success: false,
      message: 'Failed to initiate purchase',
      error: 'PURCHASE_ERROR'
    };
  }
}

/**
 * Add credits to user account
 */
export async function addCreditsToUser(userId: string, credits: number): Promise<{ success: boolean; newTotal?: number }> {
  try {
    const result = await CreditService.addCredits(userId, credits, 'manual_addition');

    if (result.success && result.newBalance) {
      return {
        success: true,
        newTotal: result.newBalance.totalCredits
      };
    }

    return {
      success: false
    };

  } catch (error) {
    console.error('❌ Error adding credits to user:', error);
    return {
      success: false
    };
  }
}

/**
 * Get user's current credit balance
 */
export async function getUserCredits(userId: string): Promise<UserCredits> {
  try {
    const balance = await CreditService.getUserCredits(userId);

    if (!balance) {
      return {
        totalCredits: 0,
        usedCredits: 0,
        remainingCredits: 0,
        lastUpdated: new Date()
      };
    }

    return {
      totalCredits: balance.totalCredits,
      usedCredits: balance.usedCredits,
      remainingCredits: balance.remainingCredits,
      lastUpdated: new Date()
    };

  } catch (error) {
    return {
      totalCredits: 0,
      usedCredits: 0,
      remainingCredits: 0,
      lastUpdated: new Date()
    };
  }
}

/**
 * Deduct credits when user generates content
 */
export async function deductCredits(userId: string, amount: number = 1): Promise<{ success: boolean; remainingCredits?: number }> {
  try {
    const result = await CreditService.deductCredits(userId, amount, 'generation');

    return {
      success: result.success,
      remainingCredits: result.remainingCredits
    };

  } catch (error) {
    console.error('❌ Error deducting credits:', error);
    return {
      success: false
    };
  }
}

/**
 * Deduct credits for specific Revo version generation
 */
export async function deductCreditsForRevo(userId: string, revoVersion: string, generations: number = 1): Promise<{ success: boolean; remainingCredits?: number; creditsCost?: number }> {
  try {
    const creditsCost = calculateGenerationCost(revoVersion, generations);
    const currentCredits = await getUserCredits(userId);

    if (!canAffordGeneration(currentCredits.remainingCredits, revoVersion, generations)) {
      return {
        success: false,
        creditsCost
      };
    }

    const result = await CreditService.deductCredits(
      userId,
      creditsCost,
      `${revoVersion}_generation`,
      { revoVersion, generations, creditsCost }
    );

    return {
      ...result,
      creditsCost
    };

  } catch (error) {
    return {
      success: false
    };
  }
}

/**
 * Handle successful payment webhook
 * TODO: Integrate with Stripe webhooks
 */
export async function handlePaymentSuccess(sessionId: string, planId: string, userId: string): Promise<boolean> {
  try {
    const plan = getPlanById(planId);
    if (!plan) return false;

    // Add credits to user account
    const result = await addCreditsToUser(userId, plan.credits);

    if (result.success) {
      // TODO: Send confirmation email
      // TODO: Log purchase in database
      return true;
    }

    return false;

  } catch (error) {
    return false;
  }
}

/**
 * Validate if user has enough credits for an action
 */
export async function validateCredits(userId: string, requiredCredits: number = 1): Promise<boolean> {
  try {
    const credits = await getUserCredits(userId);
    return credits.remainingCredits >= requiredCredits;
  } catch (error) {
    return false;
  }
}

/**
 * Validate if user has enough credits for specific Revo version
 */
export async function validateCreditsForRevo(userId: string, revoVersion: string, generations: number = 1): Promise<{ canAfford: boolean; creditsCost: number; remainingCredits: number }> {
  try {
    const credits = await getUserCredits(userId);
    const creditsCost = calculateGenerationCost(revoVersion, generations);
    const canAfford = canAffordGeneration(credits.remainingCredits, revoVersion, generations);

    return {
      canAfford,
      creditsCost,
      remainingCredits: credits.remainingCredits
    };
  } catch (error) {
    return {
      canAfford: false,
      creditsCost: 0,
      remainingCredits: 0
    };
  }
}
