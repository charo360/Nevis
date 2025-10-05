/**
 * Test API call to debug the 500 error
 */

const testData = {
  businessType: 'ecommerce',
  businessName: 'Zentech Electronics Kenya',
  platform: 'Twitter',
  brandProfile: {
    businessName: 'Zentech Electronics Kenya',
    businessType: 'ecommerce',
    location: 'Kenya',
    primaryColor: '#1DA1F2',
    accentColor: '#14171A',
    logoUrl: null,
    logoDataUrl: null,
    services: 'ecommerce\nLogitech Signature MK650 Keyboard and Mouse Combo For Business (920-011004)\nLogitech MeetUp Mic Extension Cable 10m (950-000005)-Price in Kenya\nLogitech Rally Bar Video Conferencing -Price in Kenya\nLogitech MeetUp 2 Conferencing System-Price in Kenya\nDell Latitude 5490\nDell Latitude 3189\nDell Latitude E7270\nDell Latitude 5290\nDell Latitude E5480\nSamsung Galaxy Note 20 Ultra\nSamsung Galaxy Note 20\nSamsung Galaxy S23 Ultra\nSamsung Galaxy S24 Ultra 512GB\nHollyland Lark M2S Ultimate Combo in Kenya\nHollyland Lark A1 Wireless Microphone\nRefurbished Dell Latitude 7280\nDell Latitude E7450\nRefurbished Dell Latitude E7240\nDell Inspiron 7440\nDell XPS 13 9370\nDell Latitude 7420 x360\nDell Latitude 7410\nDell Latitude 7400\nDell Latitude 7300\niPhone 16e\nSamsung Galaxy S25 Series\nLipa Pole Pole Phones\nSpeakers\nSmartwatches'
  },
  scheduledServices: [],
  generationModel: 'revo-1.5'
};

async function testAPICall() {
  try {
    console.log('🔍 Testing API call to /quick-content...\n');
    
    const response = await fetch('http://localhost:3001/quick-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response body:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Success! Response:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Network/Parse error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAPICall();
