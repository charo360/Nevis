/**
 * Test the brand analysis action to see if it's using Claude
 */

async function testBrandAction() {
  console.log('🧪 Testing Brand Analysis Action');
  console.log('================================');
  
  const testUrl = 'https://zentechelectronics.com/';
  const apiUrl = 'http://localhost:3001/api/analyze-brand';
  
  console.log(`📍 Testing URL: ${testUrl}`);
  console.log(`🔗 API Endpoint: ${apiUrl}`);
  console.log('');
  
  try {
    console.log('⏳ Sending request to brand analysis...');
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
      console.log('✅ SUCCESS! Brand analysis completed');
      console.log('');
      console.log('🏪 Brand Information:');
      console.log(`   Business: ${result.data.businessName || 'N/A'}`);
      console.log(`   Type: ${result.data.businessType || 'N/A'}`);
      console.log(`   Description: ${result.data.description?.substring(0, 100) || 'N/A'}...`);
      
      console.log('');
      console.log('📦 Services/Products:');
      const services = result.data.services || '';
      const serviceLines = services.split('\n').filter(line => line.trim()).slice(0, 10);
      serviceLines.forEach((line, index) => {
        console.log(`   ${index + 1}. ${line.trim()}`);
      });
      
      console.log('');
      console.log('\n🎯 Key Features:');
      console.log('   ' + result.data.keyFeatures);
      
      if (result.data.visualStyle) {
        console.log('\n🎨 Visual Style:');
        console.log('   ' + result.data.visualStyle);
      }
      
      if (result.data.writingTone) {
        console.log('\n✍️  Writing Tone:');
        console.log('   ' + result.data.writingTone);
      }
      
      console.log('\n🎉 Analysis completed!');
      console.log('');
      
      // Check if it's using Claude (should show actual products, not marketing slogans)
      if (services.includes('Apple Devices') || services.includes('Smartphones') || services.includes('Laptops')) {
        console.log('✅ SUCCESS: Using Claude analyzer - showing actual products!');
      } else if (services.includes('Retail Sales') || services.includes('Wide Range') || services.includes('Customer Support')) {
        console.log('❌ STILL USING OLD ANALYZER: Showing marketing slogans instead of products');
      } else {
        console.log('🤔 UNCLEAR: Check the services output above');
      }
      
    } else {
      console.error('❌ Analysis failed:', result.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

console.log('🚀 Starting Brand Action Test');
testBrandAction().catch(console.error);
