/**
 * Simple test script for Creative Studio
 * 
 * To test:
 * 1. Open browser console on https://crevo.app/creative-studio
 * 2. Copy and paste this entire script
 * 3. Run the test functions
 */

// Test function - requires browser console
async function testCreativeStudio() {
  console.log('🧪 Testing Creative Studio...\n');
  
  try {
    // Test with Revo 1.0 (2 credits)
    console.log('📝 Testing Revo 1.0 (should use 2 credits)...');
    const result1 = await fetch('/api/test-creative-studio-fixed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'two people',
        outputType: 'image',
        preferredModel: 'revo-1.0-gemini-2.5-flash-image-preview'
      })
    });
    
    const data1 = await result1.json();
    console.log('✅ Revo 1.0 Result:', data1);
    console.log(`   Credits used: ${data1.credits?.used}, Expected: 2\n`);
    
    // Test with Revo 1.5 (3 credits)
    console.log('📝 Testing Revo 1.5 (should use 3 credits)...');
    const result2 = await fetch('/api/test-creative-studio-fixed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'two people',
        outputType: 'image',
        preferredModel: 'revo-1.5-gemini-2.5-flash-image-preview'
      })
    });
    
    const data2 = await result2.json();
    console.log('✅ Revo 1.5 Result:', data2);
    console.log(`   Credits used: ${data2.credits?.used}, Expected: 3\n`);
    
    // Test with Revo 2.0 (4 credits)
    console.log('📝 Testing Revo 2.0 (should use 4 credits)...');
    const result3 = await fetch('/api/test-creative-studio-fixed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'two people',
        outputType: 'image',
        preferredModel: 'revo-2.0-gemini-2.5-flash-image-preview'
      })
    });
    
    const data3 = await result3.json();
    console.log('✅ Revo 2.0 Result:', data3);
    console.log(`   Credits used: ${data3.credits?.used}, Expected: 4\n`);
    
    console.log('✨ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Simple test for authentication
async function testAuth() {
  console.log('🔐 Testing Authentication...\n');
  
  try {
    const result = await fetch('/api/test-creative-studio-fixed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'test'
      })
    });
    
    const data = await result.json();
    
    if (data.error && data.error.includes('Unauthorized')) {
      console.log('❌ Authentication failed - Please log in first');
    } else {
      console.log('✅ Authentication successful!');
      console.log('   User:', data.metadata?.userId || 'N/A');
    }
  } catch (error) {
    console.error('❌ Auth test failed:', error);
  }
}

// Export for browser console
console.log(`
🧪 Creative Studio Test Functions Loaded!

Available functions:
- testCreativeStudio() - Test all three models and credit deduction
- testAuth() - Test authentication

Run: testCreativeStudio() or testAuth()
`);

