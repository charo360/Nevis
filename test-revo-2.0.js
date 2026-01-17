// const fetch = require('node-fetch');

async function testRevo2() {
  console.log('🚀 Testing Revo 2.0 Generation...');
  
  const payload = {
    revoModel: 'revo-2.0',
    brandProfile: {
      id: 'test-profile-id',
      businessName: 'Test Business',
      businessType: 'Retail',
      primaryColor: '#9D00FF', // Distinct Purple
      accentColor: '#00FF00',  // Neon Green
      backgroundColor: '#1A1A1A', // Dark Grey
      logoUrl: 'https://via.placeholder.com/150',
      contactInfo: {
        phone: '1234567890',
        email: 'test@example.com',
        website: 'https://example.com'
      }
    },
    platform: 'instagram',
    prompt: 'Test prompt'
  };

  try {
    // Revo 2.0 might take longer due to assistant
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const response = await fetch('http://localhost:3001/api/quick-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeout);

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.status !== 200) {
      const text = await response.text();
      console.log('Error Body:', text);
    } else {
      const data = await response.json();
      console.log('Success!', data.id);
      if (data.metadata) {
        console.log('Model Used:', data.metadata.model);
      }
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testRevo2();
