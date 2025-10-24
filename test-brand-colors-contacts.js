/**
 * Test Brand Colors and Contact Information in Revo 1.0 and Revo 1.5
 */

console.log('🧪 Testing Brand Colors and Contact Information...\n');

// Test data with explicit brand colors and contact information
const testBrandProfile = {
  id: 'test-brand-123',
  businessName: 'Test Colors & Contacts',
  businessType: 'Financial Technology',
  location: 'Nairobi, Kenya',
  description: 'Testing brand colors and contact information display',
  services: 'Mobile payments\nDigital wallets\nFinancial services',
  targetAudience: 'Tech-savvy individuals and businesses',
  
  // EXPLICIT BRAND COLORS
  primaryColor: '#FF6B35',      // Orange
  accentColor: '#004E89',       // Blue  
  backgroundColor: '#F7F9FB',   // Light gray
  
  // EXPLICIT CONTACT INFORMATION
  contactInfo: {
    phone: '+254-700-123456',
    email: 'info@testcolors.com',
    address: 'Nairobi CBD, Kenya'
  },
  websiteUrl: 'https://testcolors.com',
  
  visualStyle: 'modern',
  logoDataUrl: null,
  logoUrl: null
};

const testBrandConsistency = {
  strictConsistency: false,
  followBrandColors: true,    // COLORS TOGGLE ENABLED
  includeContacts: true       // CONTACTS TOGGLE ENABLED
};

async function testRevo10Colors() {
  console.log('🎨 Testing Revo 1.0 with Colors and Contacts enabled...');
  
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
        brandConsistency: testBrandConsistency,
        useLocalLanguage: false,
        scheduledServices: [],
        includePeopleInDesigns: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Revo 1.0 API Error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Revo 1.0 Response received');
    console.log('📊 Result structure:', {
      hasContent: !!result.content,
      hasVariants: !!result.variants,
      variantsCount: result.variants?.length || 0,
      hasImageUrl: !!(result.variants?.[0]?.imageUrl),
      imageUrlType: result.variants?.[0]?.imageUrl?.startsWith('data:') ? 'data URL' : 
                   result.variants?.[0]?.imageUrl?.startsWith('http') ? 'HTTP URL' : 'unknown'
    });

    // Check if brand colors were logged in the generation process
    console.log('🎨 Brand Colors Test:', {
      primaryColor: testBrandProfile.primaryColor,
      accentColor: testBrandProfile.accentColor,
      backgroundColor: testBrandProfile.backgroundColor,
      followBrandColors: testBrandConsistency.followBrandColors
    });

    // Check if contact information was logged
    console.log('📞 Contact Information Test:', {
      includeContacts: testBrandConsistency.includeContacts,
      phone: testBrandProfile.contactInfo.phone,
      email: testBrandProfile.contactInfo.email,
      website: testBrandProfile.websiteUrl
    });

    console.log('📝 Generated Content Preview:', {
      content: result.content?.substring(0, 100) + '...',
      hashtags: result.hashtags?.slice(0, 3),
      catchyWords: result.catchyWords,
      subheadline: result.subheadline,
      callToAction: result.callToAction
    });

  } catch (error) {
    console.error('❌ Revo 1.0 Test Error:', error.message);
  }
}

async function testRevo15Colors() {
  console.log('\n🎨 Testing Revo 1.5 with Colors and Contacts enabled...');
  
  try {
    const response = await fetch('http://localhost:3001/api/quick-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        revoModel: 'revo-1.5',
        platform: 'instagram',
        brandProfile: testBrandProfile,
        brandConsistency: testBrandConsistency,
        useLocalLanguage: false,
        scheduledServices: [],
        includePeopleInDesigns: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Revo 1.5 API Error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Revo 1.5 Response received');
    console.log('📊 Result structure:', {
      hasContent: !!result.content,
      hasVariants: !!result.variants,
      variantsCount: result.variants?.length || 0,
      hasImageUrl: !!(result.variants?.[0]?.imageUrl),
      imageUrlType: result.variants?.[0]?.imageUrl?.startsWith('data:') ? 'data URL' : 
                   result.variants?.[0]?.imageUrl?.startsWith('http') ? 'HTTP URL' : 'unknown'
    });

    console.log('📝 Generated Content Preview:', {
      content: result.content?.substring(0, 100) + '...',
      hashtags: result.hashtags?.slice(0, 3),
      catchyWords: result.catchyWords,
      subheadline: result.subheadline,
      callToAction: result.callToAction
    });

  } catch (error) {
    console.error('❌ Revo 1.5 Test Error:', error.message);
  }
}

async function testColorsDisabled() {
  console.log('\n🚫 Testing with Colors and Contacts DISABLED...');
  
  const disabledBrandConsistency = {
    strictConsistency: false,
    followBrandColors: false,   // COLORS TOGGLE DISABLED
    includeContacts: false      // CONTACTS TOGGLE DISABLED
  };
  
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
        brandConsistency: disabledBrandConsistency,
        useLocalLanguage: false,
        scheduledServices: [],
        includePeopleInDesigns: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Disabled Test API Error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Disabled Test Response received');
    console.log('🚫 Settings Test:', {
      followBrandColors: disabledBrandConsistency.followBrandColors,
      includeContacts: disabledBrandConsistency.includeContacts,
      shouldNotUseBrandColors: 'Colors should be generic/default',
      shouldNotIncludeContacts: 'No contact info should appear in image'
    });

  } catch (error) {
    console.error('❌ Disabled Test Error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Brand Colors and Contact Information Tests\n');
  
  await testRevo10Colors();
  await testRevo15Colors();
  await testColorsDisabled();
  
  console.log('\n✅ All tests completed!');
  console.log('\n📋 What to check:');
  console.log('1. Look at the server logs for color and contact debug messages');
  console.log('2. Check if the generated images use the specified brand colors:');
  console.log('   - Primary: #FF6B35 (Orange)');
  console.log('   - Accent: #004E89 (Blue)');
  console.log('   - Background: #F7F9FB (Light gray)');
  console.log('3. Check if contact information appears in the images:');
  console.log('   - Phone: +254-700-123456');
  console.log('   - Email: info@testcolors.com');
  console.log('   - Website: www.testcolors.com');
  console.log('4. Compare with disabled test to see the difference');
}

runAllTests().catch(console.error);
