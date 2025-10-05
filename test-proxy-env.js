/**
 * Test proxy environment configuration
 */

console.log('🔍 Checking Proxy Environment Configuration...\n');

console.log('Environment Variables:');
console.log(`AI_PROXY_ENABLED: ${process.env.AI_PROXY_ENABLED}`);
console.log(`AI_PROXY_URL: ${process.env.AI_PROXY_URL}`);
console.log(`AI_PROXY_TIMEOUT: ${process.env.AI_PROXY_TIMEOUT}`);

console.log('\nGemini API Keys:');
console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Set' : 'Not Set'}`);
console.log(`GEMINI_API_KEY_REVO_1_0: ${process.env.GEMINI_API_KEY_REVO_1_0 ? 'Set' : 'Not Set'}`);
console.log(`GEMINI_API_KEY_REVO_1_5: ${process.env.GEMINI_API_KEY_REVO_1_5 ? 'Set' : 'Not Set'}`);
console.log(`GEMINI_API_KEY_REVO_2_0: ${process.env.GEMINI_API_KEY_REVO_2_0 ? 'Set' : 'Not Set'}`);

console.log('\n🎯 Analysis:');
if (process.env.AI_PROXY_ENABLED === 'true') {
  console.log('✅ Proxy is ENABLED - All Revo services should use proxy');
  console.log(`✅ Proxy URL configured: ${process.env.AI_PROXY_URL}`);
} else {
  console.log('❌ Proxy is DISABLED - Services will use direct API calls');
  console.log('   To enable proxy, set AI_PROXY_ENABLED=true in .env.local');
}

console.log('\n📊 Expected Behavior:');
console.log('- When AI_PROXY_ENABLED=true: All AI calls go through proxy');
console.log('- When AI_PROXY_ENABLED=false: Direct API calls (no cost protection)');
console.log('- Proxy logs should show: "🔄 Revo X.X: Using proxy for generation"');
console.log('- Direct API logs show: "🔄 Revo X.X: Using direct API for generation"');
