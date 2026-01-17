
require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

async function testOpenAI() {
  console.log('Testing OpenAI Connection...');
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No OPENAI_API_KEY found in .env.local');
    return;
  }
  
  console.log('Key found:', apiKey.substring(0, 10) + '...');
  
  const openai = new OpenAI({ apiKey });

  try {
    console.log('Listing models...');
    const models = await openai.models.list();
    console.log('✅ OpenAI Connection Success. Models available:', models.data.length);
    
    // Check specific assistant if possible
    const retailAssistantId = process.env.OPENAI_ASSISTANT_RETAIL;
    if (retailAssistantId) {
        console.log(`Checking Retail Assistant (${retailAssistantId})...`);
        const assistant = await openai.beta.assistants.retrieve(retailAssistantId);
        console.log('✅ Assistant retrieved:', assistant.name);
    } else {
        console.log('⚠️ No OPENAI_ASSISTANT_RETAIL id found.');
    }

  } catch (error) {
    console.error('❌ OpenAI Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testOpenAI();
