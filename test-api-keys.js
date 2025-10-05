const { GoogleGenerativeAI } = require('@google/generative-ai');

// Test all Google API keys
const keys = {
  'GEMINI_API_KEY': 'AIzaSyCp1jUev22wpoaFjlv0bjKN5NCZyIq7tkM',
  'GEMINI_API_KEY_REVO_1_0': 'AIzaSyAoNLkmCN1lfxjG7JkOT4GCIdOZQ5e1cSQ',
  'GEMINI_API_KEY_REVO_1_5': 'AIzaSyBqYKOgbYOQHPxMVFA09uCXgtiPzW9TQc0',
  'GEMINI_API_KEY_REVO_2_0': 'AIzaSyB8BgmkXyURWBru90xKRy5u-dUnT_vN1vE'
};

async function testKey(name, key) {
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Hello');
    const response = await result.response;
    console.log(`✅ ${name}: WORKING`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return false;
  }
}

async function testAll() {
  console.log('Testing Google API Keys...\n');
  
  for (const [name, key] of Object.entries(keys)) {
    await testKey(name, key);
  }
}

testAll();