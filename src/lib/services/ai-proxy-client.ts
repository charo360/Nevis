/**
 * AI Proxy Client - Controlled access to AI models through proxy server
 * Prevents unexpected model calls and manages costs
 */

interface ProxyImageRequest {
  prompt: string;
  user_id: string;
  model?: string;
  max_tokens?: number;
  temperature?: number;
}

interface ProxyTextRequest {
  prompt: string;
  user_id: string;
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

interface QuotaResponse {
  user_id: string;
  current_usage: number;
  monthly_limit: number;
  remaining: number;
  month: string;
}

class AIProxyClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.AI_PROXY_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate image through controlled proxy
   */
  async generateImage(request: ProxyImageRequest): Promise<ProxyResponse> {
    try {
      console.log(`🔒 Proxy: Generating image with model ${request.model || 'gemini-2.5-flash-image-preview'}`);
      
      const response = await fetch(`${this.baseUrl}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          user_id: request.user_id,
          model: request.model || 'gemini-2.5-flash-image-preview',
          max_tokens: request.max_tokens || 1000,
          temperature: request.temperature || 0.7
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Proxy error: ${error.detail || response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Proxy: Image generated successfully with ${result.model_used}`);
      console.log(`📊 Proxy: User quota: ${result.user_quota}/40`);
      
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
      console.log(`🔒 Proxy: Generating text with model ${request.model || 'gemini-2.5-flash'}`);
      
      const response = await fetch(`${this.baseUrl}/generate-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          user_id: request.user_id,
          model: request.model || 'gemini-2.5-flash',
          max_tokens: request.max_tokens || 1000,
          temperature: request.temperature || 0.7
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Proxy error: ${error.detail || response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Proxy: Text generated successfully with ${result.model_used}`);
      console.log(`📊 Proxy: User quota: ${result.user_quota}/40`);
      
      return result;
    } catch (error) {
      console.error('❌ Proxy: Text generation failed:', error);
      throw error;
    }
  }

  /**
   * Check user's quota usage
   */
  async getUserQuota(userId: string): Promise<QuotaResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/quota/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get quota: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Proxy: Failed to get user quota:', error);
      throw error;
    }
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
