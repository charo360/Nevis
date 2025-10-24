/**
 * Test Vertex AI configuration and availability
 */

// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

async function testVertexAIConfig() {
  console.log('🔍 Testing Vertex AI Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`VERTEX_AI_ENABLED: ${process.env.VERTEX_AI_ENABLED || 'NOT SET'}`);
  console.log(`VERTEX_AI_PROJECT_ID: ${process.env.VERTEX_AI_PROJECT_ID || 'NOT SET'}`);
  console.log(`VERTEX_AI_LOCATION: ${process.env.VERTEX_AI_LOCATION || 'NOT SET'}`);
  console.log(`VERTEX_AI_CREDENTIALS: ${process.env.VERTEX_AI_CREDENTIALS ? 'SET (JSON)' : 'NOT SET'}`);
  console.log(`VERTEX_AI_CREDENTIALS_PATH: ${process.env.VERTEX_AI_CREDENTIALS_PATH || 'NOT SET'}`);
  
  // Check Google API keys (fallback)
  console.log('\n📋 Google API Keys (Fallback):');
  console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`GEMINI_API_KEY_REVO_1_0: ${process.env.GEMINI_API_KEY_REVO_1_0 ? 'SET' : 'NOT SET'}`);
  console.log(`GEMINI_API_KEY_REVO_1_5: ${process.env.GEMINI_API_KEY_REVO_1_5 ? 'SET' : 'NOT SET'}`);
  console.log(`GEMINI_API_KEY_REVO_2_0: ${process.env.GEMINI_API_KEY_REVO_2_0 ? 'SET' : 'NOT SET'}`);
  
  console.log('\n🔍 Analysis:');
  
  // Check if Vertex AI is properly configured
  const hasVertexAIEnabled = process.env.VERTEX_AI_ENABLED === 'true';
  const hasVertexAIProject = !!process.env.VERTEX_AI_PROJECT_ID;
  const hasVertexAICredentials = !!(process.env.VERTEX_AI_CREDENTIALS || process.env.VERTEX_AI_CREDENTIALS_PATH);
  
  console.log(`✅ Vertex AI Enabled: ${hasVertexAIEnabled ? 'YES' : 'NO'}`);
  console.log(`✅ Vertex AI Project ID: ${hasVertexAIProject ? 'YES' : 'NO'}`);
  console.log(`✅ Vertex AI Credentials: ${hasVertexAICredentials ? 'YES' : 'NO'}`);
  
  // Check if Google API keys are available as fallback
  const hasGoogleAPIKeys = !!(
    process.env.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY_REVO_1_0 ||
    process.env.GEMINI_API_KEY_REVO_1_5 ||
    process.env.GEMINI_API_KEY_REVO_2_0
  );
  
  console.log(`✅ Google API Keys (Fallback): ${hasGoogleAPIKeys ? 'YES' : 'NO'}`);
  
  console.log('\n🎯 Current Status:');
  
  if (hasVertexAIEnabled && hasVertexAIProject && hasVertexAICredentials) {
    console.log('✅ VERTEX AI: Fully configured and should work');
  } else if (hasVertexAIEnabled) {
    console.log('⚠️ VERTEX AI: Enabled but missing configuration');
    if (!hasVertexAIProject) console.log('   - Missing VERTEX_AI_PROJECT_ID');
    if (!hasVertexAICredentials) console.log('   - Missing VERTEX_AI_CREDENTIALS or VERTEX_AI_CREDENTIALS_PATH');
  } else {
    console.log('❌ VERTEX AI: Not enabled (VERTEX_AI_ENABLED != true)');
  }
  
  if (hasGoogleAPIKeys) {
    console.log('✅ GOOGLE API: Available as fallback');
  } else {
    console.log('❌ GOOGLE API: No API keys found');
  }
  
  console.log('\n🔧 Recommendations:');
  
  if (!hasVertexAIEnabled && hasGoogleAPIKeys) {
    console.log('💡 Use Google API directly instead of Vertex AI');
    console.log('   - Website analysis should use direct Google Gemini API calls');
    console.log('   - This will work with your existing API keys');
  } else if (hasVertexAIEnabled && !hasVertexAICredentials) {
    console.log('💡 Fix Vertex AI credentials');
    console.log('   - Add VERTEX_AI_CREDENTIALS environment variable with service account JSON');
    console.log('   - Or add VERTEX_AI_CREDENTIALS_PATH pointing to credentials file');
  } else if (!hasVertexAIEnabled && !hasGoogleAPIKeys) {
    console.log('💡 Configure API access');
    console.log('   - Either enable Vertex AI with proper credentials');
    console.log('   - Or add Google API keys for direct API access');
  }
}

// Load environment variables if available
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not available, continue without it
}

// Run the test
testVertexAIConfig();
