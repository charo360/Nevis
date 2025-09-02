/**
 * Test different Gemini model names to find the correct one
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
}

const genAI = new GoogleGenerativeAI(apiKey!);

// Possible model names for Gemini 2.5 Flash Image
const POSSIBLE_MODEL_NAMES = [
  'gemini-2.5-flash-image-preview',
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-exp',
  'gemini-2.5-flash-experimental',
  'gemini-2.5-flash-thinking-exp',
  'gemini-2.5-flash-thinking-exp-01-21',
  'gemini-2.5-flash-002',
  'gemini-2.5-flash-001',
  'gemini-2.5-flash',
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash-thinking-exp-1219',
  'gemini-exp-1206',
  'gemini-exp-1121'
];

/**
 * Test which Gemini models are available
 */
export async function testAvailableGeminiModels(): Promise<string[]> {
  const availableModels: string[] = [];

  for (const modelName of POSSIBLE_MODEL_NAMES) {
    try {
      
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // Try a simple text generation first
      const result = await model.generateContent(['Test message']);
      const response = await result.response;
      
      if (response && response.text) {
        availableModels.push(modelName);
        
        // Test if it supports image generation
        try {
          const imageResult = await model.generateContent(['Create a simple test image']);
          const imageResponse = await imageResult.response;
          
          const hasImage = imageResponse.candidates?.[0]?.content?.parts?.some(part => part.inlineData);
          if (hasImage) {
          }
        } catch (imageError) {
        }
      }
      
    } catch (error) {
    }
  }

  
  return availableModels;
}

/**
 * Test specific model for image generation
 */
export async function testModelImageGeneration(modelName: string): Promise<boolean> {
  try {
    
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const result = await model.generateContent([
      'Create a simple test image with the text "Hello World" on a blue background'
    ]);
    
    const response = await result.response;
    const hasImage = response.candidates?.[0]?.content?.parts?.some(part => part.inlineData);
    
    if (hasImage) {
      return true;
    } else {
      return false;
    }
    
  } catch (error) {
    return false;
  }
}

/**
 * Find the best model for Revo 2.0
 */
export async function findBestRevo20Model(): Promise<string | null> {
  
  const availableModels = await testAvailableGeminiModels();
  
  // Priority order for Revo 2.0
  const priorityOrder = [
    'gemini-2.5-flash-image-preview',
    'gemini-2.5-flash-image',
    'gemini-2.5-flash-exp',
    'gemini-2.5-flash-experimental',
    'gemini-2.5-flash-thinking-exp',
    'gemini-2.5-flash-thinking-exp-01-21',
    'gemini-2.5-flash-002',
    'gemini-2.5-flash-001',
    'gemini-2.5-flash'
  ];
  
  for (const modelName of priorityOrder) {
    if (availableModels.includes(modelName)) {
      // Test if it supports image generation
      const supportsImages = await testModelImageGeneration(modelName);
      if (supportsImages) {
        return modelName;
      }
    }
  }
  
  // Fallback to any available model
  for (const modelName of availableModels) {
    const supportsImages = await testModelImageGeneration(modelName);
    if (supportsImages) {
      return modelName;
    }
  }
  
  return null;
}

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).testAvailableGeminiModels = testAvailableGeminiModels;
  (window as any).testModelImageGeneration = testModelImageGeneration;
  (window as any).findBestRevo20Model = findBestRevo20Model;
  
}
