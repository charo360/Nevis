/**
 * Debug Revo 1.0 Contact Information Issue
 * Test to see why only website is showing when contacts toggle is enabled
 */

console.log('🔍 Debugging Revo 1.0 Contact Information Issue...\n');

// Test brand profile with explicit contact information
const testBrandProfile = {
  id: 'debug-contacts-123',
  businessName: 'Contact Debug Test',
  businessType: 'Financial Technology',
  location: 'Nairobi, Kenya',
  description: 'Testing contact information display in Revo 1.0',
  
  // EXPLICIT CONTACT INFORMATION
  contactInfo: {
    phone: '+254-700-555-1234',
    email: 'debug@contacttest.com',
    address: 'Test Address, Nairobi'
  },
  websiteUrl: 'https://contacttest.com',
  
  // Also test legacy format
  phone: '+254-700-555-1234',
  email: 'debug@contacttest.com',
  
  primaryColor: '#FF6B35',
  accentColor: '#004E89',
  backgroundColor: '#F7F9FB',
  visualStyle: 'modern'
};

const enabledBrandConsistency = {
  strictConsistency: false,
  followBrandColors: true,
  includeContacts: true  // CONTACTS TOGGLE ENABLED
};

async function debugRevo10Contacts() {
  console.log('🔍 Testing Revo 1.0 Contact Information Flow...');
  
  try {
    const response = await fetch('http://localhost:3001/api/quick-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        revoModel: 'revo-1.0',
        platform: 'instagram',
        brandProfile: testBrandProfile,
        brandConsistency: enabledBrandConsistency,
        useLocalLanguage: false,
        scheduledServices: [],
        includePeopleInDesigns: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Debug Test Error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Debug Test Response received');
    console.log('📊 Result Analysis:', {
      hasContent: !!result.content,
      hasVariants: !!result.variants,
      hasImageUrl: !!(result.variants?.[0]?.imageUrl)
    });

    console.log('\n🔍 Expected Contact Information in Image:');
    console.log('- Phone: +254-700-555-1234');
    console.log('- Email: debug@contacttest.com');
    console.log('- Website: www.contacttest.com');
    
    console.log('\n📋 Check Server Logs For:');
    console.log('1. "📞 [QuickContent] Contact Info Validation:" - API layer validation');
    console.log('2. "📞 [Revo 1.0] Contact Information Debug:" - Service layer extraction');
    console.log('3. "📞 [Revo 1.0] Contact Instructions Added:" - Prompt integration');
    
    console.log('\n🎯 Key Debug Points:');
    console.log('- finalContactInfo should show phone and email');
    console.log('- finalWebsiteUrl should show website');
    console.log('- hasValidContacts should be true');
    console.log('- willIncludeContacts should be true');
    console.log('- contactInstructions should include all three contact details');

    return result;

  } catch (error) {
    console.error('❌ Debug Test Error:', error.message);
  }
}

// Test with different contact info structures
async function testContactInfoStructures() {
  console.log('\n🧪 Testing Different Contact Info Structures...');
  
  // Test 1: Only contactInfo object
  const test1Profile = {
    ...testBrandProfile,
    contactInfo: {
      phone: '+254-111-111-111',
      email: 'test1@example.com',
      address: 'Test 1 Address'
    },
    websiteUrl: 'https://test1.com',
    // Remove legacy fields
    phone: undefined,
    email: undefined
  };
  
  // Test 2: Only legacy fields
  const test2Profile = {
    ...testBrandProfile,
    contactInfo: undefined,
    phone: '+254-222-222-222',
    email: 'test2@example.com',
    websiteUrl: 'https://test2.com'
  };
  
  // Test 3: Mixed structure
  const test3Profile = {
    ...testBrandProfile,
    contactInfo: {
      phone: '+254-333-333-333',
      email: 'test3@example.com'
    },
    websiteUrl: 'https://test3.com',
    phone: '+254-444-444-444', // Different from contactInfo
    email: 'different@example.com' // Different from contactInfo
  };
  
  console.log('📋 Test Structures:');
  console.log('Test 1 - Only contactInfo object:', {
    contactInfo: test1Profile.contactInfo,
    websiteUrl: test1Profile.websiteUrl,
    legacyPhone: test1Profile.phone,
    legacyEmail: test1Profile.email
  });
  
  console.log('Test 2 - Only legacy fields:', {
    contactInfo: test2Profile.contactInfo,
    websiteUrl: test2Profile.websiteUrl,
    legacyPhone: test2Profile.phone,
    legacyEmail: test2Profile.email
  });
  
  console.log('Test 3 - Mixed structure:', {
    contactInfo: test3Profile.contactInfo,
    websiteUrl: test3Profile.websiteUrl,
    legacyPhone: test3Profile.phone,
    legacyEmail: test3Profile.email
  });
  
  console.log('\n🎯 Expected Behavior:');
  console.log('- API should extract contact info from both sources');
  console.log('- Revo 1.0 should receive all contact details');
  console.log('- Generated image should show phone, email, and website');
}

// Run debug tests
async function runDebugTests() {
  console.log('🚀 Starting Revo 1.0 Contact Information Debug Tests\n');
  
  await testContactInfoStructures();
  await debugRevo10Contacts();
  
  console.log('\n✅ Debug tests completed!');
  console.log('\n🔍 Next Steps:');
  console.log('1. Check the server logs for the debug messages');
  console.log('2. Verify that all contact details are being extracted correctly');
  console.log('3. Check if the AI prompt includes all contact information');
  console.log('4. Examine the generated image to see which contacts appear');
}

runDebugTests().catch(console.error);
