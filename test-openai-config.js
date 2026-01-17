// Test OpenAI Configuration
require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

async function testOpenAIConfig() {
  console.log('🔍 Testing OpenAI Configuration...\n');

  // Check if API key exists
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not found in .env.local');
    return;
  }

  console.log('✅ API Key found:', apiKey.substring(0, 20) + '...' + apiKey.substring(apiKey.length - 4));

  // Test API key validity
  try {
    const openai = new OpenAI({ apiKey });
    
    console.log('\n🧪 Testing API key validity...');
    const models = await openai.models.list();
    console.log('✅ API key is valid! Available models:', models.data.length);

    // Test GPT-4 access
    console.log('\n🧪 Testing GPT-4 access...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Say "OpenAI is working!"' }],
      max_tokens: 20
    });
    console.log('✅ GPT-4 Response:', completion.choices[0].message.content);

    // Check for assistants
    console.log('\n🧪 Checking for assistants...');
    const assistants = await openai.beta.assistants.list();
    console.log('✅ Found', assistants.data.length, 'assistants');
    
    if (assistants.data.length > 0) {
      console.log('\nAssistants:');
      assistants.data.forEach(assistant => {
        console.log(`  - ${assistant.name} (${assistant.id})`);
      });
    } else {
      console.log('⚠️  No assistants found. You may need to create them.');
    }

    console.log('\n✅ OpenAI configuration is working correctly!');
    
  } catch (error) {
    console.error('\n❌ Error testing OpenAI:', error.message);
    if (error.status === 401) {
      console.error('   API key is invalid or expired');
    } else if (error.status === 429) {
      console.error('   Rate limit exceeded or quota exhausted');
    }
  }
}

testOpenAIConfig();
