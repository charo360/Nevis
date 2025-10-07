/**
 * Proxy-Only Google AI Service for Gemini Models
 * ENFORCES proxy-only architecture for cost control and centralized AI request management
 * NO DIRECT API CALLS - ALL REQUESTS ROUTE THROUGH PROXY
 */

import { aiProxyClient, getUserIdForProxy, getUserTierForProxy, shouldUseProxy } from '@/lib/services/ai-proxy-client';

// REMOVED: Direct GoogleGenerativeAI instantiation - ALL AI calls now go through proxy for cost control
// REMOVED: Direct API key usage - proxy handles authentication and routing

// Available Gemini models (routed through proxy)
export const GEMINI_2_5_MODELS = {
  FLASH: 'gemini-2.5-flash',
  PRO: 'gemini-2.5-pro',
  FLASH_LITE: 'gemini-2.5-flash-lite',
  FLASH_IMAGE_PREVIEW: 'gemini-2.5-flash-image-preview'
} as const;

export type Gemini25Model = typeof GEMINI_2_5_MODELS[keyof typeof GEMINI_2_5_MODELS];

export interface Gemini25GenerateOptions {
  model?: Gemini25Model;
  temperature?: number;
  maxOutputTokens?: number;
  topK?: number;
  topP?: number;
}

export interface Gemini25TextResponse {
  text: string;
  finishReason?: string;
  safetyRatings?: any[];
}

export interface Gemini25ImageResponse {
  imageData: string; // Base64 encoded image
  mimeType: string;
  finishReason?: string;
  safetyRatings?: any[];
}

// Helper function to route AI calls through proxy - PROXY ONLY, NO FALLBACK
async function generateContentWithProxy(promptOrParts: string | any[], modelName: string, isImageGeneration: boolean = false): Promise<any> {
  if (!shouldUseProxy()) {
    throw new Error('🚫 Proxy is disabled. This system requires AI_PROXY_ENABLED=true for cost control and model management.');
  }

  console.log(`🔄 Proxy-Only Google AI: Using proxy for ${isImageGeneration ? 'image' : 'text'} generation with ${modelName}`);

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
    console.error(`❌ Proxy-Only Google AI: ${isImageGeneration ? 'Image' : 'Text'} generation failed:`, error);
    throw error;
  }
}

/**
 * Generate text using Gemini models (PROXY ONLY)
 */
export async function generateText(
  prompt: string,
  options: Gemini25GenerateOptions = {}
): Promise<Gemini25TextResponse> {
  try {
    const {
      model = GEMINI_2_5_MODELS.FLASH,
      temperature = 0.7,
      maxOutputTokens = 2048,
    } = options;

    console.log(`🔍 [Proxy-Only Google AI] Generating text with model: ${model}`);

    const result = await generateContentWithProxy(prompt, model, false);
    const response = await result.response;
    const text = response.text();

    console.log(`✅ [Proxy-Only Google AI] Text generation successful, length: ${text.length}`);

    return {
      text,
      finishReason: response.candidates?.[0]?.finishReason,
      safetyRatings: response.candidates?.[0]?.safetyRatings,
    };

  } catch (error) {
    console.error('❌ [Proxy-Only Google AI] Text generation failed:', error);
    throw new Error(`Proxy-only Google AI text generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test connection to Google AI API (through proxy)
 */
export async function testConnection(): Promise<boolean> {
  try {
    const response = await generateText('Test connection', { maxOutputTokens: 10 });
    return response.text.length > 0;
  } catch (error) {
    console.error('❌ [Proxy-Only Google AI] Connection test failed:', error);
    return false;
  }
}

/**
 * Generate image using Gemini models (PROXY ONLY)
 */
export async function generateImage(
  prompt: string,
  options: Gemini25GenerateOptions = {}
): Promise<Gemini25ImageResponse> {
  try {
    const {
      model = GEMINI_2_5_MODELS.FLASH_IMAGE_PREVIEW,
      temperature = 0.8,
      maxOutputTokens = 1024,
    } = options;

    console.log(`🔍 [Proxy-Only Google AI] Generating image with model: ${model}`);

    const result = await generateContentWithProxy(prompt, model, true);
    const response = await result.response;

    // Extract image data from proxy response
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData) {
          return {
            imageData: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png',
            finishReason: candidates[0].finishReason
          };
        }
      }
    }

    throw new Error('No image data found in proxy response');

  } catch (error) {
    console.error('❌ [Proxy-Only Google AI] Image generation failed:', error);
    throw new Error(`Proxy-only Google AI image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate multimodal content (text + image analysis) - PROXY ONLY
 */
export async function generateMultimodal(
  textPrompt: string,
  imageData?: string, // Base64 encoded image
  options: Gemini25GenerateOptions = {}
): Promise<Gemini25TextResponse> {
  try {
    const {
      model = GEMINI_2_5_MODELS.FLASH,
      temperature = 0.7,
      maxOutputTokens = 2048,
    } = options;

    console.log(`🔍 [Proxy-Only Google AI] Generating multimodal content with model: ${model}`);

    // Prepare multimodal parts for proxy
    let parts: any[] = [textPrompt];
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData
        }
      });
    }

    const result = await generateContentWithProxy(parts, model, false);
    const response = await result.response;
    const text = response.text();

    return {
      text,
      finishReason: response.candidates?.[0]?.finishReason,
      safetyRatings: response.candidates?.[0]?.safetyRatings,
    };

  } catch (error) {
    console.error('❌ [Proxy-Only Google AI] Multimodal generation failed:', error);
    throw new Error(`Proxy-only Google AI multimodal generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get available models and their capabilities (routed through proxy)
 */
export function getAvailableModels() {
  return {
    models: GEMINI_2_5_MODELS,
    architecture: 'PROXY-ONLY - All requests route through AI proxy for cost control',
    capabilities: {
      [GEMINI_2_5_MODELS.FLASH]: {
        description: 'Fast and efficient for most tasks (via proxy)',
        bestFor: ['content generation', 'design specifications', 'quick responses'],
        costEfficiency: 'high'
      },
      [GEMINI_2_5_MODELS.PRO]: {
        description: 'Most capable but expensive - BLOCKED by proxy for cost control',
        bestFor: ['complex analysis', 'detailed design planning', 'sophisticated content'],
        costEfficiency: 'BLOCKED - Proxy prevents usage to control costs'
      },
      [GEMINI_2_5_MODELS.FLASH_LITE]: {
        description: 'Lightweight and cost-effective (via proxy)',
        bestFor: ['simple tasks', 'quick responses', 'high-volume requests'],
        costEfficiency: 'very high'
      },
      [GEMINI_2_5_MODELS.FLASH_IMAGE_PREVIEW]: {
        description: 'Image generation model (via proxy)',
        bestFor: ['image generation', 'visual content creation'],
        costEfficiency: 'controlled via proxy'
      }
    }
  };
}
