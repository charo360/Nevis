/**
 * Test Universal Website Extractor
 * Demonstrates comprehensive extraction from ANY website
 */

async function testUniversalExtractor() {
  console.log('🌐 Testing Universal Website Extractor');
  console.log('=====================================');
  
  const testCases = [
    {
      name: 'E-commerce Site (ZenTech Electronics)',
      url: 'https://zentechelectronics.com/',
      format: 'both'
    },
    {
      name: 'Service Provider (Paya Finance)',
      url: 'https://www.paya.co.ke/',
      format: 'formatted'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 Testing: ${testCase.name}`);
    console.log(`🔗 URL: ${testCase.url}`);
    console.log(`📊 Format: ${testCase.format}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch('http://localhost:3001/api/universal-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: testCase.url,
          format: testCase.format,
          smart: false
        })
      });
      
      const executionTime = Date.now() - startTime;
      console.log(`⏱️  Response time: ${executionTime}ms`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', response.status, response.statusText);
        console.error('Error details:', errorData);
        continue;
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ SUCCESS! Universal extraction completed');
        
        const data = result.data;
        
        // Display website analysis
        console.log('\n🔍 Website Analysis:');
        console.log(`   Type: ${data.website_type}`);
        console.log(`   Extraction Date: ${data.extraction_date}`);
        
        // Display formatted output if available
        if (data.formatted_text) {
          console.log('\n📝 Formatted Output:');
          console.log('─'.repeat(50));
          console.log(data.formatted_text.substring(0, 1000) + '...');
          console.log('─'.repeat(50));
        }
        
        // Display JSON structure if available
        if (data.json_data) {
          console.log('\n📊 JSON Structure:');
          const jsonData = data.json_data;
          
          if (jsonData.business_info) {
            console.log(`   Business: ${jsonData.business_info.name}`);
            console.log(`   Type: ${jsonData.business_info.type}`);
            console.log(`   Description: ${jsonData.business_info.description?.substring(0, 100)}...`);
          }
          
          if (jsonData.offerings && jsonData.offerings.length > 0) {
            console.log(`\n📦 Offerings Found: ${jsonData.offerings.length} categories`);
            
            jsonData.offerings.forEach((category, index) => {
              console.log(`   ${index + 1}. ${category.category} (${category.type})`);
              console.log(`      Items: ${category.items?.length || 0}`);
              
              if (category.items && category.items.length > 0) {
                const firstItem = category.items[0];
                console.log(`      Sample: ${firstItem.name}`);
                if (firstItem.pricing?.base_price?.formatted) {
                  console.log(`      Price: ${firstItem.pricing.base_price.formatted}`);
                }
              }
            });
          }
          
          if (jsonData.total_items_extracted) {
            console.log(`\n📈 Total Items Extracted: ${jsonData.total_items_extracted}`);
          }
          
          if (jsonData.special_offers && jsonData.special_offers.length > 0) {
            console.log(`\n🎁 Special Offers: ${jsonData.special_offers.length}`);
            jsonData.special_offers.forEach((offer, index) => {
              console.log(`   ${index + 1}. ${offer.title}: ${offer.description}`);
            });
          }
        }
        
        console.log('\n🎉 Test completed successfully!');
        
      } else {
        console.error('❌ Extraction failed:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }
}

async function testSmartExtraction() {
  console.log('\n🧠 Testing Smart Multi-Page Extraction');
  console.log('======================================');
  
  const testUrl = 'https://zentechelectronics.com/';
  
  try {
    console.log(`📍 Testing Smart Extraction: ${testUrl}`);
    
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3001/api/universal-extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: testUrl,
        smart: true
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
      console.log('✅ SUCCESS! Smart extraction completed');
      
      const data = result.data;
      
      console.log(`\n📊 Smart Extraction Results:`);
      console.log(`   Base URL: ${data.base_url}`);
      console.log(`   Pages Analyzed: ${data.pages_analyzed}`);
      console.log(`   Total Items: ${data.total_items}`);
      console.log(`   Categories Found: ${data.all_offerings?.length || 0}`);
      
      if (data.all_offerings && data.all_offerings.length > 0) {
        console.log('\n📦 All Categories:');
        data.all_offerings.forEach((category, index) => {
          console.log(`   ${index + 1}. ${category.category} - ${category.items?.length || 0} items`);
        });
      }
      
      console.log('\n🎉 Smart extraction completed successfully!');
      
    } else {
      console.error('❌ Smart extraction failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Smart extraction test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Universal Website Extractor Tests');
  console.log('='.repeat(70));
  
  // Test standard extraction
  await testUniversalExtractor();
  
  // Test smart extraction
  await testSmartExtraction();
  
  console.log('\n🏁 All tests completed!');
  console.log('='.repeat(70));
}

// Run the tests
runAllTests().catch(console.error);
