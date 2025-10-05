/**
 * Test script with correct model for free tier
 */

async function testProxyWithCorrectModel() {
  const baseUrl = 'http://localhost:8000';
  
  console.log('🔍 Testing proxy server with correct model...');
  
  try {
    // Test with gemini-2.5-flash-lite (allowed for free tier)
    console.log('\n1. Testing text generation with gemini-2.5-flash-lite...');
    const textResponse = await fetch(`${baseUrl}/generate-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Say hello world',
        user_id: 'test-user',
        model: 'gemini-2.5-flash-lite',
        max_tokens: 100,
        temperature: 0.7
      })
    });
    
    console.log(`Text generation status: ${textResponse.status}`);
    if (textResponse.ok) {
      const textData = await textResponse.json();
      console.log('✅ Text generation success:', textData);
    } else {
      const errorText = await textResponse.text();
      console.log('❌ Text generation failed:', errorText);
    }
    
    // Test image generation (should fail for free tier)
    console.log('\n2. Testing image generation...');
    const imageResponse = await fetch(`${baseUrl}/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'A simple test image',
        user_id: 'test-user',
        model: 'gemini-2.5-flash-image-preview',
        max_tokens: 100,
        temperature: 0.7
      })
    });
    
    console.log(`Image generation status: ${imageResponse.status}`);
    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      console.log('✅ Image generation success:', imageData);
    } else {
      const errorText = await imageResponse.text();
      console.log('❌ Image generation failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Proxy test failed:', error);
  }
}

// Run the test
testProxyWithCorrectModel();
