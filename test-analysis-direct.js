/**
 * Direct test of analysis endpoint
 */

async function testAnalysisDirect() {
  console.log('🔍 Testing analysis endpoint directly...');
  
  try {
    const response = await fetch('http://localhost:3001/api/analyze-brand', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        websiteUrl: 'https://shopify.com',
        designImageUris: []
      })
    });
    
    const result = await response.json();
    console.log('📊 Response Status:', response.status);
    console.log('📊 Success:', result.success);
    
    if (result.success) {
      console.log('✅ Analysis succeeded!');
      console.log('📊 Business Name:', result.data?.businessName);
      console.log('📊 Business Type:', result.data?.businessType);
      console.log('📊 Competitive Advantages:', result.data?.competitiveAdvantages);
      console.log('📊 Content Themes:', result.data?.contentThemes);
      console.log('📊 Phone:', result.data?.contactInfo?.phone);
    } else {
      console.log('❌ Error:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testAnalysisDirect().catch(console.error);
