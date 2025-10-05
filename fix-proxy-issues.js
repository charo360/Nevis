/**
 * Fix proxy issues by adding test credits and updating user tier
 */

async function fixProxyIssues() {
  const baseUrl = 'http://localhost:8000';
  
  console.log('🔧 Fixing proxy server issues...');
  
  try {
    // Add credits to test user
    console.log('\n1. Adding credits to test user...');
    const addCreditsResponse = await fetch(`${baseUrl}/add-credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: 'test-user',
        credits: 100,
        tier: 'basic'  // Upgrade to basic tier for better model access
      })
    });
    
    console.log(`Add credits status: ${addCreditsResponse.status}`);
    if (addCreditsResponse.ok) {
      const creditsData = await addCreditsResponse.json();
      console.log('✅ Credits added:', creditsData);
    } else {
      const errorText = await addCreditsResponse.text();
      console.log('❌ Failed to add credits:', errorText);
    }
    
    // Check updated credits
    console.log('\n2. Checking updated credits...');
    const creditsResponse = await fetch(`${baseUrl}/credits/test-user`);
    if (creditsResponse.ok) {
      const creditsData = await creditsResponse.json();
      console.log('Updated credits:', creditsData);
    }
    
    // Test text generation with basic tier
    console.log('\n3. Testing text generation with basic tier...');
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
      console.log('✅ Text generation success:', textData);
    } else {
      const errorText = await textResponse.text();
      console.log('❌ Text generation failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

// Run the fix
fixProxyIssues();
