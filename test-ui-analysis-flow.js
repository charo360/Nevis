/**
 * Test the UI Analysis Flow
 * Tests the analyzeBrandAction function that the UI actually calls
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testUIAnalysisFlow() {
  console.log('🎯 Testing UI Analysis Flow (analyzeBrandAction)...');
  
  try {
    // This tests the actual endpoint that the UI calls
    const response = await axios.post(`${BASE_URL}/api/analyze-brand-action`, {
      websiteUrl: 'https://example.com',
      designImageUris: []
    }, {
      timeout: 60000 // 60 second timeout
    });

    console.log('✅ UI Analysis Flow Response:', response.status);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n✅ UI Analysis Flow: SUCCESS');
      console.log(`   Business Name: ${response.data.data.businessName}`);
      console.log(`   Business Type: ${response.data.data.businessType}`);
      console.log(`   Description: ${response.data.data.description?.substring(0, 100)}...`);
      return true;
    } else {
      console.log('\n❌ UI Analysis Flow: FAILED');
      console.log(`   Error: ${response.data.error}`);
      console.log(`   Error Type: ${response.data.errorType}`);
      return false;
    }
  } catch (error) {
    console.log('\n❌ UI Analysis Flow: ERROR');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Error Message: ${error.message}`);
    console.log(`   Response Data: ${JSON.stringify(error.response?.data, null, 2)}`);
    
    if (error.response?.status === 404) {
      console.log('\n🔧 Creating API endpoint for analyzeBrandAction...');
      console.log('   The UI calls analyzeBrandAction but there\'s no API endpoint for it');
      console.log('   We need to create /api/analyze-brand-action endpoint');
    }
    
    return false;
  }
}

async function testDirectAnalyzeBrandFunction() {
  console.log('\n🔍 Testing Direct analyzeBrand Function...');
  
  try {
    // Test the function directly by calling the API that uses it
    const response = await axios.post(`${BASE_URL}/api/test-analyze-brand-direct`, {
      websiteUrl: 'https://example.com',
      designImageUris: []
    });

    if (response.data.success) {
      console.log('✅ Direct analyzeBrand Function: SUCCESS');
      console.log(`   Business Name: ${response.data.data.businessName}`);
      console.log(`   Business Type: ${response.data.data.businessType}`);
      return true;
    } else {
      console.log('❌ Direct analyzeBrand Function: FAILED');
      console.log(`   Error: ${response.data.error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Direct analyzeBrand Function: ERROR');
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function runUIFlowTest() {
  console.log('🎯 TESTING UI ANALYSIS FLOW');
  console.log('=' .repeat(50));

  const results = {
    uiFlow: await testUIAnalysisFlow(),
    directFunction: await testDirectAnalyzeBrandFunction()
  };

  console.log('\n📊 UI FLOW TEST RESULTS:');
  console.log('=' .repeat(50));
  console.log(`UI Analysis Flow:        ${results.uiFlow ? '✅ Working' : '❌ Broken'}`);
  console.log(`Direct Function:         ${results.directFunction ? '✅ Working' : '❌ Broken'}`);

  if (!results.uiFlow) {
    console.log('\n🔧 DIAGNOSIS:');
    console.log('❌ The UI analysis flow is broken');
    console.log('   - The UI calls analyzeBrandAction from actions.ts');
    console.log('   - But there\'s no API endpoint for this action');
    console.log('   - We need to create the proper API endpoint');
    console.log('\n💡 SOLUTION:');
    console.log('   - Create /api/analyze-brand-action endpoint');
    console.log('   - Or update the UI to use the existing /api/analyze-brand endpoint');
  }

  if (results.uiFlow) {
    console.log('\n🎉 SUCCESS: UI Analysis Flow is working!');
    console.log('   - Website analysis works through the UI');
    console.log('   - Brand profile creation should work');
    console.log('   - OpenRouter integration is functional');
  }
}

// Run UI flow test
runUIFlowTest().catch(console.error);
