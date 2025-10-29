/**
 * Test Contact Toggle - Email, Phone, and Website Inclusion
 */

async function testContactToggle() {
  console.log('🧪 Testing Contact Toggle (Email, Phone, Website)...\n');

  const testPayload = {
    revoModel: 'revo-1.0',
    brandProfile: {
      businessName: 'Paya',
      businessType: 'Financial Technology (Fintech)',
      location: 'Kenya',
      services: [
        { name: 'Digital Banking', description: 'Mobile banking services' },
        { name: 'Buy Now Pay Later', description: 'Flexible payment plans' }
      ],
      primaryColor: '#E4574C',
      accentColor: '#2A2A2A',
      backgroundColor: '#FFFFFF',
      contactInfo: {
        phone: '+254 700 123 456',
        email: 'support@paya.co.ke',
        website: 'https://paya.co.ke'
      }
    },
    platform: 'instagram',
    brandConsistency: {
      strictConsistency: true,
      followBrandColors: true,
      includeContacts: true // CONTACTS TOGGLE ON - should include all contact info
    },
    includePeopleInDesigns: true
  };

  try {
    console.log('📤 Testing with CONTACTS TOGGLE ON...');
    console.log('   Expected contacts in image:');
    console.log('   📞 Phone: +254 700 123 456');
    console.log('   📧 Email: support@paya.co.ke');
    console.log('   🌐 Website: www.paya.co.ke');
    
    const response = await fetch('http://localhost:3001/api/quick-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.log('❌ API Error:', result.error);
      return;
    }

    console.log('✅ Content Generated Successfully!\n');
    
    console.log('📋 Generated Content:');
    console.log('   Headline:', result.catchyWords);
    console.log('   Subheadline:', result.subheadline);
    console.log('   CTA:', result.callToAction);
    
    console.log('\n🔍 Contact Toggle Verification:');
    
    // Check if image was generated
    const hasImage = !!result.imageUrl;
    console.log('   🖼️  Image generated:', hasImage ? 'Yes ✅' : 'No ❌');
    
    if (hasImage) {
      console.log('\n📞 Expected Contact Information in Image:');
      console.log('   ✅ Should include: +254 700 123 456 (phone)');
      console.log('   ✅ Should include: support@paya.co.ke (email)');
      console.log('   ✅ Should include: www.paya.co.ke (website)');
      console.log('   📍 Should be placed at bottom of image');
      console.log('   📝 Should be clearly readable');
      
      console.log('\n🎯 Manual Verification Required:');
      console.log('   1. Check if phone number appears in image');
      console.log('   2. Check if email address appears in image');
      console.log('   3. Check if website appears in image');
      console.log('   4. Verify contacts are at bottom of image');
      console.log('   5. Ensure all contacts are readable');
    }

    // Test with contacts OFF
    console.log('\n🔄 Testing with CONTACTS TOGGLE OFF...');
    
    const testPayloadOff = {
      ...testPayload,
      brandConsistency: {
        ...testPayload.brandConsistency,
        includeContacts: false // CONTACTS TOGGLE OFF
      }
    };

    const responseOff = await fetch('http://localhost:3001/api/quick-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayloadOff)
    });

    const resultOff = await responseOff.json();

    if (responseOff.ok) {
      console.log('✅ Content Generated (Contacts OFF)');
      const hasImageOff = !!resultOff.imageUrl;
      console.log('   🖼️  Image generated:', hasImageOff ? 'Yes ✅' : 'No ❌');
      
      if (hasImageOff) {
        console.log('\n🚫 Expected Behavior (Contacts OFF):');
        console.log('   ❌ Should NOT include phone number');
        console.log('   ❌ Should NOT include email address');
        console.log('   ❌ Should NOT include website');
        console.log('   ✅ Should only show business content');
      }
    } else {
      console.log('❌ Contacts OFF test failed:', resultOff.error);
    }

    console.log('\n🎯 Summary:');
    console.log('   - Contact toggle should control inclusion of ALL contact types');
    console.log('   - When ON: Include phone + email + website');
    console.log('   - When OFF: Include no contact information');
    console.log('   - Contacts should appear at bottom of image when included');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testContactToggle().catch(console.error);
