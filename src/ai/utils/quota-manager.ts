/**
 * Quota Management Service
 * Handles API quota limits and provides fallback mechanisms
 */

export interface QuotaError {
  isQuotaExceeded: boolean;
  retryAfter?: number;
  quotaType?: string;
  message: string;
}

export class QuotaManager {
  private static readonly QUOTA_EXCEEDED_MESSAGES = [
    'quota exceeded',
    'too many requests',
    '429',
    'rate limit',
    'exceeded your current quota'
  ];

  /**
   * Check if an error is quota-related
   */
  static isQuotaError(error: any): QuotaError {
    const errorMessage = error?.message?.toLowerCase() || '';
    const isQuotaExceeded = this.QUOTA_EXCEEDED_MESSAGES.some(msg => 
      errorMessage.includes(msg)
    );

    let retryAfter: number | undefined;
    let quotaType: string | undefined;

    if (isQuotaExceeded) {
      // Extract retry delay from error message
      const retryMatch = errorMessage.match(/retry in (\d+(?:\.\d+)?)s/);
      if (retryMatch) {
        retryAfter = parseFloat(retryMatch[1]);
      }

      // Extract quota type
      if (errorMessage.includes('free_tier_requests')) {
        quotaType = 'free_tier_daily';
      } else if (errorMessage.includes('requests_per_minute')) {
        quotaType = 'requests_per_minute';
      }
    }

    return {
      isQuotaExceeded,
      retryAfter,
      quotaType,
      message: error?.message || 'Unknown error'
    };
  }

  /**
   * Get user-friendly error message for quota issues
   */
  static getQuotaErrorMessage(modelName: string, quotaError: QuotaError): string {
    if (!quotaError.isQuotaExceeded) {
      return `${modelName} encountered an error: ${quotaError.message}`;
    }

    const baseMessage = `${modelName} has reached its daily limit`;
    
    if (quotaError.quotaType === 'free_tier_daily') {
      return `${baseMessage} of 250 requests. 🚀 Good news: You can upgrade to a paid plan for unlimited usage, or try again tomorrow when the quota resets!`;
    }

    return `${baseMessage}. Please try again in a few minutes or upgrade to a paid plan for higher limits.`;
  }

  /**
   * Get upgrade instructions for users
   */
  static getUpgradeInstructions(): string {
    return `
🚀 **Upgrade Your API Plan for Unlimited Usage:**

1. **Visit Google AI Studio**: https://aistudio.google.com/
2. **Go to API Keys section**
3. **Enable billing** for your project
4. **Switch to Pay-as-you-go**

**Benefits:**
✅ **1,000+ requests per minute** (vs 250/day free)
✅ **No daily limits**
✅ **Access to premium models**
✅ **Very affordable**: ~$0.075 per 1K tokens

**Alternative:** Wait until tomorrow when your free quota resets!
    `.trim();
  }

  /**
   * Suggest alternative models when quota is exceeded
   */
  static getAlternativeModelSuggestion(currentModel: string): string {
    const alternatives = {
      'Revo 1.0': ['Revo 1.5', 'Revo 2.0'],
      'Revo 1.5': ['Revo 2.0', 'Revo 1.0'],
      'Revo 2.0': ['Revo 1.5', 'Revo 1.0']
    };

    const suggested = alternatives[currentModel as keyof typeof alternatives];
    if (suggested && suggested.length > 0) {
      return `💡 **Try ${suggested[0]}** instead - it might have available quota!`;
    }

    return '💡 **Try a different model** - it might have available quota!';
  }

  /**
   * Create a comprehensive error response for quota issues
   */
  static createQuotaErrorResponse(modelName: string, error: any): {
    success: false;
    error: string;
    errorType: 'quota_exceeded' | 'api_error';
    suggestions: string[];
    upgradeInfo?: string;
  } {
    const quotaError = this.isQuotaError(error);
    
    if (quotaError.isQuotaExceeded) {
      return {
        success: false,
        error: this.getQuotaErrorMessage(modelName, quotaError),
        errorType: 'quota_exceeded',
        suggestions: [
          this.getAlternativeModelSuggestion(modelName),
          'Wait for quota reset (usually at midnight UTC)',
          'Upgrade to paid plan for unlimited usage'
        ],
        upgradeInfo: this.getUpgradeInstructions()
      };
    }

    return {
      success: false,
      error: `${modelName} encountered an error: ${error?.message || 'Unknown error'}`,
      errorType: 'api_error',
      suggestions: [
        'Check your internet connection',
        'Verify your API key is valid',
        'Try again in a few moments'
      ]
    };
  }
}
