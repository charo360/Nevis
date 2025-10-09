"use client";

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth-supabase';

export interface UserCredits {
  total_credits: number;
  remaining_credits: number;
  used_credits: number;
  last_payment_at?: string;
}

export function useCredits() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Check if user has enough credits
  const hasEnoughCredits = useCallback(async (requiredCredits: number): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch('/api/user/credits', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) return false;

      const credits = await response.json();
      return credits.remaining_credits >= requiredCredits;
    } catch (error) {
      console.error('Error checking credits:', error);
      return false;
    }
  }, [user]);

  // Use credits for a specific feature
  const useCredits = useCallback(async (
    creditsToUse: number,
    feature: string = 'Content Generation',
    details?: any
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);

    try {
      const response = await fetch('/api/user/credit-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          creditsUsed: creditsToUse,
          feature,
          details: details || {}
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.error || 'Failed to use credits' 
        };
      }
    } catch (error) {
      console.error('Error using credits:', error);
      return { 
        success: false, 
        error: 'Network error occurred' 
      };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get current credit balance
  const getCreditBalance = useCallback(async (): Promise<UserCredits | null> => {
    if (!user) return null;

    try {
      const response = await fetch('/api/user/credits', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) return null;

      return await response.json();
    } catch (error) {
      console.error('Error getting credit balance:', error);
      return null;
    }
  }, [user]);

  // Add credits (typically called after payment)
  const addCredits = useCallback(async (creditsToAdd: number): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch('/api/user/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          creditsToAdd,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error adding credits:', error);
      return false;
    }
  }, [user]);

  return {
    hasEnoughCredits,
    useCredits,
    getCreditBalance,
    addCredits,
    loading,
  };
}

// Credit requirements for different features
export const CREDIT_COSTS = {
  AI_POST_GENERATION: 2,
  AI_IMAGE_GENERATION: 3,
  AI_CONTENT_OPTIMIZATION: 1,
  AI_HASHTAG_GENERATION: 1,
  AI_CAPTION_ENHANCEMENT: 2,
  BULK_CONTENT_GENERATION: 5,
} as const;

// Helper function to get credit cost for a feature
export function getCreditCost(feature: keyof typeof CREDIT_COSTS): number {
  return CREDIT_COSTS[feature] || 1;
}