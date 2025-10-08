import fetch from 'node-fetch';

async function testCreativeStudioWithLogo() {
  try {
    console.log('🎨 Testing Creative Studio with Brand Logo...');
    
    // Create a simple test logo (red square) as base64 data URL
    const testLogoDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABYSURBVBiVY2RgYPgPBQw4wH8cYBQqZGBg+I8VjEKFDAwM/7GCUaiQgYHhP1YwChUyMDD8xwpGoUIGBob/WMEoVMjAwPAfKxiFChkYGP5jBaNQIQMDw3+sAADKVQX/2JK1NQAAAABJRU5ErkJggg==';
    
    // Create a test brand profile with logo
    const testBrandProfile = {
      businessName: 'Test Company',
      businessType: 'Technology',
      location: 'San Francisco, CA',
      description: 'A test technology company',
      targetAudience: 'Tech professionals',
      keyFeatures: 'Innovation, Quality, Service',
      competitiveAdvantages: 'Fast, Reliable, Affordable',
      visualStyle: 'modern',
      writingTone: 'professional',
      contentThemes: 'technology, innovation',
      primaryColor: '#3B82F6',
      accentColor: '#10B981',
      backgroundColor: '#F8FAFC',
      logoDataUrl: testLogoDataUrl, // Include the logo
      websiteUrl: 'https://testcompany.com',
      socialMedia: {
        facebook: '',
        instagram: '',
        twitter: '',
        linkedin: '',
      },
      contactInfo: {
        phone: '555-123-4567',
        email: 'info@testcompany.com',
        address: '123 Tech Street, San Francisco, CA',
      },
    };
    
    // Test the Creative Studio action with brand profile and logo
    const response = await fetch('http://localhost:3001/api/test-creative-studio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Create a professional business card design',
        outputType: 'image',
        referenceAssetUrl: null,
        useBrandProfile: true, // Enable brand profile usage
        brandProfile: testBrandProfile, // Include the brand profile with logo
        maskDataUrl: null,
        aspectRatio: null,
        preferredModel: 'gemini-2.5-flash-image-preview'
      })
    });

    const data = await response.json();
    
    console.log('📦 Response status:', response.status);
    console.log('📦 Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Creative Studio with Logo working!');
      console.log('🖼️ Image URL:', data.result.imageUrl);
      console.log('📝 AI Explanation:', data.result.aiExplanation);
      
      // Check if the response indicates logo integration
      if (data.result.aiExplanation && data.result.aiExplanation.toLowerCase().includes('logo')) {
        console.log('🎯 Logo integration detected in AI explanation!');
      } else {
        console.log('⚠️ No logo mention in AI explanation - logo might not be integrated');
      }
    } else {
      console.log('❌ Creative Studio with Logo failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing Creative Studio with Logo:', error.message);
  }
}

testCreativeStudioWithLogo();
