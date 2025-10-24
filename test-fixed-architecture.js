/**
 * Test the Fixed Architecture
 * Tests both OpenRouter (website analysis) and Vertex AI (content generation)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testOpenRouterWebsiteAnalysis() {
  console.log('\n🌐 Testing OpenRouter Website Analysis...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/analyze-brand`, {
      websiteUrl: 'https://example.com',
      designImageUris: []
    });

    if (response.data.success) {
      console.log('✅ OpenRouter Website Analysis: SUCCESS');
      console.log(`   Business Name: ${response.data.data.businessName}`);
      console.log(`   Business Type: ${response.data.data.businessType}`);
      console.log(`   Analysis Source: ${response.data.data._metadata?.source || 'unknown'}`);
      console.log(`   Model Used: ${response.data.data._metadata?.analyzedBy || 'unknown'}`);
      return true;
    } else {
      console.log('❌ OpenRouter Website Analysis: FAILED');
      console.log(`   Error: ${response.data.error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ OpenRouter Website Analysis: ERROR');
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testVertexAIContentGeneration() {
  console.log('\n🎨 Testing Vertex AI Content Generation...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/quick-content`, {
      businessName: 'Test Business',
      businessType: 'restaurant',
      location: 'Kenya',
      platform: 'instagram',
      revoVersion: '1.0',
      brandProfile: {
        businessName: 'Test Restaurant',
        businessType: 'restaurant',
        location: 'Nairobi, Kenya'
      }
    });

    if (response.data.success) {
      console.log('✅ Vertex AI Content Generation: SUCCESS');
      console.log(`   Generated Content: ${response.data.content?.substring(0, 100)}...`);
      console.log(`   Image Generated: ${response.data.imageUrl ? 'YES' : 'NO'}`);
      console.log(`   Model Used: Revo 1.0 (Vertex AI)`);
      return true;
    } else {
      console.log('❌ Vertex AI Content Generation: FAILED');
      console.log(`   Error: ${response.data.error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Vertex AI Content Generation: ERROR');
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    
    // Check if it's a Vertex AI configuration issue
    if (error.message.includes('VERTEX_AI_ENABLED') || error.message.includes('VERTEX_AI_CREDENTIALS')) {
      console.log('\n🔧 VERTEX AI CONFIGURATION NEEDED:');
      console.log('   1. Vertex AI is enabled but missing credentials');
      console.log('   2. You need to add VERTEX_AI_CREDENTIALS to .env.local');
      console.log('   3. Get service account JSON from Google Cloud Console');
      console.log('   4. Add: VERTEX_AI_CREDENTIALS={"type":"service_account",...}');
    }
    
    return false;
  }
}

async function testHealthChecks() {
  console.log('\n🏥 Testing Health Checks...');
  
  // Test OpenRouter health
  try {
    const { openRouterClient } = await import('./src/lib/services/openrouter-client.js');
    const health = await openRouterClient.healthCheck();
    
    if (health.healthy) {
      console.log('✅ OpenRouter Health: HEALTHY');
      console.log(`   Model: ${health.model}`);
    } else {
      console.log('❌ OpenRouter Health: UNHEALTHY');
      console.log(`   Error: ${health.error}`);
    }
  } catch (error) {
    console.log('❌ OpenRouter Health: ERROR');
    console.log(`   Error: ${error.message}`);
  }

  // Test Vertex AI health
  try {
    const response = await axios.get(`${BASE_URL}/api/test-revo-1.0`);
    
    if (response.data.success) {
      console.log('✅ Vertex AI Health: HEALTHY');
      console.log(`   Model: ${response.data.model}`);
    } else {
      console.log('❌ Vertex AI Health: UNHEALTHY');
      console.log(`   Error: ${response.data.error}`);
    }
  } catch (error) {
    console.log('❌ Vertex AI Health: ERROR');
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Testing Fixed Architecture: OpenRouter + Vertex AI (No Proxy)');
  console.log('=' .repeat(60));

  const results = {
    openRouterAnalysis: await testOpenRouterWebsiteAnalysis(),
    vertexAIGeneration: await testVertexAIContentGeneration()
  };

  await testHealthChecks();

  console.log('\n📊 TEST RESULTS SUMMARY:');
  console.log('=' .repeat(60));
  console.log(`OpenRouter Website Analysis: ${results.openRouterAnalysis ? '✅ WORKING' : '❌ BROKEN'}`);
  console.log(`Vertex AI Content Generation: ${results.vertexAIGeneration ? '✅ WORKING' : '❌ BROKEN'}`);

  if (results.openRouterAnalysis && results.vertexAIGeneration) {
    console.log('\n🎉 SUCCESS: Both OpenRouter and Vertex AI are working!');
    console.log('   Your architecture is now: OpenRouter (analysis) + Vertex AI (generation)');
    console.log('   No proxy dependencies - direct API calls only');
  } else {
    console.log('\n⚠️  PARTIAL SUCCESS: Some components need configuration');
    
    if (!results.openRouterAnalysis) {
      console.log('   - OpenRouter: Check OPENROUTER_API_KEY in .env.local');
    }
    
    if (!results.vertexAIGeneration) {
      console.log('   - Vertex AI: Add VERTEX_AI_CREDENTIALS to .env.local');
      console.log('   - Get service account JSON from Google Cloud Console');
    }
  }

  console.log('\n🔧 Next Steps:');
  console.log('   1. If Vertex AI fails: Add service account credentials');
  console.log('   2. If OpenRouter fails: Check API key configuration');
  console.log('   3. Test website analysis and content generation in the UI');
}

// Run the tests
runTests().catch(console.error);
