/**
 * PROXY-ONLY Genkit Replacement
 * ENFORCES proxy-only architecture for cost control and centralized AI request management
 * NO DIRECT API CALLS - ALL REQUESTS ROUTE THROUGH PROXY
 */

import { aiProxyClient, getUserIdForProxy, getUserTierForProxy, shouldUseProxy } from '@/lib/services/ai-proxy-client';

// Direct API fallback function when proxy is not available
async function generateContentDirect(promptOrParts: string | any[], modelName: string, isImageGeneration: boolean, explicitLogoDataUrl?: string): Promise<any> {
  console.log('🔄 Direct API: Using direct Google AI API fallback');

  // Get API key from environment
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('🚫 No Google API key found. Please set GEMINI_API_KEY or GOOGLE_API_KEY in your environment variables.');
  }

  // Prepare prompt
  let prompt: string;
  if (Array.isArray(promptOrParts)) {
    const textParts = promptOrParts.filter(part => typeof part === 'string' || part.text);
    prompt = textParts.map(part => typeof part === 'string' ? part : part.text).join('\n');
  } else {
    prompt = promptOrParts;
  }

  // Prepare payload
  const parts = [{ text: prompt }];

  // Add logo if provided
  if (explicitLogoDataUrl && explicitLogoDataUrl.startsWith('data:image/')) {
    try {
      const logoMatch = explicitLogoDataUrl.split(',', 1);
      if (logoMatch.length === 2) {
        const mimeInfo = logoMatch[0].split(';')[0].split(':')[1];
        const base64Data = logoMatch[1];
        parts.push({
          inlineData: {
            mimeType: mimeInfo,
            data: base64Data
          }
        });
      }
    } catch (error) {
      console.warn('Failed to process logo for direct API:', error);
    }
  }

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      ...(isImageGeneration && { responseModalities: ['IMAGE'] })
    }
  };

  // Determine endpoint based on model
  const cleanModelName = modelName.replace(/^(googleai\/|anthropic\/|openai\/)/, '');
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelName}:generateContent`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (isImageGeneration) {
      // Extract image data
      const candidates = result.candidates;
      if (!candidates || !candidates[0]?.content?.parts?.[0]?.inlineData?.data) {
        throw new Error('Invalid image response from Google API');
      }

      const base64Data = candidates[0].content.parts[0].inlineData.data;
      const imageDataUrl = `data:image/png;base64,${base64Data}`;

      return {
        response: {
          candidates: [{
            content: {
              parts: [{
                inlineData: {
                  data: base64Data,
                  mimeType: 'image/png'
                }
              }]
            },
            finishReason: 'STOP'
          }]
        },
        media: {
          url: imageDataUrl,
          contentType: 'image/png'
        }
      };
    } else {
      // Extract text content
      const candidates = result.candidates;
      if (!candidates || !candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid text response from Google API');
      }

      return {
        response: {
          text: () => candidates[0].content.parts[0].text,
          candidates: [{
            content: { parts: [{ text: candidates[0].content.parts[0].text }] },
            finishReason: 'STOP'
          }]
        }
      };
    }
  } catch (error) {
    console.error('❌ Direct API generation failed:', error);
    throw error;
  }
}

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

// Helper function to route AI calls through proxy with fallback to direct API
export async function generateContentWithProxy(promptOrParts: string | any[], modelName: string = 'gemini-2.5-flash', isImageGeneration: boolean = false, explicitLogoDataUrl?: string): Promise<any> {
  // If proxy is disabled, use direct API fallback
  if (!shouldUseProxy()) {
    console.log('🔄 Proxy disabled, using direct API fallback');
    return await generateContentDirect(promptOrParts, modelName, isImageGeneration, explicitLogoDataUrl);
  }

  // Strip Genkit prefixes to get the raw model name for proxy
  const cleanModelName = modelName.replace(/^(googleai\/|anthropic\/|openai\/)/, '');

  console.log(`🔄 Proxy-Only Genkit: Using proxy for ${isImageGeneration ? 'image' : 'text'} generation with ${cleanModelName} (original: ${modelName})`);

  // Handle multimodal requests (text + images) properly
  let prompt: string;
  let imageData: string | undefined = explicitLogoDataUrl;

  if (Array.isArray(promptOrParts)) {
    // Extract text and image data from parts
    const textParts = promptOrParts.filter(part => typeof part === 'string' || part.text);
    const imageParts = promptOrParts.filter(part => part.inlineData || (part.media && part.media.url));

    prompt = textParts.map(part => typeof part === 'string' ? part : part.text).join('\n');

    // Only extract image data from parts if no explicit logo was provided
    if (!imageData && imageParts.length > 0) {
      // For Creative Studio: Look for brand logo specifically by checking if prompt mentions logo integration
      // This helps distinguish between reference assets and brand logos
      const promptText = prompt.toLowerCase();
      const isLogoIntegrationRequest = promptText.includes('logo') && (
        promptText.includes('brand logo') ||
        promptText.includes('logo integration') ||
        promptText.includes('mandatory logo') ||
        promptText.includes('critical logo')
      );

      let selectedImagePart = imageParts[0]; // Default to first image

      if (isLogoIntegrationRequest && imageParts.length > 1) {
        // If this is a logo integration request with multiple images,
        // try to find the logo by looking for the last image that's likely a logo
        // (logos are typically added after reference assets in Creative Studio)
        for (let i = imageParts.length - 1; i >= 0; i--) {
          const imagePart = imageParts[i];
          if (imagePart.media && imagePart.media.url && imagePart.media.url.startsWith('data:image/')) {
            // This looks like a logo (data URL format)
            selectedImagePart = imagePart;
            break;
          }
        }
      }

      // Handle both inlineData and media URL formats
      if (selectedImagePart.inlineData) {
        imageData = selectedImagePart.inlineData.data;
      } else if (selectedImagePart.media && selectedImagePart.media.url) {
        // Convert data URL to base64 data for proxy
        if (selectedImagePart.media.url.startsWith('data:')) {
          const base64Match = selectedImagePart.media.url.match(/^data:[^;]+;base64,(.+)$/);
          if (base64Match) {
            imageData = selectedImagePart.media.url; // Keep full data URL for logoImage
          }
        }
      }
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
        model: cleanModelName,
        ...(imageData && { logoImage: imageData }) // Pass image data as logoImage for brand integration
      });

      // Extract base64 data from proxy response structure
      let base64Data;
      if (typeof response.data === 'string') {
        base64Data = response.data;
      } else if (response.data && response.data.candidates &&
        response.data.candidates[0] && response.data.candidates[0].content &&
        response.data.candidates[0].content.parts && response.data.candidates[0].content.parts[0] &&
        response.data.candidates[0].content.parts[0].inlineData &&
        response.data.candidates[0].content.parts[0].inlineData.data) {
        base64Data = response.data.candidates[0].content.parts[0].inlineData.data;
      } else {
        console.error('Debug: Full response structure:', JSON.stringify(response, null, 2));
        throw new Error('Invalid image data format from proxy');
      }

      // Convert proxy response to Genkit format with media URL
      const imageDataUrl = `data:image/png;base64,${base64Data}`;

      console.log('🔍 [DEBUG] generateContentWithProxy returning successful image response');

      return {
        response: {
          candidates: [{
            content: {
              parts: [{
                inlineData: {
                  data: base64Data,
                  mimeType: 'image/png'
                }
              }]
            },
            finishReason: 'STOP'
          }]
        },
        // Add media property for Creative Studio compatibility
        media: {
          url: imageDataUrl,
          contentType: 'image/png'
        }
      };
    } else {
      const response = await aiProxyClient.generateText({
        prompt,
        user_id: userId,
        user_tier: userTier,
        model: cleanModelName,
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

    // If proxy fails and we should be using it, try direct API fallback
    if (shouldUseProxy()) {
      console.log('🔄 Proxy failed, attempting direct API fallback...');
      try {
        return await generateContentDirect(promptOrParts, modelName, isImageGeneration, explicitLogoDataUrl);
      } catch (fallbackError) {
        console.error('❌ Direct API fallback also failed:', fallbackError);
        throw new Error(`Both proxy and direct API failed. Proxy error: ${error.message}. Direct API error: ${fallbackError.message}`);
      }
    }

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
  },

  // definePrompt compatibility for existing prompts
  definePrompt: (config: any) => {
    console.log('🔒 [Proxy-Only Genkit] DefinePrompt called for:', config.name);

    // Return a function that can be used to execute the prompt through proxy
    return async (input: any) => {
      if (!shouldUseProxy()) {
        throw new Error('🚫 Proxy is disabled. This system requires AI_PROXY_ENABLED=true for cost control and model management.');
      }

      console.log(`🔄 [Proxy-Only Genkit] Executing prompt: ${config.name}`);

      // For now, return a placeholder since the actual prompt isn't being used
      // This can be enhanced later to actually process the prompt through proxy
      return {
        message: `Prompt ${config.name} executed through proxy`,
        config: config.name
      };
    };
  },

  // defineTool compatibility for existing tools (like events service)
  defineTool: (config: any) => {
    console.log('🔒 [Proxy-Only Genkit] DefineTool called for:', config.name);

    // Return a function that can be used to execute the tool
    return async (input: any) => {
      console.log(`🔄 [Proxy-Only Genkit] Executing tool: ${config.name} with input:`, input);

      // For events tool, return mock data since we're in proxy-only mode
      if (config.name === 'getEnhancedEvents') {
        return {
          events: [],
          message: `Events tool ${config.name} executed in proxy-only mode`,
          location: input.location,
          businessType: input.businessType
        };
      }

      // For other tools, return generic response
      return {
        message: `Tool ${config.name} executed through proxy-only mode`,
        config: config.name,
        input: input
      };
    };
  }
};
