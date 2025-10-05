/**
 * Test what the API is actually returning
 */

const testData = {
  revoModel: 'revo-1.5',
  brandProfile: {
    businessName: 'Zentech Electronics Kenya',
    businessType: 'ecommerce',
    location: 'Kenya',
    services: 'ecommerce\nLogitech products\nDell laptops\nSamsung phones'
  },
  platform: 'Twitter',
  brandConsistency: {
    strictConsistency: false,
    followBrandColors: true,
    includeContacts: false
  },
  useLocalLanguage: false,
  scheduledServices: [],
  includePeopleInDesigns: true
};

async function testAPIResponse() {
  try {
    console.log('🔍 Testing API response format...\n');
    
    const response = await fetch('http://localhost:3001/api/quick-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    // Get the raw response text first
    const responseText = await response.text();
    console.log('📄 Response text (first 500 chars):', responseText.substring(0, 500));

    if (responseText.startsWith('<!DOCTYPE')) {
      console.log('❌ Response is HTML, not JSON');
      console.log('🔍 This suggests the request is not reaching the API route');
      return;
    }

    try {
      const result = JSON.parse(responseText);
      console.log('✅ Success! Response is valid JSON');
      console.log('📋 Response keys:', Object.keys(result));
    } catch (parseError) {
      console.log('❌ Response is not valid JSON:', parseError.message);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testAPIResponse();
