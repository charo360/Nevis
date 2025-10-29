/**
 * Simple Contact Toggle Test - Focus on Contact Information Only
 */

async function testContactSimple() {
  console.log('🧪 Simple Contact Toggle Test...\n');

  const testPayload = {
    revoModel: 'revo-1.0',
    brandProfile: {
      businessName: 'Test Business',
      businessType: 'Technology',
      location: 'Kenya',
      services: [
        { name: 'Web Development', description: 'Custom websites' }
      ],
      primaryColor: '#E4574C',
      accentColor: '#2A2A2A',
      backgroundColor: '#FFFFFF',
      contactInfo: {
        phone: '+254 700 123 456',
        email: 'info@testbusiness.co.ke',
        website: 'https://testbusiness.co.ke'
      }
    },
    platform: 'instagram',
    brandConsistency: {
      strictConsistency: false,
      followBrandColors: true,
      includeContacts: true // CONTACTS ON
    },
    includePeopleInDesigns: false // Disable people to focus on contacts
  };

  try {
    console.log('📤 Testing SIMPLE contact inclusion...');
    console.log('   Contact Info Sent:');
    console.log('   📞 Phone:', testPayload.brandProfile.contactInfo.phone);
    console.log('   📧 Email:', testPayload.brandProfile.contactInfo.email);
    console.log('   🌐 Website:', testPayload.brandProfile.contactInfo.website);
    console.log('   🔧 Include Contacts:', testPayload.brandConsistency.includeContacts);
    
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

    console.log('\n✅ Content Generated Successfully!');
    console.log('📋 Content:', result.catchyWords);
    console.log('🖼️  Image generated:', !!result.imageUrl ? 'Yes ✅' : 'No ❌');
    
    if (result.imageUrl) {
      console.log('\n🔍 MANUAL CHECK REQUIRED:');
      console.log('   Look at the generated image and verify:');
      console.log('   1. Does it show "+254 700 123 456" at the bottom?');
      console.log('   2. Does it show "info@testbusiness.co.ke" at the bottom?');
      console.log('   3. Does it show "www.testbusiness.co.ke" at the bottom?');
      console.log('\n   If contacts are missing, there\'s still an issue with the contact system.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testContactSimple().catch(console.error);
