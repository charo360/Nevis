/**
 * Test script for Revo 1.5 CTA Grammar Fixes
 * Tests the grammar correction functions to ensure proper English CTAs
 */

console.log('🧪 Testing Revo 1.5 CTA Grammar Fixes...\n');

// Mock the functions for testing (simplified versions)
function fixCTAGrammar(cta, businessName, businessType, location) {
  if (!cta) return cta;

  const grammarFixes = [
    // Fix "Shop [City] Now" -> "Shop in [City] Now" if it matches location
    {
      pattern: /^shop\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i,
      replacement: 'Shop in $1 $2',
      condition: (match) => {
        if (/(at|in|with|from)\s/i.test(match)) return false; // Already has preposition
        const shopMatch = match.match(/^shop\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i);
        return shopMatch && location && shopMatch[1].toLowerCase().trim() === location.toLowerCase().trim();
      }
    },
    // Fix "Shop [BusinessName] Now" -> "Shop at [BusinessName] Now" (only if not already has preposition and not a city)
    {
      pattern: /^shop\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i,
      replacement: 'Shop at $1 $2',
      condition: (match) => {
        if (/(at|in|with|from)\s/i.test(match)) return false; // Already has preposition
        const shopMatch = match.match(/^shop\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i);
        // Don't apply if it's a city name
        return !(shopMatch && location && shopMatch[1].toLowerCase().trim() === location.toLowerCase().trim());
      }
    },
    // Fix "Visit [City] Now" -> "Shop in [City] Now" if it matches location
    {
      pattern: /^visit\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i,
      replacement: 'Shop in $1 $2',
      condition: (match) => {
        const cityMatch = match.match(/^visit\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i);
        return cityMatch && location && cityMatch[1].toLowerCase().trim() === location.toLowerCase().trim();
      }
    },
    // Fix "Order [BusinessName] Now" -> "Order from [BusinessName] Now" (only if not already has preposition)
    {
      pattern: /^order\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i,
      replacement: 'Order from $1 $2',
      condition: (match) => !/(from|at|with)\s/i.test(match)
    },
    // Fix "Book [BusinessName] Now" -> "Book with [BusinessName] Now" (only if not already has preposition)
    {
      pattern: /^book\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i,
      replacement: 'Book with $1 $2',
      condition: (match) => !/(with|at)\s/i.test(match)
    }
  ];

  let fixedCTA = cta;

  for (const fix of grammarFixes) {
    if (fix.pattern.test(fixedCTA)) {
      // Check condition if provided
      if (!fix.condition || fix.condition(fixedCTA)) {
        fixedCTA = fixedCTA.replace(fix.pattern, fix.replacement);
        console.log(`🔧 Fixed CTA grammar: "${cta}" -> "${fixedCTA}"`);
        break;
      }
    }
  }

  // Clean up extra spaces
  fixedCTA = fixedCTA.replace(/\s+/g, ' ').trim();

  // Ensure proper capitalization
  fixedCTA = fixedCTA.charAt(0).toUpperCase() + fixedCTA.slice(1);

  return fixedCTA;
}

function generateContextualCTA(businessType, businessName, location) {
  const type = businessType.toLowerCase();

  const ctaPatterns = {
    restaurant: ['Dine with Us', 'Order from Us', 'Reserve Table', 'Book Now'],
    food: ['Order from Us', 'Taste Today', 'Try Now', 'Order Online'],
    retail: ['Shop with Us', 'Browse Store', 'View Products', 'Shop Now'],
    store: ['Shop with Us', 'Visit Store', 'Browse Now', 'Shop Today'],
    electronics: ['Shop with Us', 'View Products', 'Compare Now', 'Browse Tech'],
    salon: ['Book with Us', 'Schedule Now', 'Book Today', 'Reserve Spot'],
    consulting: ['Contact Us', 'Schedule Call', 'Get Quote', 'Learn More']
  };

  for (const [businessKey, ctas] of Object.entries(ctaPatterns)) {
    if (type.includes(businessKey)) {
      return ctas[0]; // Return first option for consistent testing
    }
  }

  return 'Contact Us';
}

