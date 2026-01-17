
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

async function testSpecificKey() {
  console.log('Testing Key from .env.local directly...');
  
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Simple regex to extract OPENAI_API_KEY
    const match = envContent.match(/OPENAI_API_KEY=([^\s#]+)/);
    
    if (!match) {
      console.error('❌ Could not find OPENAI_API_KEY in .env.local');
      return;
    }
    
    const apiKey = match[1].trim();
    console.log('Found key in file:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5));
    
    const openai = new OpenAI({ apiKey });

    console.log('Listing models with file key...');
    const models = await openai.models.list();
    console.log('✅ Success! The key in .env.local IS VALID. Models available:', models.data.length);
    
  } catch (error) {
    console.error('❌ Error testing file key:', error.message);
  }
}

testSpecificKey();
