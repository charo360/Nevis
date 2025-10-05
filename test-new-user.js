/**
 * Test with a new user to verify updated default credits and model access
 */

async function testNewUser() {
  const baseUrl = 'http://localhost:8000';
  const newUserId = 'new-user-' + Date.now();
  
  console.log(`🔍 Testing with new user: ${newUserId}`);
  
  try {
    // Check credits for new user (should get default 100 credits)
    console.log('\n1. Checking credits for new user...');
    const creditsResponse = await fetch(`${baseUrl}/credits/${newUserId}`);
    console.log(`Credits status: ${creditsResponse.status}`);
    if (creditsResponse.ok) {
      const creditsData = await creditsResponse.json();
      console.log('New user credits:', creditsData);
    } else {
      console.log('Credits check failed:', await creditsResponse.text());
    }
    
    // Test text generation with gemini-2.5-flash (should work now)
    console.log('\n2. Testing text generation with gemini-2.5-flash...');
    const textResponse = await fetch(`${baseUrl}/generate-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Say hello world',
        user_id: newUserId,
        model: 'gemini-2.5-flash',
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
    
    // Test image generation with gemini-2.5-flash-image-preview (should work now)
    console.log('\n3. Testing image generation...');
    const imageResponse = await fetch(`${baseUrl}/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'A simple test image with text "Hello World"',
        user_id: newUserId,
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
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testNewUser();
