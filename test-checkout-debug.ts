// Test file to debug current checkout behavior
// This will help us identify what's being sent to the API

async function testCheckoutCall() {
  console.log('🧪 Testing checkout API call...');
  
  try {
    const testPayload = {
      planId: 'starter', // This should be the new format
      quantity: 1,
      mode: 'payment',
      customerEmail: 'test@example.com',
      metadata: { userId: 'test-user-123', planId: 'starter' }
    };
    
    console.log('📤 Sending payload:', testPayload);
    
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail auth but let us see the validation
      },
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.json();
    console.log('📥 Response status:', response.status);
    console.log('📥 Response body:', result);
    
    if (response.status === 400) {
      console.log('❌ 400 Error - checking if old price ID system is still active');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Make available for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testCheckoutCall = testCheckoutCall;
  console.log('🔧 Run testCheckoutCall() in browser console to test');
}

export { testCheckoutCall };