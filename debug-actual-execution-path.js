/**
 * Debug Actual Execution Path for Revo 1.0 Content Generation
 * This will help us understand which code path is actually being used
 */

console.log('🔍 Debugging Actual Execution Path for Revo 1.0...\n');

// Test brand profile with complete contact information
const testBrandProfile = {
  id: 'execution-path-test',
  businessName: 'Execution Path Test Company',
  businessType: 'Financial Technology',
  location: 'Nairobi, Kenya',
  description: 'Testing which execution path is actually used for Revo 1.0',
  
  // COMPLETE CONTACT INFORMATION
  contactInfo: {
    phone: '+254-700-EXECUTION',
    email: 'path@executiontest.com',
    address: 'Execution Path Street, Nairobi'
  },
  websiteUrl: 'https://executiontest.com',
  
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

async function testActualExecutionPath() {
  console.log('🧪 Testing Actual Execution Path for Revo 1.0...');
  console.log('📋 Expected Contact Details in Image:');
  console.log('  📞 Phone: +254-700-EXECUTION');
  console.log('  📧 Email: path@executiontest.com');
  console.log('  🌐 Website: www.executiontest.com');
  console.log('');
  
  console.log('🔍 Testing which path is actually used by the UI...');
  console.log('');
  
  // Test 1: Direct API call to /api/quick-content (what I was fixing)
  console.log('📡 Test 1: Direct /api/quick-content call (Revo 1.0)');
  try {
    const response1 = await fetch('http://localhost:3001/api/quick-content', {
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

    if (response1.ok) {
      const result1 = await response1.json();
      console.log('✅ /api/quick-content (Revo 1.0) - SUCCESS');
      console.log('📊 Result:', {
        hasContent: !!result1.content,
        hasImageUrl: !!result1.variants?.[0]?.imageUrl,
        model: result1.metadata?.model
      });
    } else {
      console.log('❌ /api/quick-content (Revo 1.0) - FAILED:', response1.status);
    }
  } catch (error) {
    console.log('❌ /api/quick-content (Revo 1.0) - ERROR:', error.message);
  }
  
  console.log('');
  
  // Test 2: Direct API call to /api/quick-content (Revo 1.5)
  console.log('📡 Test 2: Direct /api/quick-content call (Revo 1.5)');
  try {
    const response2 = await fetch('http://localhost:3001/api/quick-content', {
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

    if (response2.ok) {
      const result2 = await response2.json();
      console.log('✅ /api/quick-content (Revo 1.5) - SUCCESS');
      console.log('📊 Result:', {
        hasContent: !!result2.content,
        hasImageUrl: !!result2.variants?.[0]?.imageUrl,
        model: result2.metadata?.model
      });
    } else {
      console.log('❌ /api/quick-content (Revo 1.5) - FAILED:', response2.status);
    }
  } catch (error) {
    console.log('❌ /api/quick-content (Revo 1.5) - ERROR:', error.message);
  }
  
  console.log('');
  console.log('🔍 Key Questions to Answer:');
  console.log('1. Which API endpoint does the Quick Content UI actually call?');
  console.log('2. Does it call /api/quick-content or use server actions?');
  console.log('3. Are the server actions routing to the correct Revo 1.0 functions?');
  console.log('4. Is the contact information being passed correctly through the chain?');
  
  console.log('');
  console.log('🎯 Expected Server Log Messages:');
  console.log('For /api/quick-content (Revo 1.0):');
  console.log('- "📞 [QuickContent] Contact Info Validation:"');
  console.log('- "📞 [Revo 1.0] Contact Information Debug:"');
  console.log('- "📞 [Revo 1.0] Contact Instructions Added:"');
  
  console.log('');
  console.log('For /api/quick-content (Revo 1.5):');
  console.log('- "📞 [QuickContent] Contact Info Validation:"');
  console.log('- "📞 [Revo 1.5] Contact Information Debug:"');
  console.log('- "📞 [Revo 1.5] Contact Instructions Added:"');
  
  console.log('');
  console.log('🚨 CRITICAL FINDING:');
  console.log('The Quick Content UI calls generateRevo15ContentAction() for BOTH Revo 1.0 and Revo 1.5!');
  console.log('This means my fixes to /api/quick-content might not be used by the UI.');
  console.log('The UI might be using server actions instead of direct API calls.');
  
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Check server logs to see which debug messages appear');
  console.log('2. Verify if generateRevo15ContentAction() properly handles Revo 1.0');
  console.log('3. Fix the contact information in the actual code path being used');
  console.log('4. Test with the UI to confirm the fixes work');
}

// Run the execution path test
testActualExecutionPath().catch(console.error);
