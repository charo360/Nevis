import fetch from 'node-fetch';

async function debugLogoIntegration() {
  try {
    console.log('🔍 Debugging Logo Integration Pipeline...\n');
    
    // Step 1: Create a test logo (simple red square)
    const testLogoDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABYSURBVBiVY2RgYPgPBQw4wH8cYBQqZGBg+I8VjEKFDAwM/7GCUaiQgYHhP1YwChUyMDD8xwpGoUIGBob/WMEoVMjAwPAfKxiFChkYGP5jBaNQIQMDw3+sAADKVQX/2JK1NQAAAABJRU5ErkJggg==';
    
    console.log('1️⃣ Test Logo Created:');
    console.log('   - Format: PNG data URL');
    console.log('   - Size:', testLogoDataUrl.length, 'characters');
    console.log('   - Preview:', testLogoDataUrl.substring(0, 50) + '...\n');
    
    // Step 2: Create a comprehensive brand profile
    const testBrandProfile = {
      businessName: 'Debug Test Company',
      businessType: 'Technology',
      location: 'San Francisco, CA',
      description: 'A test company for debugging logo integration',
      targetAudience: 'Developers',
      keyFeatures: 'Testing, Debugging, Quality',
      competitiveAdvantages: 'Thorough, Systematic, Reliable',
      visualStyle: 'modern',
      writingTone: 'professional',
      contentThemes: 'technology, testing',
      primaryColor: '#FF0000',
      accentColor: '#00FF00',
      backgroundColor: '#FFFFFF',
      logoDataUrl: testLogoDataUrl, // This is the key field
      websiteUrl: 'https://debugtest.com',
      socialMedia: { facebook: '', instagram: '', twitter: '', linkedin: '' },
      contactInfo: { phone: '555-DEBUG', email: 'debug@test.com', address: '123 Debug St' },
    };
    
    console.log('2️⃣ Brand Profile Created:');
    console.log('   - Business Name:', testBrandProfile.businessName);
    console.log('   - Has Logo:', !!testBrandProfile.logoDataUrl);
    console.log('   - Logo Type:', testBrandProfile.logoDataUrl ? 'Data URL' : 'None');
    console.log('   - Logo Size:', testBrandProfile.logoDataUrl?.length || 0, 'characters\n');
    
    // Step 3: Test the Creative Studio API with detailed logging
    console.log('3️⃣ Testing Creative Studio API...');
    
    const requestPayload = {
      prompt: 'Create a professional business card design with the company logo prominently displayed',
      outputType: 'image',
      referenceAssetUrl: null,
      useBrandProfile: true, // This is critical
      brandProfile: testBrandProfile, // Pass the full brand profile
      maskDataUrl: null,
      aspectRatio: null,
      preferredModel: 'gemini-2.5-flash-image-preview'
    };
    
    console.log('   - Request Payload:');
    console.log('     * Prompt:', requestPayload.prompt);
    console.log('     * Use Brand Profile:', requestPayload.useBrandProfile);
    console.log('     * Brand Profile Business Name:', requestPayload.brandProfile?.businessName);
    console.log('     * Brand Profile Has Logo:', !!requestPayload.brandProfile?.logoDataUrl);
    console.log('     * Logo Data Length:', requestPayload.brandProfile?.logoDataUrl?.length || 0);
    
    const response = await fetch('http://localhost:3001/api/test-creative-studio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload)
    });

    const data = await response.json();
    
    console.log('\n4️⃣ API Response:');
    console.log('   - Status:', response.status);
    console.log('   - Success:', data.success);
    
    if (data.success) {
      console.log('   - Image URL:', data.result.imageUrl);
      console.log('   - AI Explanation:', data.result.aiExplanation);
      
      // Check if the AI explanation mentions the logo
      const explanation = data.result.aiExplanation?.toLowerCase() || '';
      const logoMentioned = explanation.includes('logo') || explanation.includes('brand') || explanation.includes('company');
      
      console.log('   - Logo Mentioned in Explanation:', logoMentioned);
      
      if (logoMentioned) {
        console.log('✅ SUCCESS: Logo appears to be integrated (mentioned in AI explanation)');
      } else {
        console.log('⚠️  WARNING: Logo not mentioned in AI explanation - may not be integrated');
      }
      
      // Test if the image is accessible
      if (data.result.imageUrl) {
        try {
          const imageResponse = await fetch(data.result.imageUrl, { method: 'HEAD' });
          console.log('   - Image Accessible:', imageResponse.ok);
          console.log('   - Image Size:', imageResponse.headers.get('content-length'), 'bytes');
        } catch (error) {
          console.log('   - Image Access Error:', error.message);
        }
      }
      
    } else {
      console.log('   - Error:', data.error);
      console.log('❌ FAILURE: Creative Studio API failed');
    }
    
    console.log('\n🔍 DEBUGGING SUMMARY:');
    console.log('1. Logo Data URL Created: ✅');
    console.log('2. Brand Profile with Logo: ✅');
    console.log('3. API Request Sent: ✅');
    console.log('4. API Response Received:', data.success ? '✅' : '❌');
    console.log('5. Logo Integration Status:', data.success && data.result.aiExplanation?.toLowerCase().includes('logo') ? '✅' : '❓');
    
  } catch (error) {
    console.error('❌ Debug Error:', error.message);
  }
}

debugLogoIntegration();
