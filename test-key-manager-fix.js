
require('dotenv').config({ path: '.env.local' }); // Load env for context, though manager should force load
const { OpenAIKeyManager } = require('./src/lib/services/openai-key-manager');

// Mock process.cwd if needed, but node runs in root so it should be fine.

async function testKeyManager() {
  console.log('Testing OpenAIKeyManager fix...');
  
  // Initialize manager
  const manager = new OpenAIKeyManager();
  
  // Get client
  const client = manager.createClient();
  const key = client.apiKey;
  
  console.log('Manager selected key ending in:', key.slice(-5));
  
  if (key.endsWith('jkCAA')) {
      console.log('✅ PASS: Manager selected the correct key from .env.local');
  } else {
      console.log('❌ FAIL: Manager selected the wrong key');
  }

  // Try a call
  try {
      console.log('Attempting API call with selected key...');
      const models = await client.models.list();
      console.log('✅ API Call Successful! Models found:', models.data.length);
  } catch (err) {
      console.error('❌ API Call Failed:', err.message);
  }
}

testKeyManager();
