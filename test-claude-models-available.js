/**
 * Test which Claude models are currently available
 */

require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

async function testClaudeModels() {
  console.log('🔍 Testing Available Claude Models...\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found');
    return;
  }

  const anthropic = new Anthropic({ apiKey });

  // Test all possible current Claude models
  const modelsToTest = [
    // Latest Claude 3.5 Sonnet
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-latest',
    'claude-3-5-sonnet',
    
    // Newer Claude 3.5 Sonnet (if exists)
    'claude-3-5-sonnet-20250101',
    'claude-3-5-sonnet-20241220',
    
    // Claude 3 Opus
    'claude-3-opus-20240229',
    'claude-3-opus-latest',
    
    // Claude 3 Haiku
    'claude-3-haiku-20240307',
    'claude-3-haiku-latest',
    
    // Claude 3 Sonnet (older)
    'claude-3-sonnet-20240229',
  ];

  console.log(`Testing ${modelsToTest.length} models...\n`);

  const workingModels = [];
  const failedModels = [];

  for (const model of modelsToTest) {
    try {
      console.log(`🧪 Testing: ${model}...`);
      
      const message = await anthropic.messages.create({
        model: model,
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: 'Say "OK" in one word.'
          }
        ]
      });

      console.log(`   ✅ WORKS! Response: "${message.content[0].text}"`);
      console.log(`   📊 Tokens: ${message.usage.input_tokens + message.usage.output_tokens}`);
      workingModels.push({
        model,
        actualModel: message.model,
        response: message.content[0].text
      });
      console.log('');

    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message.substring(0, 100)}`);
      failedModels.push({ model, error: error.message });
      console.log('');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('='.repeat(60) + '\n');

  if (workingModels.length > 0) {
    console.log(`✅ WORKING MODELS (${workingModels.length}):\n`);
    workingModels.forEach(({ model, actualModel, response }) => {
      console.log(`   🟢 ${model}`);
      console.log(`      Actual: ${actualModel}`);
      console.log(`      Test response: "${response}"`);
      console.log('');
    });
  }

  if (failedModels.length > 0) {
    console.log(`❌ FAILED MODELS (${failedModels.length}):\n`);
    failedModels.forEach(({ model, error }) => {
      console.log(`   🔴 ${model}`);
      console.log(`      Error: ${error.substring(0, 80)}`);
      console.log('');
    });
  }

  if (workingModels.length > 0) {
    console.log('='.repeat(60));
    console.log('🎯 RECOMMENDED MODEL TO USE:');
    console.log('='.repeat(60));
    console.log(`\n   ${workingModels[0].model}\n`);
    console.log('Update your code to use this model name.');
  } else {
    console.log('⚠️ No working models found! Check your API key and account status.');
  }
}

testClaudeModels();

