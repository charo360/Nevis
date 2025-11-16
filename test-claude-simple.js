/**
 * Simple test for Claude website analysis via API
 * Tests the ZenTech Electronics site that was previously problematic
 */

// Use built-in fetch (Node.js 18+)

async function testClaudeAnalysis() {
  console.log('🧪 Testing Claude Website Analysis');
  console.log('================================');
  
  const testUrl = 'https://zentechelectronics.com/';
  const apiUrl = 'http://localhost:3001/api/analyze-website-claude';
  
  console.log(`📍 Testing URL: ${testUrl}`);
  console.log(`🔗 API Endpoint: ${apiUrl}`);
  console.log('');
  
  try {
    console.log('⏳ Sending request to Claude analyzer...');
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
      console.error('Error details:', errorData);
      return;
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ SUCCESS! Claude analysis completed');
      console.log('');
      
      const data = result.data;
      
      // Display store info
      if (data.store_info) {
        console.log('🏪 Store Information:');
        console.log(`   Name: ${data.store_info.name || 'N/A'}`);
        console.log(`   Description: ${data.store_info.description || 'N/A'}`);
        console.log('');
      }
      
      // Display product categories
      if (data.product_categories && data.product_categories.length > 0) {
        console.log('📦 Product Categories Found:');
        data.product_categories.forEach((category, index) => {
          console.log(`   ${index + 1}. ${category.category}`);
          if (category.products && category.products.length > 0) {
            console.log(`      Products: ${category.products.length}`);
            // Show first few products as examples
            category.products.slice(0, 3).forEach(product => {
              let productInfo = `      - ${product.name}`;
              if (product.price) productInfo += ` (${product.price})`;
              console.log(productInfo);
            });
            if (category.products.length > 3) {
              console.log(`      ... and ${category.products.length - 3} more`);
            }
          }
        });
        console.log('');
      } else {
        console.log('📦 No product categories found');
      }
      
      // Display payment options
      if (data.payment_options && data.payment_options.length > 0) {
        console.log('💳 Payment Options:');
        data.payment_options.forEach(option => {
          console.log(`   - ${option}`);
        });
        console.log('');
      }
      
      // Display delivery info
      if (data.delivery_info) {
        console.log('🚚 Delivery Information:');
        console.log(`   ${data.delivery_info}`);
        console.log('');
      }
      
      console.log('🎉 Test completed successfully!');
      console.log('');
      console.log('📊 Comparison with original analyzer:');
      console.log('   ❌ Original: "Wide Range of Electronics", "Competitive Pricing"');
      console.log('   ✅ Claude: Actual product categories with details');
      
    } else {
      console.error('❌ Analysis failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('💡 Make sure the development server is running:');
      console.log('   npm run dev');
    }
  }
}

// Run the test
console.log('🚀 Starting Claude Website Analysis Test');
console.log('Make sure your ANTHROPIC_API_KEY is set in .env.local');
console.log('');

testClaudeAnalysis().catch(console.error);
