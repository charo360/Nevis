/**
 * Test OpenRouter Client Directly
 */

async function testOpenRouterDirect() {
  console.log('🌐 Testing OpenRouter Client Directly...');
  
  try {
    // Test the OpenRouter API directly
    const apiKey = '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';
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nevis-ai.com',
        'X-Title': 'Nevis AI - Test'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'user',
            content: 'Test connection - respond with "OpenRouter working"'
          }
        ],
        temperature: 0.3,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ OpenRouter API Error:', response.status, errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ OpenRouter API Response:', data.choices[0].message.content);
    return true;
    
  } catch (error) {
    console.log('❌ OpenRouter Test Error:', error.message);
    return false;
  }
}

async function testWebsiteAnalysisEndpoint() {
  console.log('\n🔍 Testing Website Analysis Endpoint...');
  
  try {
    const response = await fetch('http://localhost:3001/api/analyze-brand', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        websiteUrl: 'https://example.com',
        designImageUris: []
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Website Analysis Error:', response.status, errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ Website Analysis Success:', data.success);
    if (data.success) {
      console.log('   Business Name:', data.data.businessName);
      console.log('   Business Type:', data.data.businessType);
    }
    return data.success;
    
  } catch (error) {
    console.log('❌ Website Analysis Test Error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing OpenRouter Integration');
  console.log('=' .repeat(40));
  
  const directTest = await testOpenRouterDirect();
  const endpointTest = await testWebsiteAnalysisEndpoint();
  
  console.log('\n📊 Results:');
  console.log(`Direct OpenRouter API: ${directTest ? '✅ Working' : '❌ Failed'}`);
  console.log(`Website Analysis Endpoint: ${endpointTest ? '✅ Working' : '❌ Failed'}`);
  
  if (directTest && endpointTest) {
    console.log('\n🎉 OpenRouter integration is working perfectly!');
  } else if (directTest && !endpointTest) {
    console.log('\n⚠️  OpenRouter API works, but endpoint needs debugging');
  } else {
    console.log('\n❌ OpenRouter integration needs configuration');
  }
}

runTests().catch(console.error);
