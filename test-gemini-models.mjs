#!/usr/bin/env node

import { config } from 'dotenv';

config({ path: '.env.local' });

async function testGeminiModels() {
  console.log('🧪 Testing Available Gemini Models...');
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment');
    return;
  }
  
  console.log('✅ API Key found:', apiKey.substring(0, 20) + '...');
  
  try {
    // List available models
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    console.log('📡 Models list response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('📋 Available Models:');
    
    data.models?.forEach(model => {
      console.log(`  - ${model.name} (${model.displayName})`);
      console.log(`    Supported methods: ${model.supportedGenerationMethods?.join(', ')}`);
      console.log(`    Input token limit: ${model.inputTokenLimit}`);
      console.log(`    Output token limit: ${model.outputTokenLimit}`);
      console.log('    ---');
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGeminiModels();