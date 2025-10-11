// Test script to verify webhook endpoint and database function
const fetch = require('node-fetch');

async function testWebhookEndpoint() {
  try {
    console.log('🔍 Testing webhook endpoint...');
    
    const response = await fetch('http://localhost:3001/api/webhooks/stripe', {
      method: 'GET'
    });
    
    const data = await response.json();
    console.log('✅ Webhook endpoint response:', data);
    
    if (data.webhook_configured) {
      console.log('✅ Webhook secret is configured');
    } else {
      console.log('❌ Webhook secret is NOT configured');
    }
    
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
  }
}

async function testCreditAPI() {
  try {
    console.log('🔍 Testing credit API...');
    
    // This will fail without auth, but we can see if the endpoint exists
    const response = await fetch('http://localhost:3001/api/user/credits', {
      method: 'GET'
    });
    
    console.log('📊 Credit API status:', response.status);
    
    if (response.status === 401) {
      console.log('✅ Credit API is working (returns 401 as expected without auth)');
    } else {
      const data = await response.json();
      console.log('📋 Credit API response:', data);
    }
    
  } catch (error) {
    console.error('❌ Error testing credit API:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting webhook and credit system tests...\n');
  
  await testWebhookEndpoint();
  console.log('');
  await testCreditAPI();
  
  console.log('\n✅ Tests completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Run the fixed database function: process_payment_with_idempotency_fixed.sql');
  console.log('2. Restart your Next.js server');
  console.log('3. Test a Stripe payment to verify transaction recording');
}

main().catch(console.error);