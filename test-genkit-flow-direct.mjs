import fetch from 'node-fetch';

async function testGenkitFlowDirect() {
  try {
    console.log('🔧 Testing Genkit Flow Directly...');
    
    // Test the generateCreativeAsset flow directly
    const response = await fetch('http://localhost:3400/generateCreativeAsset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          prompt: 'A beautiful sunset over mountains',
          outputType: 'image',
          referenceAssetUrl: null,
          useBrandProfile: false,
          brandProfile: null,
          maskDataUrl: null,
          aspectRatio: null,
          preferredModel: 'gemini-2.5-flash-image-preview'
        }
      })
    });

    const data = await response.json();
    
    console.log('📦 Response status:', response.status);
    console.log('📦 Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.result) {
      console.log('✅ Genkit Flow working!');
      console.log('🖼️ Image URL type:', typeof data.result.imageUrl);
      console.log('🖼️ Image URL length:', data.result.imageUrl?.length);
      console.log('🖼️ Image URL starts with:', data.result.imageUrl?.substring(0, 50));
    } else {
      console.log('❌ Genkit Flow failed:', data.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Error testing Genkit Flow:', error.message);
  }
}

testGenkitFlowDirect();
