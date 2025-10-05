/**
 * Test script for Revo 1.0 Proxy Integration
 * Verifies that Revo 1.0 uses only proxy calls and no direct API calls
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Revo 1.0 Proxy Integration...\n');

// Test 1: Check for removed direct API imports
console.log('📋 Test 1: Checking for removed direct API imports...');
const revo10ServicePath = path.join(__dirname, 'src/ai/revo-1.0-service.ts');
const revo10Content = fs.readFileSync(revo10ServicePath, 'utf8');

// Check for removed GoogleGenerativeAI import
if (revo10Content.includes('import { GoogleGenerativeAI }')) {
  console.error('❌ FAIL: GoogleGenerativeAI import still exists');
  process.exit(1);
} else {
  console.log('✅ PASS: GoogleGenerativeAI import removed');
}

// Test 2: Check for removed direct API client initialization
console.log('\n📋 Test 2: Checking for removed direct API client...');
if (revo10Content.includes('new GoogleGenerativeAI(')) {
  console.error('❌ FAIL: Direct GoogleGenerativeAI client initialization still exists');
  process.exit(1);
} else {
  console.log('✅ PASS: Direct API client initialization removed');
}

// Test 3: Check for removed direct API calls
console.log('\n📋 Test 3: Checking for removed direct API calls...');
const directApiPatterns = [
  'ai.getGenerativeModel',
  'model.generateContent',
  'const model = ai.getGenerativeModel'
];

let hasDirectApiCalls = false;
directApiPatterns.forEach(pattern => {
  if (revo10Content.includes(pattern)) {
    console.error(`❌ FAIL: Direct API call pattern found: ${pattern}`);
    hasDirectApiCalls = true;
  }
});

if (!hasDirectApiCalls) {
  console.log('✅ PASS: All direct API calls removed');
} else {
  process.exit(1);
}

// Test 4: Check for proxy-only implementation
console.log('\n📋 Test 4: Checking for proxy-only implementation...');
if (!revo10Content.includes('shouldUseProxy()')) {
  console.error('❌ FAIL: shouldUseProxy() check not found');
  process.exit(1);
} else {
  console.log('✅ PASS: shouldUseProxy() check exists');
}

if (!revo10Content.includes('aiProxyClient.generateImage') || !revo10Content.includes('aiProxyClient.generateText')) {
  console.error('❌ FAIL: aiProxyClient calls not found');
  process.exit(1);
} else {
  console.log('✅ PASS: aiProxyClient calls exist');
}

// Test 5: Check for error handling when proxy is disabled
console.log('\n📋 Test 5: Checking for proxy-required error handling...');
if (!revo10Content.includes('Proxy is disabled. This system requires AI_PROXY_ENABLED=true')) {
  console.error('❌ FAIL: Proxy-required error handling not found');
  process.exit(1);
} else {
  console.log('✅ PASS: Proxy-required error handling exists');
}

// Test 6: Check token limits updated to 8192
console.log('\n📋 Test 6: Checking token limits...');
const configPath = path.join(__dirname, 'src/ai/models/versions/revo-1.0/config.ts');
const configContent = fs.readFileSync(configPath, 'utf8');

if (!configContent.includes('maxTokens: 8192')) {
  console.error('❌ FAIL: Token limit not updated to 8192');
  process.exit(1);
} else {
  console.log('✅ PASS: Token limit updated to 8192');
}

// Test 7: Check for consistent response structure
console.log('\n📋 Test 7: Checking for consistent response structure...');
if (!revo10Content.includes('candidates: [{') || !revo10Content.includes('inlineData: {')) {
  console.error('❌ FAIL: Consistent response structure not found');
  process.exit(1);
} else {
  console.log('✅ PASS: Consistent response structure exists');
}

console.log('\n🎉 All tests passed! Revo 1.0 is now 100% proxy-only!');
console.log('\n📊 Summary:');
console.log('✅ Direct API imports removed');
console.log('✅ Direct API client initialization removed');
console.log('✅ Direct API calls removed');
console.log('✅ Proxy-only implementation verified');
console.log('✅ Error handling for disabled proxy');
console.log('✅ Token limits increased to 8192');
console.log('✅ Consistent response structure');
console.log('\n🛡️ Cost control: All Revo 1.0 requests now go through proxy!');
