/**
 * Test script to verify proxy integration is working
 */

const { testRevo20Availability } = require('./src/ai/revo-2.0-service.ts');

async function testProxyIntegration() {
  console.log('🧪 Testing Proxy Integration...\n');
  
  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`AI_PROXY_ENABLED: ${process.env.AI_PROXY_ENABLED}`);
  console.log(`AI_PROXY_URL: ${process.env.AI_PROXY_URL}`);
  console.log(`GEMINI_API_KEY_REVO_2_0: ${process.env.GEMINI_API_KEY_REVO_2_0 ? 'Set' : 'Not Set'}\n`);
  
  // Test proxy server health
  console.log('🏥 Testing Proxy Server Health...');
  try {
    const response = await fetch('http://localhost:8000/health');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Proxy server is healthy');
      console.log(`   Allowed models: ${data.allowed_models.join(', ')}\n`);
    } else {
      console.log('❌ Proxy server health check failed\n');
      return;
    }
  } catch (error) {
    console.log('❌ Cannot connect to proxy server:', error.message);
    console.log('   Make sure proxy server is running on http://localhost:8000\n');
    return;
  }
  
  // Test credit system
  console.log('💳 Testing Credit System...');
  try {
    // Purchase credits for test user
    const purchaseResponse = await fetch('http://localhost:8000/purchase-credits/test_user?tier=basic', {
      method: 'POST'
    });
    
    if (purchaseResponse.ok) {
      console.log('✅ Credit purchase successful');
      
      // Check credit balance
      const creditsResponse = await fetch('http://localhost:8000/credits/test_user');
      if (creditsResponse.ok) {
        const credits = await creditsResponse.json();
        console.log(`   Credits remaining: ${credits.credits_remaining}`);
        console.log(`   Tier: ${credits.tier}\n`);
      }
    }
  } catch (error) {
    console.log('❌ Credit system test failed:', error.message, '\n');
  }
  
  // Test Revo 2.0 with proxy
  console.log('🚀 Testing Revo 2.0 with Proxy...');
  try {
    const result = await testRevo20Availability();
    if (result) {
      console.log('✅ Revo 2.0 test successful - proxy integration working!');
    } else {
      console.log('❌ Revo 2.0 test failed');
    }
  } catch (error) {
    console.log('❌ Revo 2.0 test error:', error.message);
  }
  
  // Check proxy logs
  console.log('\n📊 Check proxy server logs to see if requests went through proxy');
  console.log('   Look for: "🔄 Revo 2.0: Using proxy for image generation"');
  
  // Final credit check
  console.log('\n💰 Final Credit Check...');
  try {
    const creditsResponse = await fetch('http://localhost:8000/credits/test_user');
    if (creditsResponse.ok) {
      const credits = await creditsResponse.json();
      console.log(`   Credits remaining: ${credits.credits_remaining}`);
      console.log(`   Total AI cost incurred: ${credits.total_ai_cost_incurred}`);
    }
  } catch (error) {
    console.log('❌ Final credit check failed:', error.message);
  }
}

// Run the test
testProxyIntegration().catch(console.error);
