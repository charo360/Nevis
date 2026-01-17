// Test New OpenAI API Key
const OpenAI = require('openai');
const fs = require('fs');

async function testNewKey() {
  console.log('🔍 Testing New OpenAI API Key...\n');

  // Read .env.local directly
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const keyMatch = envContent.match(/^OPENAI_API_KEY=(.+)$/m);
  
  if (!keyMatch) {
    console.error('❌ OPENAI_API_KEY not found in .env.local');
    return;
  }

  const apiKey = keyMatch[1].trim();
  console.log('✅ API Key found:', apiKey.substring(0, 20) + '...' + apiKey.substring(apiKey.length - 4));

  // Test API key validity
  try {
    const openai = new OpenAI({ apiKey });
    
    console.log('\n🧪 Testing API key validity...');
    const models = await openai.models.list();
    console.log('✅ API key is VALID! Available models:', models.data.length);

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
      console.log('\n📋 Your Assistants:');
      assistants.data.forEach(assistant => {
        console.log(`  - ${assistant.name} (${assistant.id})`);
      });
    } else {
      console.log('\n⚠️  No assistants found. You need to create them.');
      console.log('   Run: npm run create-assistants');
    }

    console.log('\n✅ OpenAI configuration is working correctly!');
    console.log('✅ You can now use AI-powered features in the app!');
    
  } catch (error) {
    console.error('\n❌ Error testing OpenAI:', error.message);
    if (error.status === 401) {
      console.error('   ❌ API key is invalid or expired');
      console.error('   Please get a new key from: https://platform.openai.com/api-keys');
    } else if (error.status === 429) {
      console.error('   ❌ Rate limit exceeded or quota exhausted');
      console.error('   Check your OpenAI billing: https://platform.openai.com/account/billing');
    } else if (error.status === 403) {
      console.error('   ❌ Access forbidden - check your API key permissions');
    }
  }
}

testNewKey();
