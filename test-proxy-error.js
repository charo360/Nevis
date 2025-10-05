/**
 * Test script to identify proxy server errors
 */

async function testProxyServer() {
  const baseUrl = 'http://localhost:8000';
  
  console.log('🔍 Testing proxy server endpoints...');
  
  try {
    // Test 1: Health check
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    console.log(`Health status: ${healthResponse.status}`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health data:', healthData);
    } else {
      console.log('Health check failed:', await healthResponse.text());
    }
    
    // Test 2: Credits endpoint
    console.log('\n2. Testing credits endpoint...');
    const creditsResponse = await fetch(`${baseUrl}/credits/test-user`);
    console.log(`Credits status: ${creditsResponse.status}`);
    if (creditsResponse.ok) {
      const creditsData = await creditsResponse.json();
      console.log('Credits data:', creditsData);
    } else {
      console.log('Credits check failed:', await creditsResponse.text());
    }
    
    // Test 3: Text generation
    console.log('\n3. Testing text generation...');
    const textResponse = await fetch(`${baseUrl}/generate-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Say hello world',
        user_id: 'test-user',
        model: 'gemini-2.5-flash',
        max_tokens: 100,
        temperature: 0.7
      })
    });
    
    console.log(`Text generation status: ${textResponse.status}`);
    if (textResponse.ok) {
      const textData = await textResponse.json();
      console.log('Text generation success:', textData);
    } else {
      const errorText = await textResponse.text();
      console.log('Text generation failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Proxy test failed:', error);
  }
}

// Run the test
testProxyServer();
