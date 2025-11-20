/**
 * Test if the Claude model name is correct
 */

require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

async function testClaudeModel() {
  console.log('🧪 Testing Claude model: claude-haiku-4-5-20251001\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const anthropic = new Anthropic({ apiKey });

  try {
    console.log('📤 Calling Claude with model: claude-haiku-4-5-20251001...\n');

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'What model are you?'
        }
      ]
    });

    console.log('✅ SUCCESS! Model is valid!\n');
    console.log('📝 Response:', message.content[0].text);
    console.log('\n📊 Model info:');
    console.log('   - Model:', message.model);
    console.log('   - Stop reason:', message.stop_reason);

  } catch (error) {
    console.error('\n❌ FAILED! Model name might be incorrect!\n');
    console.error('Error:', error.message);
    
    if (error.status === 400) {
      console.log('\n💡 The model name "claude-haiku-4-5-20251001" might be invalid.');
      console.log('   Trying alternative model names...\n');
      
      const modelsToTry = [
        'claude-3-5-haiku-20241022',
        'claude-3-haiku-20240307',
        'claude-3-5-sonnet-20241022'
      ];
      
      for (const model of modelsToTry) {
        try {
          console.log(`   Testing: ${model}...`);
          const testMessage = await anthropic.messages.create({
            model: model,
            max_tokens: 50,
            messages: [{ role: 'user', content: 'Hi' }]
          });
          console.log(`   ✅ ${model} WORKS!`);
          console.log(`   📝 Response: ${testMessage.content[0].text}\n`);
        } catch (e) {
          console.log(`   ❌ ${model} failed: ${e.message}`);
        }
      }
    }
  }
}

testClaudeModel();
