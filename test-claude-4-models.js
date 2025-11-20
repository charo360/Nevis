/**
 * Test Claude 4 models (Haiku, Sonnet, Opus)
 */

require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

async function testClaude4Models() {
  console.log('🔍 Testing Claude 4 Models...\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found');
    return;
  }

  const anthropic = new Anthropic({ apiKey });

  // Test Claude 4 models
  const modelsToTest = [
    // Claude 4.5 models (newest)
    'claude-sonnet-4-5-20250929',
    'claude-haiku-4-5-20251001',
    'claude-opus-4-1-20250805',
    
    // Alternative naming
    'claude-4-5-sonnet',
    'claude-4-5-haiku',
    'claude-4-1-opus',
    
    // With dashes
    'claude-4.5-sonnet',
    'claude-4.5-haiku',
    'claude-4.1-opus',
  ];

  console.log(`Testing ${modelsToTest.length} Claude 4 models...\n`);

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
            content: 'Say "Working" in one word.'
          }
        ]
      });

      console.log(`   ✅ WORKS! Response: "${message.content[0].text}"`);
      console.log(`   📊 Tokens: ${message.usage.input_tokens + message.usage.output_tokens}`);
      console.log(`   🎯 Actual model: ${message.model}`);
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
    console.log(`✅ WORKING CLAUDE 4 MODELS (${workingModels.length}):\n`);
    workingModels.forEach(({ model, actualModel, response }) => {
      console.log(`   🟢 ${model}`);
      console.log(`      Actual: ${actualModel}`);
      console.log(`      Test response: "${response}"`);
      console.log('');
    });
    
    console.log('='.repeat(60));
    console.log('🎯 RECOMMENDED MODEL TO USE:');
    console.log('='.repeat(60));
    console.log(`\n   ${workingModels[0].model}\n`);
    console.log('This is the latest working Claude 4 model.');
  } else {
    console.log('❌ No Claude 4 models available with this API key.');
    console.log('Your account may not have access to Claude 4 models yet.');
    console.log('\nFalling back to Claude 3 models...');
  }
}

testClaude4Models();

