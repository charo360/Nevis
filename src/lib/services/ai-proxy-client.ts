/**
 * AI Proxy Client - Controlled access to AI models through proxy server
 * Prevents unexpected model calls and manages costs
 */

interface ProxyImageRequest {
  prompt: string;
  user_id: string;
  user_tier?: string; // User's subscription tier
  model?: string;
  max_tokens?: number;
  temperature?: number;
  logoImage?: string; // Logo image data URL for brand integration
}

interface ProxyTextRequest {
  prompt: string;
  user_id: string;
  user_tier?: string; // User's subscription tier
  model?: string;
  max_tokens?: number;
  temperature?: number;
}

interface ProxyResponse {
  success: boolean;
  data: any;
  model_used: string;
  endpoint_used: string;
  user_quota: number;
}

interface CreditsResponse {
  user_id: string;
  tier: string;
  credits_remaining: number;
  last_updated: string;
  tier_info: {
    available_models: string[];
    credit_package_size: number;
    estimated_cost_per_credit: string;
  };
}

// Keep old interface for backward compatibility
interface QuotaResponse extends CreditsResponse {
  current_usage?: number;
  monthly_limit?: number;
  remaining?: number;
  month?: string;
}

class AIProxyClient {
  private baseUrl: string;
  private enabled: boolean;

  constructor(baseUrl: string = process.env.AI_PROXY_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.enabled = process.env.AI_PROXY_ENABLED === 'true';
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Generate image through controlled proxy
   */
  async generateImage(request: ProxyImageRequest): Promise<ProxyResponse> {
    try {

      const response = await fetch(`${this.baseUrl}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          user_id: request.user_id,
          model: request.model || 'gemini-2.5-flash-image-preview',
          max_tokens: request.max_tokens || 8192,
          temperature: request.temperature || 0.7,
          ...(request.logoImage && { logoImage: request.logoImage })
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Proxy error: ${error.detail || response.statusText}`);
      }

      const result = await response.json();

      return result;
    } catch (error) {
      console.error('❌ Proxy: Image generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate text through controlled proxy
   */
  async generateText(request: ProxyTextRequest): Promise<ProxyResponse> {
    try {

      const response = await fetch(`${this.baseUrl}/generate-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          user_id: request.user_id,
          model: request.model || 'gemini-2.5-flash',
          max_tokens: request.max_tokens || 8192,
          temperature: request.temperature || 0.7
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Proxy error: ${error.detail || response.statusText}`);
      }

      const result = await response.json();

      return result;
    } catch (error) {
      console.error('❌ Proxy: Text generation failed:', error);
      throw error;
    }
  }

  /**
   * Check user's credit balance
   */
  async getUserCredits(userId: string): Promise<CreditsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/credits/${userId}`);

      if (!response.ok) {
        throw new Error(`Failed to get credits: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Proxy: Failed to get user credits:', error);
      throw error;
    }
  }

  /**
   * Legacy method - redirects to getUserCredits
   */
  async getUserQuota(userId: string): Promise<QuotaResponse> {
    return await this.getUserCredits(userId);
  }

  /**
   * Check proxy health
   */
  async checkHealth(): Promise<{ status: string; allowed_models: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error) {
      console.error('❌ Proxy: Health check failed:', error);
      throw error;
    }
  }

  /**
   * Purchase credit package for user
   */
  async purchaseCredits(userId: string, tier: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/purchase-credits/${userId}?tier=${tier}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to purchase credits: ${error.detail || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Proxy: Failed to purchase credits:', error);
      throw error;
    }
  }

  /**
   * Add credits manually (admin function)
   */
  async addCredits(userId: string, credits: number, tier: string = 'free'): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/add-credits/${userId}?credits=${credits}&tier=${tier}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to add credits: ${error.detail || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Proxy: Failed to add credits:', error);
      throw error;
    }
  }

  /**
   * Get available credit packages and their info
   */
  async getCreditPackages(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      const stats = await response.json();
      return {
        packages: stats.credit_packages,
        tier_breakdown: stats.tier_breakdown,
        cost_per_credit: stats.cost_per_credit
      };
    } catch (error) {
      console.error('❌ Proxy: Failed to get credit package info:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const aiProxyClient = new AIProxyClient();

// Export types
export type { ProxyImageRequest, ProxyTextRequest, ProxyResponse, QuotaResponse };

/**
 * Helper function to generate user ID from session/auth
 */
export function getUserIdForProxy(): string {
  // You can customize this based on your auth system
  // For now, using a simple approach
  if (typeof window !== 'undefined') {
    // Client-side: use session storage or generate consistent ID
    let userId = sessionStorage.getItem('proxy_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('proxy_user_id', userId);
    }
    return userId;
  } else {
    // Server-side: you'll need to pass user ID from your auth system
    return 'server_user';
  }
}

/**
 * Helper function to get user's subscription tier
 * You should integrate this with your actual user/subscription system
 */
export function getUserTierForProxy(): string {
  // TODO: Replace with your actual user tier logic
  // This could come from:
  // - Your user database
  // - Stripe/payment provider
  // - Session/JWT token
  // - Local storage for testing

  if (typeof window !== 'undefined') {
    // For testing: allow setting tier in localStorage
    const testTier = localStorage.getItem('proxy_user_tier');
    if (testTier) return testTier;
  }

  // Default to free tier
  return 'free';
}

/**
 * Helper function to check if proxy should be used
 */
export function shouldUseProxy(): boolean {
  return process.env.AI_PROXY_ENABLED === 'true';
}
