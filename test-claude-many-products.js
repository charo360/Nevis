/**
 * Test Claude extraction with emphasis on many products
 */

async function testManyProducts() {
  console.log('🛍️ Testing Many Products Extraction');
  console.log('===================================');
  
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
      console.log('✅ SUCCESS! Product extraction completed');
      
      const products = result.data.products || [];
      console.log(`\n📦 Total Products Extracted: ${products.length}`);
      
      if (products.length > 0) {
        console.log('\n🛍️ Product List:');
        products.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name}`);
          if (product.price) {
            console.log(`      Price: ${product.price}`);
          }
          if (product.category) {
            console.log(`      Category: ${product.category}`);
          }
        });
        
        console.log(`\n🎯 Extraction Quality:`);
        console.log(`   Total Products: ${products.length}`);
        console.log(`   Products with Prices: ${products.filter(p => p.price).length}`);
        console.log(`   Products with Specs: ${products.filter(p => p.specifications && p.specifications.length > 0).length}`);
        
        if (products.length >= 10) {
          console.log('\n✅ EXCELLENT: Extracted 10+ products!');
        } else if (products.length >= 5) {
          console.log('\n✅ GOOD: Extracted 5+ products');
        } else {
          console.log('\n🤔 LIMITED: Only extracted a few products - need improvement');
        }
      }
      
    } else {
      console.error('❌ Extraction failed:', result.error);
      if (result.raw_response) {
        console.log('\n📝 Raw response preview:');
        console.log(result.raw_response.substring(0, 500));
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

console.log('🚀 Starting Many Products Test');
testManyProducts().catch(console.error);
