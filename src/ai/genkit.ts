/**
 * PROXY-ONLY Genkit Replacement
 * ENFORCES proxy-only architecture for cost control and centralized AI request management
 * NO DIRECT API CALLS - ALL REQUESTS ROUTE THROUGH PROXY
 */

import { aiProxyClient, getUserIdForProxy, getUserTierForProxy, shouldUseProxy } from '@/lib/services/ai-proxy-client';

// Proxy-compatible type definitions for genkit compatibility
export interface MediaPart {
  media?: {
    url?: string;
    contentType?: string;
  };
  data?: string;
  mimeType?: string;
}

export interface GenerateRequest {
  prompt?: string;
  input?: string;
  model?: string;
  config?: any;
}

// Helper function to route AI calls through proxy - PROXY ONLY, NO FALLBACK
async function generateContentWithProxy(promptOrParts: string | any[], modelName: string = 'gemini-2.5-flash', isImageGeneration: boolean = false): Promise<any> {
  if (!shouldUseProxy()) {
    throw new Error('🚫 Proxy is disabled. This system requires AI_PROXY_ENABLED=true for cost control and model management.');
  }

  console.log(`🔄 Proxy-Only Genkit: Using proxy for ${isImageGeneration ? 'image' : 'text'} generation with ${modelName}`);

  // Handle multimodal requests (text + images) properly
  let prompt: string;
  let imageData: string | undefined;

  if (Array.isArray(promptOrParts)) {
    // Extract text and image data from parts
    const textParts = promptOrParts.filter(part => typeof part === 'string' || part.text);
    const imageParts = promptOrParts.filter(part => part.inlineData);

    prompt = textParts.map(part => typeof part === 'string' ? part : part.text).join('\n');

    if (imageParts.length > 0) {
      imageData = imageParts[0].inlineData.data;
    }
  } else {
    prompt = promptOrParts;
  }

  try {
    const userId = getUserIdForProxy();
    const userTier = getUserTierForProxy();

    if (isImageGeneration) {
      const response = await aiProxyClient.generateImage({
        prompt,
        user_id: userId,
        user_tier: userTier,
        model: modelName,
        image_data: imageData
      });

      return {
        response: {
          candidates: [{
            content: {
              parts: [{
                inlineData: {
                  data: response.data,
                  mimeType: 'image/png'
                }
              }]
            },
            finishReason: 'STOP'
          }]
        }
      };
    } else {
      const response = await aiProxyClient.generateText({
        prompt,
        user_id: userId,
        user_tier: userTier,
        model: modelName,
        temperature: 0.7,
        max_tokens: 2048
      });

      return {
        response: {
          text: () => response.content,
          candidates: [{
            content: { parts: [{ text: response.content }] },
            finishReason: 'STOP'
          }]
        }
      };
    }
  } catch (error) {
    console.error(`❌ Proxy-Only Genkit: ${isImageGeneration ? 'Image' : 'Text'} generation failed:`, error);
    throw error;
  }
}

// Proxy-only AI interface that mimics Genkit's API but routes through proxy
export const ai = {
  generate: async (options: any) => {
    console.log('🔒 [Proxy-Only Genkit] Generate called - routing through proxy');

    const prompt = options.prompt || options.input || '';
    const model = options.model || 'gemini-2.5-flash';
    const isImageGeneration = model.includes('image') || options.outputType === 'image';

    return await generateContentWithProxy(prompt, model, isImageGeneration);
  },

  // Compatibility methods for existing code
  generateText: async (prompt: string, options: any = {}) => {
    const model = options.model || 'gemini-2.5-flash';
    return await generateContentWithProxy(prompt, model, false);
  },

  generateImage: async (prompt: string, options: any = {}) => {
    const model = options.model || 'gemini-2.5-flash-image-preview';
    return await generateContentWithProxy(prompt, model, true);
  },

  // defineFlow compatibility for existing flows
  defineFlow: (config: any, handler: any) => {
    console.log('🔒 [Proxy-Only Genkit] DefineFlow called for:', config.name);

    // Return a function that wraps the handler with proxy-only enforcement
    return async (input: any) => {
      if (!shouldUseProxy()) {
        throw new Error('🚫 Proxy is disabled. This system requires AI_PROXY_ENABLED=true for cost control and model management.');
      }

      console.log(`🔄 [Proxy-Only Genkit] Executing flow: ${config.name}`);

      // Execute the handler function
      return await handler(input);
    };
  }
};
