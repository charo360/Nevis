/**
 * Test Creative Studio Configuration
 */

console.log('🔍 Testing Creative Studio Configuration...\n');

// Load environment variables
require('dotenv').config();

console.log('Environment Variables:');
console.log(`AI_PROXY_ENABLED: ${process.env.AI_PROXY_ENABLED}`);
console.log(`AI_PROXY_URL: ${process.env.AI_PROXY_URL}`);
console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Set' : 'Not Set'}`);
console.log(`GOOGLE_API_KEY: ${process.env.GOOGLE_API_KEY ? 'Set' : 'Not Set'}`);

console.log('\nRevo API Keys:');
console.log(`GEMINI_API_KEY_REVO_1_0: ${process.env.GEMINI_API_KEY_REVO_1_0 ? 'Set' : 'Not Set'}`);
console.log(`GEMINI_API_KEY_REVO_1_5: ${process.env.GEMINI_API_KEY_REVO_1_5 ? 'Set' : 'Not Set'}`);
console.log(`GEMINI_API_KEY_REVO_2_0: ${process.env.GEMINI_API_KEY_REVO_2_0 ? 'Set' : 'Not Set'}`);

console.log('\n🎯 Analysis:');
if (process.env.AI_PROXY_ENABLED === 'false') {
  console.log('✅ Proxy is DISABLED - Creative Studio will use direct API calls');
  console.log('✅ This should work immediately without starting a proxy server');
} else if (process.env.AI_PROXY_ENABLED === 'true') {
  console.log('⚠️ Proxy is ENABLED - You need to start the proxy server');
  console.log('   Run: cd proxy-server && python main.py');
} else {
  console.log('❌ AI_PROXY_ENABLED is not set properly');
}

if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
  console.log('✅ API keys are configured - Creative Studio should work');
} else {
  console.log('❌ No API keys found - Creative Studio will fail');
}

console.log('\n📊 Expected Behavior:');
console.log('- Creative Studio should work with direct API calls');
console.log('- No proxy server required');
console.log('- Look for "🔄 Direct API: Using direct Google AI API fallback" in console');
