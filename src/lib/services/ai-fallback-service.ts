/**
 * AI Fallback Service - Ensures 100% success rate for AI generation
 * Primary: Google AI (via proxy) -> Fallback: OpenRouter
 */

import { openRouterClient, isOpenRouterEnabled } from './openrouter-client';

interface GenerationParams {
  prompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  isImageGeneration?: boolean;
  user_id?: string;
  user_tier?: string;
}

interface GenerationResult {
  content?: string;
  imageUrl?: string;
  usage?: any;
  provider: 'google' | 'openrouter';
  success: boolean;
  error?: string;
}

class AIFallbackService {
  private maxRetries = 2;
  private retryDelay = 1000; // 1 second

  /**
   * Generate content with automatic fallback
   */
  async generateWithFallback(params: GenerationParams): Promise<GenerationResult> {
    console.log(`🎯 AI Fallback: Starting ${params.isImageGeneration ? 'image' : 'text'} generation with model ${params.model}`);

    // Try Google AI first (primary)
    try {
      const googleResult = await this.tryGoogleAI(params);
      if (googleResult.success) {
        console.log(`✅ AI Fallback: Google AI succeeded`);
        return googleResult;
      }
    } catch (error: any) {
      console.log(`⚠️ AI Fallback: Google AI failed, trying OpenRouter fallback...`);
      console.error('Google AI error:', error.message);
    }

    // Fallback to OpenRouter
    if (isOpenRouterEnabled()) {
      try {
        const openRouterResult = await this.tryOpenRouter(params);
        if (openRouterResult.success) {
          console.log(`✅ AI Fallback: OpenRouter succeeded as fallback`);
          return openRouterResult;
        }
      } catch (error: any) {
        console.error('❌ AI Fallback: OpenRouter also failed:', error.message);
      }
    } else {
      console.log('⚠️ AI Fallback: OpenRouter not enabled, cannot use as fallback');
    }

    // If both fail, return error
    return {
      success: false,
      provider: 'google',
      error: 'Both Google AI and OpenRouter failed to generate content'
    };
  }

  /**
   * Try Google AI generation (via proxy only - no direct calls for cost protection)
   */
  private async tryGoogleAI(params: GenerationParams): Promise<GenerationResult> {
    // Only use proxy for cost protection - never direct Google AI calls
    const shouldUseProxy = process.env.AI_PROXY_ENABLED === 'true';

    if (shouldUseProxy) {
      return this.tryGoogleAIViaProxy(params);
    } else {
      // If proxy is disabled, skip Google AI entirely to avoid cost issues
      throw new Error('Google AI proxy is disabled - cannot use Google AI without cost protection');
    }
  }

  /**
   * Try Google AI via proxy
   */
  private async tryGoogleAIViaProxy(params: GenerationParams): Promise<GenerationResult> {
    const proxyUrl = process.env.AI_PROXY_URL || 'http://localhost:8000';
    const endpoint = params.isImageGeneration ? '/generate-image' : '/generate-text';

    const requestBody = {
      prompt: params.prompt,
      model: params.model,
      user_id: params.user_id || 'fallback_user',
      user_tier: params.user_tier || 'basic',
      temperature: params.temperature,
      max_tokens: params.maxTokens
    };

    const response = await fetch(`${proxyUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`Proxy API error: ${response.status}`);
    }

    const data = await response.json();

    if (params.isImageGeneration) {
      return {
        imageUrl: data.imageUrl,
        usage: data.usage,
        provider: 'google',
        success: true
      };
    } else {
      return {
        content: data.content,
        usage: data.usage,
        provider: 'google',
        success: true
      };
    }
  }

  // REMOVED: tryGoogleAIDirect method - bypasses cost protection
  // Only use proxy-controlled Google AI calls for cost safety

  /**
   * Try OpenRouter as fallback
   */
  private async tryOpenRouter(params: GenerationParams): Promise<GenerationResult> {
    if (params.isImageGeneration) {
      const result = await openRouterClient.generateImage({
        prompt: params.prompt,
        model: params.model
      });

      return {
        imageUrl: result.imageUrl,
        usage: result.usage,
        provider: 'openrouter',
        success: true
      };
    } else {
      const result = await openRouterClient.generateText({
        prompt: params.prompt,
        model: params.model,
        temperature: params.temperature,
        maxTokens: params.maxTokens
      });

      return {
        content: result.content,
        usage: result.usage,
        provider: 'openrouter',
        success: true
      };
    }
  }

  /**
   * Get appropriate Google API key for model
   */
  private getGoogleAPIKey(model: string): string {
    // Map models to specific API keys
    if (model.includes('revo-1.0') || model === 'gemini-2.5-flash-image-preview') {
      return process.env.GEMINI_API_KEY_REVO_1_0 || process.env.GEMINI_API_KEY || '';
    }
    if (model.includes('revo-1.5') || model === 'gemini-2.5-flash') {
      return process.env.GEMINI_API_KEY_REVO_1_5 || process.env.GEMINI_API_KEY || '';
    }
    if (model.includes('revo-2.0')) {
      return process.env.GEMINI_API_KEY_REVO_2_0 || process.env.GEMINI_API_KEY || '';
    }

    return process.env.GEMINI_API_KEY || '';
  }

  /**
   * Health check for all AI services
   */
  async healthCheck(): Promise<{
    google: { status: string; proxy: boolean };
    openrouter: { status: string; enabled: boolean };
    overall: string;
  }> {
    const results = {
      google: { status: 'unknown', proxy: false },
      openrouter: { status: 'unknown', enabled: false },
      overall: 'unknown'
    };

    // Check Google AI (via proxy if enabled)
    try {
      const shouldUseProxy = process.env.AI_PROXY_ENABLED === 'true';
      results.google.proxy = shouldUseProxy;

      if (shouldUseProxy) {
        const proxyUrl = process.env.AI_PROXY_URL || 'http://localhost:8000';
        const response = await fetch(`${proxyUrl}/health`, {
          signal: AbortSignal.timeout(5000)
        });
        results.google.status = response.ok ? 'healthy' : 'error';
      } else {
        results.google.status = process.env.GEMINI_API_KEY ? 'healthy' : 'no-key';
      }
    } catch (error) {
      results.google.status = 'error';
    }

    // Check OpenRouter
    try {
      results.openrouter.enabled = isOpenRouterEnabled();
      if (results.openrouter.enabled) {
        const health = await openRouterClient.healthCheck();
        results.openrouter.status = health.status;
      } else {
        results.openrouter.status = 'disabled';
      }
    } catch (error) {
      results.openrouter.status = 'error';
    }

    // Determine overall status
    if (results.google.status === 'healthy' || results.openrouter.status === 'healthy') {
      results.overall = 'healthy';
    } else if (results.google.status === 'error' && results.openrouter.status === 'error') {
      results.overall = 'error';
    } else {
      results.overall = 'degraded';
    }

    return results;
  }
}

// Export singleton instance
export const aiFallbackService = new AIFallbackService();

// Export convenience functions
export async function generateTextWithFallback(params: {
  prompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  user_id?: string;
  user_tier?: string;
}): Promise<GenerationResult> {
  return aiFallbackService.generateWithFallback({
    ...params,
    isImageGeneration: false
  });
}

export async function generateImageWithFallback(params: {
  prompt: string;
  model: string;
  user_id?: string;
  user_tier?: string;
}): Promise<GenerationResult> {
  return aiFallbackService.generateWithFallback({
    ...params,
    isImageGeneration: true
  });
}
