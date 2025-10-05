/**
 * Test Revo 2.0 API with logo integration
 */

async function testLogoIntegration() {
  const baseUrl = 'http://localhost:3001';
  
  // Create a simple test logo (small red square)
  const testLogoDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  console.log('🔍 Testing Revo 2.0 API with logo integration...');
  
  try {
    const testRequest = {
      businessType: 'ecommerce',
      platform: 'instagram',
      brandProfile: {
        businessName: 'Test Business with Logo',
        businessType: 'ecommerce',
        location: 'Kenya',
        visualStyle: 'modern, clean',
        writingTone: 'professional',
        contentThemes: ['products', 'sales'],
        logoUrl: null,
        logoDataUrl: testLogoDataUrl  // Include logo data
      },
      imageText: '',
      visualStyle: 'modern, clean design',
      scheduledServices: []
    };
    
    console.log('\n🚀 Calling Revo 2.0 API with logo...');
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
      console.log('✅ Revo 2.0 API with logo success:', {
        hasCaption: !!result.caption,
        hasHashtags: !!result.hashtags,
        hasImageUrl: !!result.imageUrl,
        captionLength: result.caption?.length || 0,
        hashtagsCount: result.hashtags?.length || 0,
        imageUrlPrefix: result.imageUrl?.substring(0, 50) + '...'
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
testLogoIntegration();
