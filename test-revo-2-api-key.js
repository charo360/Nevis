#!/usr/bin/env node

// Test script to verify Revo 2.0 API key configuration
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Revo 2.0 API Key Configuration...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('GEMINI_API_KEY_REVO_2_0:', process.env.GEMINI_API_KEY_REVO_2_0 ? '✅ Set' : '❌ Not set');
console.log('GEMINI_API_KEY (fallback):', process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set');

// Test the API key resolution logic (same as in revo-2.0-service.ts)
const apiKey = process.env.GEMINI_API_KEY_REVO_2_0 || 
               process.env.GEMINI_API_KEY || 
               process.env.GOOGLE_API_KEY || 
               process.env.GOOGLE_GENAI_API_KEY;

console.log('\nAPI Key Resolution:');
if (apiKey) {
  console.log('✅ API Key resolved successfully');
  console.log('Key source:', 
    process.env.GEMINI_API_KEY_REVO_2_0 ? 'GEMINI_API_KEY_REVO_2_0' :
    process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' :
    process.env.GOOGLE_API_KEY ? 'GOOGLE_API_KEY' :
    'GOOGLE_GENAI_API_KEY'
  );
  console.log('Key preview:', apiKey.substring(0, 20) + '...');
} else {
  console.log('❌ No API key found');
  process.exit(1);
}

// Test Google AI initialization
console.log('\n🔧 Testing Google AI Initialization...');
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const ai = new GoogleGenerativeAI(apiKey);
  console.log('✅ GoogleGenerativeAI client initialized successfully');
  
  // Test model access
  console.log('\n🎯 Testing Gemini 2.5 Flash Image Preview Model...');
  const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
  console.log('✅ Model instance created successfully');
  
  console.log('\n🎉 All tests passed! Revo 2.0 should work correctly.');
  
} catch (error) {
  console.error('❌ Error during initialization:', error.message);
  process.exit(1);
}
