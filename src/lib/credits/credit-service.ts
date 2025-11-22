import { supabase } from '@/lib/supabase/client';

export interface CreditBalance {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'addition' | 'deduction';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reason?: string;
  metadata?: any;
  createdAt: string;
}

export interface CreditDeductionResult {
  success: boolean;
  remainingCredits?: number;
  error?: string;
}

export class CreditService {
  /**
   * Get user's current credit balance
   */
  static async getUserCredits(userId: string): Promise<CreditBalance | null> {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('total_credits, used_credits, remaining_credits')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        console.error('❌ Failed to get user credits:', error);
        return null;
      }

      return {
        totalCredits: data.total_credits || 0,
        usedCredits: data.used_credits || 0,
        remainingCredits: data.remaining_credits || 0,
      };
    } catch (error) {
      console.error('❌ Error getting user credits:', error);
      return null;
    }
  }

  /**
   * Add credits to user account
   */
  static async addCredits(
    userId: string, 
    amount: number, 
    reason: string = 'manual_addition',
    metadata?: any
  ): Promise<{ success: boolean; newBalance?: CreditBalance; error?: string }> {
    try {
      // Get current balance
      const currentBalance = await this.getUserCredits(userId);
      if (!currentBalance) {
        return { success: false, error: 'User not found' };
      }

      const newTotal = currentBalance.totalCredits + amount;
      const newRemaining = currentBalance.remainingCredits + amount;

      // Update user credits
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({
          total_credits: newTotal,
          remaining_credits: newRemaining,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ Failed to update user credits:', updateError);
        return { success: false, error: 'Failed to update credits' };
      }

      // Log transaction
      await this.logTransaction(
        userId,
        'addition',
        amount,
        currentBalance.remainingCredits,
        newRemaining,
        reason,
        metadata
      );

      const newBalance: CreditBalance = {
        totalCredits: newTotal,
        usedCredits: currentBalance.usedCredits,
        remainingCredits: newRemaining,
      };

      return { success: true, newBalance };
    } catch (error: any) {
      console.error('❌ Error adding credits:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deduct credits from user account
   */
  static async deductCredits(
    userId: string,
    amount: number,
    reason: string = 'generation',
    metadata?: any
  ): Promise<CreditDeductionResult> {
    try {
      // Get current balance
      const currentBalance = await this.getUserCredits(userId);
      if (!currentBalance) {
        return { success: false, error: 'User not found' };
      }

      // Check if user has enough credits
      if (currentBalance.remainingCredits < amount) {
        const shortfall = amount - currentBalance.remainingCredits;
        const friendlyMessage = currentBalance.remainingCredits === 0
          ? `💳 No Credits Available\n\nYou need ${amount} credits to generate this content, but you have 0 credits remaining.\n\nPlease purchase credits to continue.`
          : `💳 Insufficient Credits\n\nYou need ${amount} credits to generate this content, but you only have ${currentBalance.remainingCredits} credits.\n\nYou need ${shortfall} more credit${shortfall !== 1 ? 's' : ''} to continue. Please purchase credits to keep creating.`;

        return {
          success: false,
          error: friendlyMessage,
          remainingCredits: currentBalance.remainingCredits
        };
      }

      const newUsed = currentBalance.usedCredits + amount;
      const newRemaining = currentBalance.remainingCredits - amount;

      // Update user credits
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({
          used_credits: newUsed,
          remaining_credits: newRemaining,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ Failed to deduct user credits:', updateError);
        return { success: false, error: 'Failed to deduct credits' };
      }

      // Log transaction
      await this.logTransaction(
        userId,
        'deduction',
        amount,
        currentBalance.remainingCredits,
        newRemaining,
        reason,
        metadata
      );

      return { success: true, remainingCredits: newRemaining };
    } catch (error: any) {
      console.error('❌ Error deducting credits:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user has enough credits for an operation
   */
  static async hasEnoughCredits(userId: string, requiredAmount: number): Promise<boolean> {
    const balance = await this.getUserCredits(userId);
    return balance ? balance.remainingCredits >= requiredAmount : false;
  }

  /**
   * Get user's credit transaction history
   */
  static async getTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<CreditTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Failed to get transaction history:', error);
        return [];
      }

      return data.map(transaction => ({
        id: transaction.id,
        userId: transaction.user_id,
        type: transaction.type,
        amount: transaction.amount,
        balanceBefore: transaction.balance_before,
        balanceAfter: transaction.balance_after,
        reason: transaction.reason,
        metadata: transaction.metadata,
        createdAt: transaction.created_at,
      }));
    } catch (error) {
      console.error('❌ Error getting transaction history:', error);
      return [];
    }
  }

  /**
   * Log a credit transaction
   */
  private static async logTransaction(
    userId: string,
    type: 'addition' | 'deduction',
    amount: number,
    balanceBefore: number,
    balanceAfter: number,
    reason?: string,
    metadata?: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          type,
          amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          reason,
          metadata,
        });

      if (error) {
        console.error('❌ Failed to log transaction:', error);
      }
    } catch (error) {
      console.error('❌ Error logging transaction:', error);
    }
  }

  /**
   * Initialize free credits for new users
   */
  static async initializeFreeCredits(userId: string): Promise<boolean> {
    try {
      const balance = await this.getUserCredits(userId);
      
      // Only give free credits if user has 0 total credits
      if (balance && balance.totalCredits === 0) {
        const result = await this.addCredits(userId, 10, 'free_signup_bonus');
        return result.success;
      }
      
      return true; // User already has credits
    } catch (error) {
      console.error('❌ Error initializing free credits:', error);
      return false;
    }
  }
}
