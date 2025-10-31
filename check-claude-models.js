/**
 * Check available Claude models
 */

require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

async function checkAvailableModels() {
  console.log('🔍 Checking available Claude models...\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found');
    return;
  }

  const anthropic = new Anthropic({ apiKey });

  // Test different model versions
  const modelsToTest = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20241220', 
    'claude-3-5-sonnet-latest',
    'claude-3-5-sonnet',
    'claude-3-sonnet-20240229',
    'claude-3-opus-20240229',
    'claude-3-haiku-20240307'
  ];

  console.log('Testing models with simple requests...\n');

  for (const model of modelsToTest) {
    try {
      console.log(`🧪 Testing: ${model}`);
      
      const message = await anthropic.messages.create({
        model: model,
        max_tokens: 50,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: 'Say "Hello from Claude" and nothing else.'
          }
        ]
      });

      const response = message.content[0].text;
      console.log(`   ✅ Working: "${response}"`);
      console.log(`   📊 Tokens: ${message.usage.input_tokens + message.usage.output_tokens}`);
      
    } catch (error) {
      if (error.message.includes('not_found_error')) {
        console.log(`   ❌ Not available: Model not found`);
      } else if (error.message.includes('rate_limit')) {
        console.log(`   ⚠️  Rate limited (but model exists)`);
      } else {
        console.log(`   ❌ Error: ${error.message.substring(0, 100)}...`);
      }
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🎯 Recommendation: Use the first working model from the list above');
}

checkAvailableModels();
