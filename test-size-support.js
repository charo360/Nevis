
const fs = require('fs');

// Mock Brand Profile
const mockBrandProfile = {
  id: 'test-brand-id',
  businessName: 'Test Business',
  businessType: 'Retail',
  location: 'Nairobi, Kenya',
  description: 'We sell quality electronics.',
  contactInfo: {
    phone: '+254700000000',
    email: 'info@test.com',
    address: 'Nairobi'
  },
  primaryColor: '#FF0000',
  accentColor: '#00FF00',
  backgroundColor: '#FFFFFF',
  visualStyle: 'modern'
};

async function testSizeSupport() {
  console.log('🚀 Testing Revo 2.0 Size Support...');

  try {
    // This is a simulation since we can't easily import server actions in a standalone script without proper Next.js context setup usually.
    // Instead, we'll verify the logic by running a fetch against the local API if the server is running.
    
    const sizesToTest = [
      { name: 'Square', sizeParam: 'square', expectedRatio: '1:1' },
      { name: 'Portrait', sizeParam: 'portrait', expectedRatio: '9:16' },
      { name: 'Landscape', sizeParam: 'landscape', expectedRatio: '16:9' }
    ];

    for (const testCase of sizesToTest) {
      console.log(`\n📏 Testing size: ${testCase.name} (${testCase.sizeParam})...`);
      
      const response = await fetch('http://localhost:3001/api/quick-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revoModel: 'revo-2.0',
          platform: 'instagram',
          brandProfile: mockBrandProfile,
          size: testCase.sizeParam,
          brandConsistency: { strictConsistency: false, followBrandColors: true, includeContacts: false }
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success for ${testCase.name}!`);
        // In a real integration test we would check if the image URL actually has the dimensions, 
        // but here we just check if the API accepted it and returned success.
        // We can inspect server logs to see if "Target Aspect Ratio" was logged correctly.
      } else {
        console.error(`❌ Failed for ${testCase.name}:`, await response.text());
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSizeSupport();
