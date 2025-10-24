/**
 * Detailed test of website analysis to identify proxy dependencies
 */

// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

async function testAnalysisDetailed() {
  console.log('🔍 Detailed Website Analysis Test...\n');
  
  const testUrl = 'https://example.com';
  
  try {
    console.log('📋 Testing /api/test-analysis endpoint...');
    
    const response = await fetch('http://localhost:3001/api/test-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: testUrl }),
    });
    
    console.log(`📡 Response status: ${response.status}`);
    console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log(`📊 Response body:`, JSON.stringify(result, null, 2));
    
    if (result.error) {
      console.log('\n🚨 ERROR ANALYSIS:');
      console.log(`Error message: ${result.error}`);
      console.log(`Error details: ${result.details || 'None'}`);
      
      // Check for proxy-related errors
      if (result.error.includes('proxy') || result.error.includes('8000') || result.error.includes('ECONNREFUSED')) {
        console.log('\n💡 DIAGNOSIS: PROXY SERVER DEPENDENCY DETECTED');
        console.log('   The website analysis is trying to connect to a proxy server');
        console.log('   This needs to be updated to use direct API calls');
      }
      
      if (result.error.includes('API key') || result.error.includes('authentication')) {
        console.log('\n💡 DIAGNOSIS: API KEY ISSUE');
        console.log('   The system needs proper API keys configured');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 DIAGNOSIS: Connection refused');
      if (error.message.includes('3001')) {
        console.log('   Development server is not running on port 3001');
      } else if (error.message.includes('8000')) {
        console.log('   Trying to connect to proxy server on port 8000 (which no longer exists)');
      }
    }
  }
}

// Run the test
testAnalysisDetailed();
