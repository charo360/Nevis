/**
 * Subscription Service - Centralized subscription management
 * Handles subscription status, access control, and payment integration
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SubscriptionStatus {
  hasAccess: boolean;
  reason: string;
  creditsRemaining: number;
  subscriptionStatus: 'active' | 'trialing' | 'inactive' | 'trial_expired' | 'canceled';
  planId?: string;
  expiresAt?: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialEnd?: string;
  stripeSubscriptionId?: string;
}

export class SubscriptionService {
  /**
   * Check if user has access to a specific feature
   * This is the main access control function
   */
  static async checkAccess(userId: string, feature: string): Promise<SubscriptionStatus> {
    try {
      console.log(`🔐 Checking access for user ${userId} to feature ${feature}`);

      // Call the database function for comprehensive access check
      const { data, error } = await supabase.rpc('check_subscription_access', {
        p_user_id: userId,
        p_feature: feature
      });

      if (error) {
        console.error('❌ Access check error:', error);
        return {
          hasAccess: false,
          reason: 'System error during access check',
          creditsRemaining: 0,
          subscriptionStatus: 'inactive'
        };
      }

      const result = data[0];
      console.log(`✅ Access check result:`, result);

      return {
        hasAccess: result.has_access,
        reason: result.reason,
        creditsRemaining: result.credits_remaining,
        subscriptionStatus: result.subscription_status
      };

    } catch (error) {
      console.error('❌ Subscription access check failed:', error);
      return {
        hasAccess: false,
        reason: 'System error',
        creditsRemaining: 0,
        subscriptionStatus: 'inactive'
      };
    }
  }

  /**
   * Get user's current subscription details
   */
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Failed to get user subscription:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Get user subscription error:', error);
      return null;
    }
  }

  /**
   * Create or update subscription after successful payment
   */
  static async createSubscription(
    userId: string,
    planId: string,
    stripeSubscriptionId: string,
    stripeCustomerId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<boolean> {
    try {
      // Update user's subscription info
      const { error: userError } = await supabase
        .from('users')
        .update({
          subscription_plan: planId,
          subscription_status: 'active',
          subscription_expires_at: periodEnd.toISOString(),
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          last_payment_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (userError) {
        console.error('❌ Failed to update user subscription:', userError);
        return false;
      }

      // Create subscription record
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId,
          plan_id: planId,
          status: 'active',
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString()
        });

      if (subscriptionError) {
        console.error('❌ Failed to create subscription record:', subscriptionError);
        return false;
      }

      console.log('✅ Subscription created successfully');
      return true;

    } catch (error) {
      console.error('❌ Create subscription error:', error);
      return false;
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const now = new Date().toISOString();

      // Update user status
      const { error: userError } = await supabase
        .from('users')
        .update({
          subscription_status: 'canceled',
          updated_at: now
        })
        .eq('user_id', userId);

      if (userError) {
        console.error('❌ Failed to update user subscription status:', userError);
        return false;
      }

      // Update subscription record
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: now,
          updated_at: now
        })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (subscriptionError) {
        console.error('❌ Failed to update subscription record:', subscriptionError);
        return false;
      }

      console.log('✅ Subscription canceled successfully');
      return true;

    } catch (error) {
      console.error('❌ Cancel subscription error:', error);
      return false;
    }
  }

  /**
   * Initialize trial for new users
   */
  static async initializeTrial(userId: string, trialDays: number = 7): Promise<boolean> {
    try {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + trialDays);

      const { error } = await supabase
        .from('users')
        .update({
          trial_ends_at: trialEnd.toISOString(),
          remaining_credits: 10, // Free trial credits
          subscription_status: 'trialing',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Failed to initialize trial:', error);
        return false;
      }

      console.log(`✅ Trial initialized for user ${userId} (${trialDays} days)`);
      return true;

    } catch (error) {
      console.error('❌ Initialize trial error:', error);
      return false;
    }
  }

  /**
   * Log feature usage for analytics and billing
   */
  static async logUsage(
    userId: string,
    feature: string,
    creditsUsed: number,
    metadata?: any
  ): Promise<void> {
    try {
      await supabase
        .from('usage_logs')
        .insert({
          user_id: userId,
          feature,
          credits_used: creditsUsed,
          metadata: metadata || {}
        });

      console.log(`📊 Usage logged: ${feature} (${creditsUsed} credits)`);
    } catch (error) {
      console.error('❌ Failed to log usage:', error);
      // Don't throw - usage logging shouldn't break the main flow
    }
  }

  /**
   * Get usage statistics for a user
   */
  static async getUserUsage(userId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('usage_logs')
        .select('feature, credits_used, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to get user usage:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Get user usage error:', error);
      return [];
    }
  }
}
