/**
 * Direct Google AI API Service for Gemini 2.5
 * Bypasses Genkit to access latest Gemini 2.5 models directly
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI with API key
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  console.error("❌ No Google AI API key found. Please set GEMINI_API_KEY, GOOGLE_API_KEY, or GOOGLE_GENAI_API_KEY environment variable.");
}

const genAI = new GoogleGenerativeAI(apiKey!);

// Available Gemini 2.5 models
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

/**
 * Generate text using Gemini 2.5 models
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
      topK = 40,
      topP = 0.95
    } = options;

    console.log(`🤖 Generating text with ${model}...`);

    const geminiModel = genAI.getGenerativeModel({
      model,
      generationConfig: {
        temperature,
        maxOutputTokens,
        topK,
        topP,
      },
    });

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log(`✅ Text generated successfully with ${model}`);

    return {
      text,
      finishReason: response.candidates?.[0]?.finishReason,
      safetyRatings: response.candidates?.[0]?.safetyRatings,
    };

  } catch (error) {
    console.error(`❌ Error generating text with Gemini 2.5:`, error);
    throw new Error(`Gemini 2.5 text generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate image using Gemini 2.5 models (when image generation is available)
 */
export async function generateImage(
  prompt: string,
  options: Gemini25GenerateOptions = {}
): Promise<Gemini25ImageResponse> {
  try {
    const {
      model = GEMINI_2_5_MODELS.FLASH,
      temperature = 0.8,
      maxOutputTokens = 1024,
    } = options;

    console.log(`🎨 Generating image with ${model}...`);

    const geminiModel = genAI.getGenerativeModel({
      model,
      generationConfig: {
        temperature,
        maxOutputTokens,
      },
    });

    // For now, Gemini 2.5 doesn't have direct image generation
    // This is a placeholder for when it becomes available
    // We'll use text generation to create detailed design specifications
    const designPrompt = `Create a detailed visual design specification for: ${prompt}

Please provide:
1. Color palette (specific hex codes)
2. Layout composition details
3. Typography specifications
4. Visual elements and their positioning
5. Style and mood descriptors
6. Technical implementation details

Format as JSON for easy parsing.`;

    const result = await geminiModel.generateContent(designPrompt);
    const response = await result.response;
    const designSpecs = response.text();

    console.log(`✅ Design specifications generated with ${model}`);

    // Return design specifications as "image data" for now
    // This will be used to generate actual images via other services
    return {
      imageData: Buffer.from(designSpecs).toString('base64'),
      mimeType: 'application/json',
      finishReason: response.candidates?.[0]?.finishReason,
      safetyRatings: response.candidates?.[0]?.safetyRatings,
    };

  } catch (error) {
    console.error(`❌ Error generating image with Gemini 2.5:`, error);
    throw new Error(`Gemini 2.5 image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate multimodal content (text + image analysis)
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

    console.log(`🔍 Generating multimodal content with ${model}...`);

    const geminiModel = genAI.getGenerativeModel({
      model,
      generationConfig: {
        temperature,
        maxOutputTokens,
      },
    });

    let parts: any[] = [{ text: textPrompt }];

    // Add image if provided
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg', // Assume JPEG for now
          data: imageData
        }
      });
    }

    const result = await geminiModel.generateContent(parts);
    const response = await result.response;
    const text = response.text();

    console.log(`✅ Multimodal content generated with ${model}`);

    return {
      text,
      finishReason: response.candidates?.[0]?.finishReason,
      safetyRatings: response.candidates?.[0]?.safetyRatings,
    };

  } catch (error) {
    console.error(`❌ Error generating multimodal content with Gemini 2.5:`, error);
    throw new Error(`Gemini 2.5 multimodal generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test connection to Gemini 2.5 API
 */
export async function testConnection(): Promise<boolean> {
  try {
    console.log('🔌 Testing Gemini 2.5 API connection...');

    const response = await generateText('Hello, this is a test message. Please respond with "Connection successful!"', {
      model: GEMINI_2_5_MODELS.FLASH,
      maxOutputTokens: 50
    });

    const isSuccessful = response.text.toLowerCase().includes('connection successful') ||
      response.text.toLowerCase().includes('hello') ||
      response.text.length > 0;

    if (isSuccessful) {
      console.log('✅ Gemini 2.5 API connection successful!');
      return true;
    } else {
      console.warn('⚠️ Gemini 2.5 API responded but with unexpected content:', response.text);
      return false;
    }

  } catch (error) {
    console.error('❌ Gemini 2.5 API connection failed:', error);
    return false;
  }
}

/**
 * Get available models and their capabilities
 */
export function getAvailableModels() {
  return {
    models: GEMINI_2_5_MODELS,
    capabilities: {
      [GEMINI_2_5_MODELS.FLASH]: {
        description: 'Fast and efficient for most tasks',
        bestFor: ['content generation', 'design specifications', 'quick responses'],
        costEfficiency: 'high'
      },
      [GEMINI_2_5_MODELS.PRO]: {
        description: 'Most capable model for complex reasoning',
        bestFor: ['complex analysis', 'detailed design planning', 'sophisticated content'],
        costEfficiency: 'medium'
      },
      [GEMINI_2_5_MODELS.FLASH_LITE]: {
        description: 'Lightweight and cost-effective',
        bestFor: ['simple tasks', 'quick responses', 'high-volume requests'],
        costEfficiency: 'very high'
      }
    }
  };
}
