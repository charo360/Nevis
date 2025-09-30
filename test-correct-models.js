const { GoogleGenerativeAI } = require('@google/generative-ai');

const keys = {
  'REVO_1_0': { key: 'AIzaSyAoNLkmCN1lfxjG7JkOT4GCIdOZQ5e1cSQ', model: 'gemini-2.5-flash-image-preview' },
  'REVO_1_5': { key: 'AIzaSyBqYKOgbYOQHPxMVFA09uCXgtiPzW9TQc0', model: 'gemini-2.5-flash-image-preview' },
  'REVO_2_0': { key: 'AIzaSyB8BgmkXyURWBru90xKRy5u-dUnT_vN1vE', model: 'gemini-2.0-flash-exp-image-generation' }
};

async function testKey(name, keyData) {
  try {
    const genAI = new GoogleGenerativeAI(keyData.key);
    const model = genAI.getGenerativeModel({ model: keyData.model });
    const result = await model.generateContent('Test');
    console.log(`✅ ${name}: WORKING`);
  } catch (error) {
    console.log(`❌ ${name}: ${error.message.split('\n')[0]}`);
  }
}

async function testAll() {
  for (const [name, keyData] of Object.entries(keys)) {
    await testKey(name, keyData);
  }
}

testAll();