import fetch from 'node-fetch';

async function testSingleAnalysis() {
  console.log('🔍 Testing single website analysis...');

  try {
    const response = await fetch('http://localhost:3001/api/analyze-brand', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://shopify.com'
      })
    });

    const result = await response.json();

    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📊 Success: ${result.success}`);

    if (result.success) {
      console.log(`🎯 Business Name: ${result.businessName}`);
      console.log(`🎯 Business Type: ${result.businessType}`);
      console.log(`🏆 Competitive Advantages: "${result.competitiveAdvantages}"`);
      console.log(`🎯 Content Themes: "${result.contentThemes}"`);
      console.log(`📞 Phone: "${result.contactInfo?.phone || 'none'}"`);
    } else {
      console.log(`❌ Error: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSingleAnalysis();
