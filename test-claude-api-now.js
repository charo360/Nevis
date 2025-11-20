/**
 * Test Claude API with current API key
 */

require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

async function testClaudeAPI() {
  console.log('🧪 Testing Claude API...\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found in .env.local');
    return;
  }

  console.log('✅ API Key found:', apiKey.substring(0, 20) + '...');
  console.log('');

  const anthropic = new Anthropic({ apiKey });

  // Test the model we're using
  const modelToTest = 'claude-3-5-sonnet-20241022';

  try {
    console.log(`🤖 Testing model: ${modelToTest}`);
    console.log('📤 Sending test request...\n');

    const message = await anthropic.messages.create({
      model: modelToTest,
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Say "Hello, I am working!" in exactly 5 words.'
        }
      ]
    });

    console.log('✅ SUCCESS! Claude API is working!\n');
    console.log('📝 Response:', message.content[0].text);
    console.log('');
    console.log('📊 Token usage:');
    console.log('   - Input tokens:', message.usage.input_tokens);
    console.log('   - Output tokens:', message.usage.output_tokens);
    console.log('   - Total tokens:', message.usage.input_tokens + message.usage.output_tokens);
    console.log('');
    console.log('🎯 Model used:', message.model);
    console.log('🆔 Message ID:', message.id);
    console.log('');
    console.log('✅ Claude API is fully functional!');

  } catch (error) {
    console.error('❌ FAILED! Claude API is NOT working!\n');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.status) {
      console.error('HTTP Status:', error.status);
    }
    
    if (error.error) {
      console.error('API Error:', JSON.stringify(error.error, null, 2));
    }

    console.log('\n🔍 Troubleshooting:');
    console.log('1. Check if API key is valid');
    console.log('2. Check if you have credits in your Anthropic account');
    console.log('3. Check if the model name is correct');
    console.log('4. Check your internet connection');
  }
}

testClaudeAPI();

