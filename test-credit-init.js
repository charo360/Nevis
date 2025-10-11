// Test script to check credit initialization
async function testCreditInitialization() {
  try {
    console.log('🧪 Testing credit initialization...');
    
    // Test the credits API
    const response = await fetch('http://localhost:3001/api/user/credits', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    console.log('📊 Credits API Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('💰 Credits Data:', data);
    } else {
      const error = await response.text();
      console.log('❌ Credits API Error:', error);
    }
    
    // Test the initialize credits API
    const initResponse = await fetch('http://localhost:3001/api/user/initialize-credits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    console.log('🎯 Initialize API Status:', initResponse.status);
    
    if (initResponse.ok) {
      const initData = await initResponse.json();
      console.log('🎉 Initialize Data:', initData);
    } else {
      const initError = await initResponse.text();
      console.log('❌ Initialize API Error:', initError);
    }
    
  } catch (error) {
    console.error('🚨 Test Error:', error);
  }
}

// Run the test
testCreditInitialization();