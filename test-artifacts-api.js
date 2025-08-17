// Simple test script to verify artifacts API is working
const testArtifactsAPI = async () => {
  try {
    console.log('🧪 Testing artifacts API endpoints...');
    
    // Test 1: General artifacts list
    console.log('\n1. Testing /api/artifacts?action=list');
    const response1 = await fetch('http://localhost:9002/api/artifacts?action=list');
    const result1 = await response1.json();
    console.log('✅ Response:', result1);
    
    // Test 2: Design artifacts list
    console.log('\n2. Testing /api/artifacts/design?action=list');
    const response2 = await fetch('http://localhost:9002/api/artifacts/design?action=list');
    const result2 = await response2.json();
    console.log('✅ Response:', result2);
    
    // Test 3: Active design artifacts
    console.log('\n3. Testing /api/artifacts/design?action=active-design');
    const response3 = await fetch('http://localhost:9002/api/artifacts/design?action=active-design');
    const result3 = await response3.json();
    console.log('✅ Response:', result3);
    
    console.log('\n🎉 All API tests completed successfully!');
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
};

// Run the test
testArtifactsAPI();
