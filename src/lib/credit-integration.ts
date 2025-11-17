/**
 * Credit Usage Integration Service
 * 
 * This service integrates with content generation workflows to automatically
 * deduct credits and track usage based on AI model costs.
 */

import { createClient } from '@/lib/supabase-client';

// Model cost configuration matching the pricing structure
export const MODEL_COSTS = {
  'revo-1.0': 3,
  'revo-1.5': 4, 
  'revo-2.0': 5,
} as const;

export type ModelVersion = keyof typeof MODEL_COSTS;
export type GenerationFeature = 
  | 'social_media_content'
  | 'image_generation' 
  | 'text_generation'
  | 'content_optimization'
  | 'ai_chat'
  | 'template_generation';

export interface CreditUsageParams {
  userId: string;
  modelVersion: ModelVersion;
  feature: GenerationFeature;
  generationType?: string;
  metadata?: Record<string, any>;
}

export interface CreditUsageResult {
  success: boolean;
  message: string;
  remainingCredits?: number;
  usageId?: string;
  costDeducted?: number;
}

/**
 * Check if user has sufficient credits for a specific model
 */
export async function hasEnoughCreditsForModel(
  userId: string, 
  modelVersion: ModelVersion
): Promise<{ hasCredits: boolean; remainingCredits: number; requiredCredits: number }> {
  try {
    const requiredCredits = MODEL_COSTS[modelVersion];
    const supabase = createClient();
    // Get current user credits
    const { data: userCredits, error } = await supabase
      .from('user_credits')
      .select('remaining_credits')
      .eq('user_id', userId)
      .single();

    if (error || !userCredits) {
      return {
        hasCredits: false,
        remainingCredits: 0,
        requiredCredits
      };
    }

    return {
      hasCredits: userCredits.remaining_credits >= requiredCredits,
      remainingCredits: userCredits.remaining_credits,
      requiredCredits
    };
  } catch (error) {
    console.error('Error checking user credits:', error);
    return {
      hasCredits: false,
      remainingCredits: 0,
      requiredCredits: MODEL_COSTS[modelVersion]
    };
  }
}

/**
 * Deduct credits and record usage when content is generated
 */
