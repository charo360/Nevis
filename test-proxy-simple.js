/**
 * Simple test to verify proxy integration
 */

async function testProxy() {
  console.log('🧪 Testing AI Proxy Integration...\n');
  
  const proxyUrl = 'http://localhost:8000';
  
  // 1. Test proxy health
  console.log('1️⃣ Testing proxy health...');
  try {
    const response = await fetch(`${proxyUrl}/health`);
    const data = await response.json();
    console.log('✅ Proxy is healthy');
    console.log(`   Models: ${data.allowed_models.join(', ')}\n`);
  } catch (error) {
    console.log('❌ Proxy health check failed:', error.message);
    return;
  }
  
  // 2. Purchase credits
  console.log('2️⃣ Purchasing credits for test user...');
  try {
    const response = await fetch(`${proxyUrl}/purchase-credits/test_user?tier=basic`, {
      method: 'POST'
    });
    const data = await response.json();
    console.log('✅ Credits purchased');
    console.log(`   Credits: ${data.credits_added}\n`);
  } catch (error) {
    console.log('❌ Credit purchase failed:', error.message);
  }
  
  // 3. Test text generation through proxy
  console.log('3️⃣ Testing text generation through proxy...');
  try {
    const response = await fetch(`${proxyUrl}/generate-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Write a short professional headline for a tech company',
        user_id: 'test_user',
        user_tier: 'basic',
        model: 'gemini-2.5-flash'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Text generation successful');
      console.log(`   Generated: ${data.content.substring(0, 100)}...\n`);
    } else {
      const error = await response.text();
      console.log('❌ Text generation failed:', error);
    }
  } catch (error) {
    console.log('❌ Text generation error:', error.message);
  }
  
  // 4. Test image generation through proxy
  console.log('4️⃣ Testing image generation through proxy...');
  try {
    const response = await fetch(`${proxyUrl}/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Create a simple test image with the text "Proxy Test" on a blue background',
        user_id: 'test_user',
        user_tier: 'basic',
        model: 'gemini-2.5-flash-image-preview'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Image generation successful');
      console.log(`   Image URL length: ${data.imageUrl.length} characters\n`);
    } else {
      const error = await response.text();
      console.log('❌ Image generation failed:', error);
    }
  } catch (error) {
    console.log('❌ Image generation error:', error.message);
  }
  
  // 5. Check final credits
  console.log('5️⃣ Checking final credit balance...');
  try {
    const response = await fetch(`${proxyUrl}/credits/test_user`);
    const data = await response.json();
    console.log('✅ Credit check successful');
    console.log(`   Credits remaining: ${data.credits_remaining}`);
    console.log(`   Total AI cost: ${data.total_ai_cost_incurred}`);
    console.log(`   Tier: ${data.tier}\n`);
  } catch (error) {
    console.log('❌ Credit check failed:', error.message);
  }
  
  // 6. Check proxy stats
  console.log('6️⃣ Checking proxy statistics...');
  try {
    const response = await fetch(`${proxyUrl}/stats`);
    const data = await response.json();
    console.log('✅ Proxy stats retrieved');
    console.log(`   Total users: ${data.total_users}`);
    console.log(`   Total credits remaining: ${data.total_credits_remaining}`);
    console.log(`   Total actual AI cost: ${data.total_actual_ai_cost}`);
  } catch (error) {
    console.log('❌ Stats check failed:', error.message);
  }
  
  console.log('\n🎯 SUMMARY:');
  console.log('If you see ✅ for text and image generation, the proxy is working!');
  console.log('Your Nevis app should now route all AI calls through the proxy.');
  console.log('Check the proxy server logs to confirm requests are coming through.');
}

// Run the test
testProxy().catch(console.error);
