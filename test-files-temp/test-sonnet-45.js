// Simple test for Claude Sonnet 4.5
const https = require('https');

async function testClaudeSonnet45() {
  console.log('🧪 Testing Claude Sonnet 4.5 directly with Anthropic API...\n');
  
  // Check if API key exists
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('❌ ANTHROPIC_API_KEY not found in environment');
    console.log('💡 Make sure to set your API key in .env.local');
    return false;
  }
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log(`🔑 API Key found: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  
  const testPayload = {
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 100,
    temperature: 0.9,
    messages: [
      {
        role: 'user',
        content: 'Generate a creative 5-word headline for a Kenyan fintech company called Paya that offers Buy Now Pay Later services.'
      }
    ]
  };
  
  return new Promise((resolve) => {
    const postData = JSON.stringify(testPayload);
    
    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    console.log('🚀 Making API request to Anthropic...');
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ SUCCESS! Claude Sonnet 4.5 is working!');
            console.log(`📝 Response: "${response.content[0].text}"`);
            console.log(`📊 Tokens used: ${response.usage.input_tokens + response.usage.output_tokens} (${response.usage.input_tokens} input + ${response.usage.output_tokens} output)`);
            console.log(`🎯 Model: ${response.model}`);
            resolve(true);
          } else {
            console.log('❌ FAILED! Claude Sonnet 4.5 is NOT working!');
            console.log(`💥 Status: ${res.statusCode}`);
            console.log(`💥 Error: ${JSON.stringify(response, null, 2)}`);
            
            // Check if it's a model not found error
            if (response.error && response.error.message.includes('model')) {
              console.log('\n🚨 MODEL NOT FOUND! The model name is incorrect.');
              console.log('💡 Trying claude-3-5-sonnet-20241022 as fallback...');
              
              // Test fallback
              testFallbackModel().then(resolve);
            } else {
              resolve(false);
            }
          }
        } catch (parseError) {
          console.log('❌ Failed to parse response:', parseError.message);
          console.log('📄 Raw response:', data);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Request failed:', error.message);
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

async function testFallbackModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  const testPayload = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 100,
    temperature: 0.9,
    messages: [
      {
        role: 'user',
        content: 'Generate a creative 5-word headline for a Kenyan fintech company.'
      }
    ]
  };
  
  return new Promise((resolve) => {
    const postData = JSON.stringify(testPayload);
    
    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ FALLBACK SUCCESS! Claude 3.5 Sonnet works!');
            console.log(`📝 Response: "${response.content[0].text}"`);
            console.log(`🎯 Model: ${response.model}`);
            resolve(true);
          } else {
            console.log('❌ FALLBACK FAILED too!');
            console.log(`💥 Error: ${JSON.stringify(response, null, 2)}`);
            resolve(false);
          }
        } catch (parseError) {
          console.log('❌ Fallback parse error:', parseError.message);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Fallback request failed:', error.message);
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

testClaudeSonnet45().then(success => {
  if (success) {
    console.log('\n🎉 Claude model testing completed successfully!');
  } else {
    console.log('\n💥 Claude model testing failed!');
    console.log('🔧 You need to fix the model configuration in Revo 2.0');
  }
}).catch(console.error);
