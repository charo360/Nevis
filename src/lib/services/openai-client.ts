import { EnhancedOpenAIClient } from './openai-client-enhanced';
import type { OpenAITextOptions, OpenAIImageOptions } from './openai-client-enhanced';

// Re-export the enhanced client option types for backward compatibility (type-only)
export type { OpenAITextOptions, OpenAIImageOptions };

export class OpenAIClient {
  /**
   * Generate text using OpenAI GPT models
   * @deprecated Use EnhancedOpenAIClient.generateText instead
   */
  static async generateText(
    prompt: string,
    model: string = 'gpt-4',
    options: OpenAITextOptions = {}
  ): Promise<{ text: string; usage?: any }> {
    return EnhancedOpenAIClient.generateText(prompt, model, options);
  }

  /**
   * Generate image using DALL-E 3
   * @deprecated Use EnhancedOpenAIClient.generateImage instead
   */
  static async generateImage(
    prompt: string,
    options: OpenAIImageOptions = {}
  ): Promise<{ imageUrl: string; revisedPrompt?: string }> {
    const result = await EnhancedOpenAIClient.generateImage(prompt, options);
    return {
      imageUrl: result.url,
      revisedPrompt: result.revisedPrompt
    };
  }
}

export function getOpenAIClient() {
  return OpenAIClient;
}
