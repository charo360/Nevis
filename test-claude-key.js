/**
 * Test if ANTHROPIC_API_KEY is valid and working
 */

require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

async function testClaudeKey() {
  console.log('🔑 Testing ANTHROPIC_API_KEY...\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found in .env.local');
    console.log('\n💡 Please add ANTHROPIC_API_KEY to your .env.local file');
    return;
  }

  console.log(`✅ API Key found (length: ${apiKey.length})`);
  console.log(`🔑 Key preview: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}\n`);

  try {
    const anthropic = new Anthropic({ apiKey });

    console.log('📤 Testing API call to Claude...\n');

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Say "Hello, API key is working!" in one sentence.'
        }
      ]
    });

    console.log('✅ SUCCESS! Claude API is working!\n');
    console.log('📝 Response:', message.content[0].text);
    console.log('\n📊 Token usage:');
    console.log('   - Input tokens:', message.usage.input_tokens);
    console.log('   - Output tokens:', message.usage.output_tokens);
    console.log('\n🎉 Your ANTHROPIC_API_KEY is valid and working correctly!');

  } catch (error) {
    console.error('\n❌ FAILED! Claude API is NOT working!\n');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.status) {
      console.error('HTTP Status:', error.status);
    }
    
    if (error.error) {
      console.error('API Error:', JSON.stringify(error.error, null, 2));
    }

    console.log('\n💡 Possible issues:');
    console.log('   1. Invalid API key');
    console.log('   2. API key has no credits/quota');
    console.log('   3. Network/firewall blocking Anthropic API');
    console.log('   4. API key permissions issue');
  }
}

testClaudeKey();