// Test cases for grammar fixes
const testCases = [
  // Current incorrect examples that should be fixed
  {
    input: 'Shop Nairobi Now',
    businessName: 'TechStore',
    businessType: 'Electronics Store',
    location: 'Nairobi',
    expected: 'Shop in Nairobi Now',
    description: 'Fix "Shop [City] Now" to "Shop in [City] Now"'
  },
  {
    input: 'Shop Zentech Now',
    businessName: 'Zentech',
    businessType: 'Electronics Store',
    location: 'Nairobi',
    expected: 'Shop at Zentech Now',
    description: 'Fix "Shop [Business] Now" to "Shop at [Business] Now"'
  },
  {
    input: 'Order FoodCorp Now',
    businessName: 'FoodCorp',
    businessType: 'Restaurant',
    location: 'Nairobi',
    expected: 'Order from FoodCorp Now',
    description: 'Fix "Order [Business] Now" to "Order from [Business] Now"'
  },
  {
    input: 'Book SalonPro Now',
    businessName: 'SalonPro',
    businessType: 'Salon',
    location: 'Nairobi',
    expected: 'Book with SalonPro Now',
    description: 'Fix "Book [Business] Now" to "Book with [Business] Now"'
  },
  // Already correct examples that should remain unchanged
  {
    input: 'Shop at TechStore Now',
    businessName: 'TechStore',
    businessType: 'Electronics Store',
    location: 'Nairobi',
    expected: 'Shop at TechStore Now',
    description: 'Keep correct grammar unchanged'
  },
  {
    input: 'Contact Us',
    businessName: 'ConsultCorp',
    businessType: 'Consulting',
    location: 'Nairobi',
    expected: 'Contact Us',
    description: 'Keep simple CTAs unchanged'
  }
];

console.log('📋 Testing Grammar Fixes:\n');

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  const result = fixCTAGrammar(
    testCase.input,
    testCase.businessName,
    testCase.businessType,
    testCase.location
  );

  const passed = result === testCase.expected;
  const status = passed ? '✅ PASS' : '❌ FAIL';

  console.log(`Test ${index + 1}: ${status}`);
  console.log(`  Description: ${testCase.description}`);
  console.log(`  Input: "${testCase.input}"`);
  console.log(`  Expected: "${testCase.expected}"`);
  console.log(`  Got: "${result}"`);
  console.log('');

  if (passed) passedTests++;
});

console.log('📋 Testing Contextual CTA Generation:\n');

const contextualTests = [
  { businessType: 'Restaurant', expected: 'Dine with Us' },
  { businessType: 'Electronics Store', expected: 'Shop with Us' },
  { businessType: 'Hair Salon', expected: 'Book with Us' },
  { businessType: 'Consulting Firm', expected: 'Contact Us' },
  { businessType: 'Food Truck', expected: 'Order from Us' }
];

contextualTests.forEach((test, index) => {
  const result = generateContextualCTA(test.businessType, 'TestBusiness', 'TestCity');
  const passed = result === test.expected;
  const status = passed ? '✅ PASS' : '❌ FAIL';

  console.log(`Contextual Test ${index + 1}: ${status}`);
  console.log(`  Business Type: ${test.businessType}`);
  console.log(`  Expected: "${test.expected}"`);
  console.log(`  Got: "${result}"`);
  console.log('');

  if (passed) passedTests++;
  totalTests++;
});

console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 All tests passed! CTA grammar fixes are working correctly.');
} else {
  console.log('⚠️ Some tests failed. Please review the grammar fix logic.');
}

console.log('\n🛡️ Grammar fixes will prevent CTAs like:');
console.log('❌ "Shop Nairobi Now" (incorrect)');
console.log('❌ "Shop Zentech Now" (incorrect)');
console.log('❌ "Order FoodCorp Now" (incorrect)');
console.log('\n✅ And generate proper CTAs like:');
console.log('✅ "Shop in Nairobi Now" (correct)');
console.log('✅ "Shop at Zentech Now" (correct)');
console.log('✅ "Order from FoodCorp Now" (correct)');
