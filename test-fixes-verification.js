/**
 * Comprehensive Test for Brand Colors and Contact Information Fixes
 * Tests both Revo 1.0 and Revo 1.5 with enhanced debugging
 */

console.log('🧪 Testing Enhanced Brand Colors and Contact Information Fixes...\n');

// Test brand profile with explicit colors and contact info
const testBrandProfile = {
  id: 'test-brand-fixes',
  businessName: 'ColorTest Finance',
  businessType: 'Financial Technology',
  location: 'Nairobi, Kenya',
  description: 'Testing enhanced brand colors and contact information fixes',
  services: 'Mobile payments\nDigital banking\nFinancial consulting',
  targetAudience: 'Small businesses and individuals',
  
  // EXPLICIT BRAND COLORS - These should appear in the generated images
  primaryColor: '#FF6B35',      // Bright Orange - should be dominant (60%)
  accentColor: '#004E89',       // Navy Blue - should be secondary (30%)
  backgroundColor: '#F7F9FB',   // Light Blue-Gray - should be base (10%)
  
  // EXPLICIT CONTACT INFORMATION - These should appear in the generated images
  contactInfo: {
    phone: '+254-700-987654',
    email: 'contact@colortest.co.ke',
    address: 'Westlands, Nairobi'
  },
  websiteUrl: 'https://colortest.co.ke',
  
  visualStyle: 'modern',
  logoDataUrl: null,
  logoUrl: null
};

// Test with both toggles enabled
const enabledBrandConsistency = {
  strictConsistency: false,
  followBrandColors: true,    // COLORS TOGGLE ENABLED
  includeContacts: true       // CONTACTS TOGGLE ENABLED
};

// Test with both toggles disabled
const disabledBrandConsistency = {
  strictConsistency: false,
  followBrandColors: false,   // COLORS TOGGLE DISABLED
  includeContacts: false      // CONTACTS TOGGLE DISABLED
};

async function testRevo10WithFixes() {
  console.log('🎨 Testing Revo 1.0 with Enhanced Fixes (Colors + Contacts ENABLED)...');
  
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
        includePeopleInDesigns: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Revo 1.0 Enhanced Test Error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Revo 1.0 Enhanced Test - Response received');
    console.log('📊 Result Analysis:', {
      hasContent: !!result.content,
      hasVariants: !!result.variants,
      variantsCount: result.variants?.length || 0,
      hasImageUrl: !!(result.variants?.[0]?.imageUrl),
      imageUrlLength: result.variants?.[0]?.imageUrl?.length || 0
    });

    console.log('🎨 Expected Brand Colors in Image:', {
      primaryColor: testBrandProfile.primaryColor + ' (Orange - should dominate)',
      accentColor: testBrandProfile.accentColor + ' (Navy Blue - highlights)',
      backgroundColor: testBrandProfile.backgroundColor + ' (Light Gray - base)'
    });

    console.log('📞 Expected Contact Info in Image:', {
      phone: testBrandProfile.contactInfo.phone,
      email: testBrandProfile.contactInfo.email,
      website: testBrandProfile.websiteUrl
    });

    return result;

  } catch (error) {
    console.error('❌ Revo 1.0 Enhanced Test Error:', error.message);
  }
}

async function testRevo15WithFixes() {
  console.log('\n🎨 Testing Revo 1.5 with Enhanced Fixes (Colors + Contacts ENABLED)...');
  
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
        brandConsistency: enabledBrandConsistency,
        useLocalLanguage: false,
        scheduledServices: [],
        includePeopleInDesigns: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Revo 1.5 Enhanced Test Error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Revo 1.5 Enhanced Test - Response received');
    console.log('📊 Result Analysis:', {
      hasContent: !!result.content,
      hasVariants: !!result.variants,
      variantsCount: result.variants?.length || 0,
      hasImageUrl: !!(result.variants?.[0]?.imageUrl),
      imageUrlLength: result.variants?.[0]?.imageUrl?.length || 0
    });

    return result;

  } catch (error) {
    console.error('❌ Revo 1.5 Enhanced Test Error:', error.message);
  }
}

async function testDisabledToggles() {
  console.log('\n🚫 Testing with Colors and Contacts DISABLED (Control Test)...');
  
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
      console.error('❌ Disabled Test Error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Disabled Test - Response received');
    console.log('🚫 Expected Behavior:', {
      shouldNotUseBrandColors: 'Should use generic/default colors instead of brand colors',
      shouldNotIncludeContacts: 'Should NOT include phone, email, or website in the image',
      followBrandColors: disabledBrandConsistency.followBrandColors,
      includeContacts: disabledBrandConsistency.includeContacts
    });

    return result;

  } catch (error) {
    console.error('❌ Disabled Test Error:', error.message);
  }
}

// Run comprehensive tests
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Brand Colors and Contact Information Tests\n');
  console.log('🎯 Test Objectives:');
  console.log('1. Verify brand colors are applied when Colors toggle is enabled');
  console.log('2. Verify contact information appears when Contacts toggle is enabled');
  console.log('3. Verify enhanced debugging logs are working');
  console.log('4. Compare enabled vs disabled behavior\n');
  
  const revo10Result = await testRevo10WithFixes();
  const revo15Result = await testRevo15WithFixes();
  const disabledResult = await testDisabledToggles();
  
  console.log('\n✅ All tests completed!');
  console.log('\n📋 What to check in the server logs:');
  console.log('1. Look for "🎨 [Revo 1.0] Brand Colors Debug:" messages');
  console.log('2. Look for "📞 [Revo 1.0] Contact Information Debug:" messages');
  console.log('3. Look for "🎨 [Revo 1.5] Brand Colors Debug:" messages');
  console.log('4. Look for "📞 [Revo 1.5] Contact Information Debug:" messages');
  console.log('5. Look for "🎨 [QuickContent] Brand Colors Validation:" messages');
  console.log('6. Look for "📞 [QuickContent] Contact Info Validation:" messages');
  
  console.log('\n🎨 Expected Visual Results:');
  console.log('- Images should prominently feature Orange (#FF6B35) as primary color');
  console.log('- Images should use Navy Blue (#004E89) for accents and highlights');
  console.log('- Images should have Light Blue-Gray (#F7F9FB) as background');
  console.log('- Contact info should appear at bottom: +254-700-987654, contact@colortest.co.ke, www.colortest.co.ke');
  
  console.log('\n🔍 Debug Information:');
  console.log('- Check if hasValidColors: true in the logs');
  console.log('- Check if hasValidContacts: true in the logs');
  console.log('- Check if willIncludeContacts: true in the logs');
  console.log('- Verify final colors match the input colors');
  
  return {
    revo10Result,
    revo15Result,
    disabledResult
  };
}

runComprehensiveTests().catch(console.error);
