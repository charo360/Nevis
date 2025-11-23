/**
 * Direct Gemini API Client (AI Studio)
 * Uses Google AI Studio API for Gemini 3 Pro image generation
 */

interface GeminiAPIRequest {
  contents: Array<{
    parts: Array<{
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string;
      };
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    imageConfig?: {
      aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
      imageSize?: '256' | '512' | '1K' | '2K';
    };
  };
}

interface GeminiAPIResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
    finishReason: string;
  }>;
}

class GeminiAPIClient {
  private apiKeys: string[];
  private currentKeyIndex: number = 0;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta';

  constructor() {
    // Load all available Gemini API keys
    this.apiKeys = [];

    // Primary key
    const primaryKey = process.env.GEMINI_API_KEY || process.env.GEMINI_IMAGE_EDIT_API_KEY;
    if (primaryKey) {
      this.apiKeys.push(primaryKey);
    }

    // Fallback key 2
    const fallbackKey2 = process.env.GEMINI_API_KEY_SECONDARY || process.env.GEMINI_IMAGE_EDIT_API_KEY_2;
    if (fallbackKey2) {
      this.apiKeys.push(fallbackKey2);
    }

    // Fallback key 3
    const fallbackKey3 = process.env.GEMINI_IMAGE_EDIT_API_KEY_3;
    if (fallbackKey3) {
      this.apiKeys.push(fallbackKey3);
    }

    if (this.apiKeys.length === 0) {
      throw new Error('🔑 At least one GEMINI_API_KEY is required. Please add GEMINI_IMAGE_EDIT_API_KEY to your environment.');
    }

    console.log(`✅ [Gemini API] Client initialized with ${this.apiKeys.length} API key(s)`);
  }

  /**
   * Get current API key
   */
  private getCurrentApiKey(): string {
    return this.apiKeys[this.currentKeyIndex];
  }

  /**
   * Switch to next API key if available
   */
  private switchToNextKey(): boolean {
    if (this.currentKeyIndex < this.apiKeys.length - 1) {
      this.currentKeyIndex++;
      console.log(`🔄 [Gemini API] Switching to fallback API key ${this.currentKeyIndex + 1}/${this.apiKeys.length}`);
      return true;
    }
    return false;
  }

  /**
   * Reset to primary key
   */
  private resetToFirstKey(): void {
    this.currentKeyIndex = 0;
  }

