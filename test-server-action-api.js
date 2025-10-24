/**
 * Test Server Action via API
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testServerActionAPI() {
  console.log('🎯 Testing Server Action via API...');
  
  try {
    console.log('📡 Making request to /api/test-analyze-brand-action...');
    
    const response = await axios.post(`${BASE_URL}/api/test-analyze-brand-action`, {
      websiteUrl: 'https://example.com',
      designImageUris: []
    }, {
      timeout: 60000 // 60 second timeout
    });

    console.log('✅ Response received:', response.status);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n✅ Server Action Analysis: SUCCESS');
      console.log(`   Business Name: ${response.data.data.businessName}`);
      console.log(`   Business Type: ${response.data.data.businessType}`);
      console.log(`   Description: ${response.data.data.description?.substring(0, 100)}...`);
      return true;
    } else {
      console.log('\n❌ Server Action Analysis: FAILED');
      console.log(`   Error: ${response.data.error}`);
      console.log(`   Error Type: ${response.data.errorType}`);
      return false;
    }
  } catch (error) {
    console.log('\n❌ Server Action Analysis: ERROR');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Error Message: ${error.message}`);
    console.log(`   Response Data: ${JSON.stringify(error.response?.data, null, 2)}`);
    return false;
  }
}

async function testAnalyzeBrandEndpoint() {
  console.log('\n🔍 Testing /api/analyze-brand endpoint...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/analyze-brand`, {
      websiteUrl: 'https://example.com',
      designImageUris: []
    }, {
      timeout: 60000,
      validateStatus: function (status) {
        return status < 500; // Accept any status less than 500
      }
    });

    console.log('✅ Response received:', response.status);
    console.log('📊 Response headers:', response.headers);
    console.log('📊 Response data type:', typeof response.data);
    console.log('📊 Response data length:', response.data?.length || 'N/A');
    console.log('📊 Response data:', response.data);

    if (response.data && response.data.success) {
      console.log('\n✅ /api/analyze-brand: SUCCESS');
      return true;
    } else {
      console.log('\n❌ /api/analyze-brand: FAILED or Empty Response');
      return false;
    }
  } catch (error) {
    console.log('\n❌ /api/analyze-brand: ERROR');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runServerActionAPITest() {
  console.log('🎯 TESTING SERVER ACTION VIA API');
  console.log('=' .repeat(50));

  const results = {
    serverActionAPI: await testServerActionAPI(),
    analyzeBrandEndpoint: await testAnalyzeBrandEndpoint()
  };

  console.log('\n📊 API TEST RESULTS:');
  console.log('=' .repeat(50));
  console.log(`Server Action API:       ${results.serverActionAPI ? '✅ Working' : '❌ Broken'}`);
  console.log(`Analyze Brand Endpoint:  ${results.analyzeBrandEndpoint ? '✅ Working' : '❌ Broken'}`);

  if (results.serverActionAPI) {
    console.log('\n🎉 SUCCESS: Server Action is working!');
    console.log('   - The UI analysis flow should work');
    console.log('   - analyzeBrandAction is functional');
    console.log('   - Website analysis integration is working');
  } else {
    console.log('\n🔧 DIAGNOSIS:');
    console.log('❌ The server action is broken');
    console.log('   - This is what the UI actually calls');
    console.log('   - Check the analyzeBrandAction function');
    console.log('   - Check the analyzeBrand import');
  }

  if (!results.analyzeBrandEndpoint) {
    console.log('\n⚠️  /api/analyze-brand endpoint issues:');
    console.log('   - Empty response or error');
    console.log('   - Check the endpoint implementation');
    console.log('   - Check OpenRouter client integration');
  }
}

// Run server action API test
runServerActionAPITest().catch(console.error);
