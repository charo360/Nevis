const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY not found in environment variables');
  process.exit(1);
}

const ai = new GoogleGenerativeAI(apiKey);

const testModels = [
  'gemini-2.0-flash-exp-image-generation',
  'gemini-2.5-flash-image-preview',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
];

async function testImageGeneration(modelName) {
  try {
    console.log(`\n🧪 Testing ${modelName} for image generation...`);
    
    const model = ai.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });

    const prompt = 'Create a simple, professional social media design with the text "TEST" on a clean white background with a blue accent.';
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    const parts = response.candidates?.[0]?.content?.parts || [];
    
    console.log(`📊 ${modelName} Response Analysis:`, {
      hasCandidates: !!response.candidates,
      candidatesLength: response.candidates?.length || 0,
      partsLength: parts.length,
      partsTypes: parts.map(p => Object.keys(p))
    });
    
    let hasImage = false;
    let hasText = false;
    
    for (const part of parts) {
      if (part.inlineData) {
        hasImage = true;
        console.log(`✅ ${modelName}: Found IMAGE data (${part.inlineData.data.length} chars, ${part.inlineData.mimeType})`);
      }
      if (part.text) {
        hasText = true;
        console.log(`📝 ${modelName}: Found TEXT data (${part.text.substring(0, 100)}...)`);
      }
    }
    
    if (hasImage) {
      console.log(`🎯 ${modelName}: ✅ WORKS FOR IMAGE GENERATION`);
      return true;
    } else if (hasText) {
      console.log(`❌ ${modelName}: Returns TEXT instead of images`);
      return false;
    } else {
      console.log(`❌ ${modelName}: Returns no usable content`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ ${modelName}: ERROR - ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing Gemini models for image generation capabilities...\n');
  
  const results = {};
  
  for (const model of testModels) {
    results[model] = await testImageGeneration(model);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
  
  console.log('\n📋 SUMMARY:');
  console.log('='.repeat(50));
  
  let workingModels = [];
  let failedModels = [];
  
  for (const [model, works] of Object.entries(results)) {
    if (works) {
      console.log(`✅ ${model} - WORKS for image generation`);
      workingModels.push(model);
    } else {
      console.log(`❌ ${model} - Does NOT work for image generation`);
      failedModels.push(model);
    }
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  if (workingModels.length > 0) {
    console.log(`✅ Use these models for image generation: ${workingModels.join(', ')}`);
  } else {
    console.log('❌ No working image generation models found');
  }
  
  console.log('\n🔄 Next steps:');
  if (workingModels.length > 0) {
    console.log(`1. Update Revo services to use: ${workingModels[0]}`);
    console.log('2. Test logo integration with working model');
    console.log('3. Verify end-to-end functionality');
  } else {
    console.log('1. Check Gemini API documentation for image generation models');
    console.log('2. Consider alternative image generation approaches');
  }
}

runTests().catch(console.error);