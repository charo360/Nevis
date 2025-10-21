/**
 * User Migration Service
 * Handles migration of existing users to the new payment system
 */

import { createClient } from '@supabase/supabase-js';
import { SubscriptionService } from '@/lib/subscription/subscription-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface MigrationResult {
  success: boolean;
  usersProcessed: number;
  errors: string[];
}

export class UserMigrationService {
  /**
   * Migrate all existing users to the new payment system
   * This should be run once during deployment
   */
  static async migrateExistingUsers(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      usersProcessed: 0,
      errors: []
    };

    try {

      // Get all existing users
      const { data: users, error } = await supabase
        .from('users')
        .select('user_id, email, subscription_plan, created_at, trial_ends_at')
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      if (!users || users.length === 0) {
        return result;
      }

      for (const user of users) {
        try {
          await this.migrateUser(user);
          result.usersProcessed++;
          
          if (result.usersProcessed % 10 === 0) {
          }

        } catch (error) {
          const errorMsg = `Failed to migrate user ${user.user_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error('❌', errorMsg);
          result.errors.push(errorMsg);
          result.success = false;
        }
      }

      
      if (result.errors.length > 0) {
        console.warn(`⚠️ ${result.errors.length} errors occurred during migration`);
      }

      return result;

    } catch (error) {
      console.error('❌ Migration failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Migrate a single user to the new payment system
   */
  private static async migrateUser(user: any): Promise<void> {
    const userId = user.user_id;
    const createdAt = new Date(user.created_at);
    const now = new Date();
    
    // Calculate account age in days
    const accountAgeInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Migration strategy based on account age and current status
    let trialDays = 7; // Default trial period
    let initialCredits = 10; // Default credits
    
    // Existing users get extended trial based on account age
    if (accountAgeInDays > 30) {
      trialDays = 14; // 2 weeks for users older than 30 days
      initialCredits = 25;
    } else if (accountAgeInDays > 7) {
      trialDays = 10; // 10 days for users older than 1 week
      initialCredits = 15;
    }

    // Check if user already has trial_ends_at set
    const hasExistingTrial = user.trial_ends_at && new Date(user.trial_ends_at) > now;
    
    if (!hasExistingTrial) {
      // Set trial period
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + trialDays);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          trial_ends_at: trialEnd.toISOString(),
          remaining_credits: initialCredits,
          total_credits: initialCredits,
          used_credits: 0,
          subscription_status: 'trialing',
          updated_at: now.toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error(`Failed to update user ${userId}: ${updateError.message}`);
      }

    } else {
    }
  }

  /**
   * Grant bonus credits to existing users as a migration incentive
   */
  static async grantMigrationBonus(userId: string, bonusCredits: number = 20): Promise<boolean> {
    try {
      // Get current user data
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('remaining_credits, total_credits')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        console.error('❌ Failed to fetch user for bonus:', fetchError);
        return false;
      }

      const newRemaining = (user.remaining_credits || 0) + bonusCredits;
      const newTotal = (user.total_credits || 0) + bonusCredits;

      // Update user credits
      const { error: updateError } = await supabase
        .from('users')
        .update({
          remaining_credits: newRemaining,
          total_credits: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ Failed to grant migration bonus:', updateError);
        return false;
      }

      // Log the bonus transaction
      await supabase
        .from('payment_transactions')
        .insert({
          user_id: userId,
          plan_id: 'migration_bonus',
          amount: 0,
          status: 'completed',
          credits_added: bonusCredits,
          payment_method: 'migration_bonus',
          metadata: {
            type: 'migration_bonus',
            reason: 'Existing user migration incentive'
          }
        });

      return true;

    } catch (error) {
      console.error('❌ Migration bonus error:', error);
      return false;
    }
  }

  /**
   * Check migration status
   */
  static async getMigrationStatus(): Promise<{
    totalUsers: number;
    migratedUsers: number;
    pendingUsers: number;
  }> {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get migrated users (those with trial_ends_at set)
      const { count: migratedUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .not('trial_ends_at', 'is', null);

      return {
        totalUsers: totalUsers || 0,
        migratedUsers: migratedUsers || 0,
        pendingUsers: (totalUsers || 0) - (migratedUsers || 0)
      };

    } catch (error) {
      console.error('❌ Failed to get migration status:', error);
      return {
        totalUsers: 0,
        migratedUsers: 0,
        pendingUsers: 0
      };
    }
  }

  /**
   * Rollback migration for testing purposes
   * WARNING: This will remove trial periods and reset credits
   */
  static async rollbackMigration(): Promise<boolean> {
    try {

      const { error } = await supabase
        .from('users')
        .update({
          trial_ends_at: null,
          remaining_credits: 0,
          total_credits: 0,
          used_credits: 0,
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('subscription_plan', 'free');

      if (error) {
        console.error('❌ Rollback failed:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('❌ Rollback error:', error);
      return false;
    }
  }
}
