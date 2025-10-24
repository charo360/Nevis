/**
 * Test Contact Information Fix for Revo 1.0 and Revo 1.5
 * Verify that ALL contact details (phone, email, website) appear in generated images
 */

console.log('🔧 Testing Contact Information Fix...\n');

// Test brand profile with complete contact information
const testBrandProfile = {
  id: 'contact-fix-test',
  businessName: 'Complete Contact Test',
  businessType: 'Financial Services',
  location: 'Nairobi, Kenya',
  description: 'Testing complete contact information display',
  
  // COMPLETE CONTACT INFORMATION
  contactInfo: {
    phone: '+254-700-CONTACT',
    email: 'all@contactfix.com',
    address: 'Contact Fix Street, Nairobi'
  },
  websiteUrl: 'https://contactfix.com',
  
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

async function testContactInfoFix() {
  console.log('🧪 Testing Contact Information Fix...');
  console.log('📋 Expected Contact Details in Image:');
  console.log('  📞 Phone: +254-700-CONTACT');
  console.log('  📧 Email: all@contactfix.com');
  console.log('  🌐 Website: www.contactfix.com');
  console.log('');
  
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
      console.error('❌ Contact Fix Test Error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Contact Fix Test Response received');
    console.log('📊 Result Analysis:', {
      hasContent: !!result.content,
      hasVariants: !!result.variants,
      hasImageUrl: !!(result.variants?.[0]?.imageUrl),
      imageUrlLength: result.variants?.[0]?.imageUrl?.length || 0
    });

    console.log('\n🔍 Check Server Logs For Enhanced Debugging:');
    console.log('1. "📞 [QuickContent] Contact Info Validation:" - API validation');
    console.log('2. "📞 [Revo 1.0] Contact Information Debug:" - Service extraction');
    console.log('3. "📞 [Revo 1.0] Contact Instructions Added:" - Prompt integration');
    console.log('4. "📞 [Revo 1.0] Contact Details Validation:" - Final validation');
    
    console.log('\n🎯 Key Validation Points:');
    console.log('- contactDetailsCount should be 3 (phone, email, website)');
    console.log('- actualPhone should show: +254-700-CONTACT');
    console.log('- actualEmail should show: all@contactfix.com');
    console.log('- actualWebsite should show: https://contactfix.com');
    console.log('- promptContainsAllDetails should be true');

    return result;

  } catch (error) {
    console.error('❌ Contact Fix Test Error:', error.message);
  }
}

async function testRevo15ContactFix() {
  console.log('\n🧪 Testing Revo 1.5 Contact Information Fix...');
  
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
        includePeopleInDesigns: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Revo 1.5 Contact Fix Test Error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Revo 1.5 Contact Fix Test Response received');
    console.log('📊 Result Analysis:', {
      hasContent: !!result.content,
      hasVariants: !!result.variants,
      hasImageUrl: !!(result.variants?.[0]?.imageUrl),
      imageUrlLength: result.variants?.[0]?.imageUrl?.length || 0
    });

    console.log('\n🔍 Check Server Logs For Revo 1.5 Enhanced Debugging:');
    console.log('1. "📞 [Revo 1.5] Contact Information Debug:" - Service extraction');
    console.log('2. "📞 [Revo 1.5] Contact Instructions Added:" - Prompt integration');
    console.log('3. "📞 [Revo 1.5] Contact Details Validation:" - Final validation');

    return result;

  } catch (error) {
    console.error('❌ Revo 1.5 Contact Fix Test Error:', error.message);
  }
}

// Run comprehensive contact fix tests
async function runContactFixTests() {
  console.log('🚀 Starting Contact Information Fix Tests\n');
  console.log('🎯 Test Objective:');
  console.log('Verify that ALL contact details (phone, email, website) appear in generated images');
  console.log('Previously: Only website was showing');
  console.log('Expected: Phone, email, AND website should all be visible\n');
  
  const revo10Result = await testContactInfoFix();
  const revo15Result = await testRevo15ContactFix();
  
  console.log('\n✅ Contact Fix Tests completed!');
  console.log('\n📋 What to Verify:');
  console.log('1. Check the generated images for ALL three contact details');
  console.log('2. Verify server logs show proper contact extraction and validation');
  console.log('3. Confirm contact details appear at the bottom of the images');
  console.log('4. Ensure contact info is clearly readable and professionally integrated');
  
  console.log('\n🔧 Fixes Applied:');
  console.log('✅ Fixed prompt formatting issue (missing line break)');
  console.log('✅ Added explicit instruction to include ALL contact details');
  console.log('✅ Added validation checklist in the AI prompt');
  console.log('✅ Enhanced debugging to track contact detail processing');
  console.log('✅ Added contact details count validation');
  
  console.log('\n🎯 Expected Results:');
  console.log('- Phone: +254-700-CONTACT should appear in image');
  console.log('- Email: all@contactfix.com should appear in image');
  console.log('- Website: www.contactfix.com should appear in image');
  console.log('- All three should be at the bottom of the image');
  
  return {
    revo10Result,
    revo15Result
  };
}

runContactFixTests().catch(console.error);
