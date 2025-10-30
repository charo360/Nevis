import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  timeout: 60000, // 60 second timeout
  maxRetries: 3, // Retry failed requests up to 3 times
});

export interface OpenAITextOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export class OpenAIClient {
  /**
   * Generate text using OpenAI GPT models
   */
  static async generateText(
    prompt: string, 
    model: string = 'gpt-4', 
    options: OpenAITextOptions = {}
  ): Promise<{ text: string; usage?: any }> {
    const {
      temperature = 0.8,
      maxTokens = 1000,
    } = options;

    try {
      console.log(`🤖 [OpenAI] Using model: ${model} with temperature: ${temperature}`);
      
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      console.log(`✅ [OpenAI] Generated ${content.length} characters, used ${response.usage?.total_tokens || 'unknown'} tokens`);

      return {
        text: content,
        usage: response.usage
      };

    } catch (error: any) {
      console.error('❌ [OpenAI] Generation failed:', error.message);
      
      // Provide helpful error messages
      if (error.code === 'invalid_api_key') {
        throw new Error('OpenAI API key is invalid. Please check your OPENAI_API_KEY environment variable.');
      } else if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI account has insufficient credits. Please add credits to your OpenAI account.');
      } else if (error.code === 'model_not_found') {
        throw new Error(`OpenAI model "${model}" not found. Please check the model name or your account access.`);
      } else if (error.code === 'rate_limit_exceeded') {
        throw new Error('OpenAI rate limit exceeded. Please wait a moment and try again.');
      }
      
      throw error;
    }
  }

  /**
   * Generate image using DALL-E 3
   */
  static async generateImage(
    prompt: string,
    options: {
      model?: string;
      size?: '1024x1024' | '1792x1024' | '1024x1792';
      quality?: 'standard' | 'hd';
      style?: 'vivid' | 'natural';
    } = {}
  ): Promise<{ imageUrl: string; revisedPrompt?: string }> {
    const {
      model = 'dall-e-3',
      size = '1024x1024',
      quality = 'hd',
      style = 'vivid'
    } = options;

    try {
      console.log(`🎨 [OpenAI DALL-E] Generating image with ${model}`);
      
      const response = await openai.images.generate({
        model: model,
        prompt: prompt,
        n: 1,
        size: size,
        quality: quality,
        style: style
      });

      const imageUrl = response.data[0]?.url;
      const revisedPrompt = response.data[0]?.revised_prompt;
      
      if (!imageUrl) {
        throw new Error('No image URL received from OpenAI');
      }

      console.log(`✅ [OpenAI DALL-E] Image generated successfully`);
      if (revisedPrompt) {
        console.log(`📝 [OpenAI DALL-E] Revised prompt: ${revisedPrompt.substring(0, 100)}...`);
      }

      return {
        imageUrl,
        revisedPrompt
      };

    } catch (error: any) {
      console.error('❌ [OpenAI DALL-E] Image generation failed:', error.message);
      throw error;
    }
  }
}

export function getOpenAIClient() {
  return OpenAIClient;
}
