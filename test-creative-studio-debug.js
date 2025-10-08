/**
 * Debug Creative Studio Issues
 */

console.log('🔍 Debugging Creative Studio Issues...\n');

// Test 1: Check if the app is running
console.log('1. Testing app connectivity...');
fetch('http://localhost:3001/api/test-proxy-env')
  .then(response => response.json())
  .then(data => {
    console.log('✅ App is running:', data.success);
    console.log('📊 Proxy status:', data.data.shouldUseProxy);
    console.log('🔑 API keys configured:', data.data.geminiKeys);
  })
  .catch(error => {
    console.log('❌ App not accessible:', error.message);
  });

// Test 2: Check proxy server
console.log('\n2. Testing proxy server...');
fetch('http://localhost:8000/health')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Proxy server is running:', data.status);
    console.log('📊 Fallback system:', data.fallback_system);
  })
  .catch(error => {
    console.log('❌ Proxy server not accessible:', error.message);
  });

// Test 3: Test image generation through proxy
console.log('\n3. Testing image generation...');
const testPayload = {
  prompt: "A simple test design",
  user_id: "test_user",
  user_tier: "free",
  model: "gemini-2.5-flash-image-preview"
};

fetch('http://localhost:8000/generate-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testPayload)
})
.then(response => {
  if (response.ok) {
    console.log('✅ Image generation working');
    return response.json();
  } else {
    console.log('❌ Image generation failed:', response.status, response.statusText);
    return response.text();
  }
})
.then(data => {
  if (data.success) {
    console.log('✅ Image generated successfully');
  } else {
    console.log('❌ Image generation error:', data);
  }
})
.catch(error => {
  console.log('❌ Image generation request failed:', error.message);
});

console.log('\n🎯 Next steps:');
console.log('- Check browser console for specific 500 errors');
console.log('- Check Next.js server terminal for error messages');
console.log('- Look at Network tab in DevTools for failed requests');
