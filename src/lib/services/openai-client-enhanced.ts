/**
 * Enhanced OpenAI Client with Fallback Support
 * 
 * Provides a robust OpenAI client that automatically handles API key rotation,
 * fallback mechanisms, and intelligent error recovery.
 */

import OpenAI from 'openai';
import { openAIKeyManager } from './openai-key-manager';
import { withRetry, openAIRetryManagers } from '@/lib/utils/openai-retry-manager';

export interface OpenAITextOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  retryType?: keyof typeof openAIRetryManagers;
}

export interface OpenAIImageOptions {
  model?: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  retryType?: keyof typeof openAIRetryManagers;
}

export class EnhancedOpenAIClient {
  /**
   * Execute an OpenAI operation with automatic fallback and retry
   */
  private static async executeWithFallback<T>(
    operation: (client: OpenAI) => Promise<T>,
    operationName: string,
    retryType: keyof typeof openAIRetryManagers = 'contentGeneration'
  ): Promise<T> {
    const maxKeyAttempts = 3; // Try up to 3 different keys
    let lastError: Error;

    for (let keyAttempt = 0; keyAttempt < maxKeyAttempts; keyAttempt++) {
      try {
        const client = openAIKeyManager.createClient();
        const apiKey = client.apiKey;

        // Execute operation with retry logic
        const result = await withRetry(
          () => operation(client),
          operationName,
          retryType
        );

        // Record success
        openAIKeyManager.recordSuccess(apiKey);
        
        if (keyAttempt > 0) {
          console.log(`✅ [Enhanced OpenAI] ${operationName} succeeded with fallback key (attempt ${keyAttempt + 1})`);
        }

        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const client = openAIKeyManager.createClient();
        
        console.warn(`⚠️ [Enhanced OpenAI] ${operationName} failed with key attempt ${keyAttempt + 1}:`, lastError.message);
        
        // Record failure
        openAIKeyManager.recordFailure(client.apiKey, lastError);

        // If this is the last attempt, throw the error
        if (keyAttempt === maxKeyAttempts - 1) {
          throw lastError;
        }

        // Wait a bit before trying the next key
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    throw lastError!;
  }

  /**
   * Generate text using OpenAI GPT models with fallback support
   */
  static async generateText(
    prompt: string,
    model: string = 'gpt-4',
    options: OpenAITextOptions = {}
  ): Promise<{ text: string; usage?: any }> {
    const {
      temperature = 0.8,
      maxTokens = 1000,
      retryType = 'contentGeneration'
    } = options;

    const result = await this.executeWithFallback(
      async (client) => {
        const response = await client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
        });

        const text = response.choices[0]?.message?.content || '';
        return {
          text,
          usage: response.usage
        };
      },
      `Generate Text (${model})`,
      retryType
    );

    return result;
  }

  /**
   * Generate images using DALL-E with fallback support
   */
  static async generateImage(
    prompt: string,
    options: OpenAIImageOptions = {}
  ): Promise<{ url: string; revisedPrompt?: string }> {
    const {
      model = 'dall-e-3',
      size = '1024x1024',
      quality = 'standard',
      style = 'vivid',
      retryType = 'contentGeneration'
    } = options;

    const result = await this.executeWithFallback(
      async (client) => {
        const response = await client.images.generate({
          model,
          prompt,
          size,
          quality,
          style,
          n: 1,
        });

        const imageData = response.data[0];
        if (!imageData?.url) {
          throw new Error('No image URL returned from OpenAI');
        }

        return {
          url: imageData.url,
          revisedPrompt: imageData.revised_prompt
        };
      },
      `Generate Image (${model})`,
      retryType
    );

    return result;
  }

  /**
   * Create a chat completion with fallback support
   */
  static async createChatCompletion(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
      retryType?: keyof typeof openAIRetryManagers;
    } = {}
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const {
      model = 'gpt-4',
      temperature = 0.8,
      maxTokens = 1000,
      stream = false,
      retryType = 'contentGeneration'
    } = options;

    const result = await this.executeWithFallback(
      async (client) => {
        return await client.chat.completions.create({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream,
        });
      },
      `Chat Completion (${model})`,
      retryType
    );

    return result;
  }

  /**
   * List available models with fallback support
   */
  static async listModels(): Promise<OpenAI.Models.ModelsPage> {
    const result = await this.executeWithFallback(
      async (client) => {
        return await client.models.list();
      },
      'List Models',
      'quickOperations'
    );

    return result;
  }

  /**
   * Create an assistant with fallback support
   */
  static async createAssistant(
    params: OpenAI.Beta.Assistants.AssistantCreateParams
  ): Promise<OpenAI.Beta.Assistants.Assistant> {
    const result = await this.executeWithFallback(
      async (client) => {
        return await client.beta.assistants.create(params);
      },
      'Create Assistant',
      'assistantManagement'
    );

    return result;
  }

  /**
   * Create a thread with fallback support
   */
  static async createThread(
    params?: OpenAI.Beta.Threads.ThreadCreateParams
  ): Promise<OpenAI.Beta.Threads.Thread> {
    const result = await this.executeWithFallback(
      async (client) => {
        return await client.beta.threads.create(params);
      },
      'Create Thread',
      'threadOperations'
    );

    return result;
  }

  /**
   * Run an assistant with fallback support
   */
  static async runAssistant(
    threadId: string,
    params: OpenAI.Beta.Threads.Runs.RunCreateParams
  ): Promise<OpenAI.Beta.Threads.Runs.Run> {
    const result = await this.executeWithFallback(
      async (client) => {
        return await client.beta.threads.runs.create(threadId, params);
      },
      'Run Assistant',
      'contentGeneration'
    );

    return result;
  }

  /**
   * Get health status of all API keys
   */
  static getKeyHealthStatus() {
    return openAIKeyManager.getHealthStatus();
  }

  /**
   * Get a direct client instance (for advanced usage)
   * Note: This bypasses the fallback system
   */
  static getDirectClient(): OpenAI {
    return openAIKeyManager.createClient();
  }
}

// Export for backward compatibility
export { EnhancedOpenAIClient as OpenAIClient };
