/**
 * Contact Debug Tool - Check what contact data is being passed to Revo 1.0
 */

async function testContactDebug() {
  console.log('🔍 Testing Contact Data Flow to Revo 1.0...\n');

  const testPayload = {
    revoModel: 'revo-1.0',
    brandProfile: {
      businessName: 'Test Business',
      businessType: 'Test Service',
      location: 'Test Location',
      contactInfo: {
        phone: '+1 (555) 123-4567',
        email: 'test@business.com',
        address: '123 Test St, Test City'
      },
      websiteUrl: 'https://testbusiness.com'
    },
    platform: 'instagram',
    brandConsistency: {
      strictConsistency: false,
      followBrandColors: true,
      includeContacts: true // CONTACTS TOGGLE ON
    },
    includePeopleInDesigns: false
  };

  try {
    console.log('📤 Sending test payload with contact data:');
    console.log('   📞 Phone:', testPayload.brandProfile.contactInfo.phone);
    console.log('   📧 Email:', testPayload.brandProfile.contactInfo.email);
    console.log('   🌐 Website:', testPayload.brandProfile.websiteUrl);
    console.log('   🏠 Address:', testPayload.brandProfile.contactInfo.address);
    console.log('   🔘 Include Contacts:', testPayload.brandConsistency.includeContacts);
    
    const response = await fetch('http://localhost:3001/api/quick-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Request failed:', response.status, errorText);
      return;
    }

    const result = await response.json();
    
    console.log('\n✅ Generation successful!');
    console.log('📸 Image URL:', result.imageUrl);
    console.log('📝 Content:', result.content);
    console.log('\n🔍 Check the generated image to see if contacts appear in the footer.');
    console.log('Expected contacts in image:');
    console.log('   📞 +1 (555) 123-4567');
    console.log('   📧 test@business.com');
    console.log('   🌐 www.testbusiness.com');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testContactDebug().catch(console.error);
