/**
 * Test Universal Brand Analysis
 */

async function testUniversalBrandAnalysis() {
  console.log('🌐 Testing Universal Brand Analysis');
  console.log('==================================');
  
  const testUrl = 'https://zentechelectronics.com/';
  const apiUrl = 'http://localhost:3001/api/analyze-brand-universal';
  
  console.log(`📍 Testing URL: ${testUrl}`);
  console.log(`🔗 API Endpoint: ${apiUrl}`);
  console.log('');
  
  try {
    console.log('⏳ Sending request to universal brand analysis...');
    const startTime = Date.now();
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        websiteUrl: testUrl,
        businessType: 'auto-detect',
        useSmartExtraction: false
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
      console.log('✅ SUCCESS! Universal brand analysis completed');
      console.log('');
      console.log('🏪 Brand Information:');
      console.log(`   Business: ${result.data.businessName || 'N/A'}`);
      console.log(`   Type: ${result.data.businessType || 'N/A'}`);
      console.log(`   Industry: ${result.data.industry || 'N/A'}`);
      console.log(`   Target Audience: ${result.data.targetAudience || 'N/A'}`);
      console.log(`   Description: ${result.data.description?.substring(0, 100) || 'N/A'}...`);
      
      console.log('');
      console.log('📦 Services/Products:');
      const services = result.data.services || '';
      const serviceLines = services.split('\n').filter(line => line.trim()).slice(0, 15);
      serviceLines.forEach((line, index) => {
        console.log(`   ${index + 1}. ${line.trim()}`);
      });
      
      console.log('');
      console.log('🎯 Key Features:');
      console.log(`   ${result.data.keyFeatures || 'N/A'}`);
      
      console.log('');
      console.log('💪 Competitive Advantages:');
      console.log(`   ${result.data.competitiveAdvantages || 'N/A'}`);
      
      if (result.data.totalItemsExtracted) {
        console.log('');
        console.log('📊 Extraction Stats:');
        console.log(`   Total Items: ${result.data.totalItemsExtracted}`);
        console.log(`   Data Completeness: ${result.metadata?.dataCompleteness || 'N/A'}%`);
      }
      
      console.log('');
      console.log('🎉 Universal analysis completed!');
      
      // Check quality of extraction
      if (services.includes('KSh') || services.includes('Price:') || services.includes('--')) {
        console.log('✅ SUCCESS: Detailed product extraction with prices!');
      } else if (services.length > 100) {
        console.log('✅ GOOD: Comprehensive service extraction');
      } else {
        console.log('🤔 BASIC: Limited extraction - may need improvement');
      }
      
    } else {
      console.error('❌ Analysis failed:', result.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

console.log('🚀 Starting Universal Brand Analysis Test');
testUniversalBrandAnalysis().catch(console.error);
