#!/usr/bin/env node

// Simple test to verify API key and make a direct API call
import { config } from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

config({ path: '.env.local' });

async function testRevo2DirectAPI() {
  console.log('🧪 Testing Revo 2.0 Direct API Call...\n');

  // Get API key
  const apiKey = process.env.GEMINI_API_KEY_REVO_2_0 || 
                 process.env.GEMINI_API_KEY || 
                 process.env.GOOGLE_API_KEY || 
                 process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey) {
    console.error('❌ No API key found');
    process.exit(1);
  }

  console.log('✅ API Key found:', apiKey.substring(0, 20) + '...');

  try {
    // Initialize Google AI
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ 
      model: 'gemini-2.5-flash-image-preview',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });

    console.log('🔧 Model initialized successfully');

    // Test simple generation
    console.log('\n🎨 Testing simple image generation...');
    
    const prompt = `Create a modern, professional social media post image for a restaurant. 
    The image should have:
    - A clean, modern design with a 1:1 aspect ratio
    - Text that says "Test Restaurant"
    - Use colors: primary #FF6B6B, secondary #4ECDC4
    - Modern typography
    - Professional restaurant aesthetic
    - High quality, readable text`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    console.log('📊 Response received');
    console.log('Candidates:', response.candidates?.length || 0);

    // Check for image data
    const parts = response.candidates?.[0]?.content?.parts || [];
    let hasImage = false;

    for (const part of parts) {
      if (part.inlineData) {
        hasImage = true;
        console.log('✅ Image data found!');
        console.log('MIME Type:', part.inlineData.mimeType);
        console.log('Data size:', part.inlineData.data?.length || 0, 'characters');
        break;
      }
    }

    if (!hasImage) {
      console.log('❌ No image data found in response');
      console.log('Response structure:', JSON.stringify(response, null, 2));
    } else {
      console.log('🎉 Revo 2.0 API test successful!');
    }

  } catch (error) {
    console.error('❌ API Error:', error.message);
    
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      console.error('🔑 This appears to be an API key authorization issue');
      console.error('Please verify:');
      console.error('1. The API key is valid and active');
      console.error('2. The API key has access to Gemini 2.5 Flash Image Preview');
      console.error('3. Billing is enabled for the Google Cloud project');
    }
    
    console.error('Full error:', error);
    process.exit(1);
  }
}

testRevo2DirectAPI();
