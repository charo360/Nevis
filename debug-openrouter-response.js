/**
 * Debug the OpenRouter response parsing to see what's being returned
 */

const debugOpenRouterResponse = async () => {
  console.log('🔍 Debugging OpenRouter Response Parsing...\n');

  const testUrl = 'https://www.mailchimp.com';
  
  try {
    console.log(`🌐 Testing website: ${testUrl}`);
    
    const response = await fetch('http://localhost:3001/api/analyze-brand', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        websiteUrl: testUrl,
        designImageUris: []
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Response received successfully!\n');
      
      console.log('🔍 RAW RESPONSE DATA:');
      console.log('='.repeat(60));
      console.log('Type of result.data:', typeof result.data);
      console.log('Keys in result.data:', Object.keys(result.data));
      console.log('\n📄 Raw Data Sample:');
      console.log(JSON.stringify(result.data, null, 2).substring(0, 1000) + '...');
      
      console.log('\n🔍 SPECIFIC FIELD ANALYSIS:');
      console.log('='.repeat(60));
      console.log('businessName type:', typeof result.data.businessName);
      console.log('businessName value:', result.data.businessName);
      console.log('description type:', typeof result.data.description);
      console.log('description value:', result.data.description?.substring(0, 200) + '...');
      console.log('keyServices type:', typeof result.data.keyServices);
      console.log('keyServices value:', result.data.keyServices);
      console.log('detailedServiceDescriptions type:', typeof result.data.detailedServiceDescriptions);
      console.log('detailedServiceDescriptions value:', result.data.detailedServiceDescriptions);
      
      console.log('\n🔍 METADATA ANALYSIS:');
      console.log('='.repeat(60));
      if (result.data._metadata) {
        console.log('Analyzed by:', result.data._metadata.analyzedBy);
        console.log('Source:', result.data._metadata.source);
        console.log('Parse error:', result.data._metadata.parseError);
        if (result.data._metadata.rawContent) {
          console.log('Raw content sample:', result.data._metadata.rawContent.substring(0, 500) + '...');
        }
      }
      
    } else {
      console.log('❌ Analysis failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
};

// Run the debug
debugOpenRouterResponse();