export async function deductCreditsForGeneration(
  params: CreditUsageParams
): Promise<CreditUsageResult> {
  const { userId, modelVersion, feature, generationType, metadata } = params;
  const creditsToDeduct = MODEL_COSTS[modelVersion];

  try {
    // First check if user has enough credits
    const creditCheck = await hasEnoughCreditsForModel(userId, modelVersion);
    
    if (!creditCheck.hasCredits) {
      const { remainingCredits, requiredCredits } = creditCheck;
      const shortfall = requiredCredits - remainingCredits;

      return {
        success: false,
        message: remainingCredits === 0
          ? `🚀 Ready to create amazing content? You need ${requiredCredits} credits to use this feature. Let's get you topped up! 💳`
          : `🎨 So close! You have ${remainingCredits} credits but need ${requiredCredits} for this generation. Just ${shortfall} more credits needed! 💳`,
        remainingCredits: remainingCredits,
        costDeducted: 0
      };
    }

    // Call the database function to atomically deduct credits and record usage
    const supabase = createClient();
    const { data, error } = await supabase.rpc('deduct_credits_with_tracking_v2', {
      p_user_id: userId,
      p_credits_used: creditsToDeduct,
      p_model_version: modelVersion,
      p_feature: feature,
      p_generation_type: generationType || 'standard',
      p_metadata: metadata || {}
    });

    if (error) {
      console.error('Database error deducting credits:', {
        error,
        params: { userId, creditsToDeduct, modelVersion, feature, generationType, metadata }
      });
      return {
        success: false,
        message: `Failed to deduct credits: ${error.message}`,
        costDeducted: 0
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        message: 'No response from credit deduction function',
        costDeducted: 0
      };
    }

    const result = data[0];
    
    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Credit deduction failed',
        remainingCredits: (result.remaining_balance ?? result.remaining_credits) || 0,
        costDeducted: 0
      };
    }

    return {
      success: true,
      message: `Successfully deducted ${creditsToDeduct} credits for ${modelVersion}`,
      remainingCredits: (result.remaining_balance ?? result.remaining_credits),
      usageId: result.usage_id,
      costDeducted: creditsToDeduct
    };

  } catch (error) {
    console.error('Error deducting credits:', error);
    return {
      success: false,
      message: `System error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      costDeducted: 0
    };
  }
}

/**
 * Record a failed generation attempt (for analytics)
 */
export async function recordFailedGeneration(
  params: CreditUsageParams & { errorMessage?: string }
): Promise<void> {
  try {
    const { userId, modelVersion, feature, generationType, metadata, errorMessage } = params;
    
    const supabase = createClient();
    // Record the failed attempt without deducting credits
    await supabase
      .from('credit_usage_history')
      .insert({
        user_id: userId,
        credits_used: 0, // No credits deducted for failed attempts
        model_version: modelVersion,
        feature,
        generation_type: generationType || 'standard',
        result_success: false,
        metadata: {
          ...metadata,
          error_message: errorMessage,
          attempted_cost: MODEL_COSTS[modelVersion]
        }
      });
  } catch (error) {
    console.error('Error recording failed generation:', error);
  }
}

/**
 * Get real-time user credit balance
 */
export async function getUserCreditBalance(userId: string): Promise<number> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_credits')
      .select('remaining_credits')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return 0;
    }

    return data.remaining_credits || 0;
  } catch (error) {
    console.error('Error fetching user credit balance:', error);
    return 0;
  }
}

/**
 * Wrapper function for content generation workflows
 * 
 * Use this function to wrap your AI generation calls to automatically
 * handle credit checking, deduction, and usage tracking.
 */
export async function withCreditTracking<T>(
  params: CreditUsageParams,
  generationFunction: () => Promise<T>
): Promise<{ success: boolean; result?: T; error?: string; creditInfo?: CreditUsageResult }> {
  try {
    // Check credits before generation
    const creditCheck = await hasEnoughCreditsForModel(params.userId, params.modelVersion);
    
    if (!creditCheck.hasCredits) {
      const { remainingCredits, requiredCredits } = creditCheck;
      const shortfall = requiredCredits - remainingCredits;

      const errorMessage = remainingCredits === 0
        ? `🚀 Ready to create amazing content? You need ${requiredCredits} credits to use this feature. Let's get you topped up! 💳`
        : `🎨 So close! You have ${remainingCredits} credits but need ${requiredCredits} for this generation. Just ${shortfall} more credits needed! 💳`;

      return {
        success: false,
        error: errorMessage,
        creditInfo: {
          success: false,
          message: errorMessage,
          remainingCredits: remainingCredits,
          costDeducted: 0
        }
      };
    }

    // Deduct credits first (optimistic approach)
    const creditResult = await deductCreditsForGeneration(params);
    
    if (!creditResult.success) {
      return {
        success: false,
        error: creditResult.message,
        creditInfo: creditResult
      };
    }

    try {
      // Execute the generation function
      const result = await generationFunction();
      
      return {
        success: true,
        result,
        creditInfo: creditResult
      };
    } catch (generationError) {
      // If generation fails, we should ideally refund credits
      // For now, we'll record the failure
      await recordFailedGeneration({
        ...params,
        errorMessage: generationError instanceof Error ? generationError.message : 'Generation failed'
      });
      
      return {
        success: false,
        error: generationError instanceof Error ? generationError.message : 'Generation failed',
        creditInfo: creditResult
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Utility function to get cost for a specific model
 */
export function getCostForModel(modelVersion: ModelVersion): number {
  return MODEL_COSTS[modelVersion];
}

/**
 * Utility function to check if a model version is valid
 */
export function isValidModelVersion(version: string): version is ModelVersion {
  return version in MODEL_COSTS;
}

/**
 * Deduct credits for image editing (fixed 1 credit cost)
 * Used when users edit images in the Quick Content card menu
 */
export async function deductCreditsForImageEdit(
  userId: string,
  metadata?: Record<string, any>
): Promise<CreditUsageResult> {
  const EDIT_CREDIT_COST = 1;
  
  try {
    const supabase = createClient();

    // Check if user has enough credits
    const { data: userData, error: fetchError } = await supabase
      .from('user_credits')
      .select('remaining_credits')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching user credits:', fetchError);
      return {
        success: false,
        message: 'Failed to fetch user credits',
      };
    }

    if (!userData || userData.remaining_credits < EDIT_CREDIT_COST) {
      const remainingCredits = userData?.remaining_credits || 0;
      return {
        success: false,
        message: remainingCredits === 0
          ? `🎨 Oops! You're out of credits. You need ${EDIT_CREDIT_COST} credit to edit images. Time to top up your account! 💳`
          : `🎨 Almost there! You have ${remainingCredits} credits but need ${EDIT_CREDIT_COST} credit for image editing. Just need ${EDIT_CREDIT_COST - remainingCredits} more! 💳`,
        remainingCredits: remainingCredits,
      };
    }

    // Calculate new values
    const newRemainingCredits = userData.remaining_credits - EDIT_CREDIT_COST;

    // Get current used_credits to calculate new value
    const { data: currentData, error: currentError } = await supabase
      .from('user_credits')
      .select('used_credits')
      .eq('user_id', userId)
      .single();

    if (currentError) {
      console.error('❌ Error fetching current used credits:', currentError);
      return {
        success: false,
        message: 'Failed to fetch current credit usage',
      };
    }

    const newUsedCredits = (currentData.used_credits || 0) + EDIT_CREDIT_COST;

    // Deduct credits
    const { data: updateData, error: updateError } = await supabase
      .from('user_credits')
      .update({
        remaining_credits: newRemainingCredits,
        used_credits: newUsedCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating credits:', updateError);
      return {
        success: false,
        message: 'Failed to deduct credits',
      };
    }

    // Record usage in credit_usage table
    const { data: usageData, error: usageError } = await supabase
      .from('credit_usage')
      .insert({
        user_id: userId,
        credits_used: EDIT_CREDIT_COST,
        feature: 'image_editing',
        model_version: 'image-edit', // Special identifier for image edits
        generation_type: 'image_edit',
        metadata: metadata || {},
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (usageError) {
      console.warn('⚠️ Failed to record credit usage:', usageError);
      // Don't fail the whole operation if just logging fails
    }

    return {
      success: true,
      message: `Successfully deducted ${EDIT_CREDIT_COST} credit for image editing`,
      remainingCredits: updateData.remaining_credits,
      usageId: usageData?.id,
      costDeducted: EDIT_CREDIT_COST,
    };
  } catch (error) {
    console.error('❌ Error in deductCreditsForImageEdit:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}