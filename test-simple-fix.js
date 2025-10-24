/**
 * Test with a simple, reliable website to check if the fix works
 */

const testSimpleFix = async () => {
  console.log('🔧 Testing Fixed Analysis with Simple Website...\n');

  const testUrl = 'https://www.starbucks.com';
  
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
      const errorText = await response.text();
      console.log('❌ HTTP Error Response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Analysis completed successfully!\n');
      
      const data = result.data;
      
      console.log('🔍 DATA STRUCTURE CHECK:');
      console.log('='.repeat(50));
      console.log('Type of data:', typeof data);
      console.log('Is data an object?', typeof data === 'object' && data !== null);
      console.log('Data keys:', Object.keys(data));
      
      console.log('\n🏢 BASIC BUSINESS INFO:');
      console.log('='.repeat(50));
      console.log(`Business Name: ${data.businessName}`);
      console.log(`Business Type: ${data.businessType}`);
      console.log(`Description Length: ${(data.description || '').length} chars`);
      console.log(`Services Length: ${(data.services || '').length} chars`);
      
      console.log('\n📞 CONTACT CHECK:');
      console.log('='.repeat(50));
      console.log('Contact Info Type:', typeof data.contactInfo);
      if (data.contactInfo) {
        console.log('Contact Keys:', Object.keys(data.contactInfo));
      }
      
      console.log('\n📱 SOCIAL MEDIA CHECK:');
      console.log('='.repeat(50));
      console.log('Social Media Type:', typeof data.socialMedia);
      if (data.socialMedia) {
        console.log('Social Keys:', Object.keys(data.socialMedia));
        const socialCount = Object.values(data.socialMedia).filter(v => v && v !== '').length;
        console.log('Social Links Found:', socialCount);
      }
      
      console.log('\n✅ ANALYSIS STATUS:');
      console.log('='.repeat(50));
      
      const hasBasicInfo = data.businessName && data.businessType && data.description;
      const hasServices = data.services && data.services.length > 50;
      const hasContact = data.contactInfo && typeof data.contactInfo === 'object';
      const hasSocial = data.socialMedia && typeof data.socialMedia === 'object';
      
      console.log(`Basic Info: ${hasBasicInfo ? '✅' : '❌'}`);
      console.log(`Services: ${hasServices ? '✅' : '❌'}`);
      console.log(`Contact Structure: ${hasContact ? '✅' : '❌'}`);
      console.log(`Social Structure: ${hasSocial ? '✅' : '❌'}`);
      
      if (hasBasicInfo && hasServices && hasContact && hasSocial) {
        console.log('\n🎉 SUCCESS: Analysis is working properly!');
      } else {
        console.log('\n⚠️  PARTIAL: Some issues remain');
      }
      
    } else {
      console.log('❌ Analysis failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testSimpleFix();
