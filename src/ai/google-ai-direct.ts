/**
 * Direct Google AI API Service for Gemini 2.5
 * Bypasses Genkit to access latest Gemini 2.5 models directly
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI with API key - Use Revo 1.5 specific key
const apiKey = process.env.GEMINI_API_KEY_REVO_1_5 || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  console.error('❌ [Google AI Direct] No API key found. Please set GEMINI_API_KEY_REVO_1_5 or GEMINI_API_KEY environment variable.');
  throw new Error('Google AI API key is required for Revo 1.5');
}

const genAI = new GoogleGenerativeAI(apiKey!);

// Available Gemini 2.5 models
export const GEMINI_2_5_MODELS = {
  FLASH: 'gemini-2.5-flash',
  PRO: 'gemini-2.5-pro',
  FLASH_LITE: 'gemini-2.5-flash-lite',
  FLASH_IMAGE_PREVIEW: 'gemini-2.0-flash-exp-image-generation'
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

    console.log(`🔍 [Google AI Direct] Generating text with model: ${model}`);
    console.log(`🔍 [Google AI Direct] API Key available: ${!!apiKey}`);
    console.log(`🔍 [Google AI Direct] API Key prefix: ${apiKey?.substring(0, 10)}...`);

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

    console.log(`✅ [Google AI Direct] Text generation successful, length: ${text.length}`);
    console.log(`🔍 [Google AI Direct] Response preview: ${text.substring(0, 200)}...`);
    console.log(`🔍 [Google AI Direct] Finish reason: ${response.candidates?.[0]?.finishReason}`);
    console.log(`🔍 [Google AI Direct] Safety ratings:`, response.candidates?.[0]?.safetyRatings);

    return {
      text,
      finishReason: response.candidates?.[0]?.finishReason,
      safetyRatings: response.candidates?.[0]?.safetyRatings,
    };

  } catch (error) {
    console.error(`❌ [Google AI Direct] Text generation error:`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      model: options.model || GEMINI_2_5_MODELS.FLASH
    });
    
    // Handle specific error types with user-friendly messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests')) {
      throw new Error('😅 Revo is experiencing high demand right now! Please try again in a few minutes or switch to Revo 2.0.');
    }
    
    if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('API key')) {
      throw new Error('🔧 Revo is having a technical hiccup. Please try Revo 2.0 while we fix this!');
    }
    
    if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
      throw new Error('🔧 Revo is having a technical hiccup. Please try Revo 2.0 while we fix this!');
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('ECONNRESET')) {
      throw new Error('🌐 Connection hiccup! Please try again in a moment.');
    }
    
    throw new Error('😅 Revo is having some trouble right now! Try Revo 2.0 for great results while we get things sorted out.');
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


    // Return design specifications as "image data" for now
    // This will be used to generate actual images via other services
    return {
      imageData: Buffer.from(designSpecs).toString('base64'),
      mimeType: 'application/json',
      finishReason: response.candidates?.[0]?.finishReason,
      safetyRatings: response.candidates?.[0]?.safetyRatings,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests')) {
      throw new Error('😅 Revo is experiencing high demand right now! Please try again in a few minutes or switch to Revo 2.0.');
    }
    
    throw new Error('😅 Revo is having some trouble right now! Try Revo 2.0 for great results while we get things sorted out.');
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


    return {
      text,
      finishReason: response.candidates?.[0]?.finishReason,
      safetyRatings: response.candidates?.[0]?.safetyRatings,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests')) {
      throw new Error('😅 Revo is experiencing high demand right now! Please try again in a few minutes or switch to Revo 2.0.');
    }
    
    throw new Error('😅 Revo is having some trouble right now! Try Revo 2.0 for great results while we get things sorted out.');
  }
}

/**
 * Test connection to Gemini 2.5 API
 */
export async function testConnection(): Promise<boolean> {
  try {

    const response = await generateText('Hello, this is a test message. Please respond with "Connection successful!"', {
      model: GEMINI_2_5_MODELS.FLASH,
      maxOutputTokens: 50
    });

    const isSuccessful = response.text.toLowerCase().includes('connection successful') ||
      response.text.toLowerCase().includes('hello') ||
      response.text.length > 0;

    if (isSuccessful) {
      return true;
    } else {
      return false;
    }

  } catch (error) {
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
        description: 'Most capable but expensive - AVOID for cost efficiency',
        bestFor: ['complex analysis', 'detailed design planning', 'sophisticated content'],
        costEfficiency: 'LOW - USE FLASH INSTEAD'
      },
      [GEMINI_2_5_MODELS.FLASH_LITE]: {
        description: 'Lightweight and cost-effective',
        bestFor: ['simple tasks', 'quick responses', 'high-volume requests'],
        costEfficiency: 'very high'
      }
    }
  };
}
