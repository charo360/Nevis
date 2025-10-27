// Test script to verify the Quick Content API is working
const testQuickContentAPI = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/quick-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        revoModel: 'revo-1.0',
        brandProfile: {
          businessName: 'Test Restaurant',
          businessType: 'Restaurant',
          location: 'New York',
          primaryColor: '#FF6B35',
          accentColor: '#F7931E',
          backgroundColor: '#FFFFFF'
        },
        platform: 'Instagram'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful!');
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.text();
      console.log('❌ API call failed');
      console.log('Error response:', errorData);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

testQuickContentAPI();