  /**
   * Generate content using Gemini API with automatic fallback
   */
  async generateContent(
    model: string,
    request: GeminiAPIRequest
  ): Promise<GeminiAPIResponse> {
    let lastError: Error | null = null;

    // Try each API key in sequence
    for (let attempt = 0; attempt < this.apiKeys.length; attempt++) {
      const currentKey = this.getCurrentApiKey();
      const endpoint = `${this.baseUrl}/models/${model}:generateContent?key=${currentKey}`;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request)
        });

        if (!response.ok) {
          const errorText = await response.text();
          const error = new Error(`Gemini API error: ${response.status} - ${errorText}`);

          // If this is a rate limit or server error and we have more keys, try next key
          if ((response.status === 429 || response.status === 503 || response.status >= 500) && this.switchToNextKey()) {
            console.warn(`⚠️ [Gemini API] Key ${attempt + 1} failed (${response.status}), trying next key...`);
            lastError = error;
            continue;
          }

          throw error;
        }

        const result = await response.json();

        // Success! Reset to first key for next request
        this.resetToFirstKey();

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // If we have more keys to try, continue
        if (this.switchToNextKey()) {
          console.warn(`⚠️ [Gemini API] Key ${attempt + 1} failed, trying next key...`);
          continue;
        }

        // No more keys to try
        break;
      }
    }

    // All keys failed
    this.resetToFirstKey();
    throw lastError || new Error('All Gemini API keys failed');
  }

  /**
   * Generate text content
   */
  async generateText(
    prompt: string,
    model: string = 'gemini-2.0-flash-exp',
    options: {
      temperature?: number;
    } = {}
  ): Promise<{ text: string; finishReason: string }> {
    const request: GeminiAPIRequest = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: options.temperature || 0.7
      }
    };

    const response = await this.generateContent(model, request);

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No candidates returned from Gemini API');
    }

    const candidate = response.candidates[0];
    const text = candidate.content.parts[0]?.text || '';

    return {
      text,
      finishReason: candidate.finishReason
    };
  }

  /**
   * Edit existing image with Gemini 3 Pro
   */
  async editImage(
    prompt: string,
    sourceImage: string, // Base64 data URL of image to edit
    model: string = 'gemini-3-pro-image-preview',
    options: {
      temperature?: number;
      aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
      imageSize?: '256' | '512' | '1K' | '2K';
      maskImage?: string; // Optional mask for selective editing
    } = {}
  ): Promise<{ imageData: string; mimeType: string; finishReason: string }> {
    const parts: any[] = [{ text: prompt }];

    // Add source image
    if (sourceImage && sourceImage.startsWith('data:image/')) {
      const [mimeInfo, base64Data] = sourceImage.split(',');
      const mimeType = mimeInfo.split(':')[1].split(';')[0];

      parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });

      console.log('✅ [Gemini API] Added source image for editing');
    }

    // Add mask image if provided
    if (options.maskImage && options.maskImage.startsWith('data:image/')) {
      const [mimeInfo, base64Data] = options.maskImage.split(',');
      const mimeType = mimeInfo.split(':')[1].split(';')[0];

      parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });

      console.log('✅ [Gemini API] Added mask image for selective editing');
    }

    const request: GeminiAPIRequest = {
      contents: [{
        parts
      }],
      generationConfig: {
        temperature: options.temperature || 0.7
      }
    };

    // Add imageConfig for Gemini 3 Pro
    if (model.includes('gemini-3-pro-image')) {
      if (!request.generationConfig) {
        request.generationConfig = {};
      }
      request.generationConfig.imageConfig = {
        aspectRatio: options.aspectRatio || '3:4',
        imageSize: options.imageSize || '1K'
      };
      console.log('✅ [Gemini API] Using Gemini 3 Pro for image editing with imageConfig:', request.generationConfig.imageConfig);
    }

    const response = await this.generateContent(model, request);

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No candidates returned from Gemini API');
    }

    const candidate = response.candidates[0];
    const imagePart = candidate.content.parts.find(part => part.inlineData);

    if (!imagePart?.inlineData) {
      throw new Error('No image data returned from Gemini API');
    }

    return {
      imageData: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
      finishReason: candidate.finishReason
    };
  }

  /**
   * Generate image content with Gemini 3 Pro
   */
  async generateImage(
    prompt: string,
    model: string = 'gemini-3-pro-image-preview',
    options: {
      temperature?: number;
      aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
      imageSize?: '256' | '512' | '1K' | '2K';
      logoImage?: string; // Base64 data URL for brand logo
      uploadedImage?: string; // Base64 data URL for reference/uploaded image
    } = {}
  ): Promise<{ imageData: string; mimeType: string; finishReason: string }> {
    const parts: any[] = [];

    // Add uploaded reference image FIRST if provided (so AI sees it before the prompt)
    if (options.uploadedImage && options.uploadedImage.startsWith('data:image/')) {
      const [mimeInfo, base64Data] = options.uploadedImage.split(',');
      const mimeType = mimeInfo.split(':')[1].split(';')[0];

      parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });

      console.log('✅ [Gemini API] Added uploaded reference image to request (FIRST for better understanding)');
    }

    // Add text prompt
    parts.push({ text: prompt });

    // Add logo image if provided (AFTER prompt for proper hierarchy)
    if (options.logoImage && options.logoImage.startsWith('data:image/')) {
      const [mimeInfo, base64Data] = options.logoImage.split(',');
      const mimeType = mimeInfo.split(':')[1].split(';')[0];

      parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });

      console.log('✅ [Gemini API] Added logo image to request');
    }

    const request: GeminiAPIRequest = {
      contents: [{
        parts
      }],
      generationConfig: {
        temperature: options.temperature || 0.7
      }
    };

    // Add imageConfig for Gemini 3 Pro
    if (model.includes('gemini-3-pro-image')) {
      if (!request.generationConfig) {
        request.generationConfig = {};
      }
      request.generationConfig.imageConfig = {
        aspectRatio: options.aspectRatio || '3:4',
        imageSize: options.imageSize || '1K'
      };
      console.log('✅ [Gemini API] Using Gemini 3 Pro with imageConfig:', request.generationConfig.imageConfig);
    }

    const response = await this.generateContent(model, request);

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No candidates returned from Gemini API');
    }

    const candidate = response.candidates[0];
    const imagePart = candidate.content.parts.find(part => part.inlineData);

    if (!imagePart?.inlineData) {
      throw new Error('No image data returned from Gemini API');
    }

    return {
      imageData: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
      finishReason: candidate.finishReason
    };
  }
}

// Export singleton instance
let geminiAPIClientInstance: GeminiAPIClient | null = null;

export function getGeminiAPIClient(): GeminiAPIClient {
  if (!geminiAPIClientInstance) {
    geminiAPIClientInstance = new GeminiAPIClient();
  }
  return geminiAPIClientInstance;
}
