/**
 * Centralized error message handling for user-friendly error display
 */

export interface ErrorContext {
  feature?: 'creative_studio' | 'quick_content';
  modelVersion?: string;
  creditsRequired?: number;
  creditsAvailable?: number;
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyErrorMessage(error: Error | string, context?: ErrorContext): string {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerMessage = errorMessage.toLowerCase();

  // Credit-related errors
  if (
    lowerMessage.includes('insufficient credits') ||
    lowerMessage.includes('not enough credits') ||
    lowerMessage.includes('no credits available') ||
    lowerMessage.includes('credit deduction failed') ||
    lowerMessage.includes('0 credits remaining') ||
    (lowerMessage.includes('need') && lowerMessage.includes('credits') && lowerMessage.includes('only have')) ||
    (lowerMessage.includes('need') && lowerMessage.includes('credits') && lowerMessage.includes('have 0'))
  ) {
    // If the error message already contains the credit info, pass it through
    if (errorMessage.includes('💳')) {
      return errorMessage;
    }
    
    if (context?.creditsRequired && context?.creditsAvailable !== undefined) {
      const needed = context.creditsRequired - context.creditsAvailable;
      if (context.creditsAvailable === 0) {
        return `💳 No Credits Available\n\nYou need ${context.creditsRequired} credits to generate this content, but you have 0 credits remaining.\n\nPlease purchase credits to continue using ${context.feature === 'creative_studio' ? 'Creative Studio' : 'Quick Content'}.`;
      }
      return `💳 Insufficient Credits\n\nYou need ${context.creditsRequired} credits to generate this content, but you only have ${context.creditsAvailable} credits.\n\nYou need ${needed} more credits to continue. Please purchase credits to continue using ${context.feature === 'creative_studio' ? 'Creative Studio' : 'Quick Content'}.`;
    }
    return `💳 Insufficient Credits\n\nYou don't have enough credits to generate this content. Please purchase credits to continue using ${context?.feature === 'creative_studio' ? 'Creative Studio' : 'Quick Content'}.`;
  }

  // Authentication errors
  if (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('401') ||
    lowerMessage.includes('not authenticated') ||
    lowerMessage.includes('please log in')
  ) {
    return `🔐 Authentication Required\n\nPlease log in again to continue using ${context?.feature === 'creative_studio' ? 'Creative Studio' : 'Quick Content'}.`;
  }

  // Network errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('econnreset') ||
    lowerMessage.includes('fetch failed') ||
    lowerMessage.includes('connection')
  ) {
    return `🌐 Connection Issue\n\nWe're having trouble connecting to our servers. Please check your internet connection and try again.`;
  }

  // Rate limiting / quota errors
  if (
    lowerMessage.includes('429') ||
    lowerMessage.includes('quota') ||
    lowerMessage.includes('too many requests') ||
    lowerMessage.includes('rate limit')
  ) {
    return `⏱️ High Demand\n\n${context?.feature === 'creative_studio' ? 'Creative Studio' : 'Quick Content'} is experiencing high demand right now. Please try again in a few minutes or switch to a different model.`;
  }

  // API/Service errors
  if (
    lowerMessage.includes('api') ||
    lowerMessage.includes('service') ||
    lowerMessage.includes('503') ||
    lowerMessage.includes('502') ||
    lowerMessage.includes('500')
  ) {
    return `🔧 Service Temporarily Unavailable\n\nWe're experiencing technical difficulties. Please try again in a moment or switch to a different model.`;
  }

  // Database errors
  if (
    lowerMessage.includes('database') ||
    lowerMessage.includes('failed to save') ||
    lowerMessage.includes('save error')
  ) {
    return `💾 Save Error\n\nThe content was generated successfully, but we couldn't save it to your account. Don't worry - you can still download or copy it.`;
  }

  // Generation errors (generic)
  if (
    lowerMessage.includes('generation failed') ||
    lowerMessage.includes('failed to generate') ||
    lowerMessage.includes('model error')
  ) {
    const modelName = context?.modelVersion === 'revo-2.0' ? 'Revo 2.0' :
                      context?.modelVersion === 'revo-1.5' ? 'Revo 1.5' :
                      context?.modelVersion === 'revo-1.0' ? 'Revo 1.0' : 'the selected model';
    return `🤖 Generation Issue\n\nThe ${modelName} model is having trouble generating your content. Please try again or switch to a different model.`;
  }

  // Already user-friendly messages (contain emojis or friendly wording)
  if (
    errorMessage.includes('💳') ||
    errorMessage.includes('🔐') ||
    errorMessage.includes('🌐') ||
    errorMessage.includes('⏱️') ||
    errorMessage.includes('🔧') ||
    errorMessage.includes('🤖') ||
    errorMessage.includes('😅') ||
    errorMessage.includes('🚀') ||
    errorMessage.includes('\n\n') // Multi-line messages are usually user-friendly
  ) {
    return errorMessage;
  }

  // Generic fallback
  const featureName = context?.feature === 'creative_studio' ? 'Creative Studio' : 'Quick Content';
  return `😅 Oops! Something went wrong\n\n${featureName} encountered an unexpected issue. Please try again, or switch to a different model if the problem persists.`;
}

/**
 * Extract credit information from error message
 */
export function extractCreditInfo(errorMessage: string): {
  creditsRequired?: number;
  creditsAvailable?: number;
} | null {
  const match = errorMessage.match(/need (\d+) credits.*only have (\d+) credits/i);
  if (match) {
    return {
      creditsRequired: parseInt(match[1], 10),
      creditsAvailable: parseInt(match[2], 10),
    };
  }
  return null;
}

/**
 * Check if error is credit-related
 */
export function isCreditError(error: Error | string): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerMessage = errorMessage.toLowerCase();
  return (
    lowerMessage.includes('insufficient credits') ||
    lowerMessage.includes('not enough credits') ||
    lowerMessage.includes('no credits available') ||
    lowerMessage.includes('credit deduction failed') ||
    lowerMessage.includes('0 credits remaining') ||
    (lowerMessage.includes('need') && lowerMessage.includes('credits') && lowerMessage.includes('only have')) ||
    (lowerMessage.includes('need') && lowerMessage.includes('credits') && lowerMessage.includes('have 0'))
  );
}

