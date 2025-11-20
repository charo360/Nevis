/**
 * Direct test of Claude extractor to see detailed errors
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Simple test that doesn't require compilation
async function testDirectly() {
  console.log('🧪 Testing Claude directly...');
  
  // Mock the basic functionality
  const testUrl = 'https://zentechelectronics.com/';
  
  try {
    // Test basic fetch first
    console.log('📡 Testing website fetch...');
    const response = await fetch(testUrl);
    console.log(`✅ Website fetch: ${response.status} ${response.statusText}`);
    
    const html = await response.text();
    console.log(`📄 HTML length: ${html.length} characters`);
    
    // Test if we can reach Claude API
    console.log('🤖 Testing Claude API connection...');
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('❌ No ANTHROPIC_API_KEY found');
      return;
    }
    
    console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
    
    // Simple Claude test
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, I am Claude!" in JSON format: {"message": "your response"}'
          }
        ]
      })
    });
    
    console.log(`🤖 Claude API: ${claudeResponse.status} ${claudeResponse.statusText}`);
    
    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('❌ Claude API Error:', errorText);
      return;
    }
    
    const claudeResult = await claudeResponse.json();
    console.log('✅ Claude Response:', JSON.stringify(claudeResult, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

console.log('🚀 Starting Direct Claude Test');
testDirectly().catch(console.error);
