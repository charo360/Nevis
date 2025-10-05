/**
 * OpenRouter API Client - Fallback system for AI generation
 * Provides reliable fallback when Google AI services fail
 */

interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenRouterImageRequest {
  model: string;
  prompt: string;
  n?: number;
  size?: string;
  quality?: string;
  style?: string;
}

interface OpenRouterImageResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string;
  private enabled: boolean;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.baseUrl = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1';
    this.enabled = process.env.OPENROUTER_ENABLED === 'true';
  }

  /**
   * Check if OpenRouter is enabled and configured
   */
  isEnabled(): boolean {
    return this.enabled && !!this.apiKey;
  }

  /**
   * Map Google AI models to OpenRouter equivalents
   */
  private mapGoogleModelToOpenRouter(googleModel: string): string {
    const modelMap: Record<string, string> = {
      'gemini-2.5-flash': 'google/gemini-2.0-flash-exp',
      'gemini-2.5-flash-lite': 'google/gemini-2.0-flash-exp',
      'gemini-2.5-flash-image-preview': 'google/gemini-2.0-flash-exp',
      'gemini-1.5-flash': 'google/gemini-flash-1.5',
      'gemini-2.5-pro': 'google/gemini-pro-1.5',
      'gemini-exp-1206': 'google/gemini-2.0-flash-exp',
      'gemini-exp-1121': 'google/gemini-2.0-flash-exp'
    };

    return modelMap[googleModel] || 'google/gemini-2.0-flash-exp';
  }

  /**
   * Generate text content using OpenRouter
   */
  async generateText(params: {
    prompt: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ content: string; usage?: any }> {
    if (!this.isEnabled()) {
      throw new Error('OpenRouter is not enabled or configured');
    }

    const openRouterModel = this.mapGoogleModelToOpenRouter(params.model);
    
    const request: OpenRouterRequest = {
      model: openRouterModel,
      messages: [
        {
          role: 'user',
          content: params.prompt
        }
      ],
      max_tokens: params.maxTokens || 2048,
      temperature: params.temperature || 0.7,
      stream: false
    };

    console.log(`🔄 OpenRouter: Generating text with ${openRouterModel} (fallback for ${params.model})`);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
          'X-Title': 'Nevis AI - Content Generation'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data: OpenRouterResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenRouter');
      }

      console.log(`✅ OpenRouter: Text generation successful`);
      
      return {
        content: data.choices[0].message.content,
        usage: data.usage
      };

    } catch (error: any) {
      console.error('❌ OpenRouter text generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate image using OpenRouter (if supported by the model)
   */
  async generateImage(params: {
    prompt: string;
    model: string;
    size?: string;
    quality?: string;
  }): Promise<{ imageUrl: string; usage?: any }> {
    if (!this.isEnabled()) {
      throw new Error('OpenRouter is not enabled or configured');
    }

    // For image generation, we'll use a text-to-image model
    // Since OpenRouter doesn't have direct Gemini image generation,
    // we'll use a different approach or return a text description
    const imageModel = 'black-forest-labs/flux-1.1-pro'; // Popular image generation model on OpenRouter
    
    const request: OpenRouterImageRequest = {
      model: imageModel,
      prompt: params.prompt,
      n: 1,
      size: params.size || '1024x1024',
      quality: params.quality || 'standard'
    };

    console.log(`🔄 OpenRouter: Generating image with ${imageModel} (fallback for ${params.model})`);

    try {
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
          'X-Title': 'Nevis AI - Image Generation'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        // If image generation fails, fall back to text description
        console.log('⚠️ OpenRouter image generation not available, generating text description instead');
        
        const textResponse = await this.generateText({
          prompt: `Create a detailed visual description for this design concept: ${params.prompt}. Format as a professional design brief that could be used to create the image.`,
          model: params.model,
          maxTokens: 500
        });

        // Return a placeholder image URL with the description
        return {
          imageUrl: `data:text/plain;base64,${Buffer.from(textResponse.content).toString('base64')}`,
          usage: textResponse.usage
        };
      }

      const data: OpenRouterImageResponse = await response.json();
      
      if (!data.data || data.data.length === 0) {
        throw new Error('No image generated by OpenRouter');
      }

      console.log(`✅ OpenRouter: Image generation successful`);
      
      return {
        imageUrl: data.data[0].url || data.data[0].b64_json || '',
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };

    } catch (error: any) {
      console.error('❌ OpenRouter image generation failed:', error);
      
      // Fallback to text description
      try {
        const textResponse = await this.generateText({
          prompt: `Create a detailed visual description for this design concept: ${params.prompt}. Format as a professional design brief.`,
          model: params.model,
          maxTokens: 500
        });

        return {
          imageUrl: `data:text/plain;base64,${Buffer.from(textResponse.content).toString('base64')}`,
          usage: textResponse.usage
        };
      } catch (textError) {
        throw error; // Throw original error if text fallback also fails
      }
    }
  }

  /**
   * Health check for OpenRouter service
   */
  async healthCheck(): Promise<{ status: string; models?: string[] }> {
    if (!this.isEnabled()) {
      return { status: 'disabled' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const availableModels = data.data?.map((model: any) => model.id) || [];
        
        return {
          status: 'healthy',
          models: availableModels.slice(0, 10) // Return first 10 models
        };
      } else {
        return { status: 'error' };
      }
    } catch (error) {
      console.error('OpenRouter health check failed:', error);
      return { status: 'error' };
    }
  }
}

// Export singleton instance
export const openRouterClient = new OpenRouterClient();

// Export helper functions
export function isOpenRouterEnabled(): boolean {
  return openRouterClient.isEnabled();
}

export async function generateTextWithOpenRouter(params: {
  prompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<{ content: string; usage?: any }> {
  return openRouterClient.generateText(params);
}

export async function generateImageWithOpenRouter(params: {
  prompt: string;
  model: string;
  size?: string;
  quality?: string;
}): Promise<{ imageUrl: string; usage?: any }> {
  return openRouterClient.generateImage(params);
}
