/**
 * Test the simple Claude API route
 */

async function testSimpleAPI() {
  console.log('🧪 Testing Simple Claude API');
  console.log('============================');
  
  const testUrl = 'https://zentechelectronics.com/';
  const apiUrl = 'http://localhost:3001/api/test-claude-simple';
  
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
        websiteUrl: testUrl
      })
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`⏱️  Response time: ${executionTime}ms`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('Error details:', errorData);
      return;
    }
    
    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('✅ SUCCESS! Claude analysis completed');
      console.log('');
      console.log('🏪 Extracted Data:');
      console.log(`   Business: ${result.data.business_name || 'N/A'}`);
      console.log(`   Type: ${result.data.business_type || 'N/A'}`);
      console.log(`   Description: ${result.data.description || 'N/A'}`);
      
      if (result.data.products_or_services && result.data.products_or_services.length > 0) {
        console.log('   Products/Services:');
        result.data.products_or_services.forEach((item, index) => {
          console.log(`     ${index + 1}. ${item}`);
        });
      }
      
      console.log('');
      console.log('🎉 Test completed successfully!');
      console.log('');
      console.log('📊 This should show actual product categories like:');
      console.log('   ✅ "Smartphones", "Laptops", "TVs"');
      console.log('   ❌ NOT "Wide Range of Electronics", "Competitive Pricing"');
      
    } else {
      console.log('📝 Raw Claude Response:');
      console.log(result.raw_response);
      
      if (!result.success) {
        console.error('❌ Analysis failed:', result.error);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

console.log('🚀 Starting Simple Claude API Test');
testSimpleAPI().catch(console.error);
