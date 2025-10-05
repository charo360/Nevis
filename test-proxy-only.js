/**
 * Test script to verify proxy-only behavior (no direct API fallback)
 */

async function testProxyOnly() {
  console.log('🧪 Testing Proxy-Only System (No Direct API Fallback)\n');

  const testPayload = {
    businessType: 'Coffee Shop',
    platform: 'instagram',
    brandProfile: {
      businessName: 'Test Cafe',
      location: 'Nairobi, Kenya',
      primaryColor: '#8B4513',
      accentColor: '#D2691E',
      backgroundColor: '#FFF8DC',
      targetAudience: 'Coffee lovers',
      writingTone: 'Friendly'
    },
    visualStyle: 'modern',
    aspectRatio: '1:1'
  };

  try {
    console.log('📡 Sending request to Revo 2.0 API...');
    console.log('⚠️  This should ONLY work if proxy server is running on port 8000\n');

    const response = await fetch('http://localhost:3000/api/generate-revo-2.0', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS: Proxy is working!');
      console.log('📊 Response:', {
        success: data.success,
        model: data.model,
        hasImage: !!data.imageUrl,
        processingTime: data.processingTime + 'ms'
      });
    } else {
      console.log('❌ FAILED:', data.error);
      console.log('\n💡 Expected behavior:');
      console.log('   - If proxy is NOT running: Should fail with proxy error');
      console.log('   - If proxy IS running: Should succeed with generated content');
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Proxy server is running: cd proxy-server && uvicorn main:app --reload --port 8000');
    console.log('   2. Next.js app is running: npm run dev');
  }
}

// Run test
testProxyOnly();
