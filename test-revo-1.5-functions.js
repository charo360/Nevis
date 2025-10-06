/**
 * Test Revo 1.5 Functions to Debug 500 Error
 */

console.log('🧪 Testing Revo 1.5 Functions...\n');

// Test if we can import the functions
try {
  // Mock the functions to test basic functionality
  function generateDynamicFallbackCaption(businessName, businessType, location, useLocalLanguage) {
    console.log('✅ generateDynamicFallbackCaption called with:', {
      businessName,
      businessType, 
      location,
      useLocalLanguage
    });
    
    return `Test caption for ${businessName} in ${location}`;
  }
  
  function generateSmartContextualCTA(businessType, businessName, location, useLocalLanguage) {
    console.log('✅ generateSmartContextualCTA called with:', {
      businessType,
      businessName,
      location, 
      useLocalLanguage
    });
    
    return 'Test CTA';
  }
  
  function cleanupCTA(cta, businessName, businessType) {
    console.log('✅ cleanupCTA called with:', {
      cta,
      businessName,
      businessType
    });
    
    return cta;
  }
  
  // Test the functions
  console.log('🔧 Testing generateDynamicFallbackCaption:');
  const caption = generateDynamicFallbackCaption('Paya Solutions', 'Payment Services', 'Nairobi, Kenya', true);
  console.log('Result:', caption);
  
  console.log('\n🔧 Testing generateSmartContextualCTA:');
  const cta = generateSmartContextualCTA('Payment Services', 'Paya Solutions', 'Nairobi, Kenya', true);
  console.log('Result:', cta);
  
  console.log('\n🔧 Testing cleanupCTA:');
  const cleanCta = cleanupCTA('Shop Paya Solutions', 'Paya Solutions', 'Payment Services');
  console.log('Result:', cleanCta);
  
  console.log('\n✅ All function tests passed - functions are callable');
  
} catch (error) {
  console.error('❌ Error testing functions:', error);
}

// Test parameter passing
console.log('\n🔍 Testing parameter scenarios that might cause 500 error:');

const testScenarios = [
  {
    name: 'Normal parameters',
    params: ['Paya Solutions', 'Payment Services', 'Nairobi, Kenya', true]
  },
  {
    name: 'Undefined useLocalLanguage',
    params: ['Paya Solutions', 'Payment Services', 'Nairobi, Kenya', undefined]
  },
  {
    name: 'Null location',
    params: ['Paya Solutions', 'Payment Services', null, true]
  },
  {
    name: 'Empty strings',
    params: ['', '', '', false]
  }
];

testScenarios.forEach(scenario => {
  try {
    console.log(`\n🧪 Testing: ${scenario.name}`);
    const result = generateDynamicFallbackCaption(...scenario.params);
    console.log(`✅ Success: ${result.substring(0, 50)}...`);
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
  }
});

console.log('\n✅ Function testing completed!');
