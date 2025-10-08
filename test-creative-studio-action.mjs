import fetch from 'node-fetch';

async function testCreativeStudioAction() {
  try {
    console.log('🎨 Testing Creative Studio Action...');
    
    // Test the generateCreativeAssetAction through the genkit flow
    const response = await fetch('http://localhost:3001/api/test-creative-studio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'A beautiful sunset over mountains',
        userId: 'test-user',
        userTier: 'free',
        imageDataUrl: null,
        maskDataUrl: null,
        aspectRatio: null,
        preferredModel: 'gemini-2.5-flash-image-preview'
      })
    });

    const data = await response.json();
    
    console.log('📦 Response status:', response.status);
    console.log('📦 Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Creative Studio Action working!');
      console.log('🖼️ Image URL:', data.imageUrl);
      console.log('📝 Explanation:', data.explanation);
    } else {
      console.log('❌ Creative Studio Action failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing Creative Studio Action:', error.message);
  }
}

testCreativeStudioAction();
