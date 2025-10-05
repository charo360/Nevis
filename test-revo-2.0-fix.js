/**
 * Test Revo 2.0 API after fixing proxy response handling
 */

async function testRevo20Fix() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🔍 Testing Revo 2.0 API fix...');
  
  try {
    const testRequest = {
      businessType: 'ecommerce',
      platform: 'instagram',
      brandProfile: {
        businessName: 'Test Business',
        businessType: 'ecommerce',
        location: 'Kenya',
        visualStyle: 'modern, clean',
        writingTone: 'professional',
        contentThemes: ['products', 'sales'],
        logoUrl: null,
        logoDataUrl: null
      },
      imageText: '',
      visualStyle: 'modern, clean design',
      scheduledServices: []
    };
    
    console.log('\n🚀 Calling Revo 2.0 API...');
    const response = await fetch(`${baseUrl}/api/generate-revo-2.0`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Revo 2.0 API success:', {
        hasCaption: !!result.caption,
        hasHashtags: !!result.hashtags,
        hasImageUrl: !!result.imageUrl,
        captionLength: result.caption?.length || 0,
        hashtagsCount: result.hashtags?.length || 0
      });
    } else {
      const errorText = await response.text();
      console.log('❌ Revo 2.0 API failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRevo20Fix();
