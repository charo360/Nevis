/**
 * Test API Response Directly
 */

const testBrandProfile = {
  businessName: "Bella Vista Restaurant",
  businessType: "restaurant",
  location: "New York, NY",
  targetAudience: "Food lovers and families",
  brandVoice: "warm and inviting",
  services: ["Fine dining", "Catering", "Private events"],
  keyFeatures: ["Fresh ingredients", "Authentic recipes", "Cozy atmosphere"],
  competitiveAdvantages: ["Chef expertise", "Local sourcing", "Customer satisfaction"]
};

async function testAPI() {
  console.log('Testing API response directly...\n');

  try {
    const response = await fetch('http://localhost:3001/api/generate-revo-2.0', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessType: testBrandProfile.businessType,
        platform: 'instagram',
        brandProfile: testBrandProfile,
        visualStyle: 'modern',
        aspectRatio: '1:1'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('=== RAW API RESPONSE ===');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAPI();
