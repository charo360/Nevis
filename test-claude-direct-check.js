/**
 * Direct test of Claude website analysis to check response
 */

async function testDirect() {
  console.log('🔍 Testing Claude Website Analysis Direct');
  console.log('==========================================');
  
  const testUrl = 'https://zentechelectronics.com/';
  const apiUrl = 'http://localhost:3001/api/analyze-website-claude';
  
  console.log(`📍 Testing URL: ${testUrl}`);
  console.log(`🔗 API Endpoint: ${apiUrl}`);
  console.log('');
  
  try {
    console.log('⏳ Sending request...');
    const startTime = Date.now();
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        websiteUrl: testUrl,
        analysisType: 'products'
      })
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`⏱️  Response time: ${executionTime}ms`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('Error details:', JSON.stringify(errorData, null, 2));
      return;
    }
    
    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('✅ SUCCESS! Analysis completed');
      console.log('\n📊 Data structure:');
      console.log('   - Products:', result.data.products?.length || 0);
      console.log('   - Visual Style:', result.data.visual_style || 'Not provided');
      console.log('   - Writing Tone:', result.data.writing_tone || 'Not provided');
      
      if (result.data.products && result.data.products.length > 0) {
        console.log('\n🛍️ First 3 Products:');
        result.data.products.slice(0, 3).forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} - ${product.price}`);
        });
      }
    } else {
      console.error('❌ Analysis failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

console.log('🚀 Starting Direct Claude Test');
testDirect().catch(console.error);
