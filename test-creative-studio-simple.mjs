import fetch from 'node-fetch';

async function testCreativeStudioSimple() {
  try {
    console.log('🎨 Testing Creative Studio - Simple Case...');
    
    // Test 1: Simple image generation without brand profile
    console.log('\n1️⃣ Testing simple image generation (no brand profile)...');
    
    const simpleResponse = await fetch('http://localhost:3001/api/test-creative-studio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Create a simple red circle on white background',
        outputType: 'image',
        referenceAssetUrl: null,
        useBrandProfile: false,
        brandProfile: null,
        maskDataUrl: null,
        aspectRatio: null,
        preferredModel: 'gemini-2.5-flash-image-preview'
      })
    });

    const simpleData = await simpleResponse.json();
    console.log('Simple Response Status:', simpleResponse.status);
    console.log('Simple Response Success:', simpleData.success);
    
    if (simpleData.success) {
      console.log('✅ Simple image generation working!');
      console.log('Image URL:', simpleData.result.imageUrl);
    } else {
      console.log('❌ Simple image generation failed:', simpleData.error);
    }
    
    // Test 2: Test with brand profile but no logo
    console.log('\n2️⃣ Testing with brand profile (no logo)...');
    
    const brandProfileNoLogo = {
      businessName: 'Test Company',
      businessType: 'Technology',
      location: 'San Francisco, CA',
      visualStyle: 'modern',
      primaryColor: '#3B82F6',
      accentColor: '#10B981',
      backgroundColor: '#F8FAFC',
      // No logoDataUrl
    };
    
    const brandResponse = await fetch('http://localhost:3001/api/test-creative-studio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Create a professional business card design',
        outputType: 'image',
        referenceAssetUrl: null,
        useBrandProfile: true,
        brandProfile: brandProfileNoLogo,
        maskDataUrl: null,
        aspectRatio: null,
        preferredModel: 'gemini-2.5-flash-image-preview'
      })
    });

    const brandData = await brandResponse.json();
    console.log('Brand Response Status:', brandResponse.status);
    console.log('Brand Response Success:', brandData.success);
    
    if (brandData.success) {
      console.log('✅ Brand profile (no logo) working!');
      console.log('Image URL:', brandData.result.imageUrl);
    } else {
      console.log('❌ Brand profile (no logo) failed:', brandData.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing Creative Studio:', error.message);
  }
}

testCreativeStudioSimple();
