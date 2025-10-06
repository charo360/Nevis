/**
 * Test Quick Content API with Revo 1.5 (the actual user flow)
 */

console.log('🧪 Testing Quick Content API with Revo 1.5...\n');

const testData = {
  revoModel: 'revo-1.5',
  platform: 'instagram',
  brandProfile: {
    businessName: 'Paya Solutions',
    businessType: 'Payment Services',
    location: 'Nairobi, Kenya',
    logoUrl: null,
    logoDataUrl: null,
    services: 'Mobile payments, digital wallets, financial services',
    visualStyle: 'modern',
    primaryColor: '#2563eb',
    targetAudience: 'General audience'
  },
  brandConsistency: {
    strictConsistency: false,
    followBrandColors: true,
    includeContacts: false
  },
  useLocalLanguage: true,
  includePeopleInDesigns: true,
  scheduledServices: []
};

async function testQuickContentAPI() {
  try {
    console.log('🔄 Making API request to Quick Content API...');
    console.log('📋 Request data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3001/api/quick-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 Raw response length:', responseText.length);
    console.log('📄 Raw response preview:', responseText.substring(0, 500) + '...');
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Quick Content API Success!');
        console.log('🎯 Response data structure:', {
          hasId: !!data.id,
          hasImageUrl: !!data.imageUrl,
          hasContent: !!data.content,
          hasHashtags: !!data.hashtags,
          hasCatchyWords: !!data.catchyWords,
          hasSubheadline: !!data.subheadline,
          hasCallToAction: !!data.callToAction,
          model: data.metadata?.model,
          platform: data.platform
        });
        
        if (data.content) {
          console.log('📝 Generated content preview:', data.content.substring(0, 100) + '...');
        }
        
        if (data.hashtags) {
          console.log('🏷️ Generated hashtags:', data.hashtags.slice(0, 5));
        }
        
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.error('❌ Response was not valid JSON');
      }
    } else {
      console.error('❌ Quick Content API Error:', response.status, response.statusText);
      console.error('❌ Error response:', responseText);
      
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ Parsed error:', errorData);
      } catch {
        console.error('❌ Could not parse error response as JSON');
      }
    }
    
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// Run the test
testQuickContentAPI().then(() => {
  console.log('\n✅ Quick Content API test completed!');
}).catch(error => {
  console.error('\n❌ Test failed:', error);
});
