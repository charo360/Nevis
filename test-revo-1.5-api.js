/**
 * Test Revo 1.5 API to Debug 500 Error
 */

console.log('🧪 Testing Revo 1.5 API...\n');

const testData = {
  businessType: 'Payment Services',
  platform: 'instagram',
  brandProfile: {
    businessName: 'Paya Solutions',
    location: 'Nairobi, Kenya',
    businessType: 'Payment Services',
    logoUrl: null,
    logoDataUrl: null,
    services: 'Mobile payments, digital wallets, financial services'
  },
  visualStyle: 'modern',
  imageText: '',
  aspectRatio: '1:1',
  includePeopleInDesigns: true,
  useLocalLanguage: true
};

async function testAPI() {
  try {
    console.log('🔄 Making API request to Revo 1.5...');
    console.log('📋 Request data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3001/api/generate-revo-1.5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 Raw response:', responseText);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ API Success!');
        console.log('🎯 Response data:', {
          success: data.success,
          model: data.model,
          fallback: data.fallback,
          hasCaption: !!data.caption,
          hasHeadline: !!data.headline,
          hasHashtags: !!data.hashtags,
          hasImageUrl: !!data.imageUrl
        });
        
        if (data.fallback) {
          console.log('🔄 FALLBACK SYSTEM ACTIVATED!');
          console.log('📝 Fallback content:', {
            caption: data.caption?.substring(0, 50) + '...',
            headline: data.headline,
            cta: data.callToAction
          });
        }
        
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
      }
    } else {
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('❌ Error response:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// Run the test
testAPI().then(() => {
  console.log('\n✅ API test completed!');
}).catch(error => {
  console.error('\n❌ Test failed:', error);
});
