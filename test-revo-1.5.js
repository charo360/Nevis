// const fetch = require('node-fetch'); // Removed as fetch is native in Node 20+

async function testRevo15() {
  console.log('🚀 Testing Revo 1.5 Generation...');
  
  const payload = {
    revoModel: 'revo-1.5',
    brandProfile: {
      id: 'test-profile-id',
      businessName: 'Test Business',
      businessType: 'Retail',
      primaryColor: '#000000',
      accentColor: '#ffffff',
      backgroundColor: '#f0f0f0',
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
    const response = await fetch('http://localhost:3001/api/quick-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.status !== 200) {
      const text = await response.text();
      console.log('Error Body:', text);
    } else {
      const data = await response.json();
      console.log('Success!', data.id);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testRevo15();
