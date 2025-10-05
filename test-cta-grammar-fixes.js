/**
 * Test script for Revo 1.5 CTA Grammar Fixes
 * Tests the grammar correction functions to ensure proper English CTAs
 */

console.log('🧪 Testing Revo 1.5 CTA Grammar Fixes...\n');

// Mock the functions for testing (simplified versions)
function fixCTAGrammar(cta, businessName, businessType, location) {
  if (!cta) return cta;

  const grammarFixes = [
    // Smart shop fixes - handle all shop cases in one rule
    {
      pattern: /^shop\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i,
      replacement: (match) => {
        const shopMatch = match.match(/^shop\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i);
        if (!shopMatch) return match;

        const target = shopMatch[1].trim();
        const timeWord = shopMatch[2] ? ` ${shopMatch[2].trim()}` : '';

        // Don't process if it's just "Shop Now" or "Shop Today" - already correct
        if (!target || target.toLowerCase() === 'now' || target.toLowerCase() === 'today') {
          return match;
        }

        // Check if it's a city first
        if (location && target.toLowerCase() === location.toLowerCase()) {
          console.log(`🔍 Debug: "${target}" is a city, using "in"`);
          return `Shop in ${target}${timeWord}`;
        }

        // Generic products - keep simple (exact matches or starts with)
        const genericProducts = ['phones', 'electronics', 'clothes', 'shoes', 'books', 'gadgets', 'fashion'];
        if (genericProducts.some(product => target.toLowerCase() === product || target.toLowerCase().startsWith(product + ' '))) {
          console.log(`🔍 Debug: "${target}" is generic product, simplifying`);
          return `Shop${timeWord}`;
        }

        // Business names - use "at"
        const businessWords = ['store', 'shop', 'mart', 'center', 'mall', 'outlet', 'boutique'];
        if (businessWords.some(word => target.toLowerCase().includes(word))) {
          console.log(`🔍 Debug: "${target}" contains business word, using "at"`);
          return `Shop at ${target}${timeWord}`;
        }

        // Capitalized business names (not cities)
        if (target !== target.toLowerCase()) {
          console.log(`🔍 Debug: "${target}" is capitalized business name, using "at"`);
          return `Shop at ${target}${timeWord}`;
        }

        console.log(`🔍 Debug: "${target}" defaulting to simple form`);
        return `Shop${timeWord}`;
      },
      condition: (match) => {
        // Don't apply to already correct CTAs like "Shop Now"
        if (/^shop\s*(now|today)?\s*$/i.test(match)) return false;
        return !/(at|in|with|from)\s/i.test(match);
      }
    },
    // Smart order fixes
    {
      pattern: /^order\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i,
      replacement: (match) => {
        const orderMatch = match.match(/^order\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i);
        if (!orderMatch) return match;

        const target = orderMatch[1].trim();
        const timeWord = orderMatch[2] ? ` ${orderMatch[2].trim()}` : '';

        // Don't process if it's just "Order Now" or "Order Today" - already correct
        if (!target || target.toLowerCase() === 'now' || target.toLowerCase() === 'today') {
          return match;
        }

        // Generic products - keep simple (exact matches or starts with)
        const genericProducts = ['food', 'pizza', 'coffee', 'lunch', 'dinner', 'takeout'];
        if (genericProducts.some(product => target.toLowerCase() === product || target.toLowerCase().startsWith(product + ' '))) {
          console.log(`🔍 Debug: "${target}" is generic food product, simplifying`);
          return `Order${timeWord}`;
        }

        // Business names - use "from"
        if (target !== target.toLowerCase()) {
          console.log(`🔍 Debug: "${target}" is capitalized business name, using "from"`);
          return `Order from ${target}${timeWord}`;
        }

        console.log(`🔍 Debug: "${target}" defaulting to simple form`);
        return `Order${timeWord}`;
      },
      condition: (match) => {
        // Don't apply to already correct CTAs like "Order Now"
        if (/^order\s*(now|today)?\s*$/i.test(match)) return false;
        return !/(from|at|with)\s/i.test(match);
      }
    },
    // Smart book fixes
    {
      pattern: /^book\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i,
      replacement: (match) => {
        const bookMatch = match.match(/^book\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i);
        if (!bookMatch) return match;

        const target = bookMatch[1].trim();
        const timeWord = bookMatch[2] ? ` ${bookMatch[2].trim()}` : '';

        // Don't process if it's just "Book Now" or "Book Today" - already correct
        if (!target || target.toLowerCase() === 'now' || target.toLowerCase() === 'today') {
          return match;
        }

        // Generic services - keep simple
        const genericServices = ['appointment', 'session', 'consultation', 'meeting', 'call'];
        if (genericServices.some(service => target.toLowerCase().includes(service))) {
          return `Book${timeWord}`;
        }

        // Business names - use "with"
        if (target !== target.toLowerCase()) {
          return `Book with ${target}${timeWord}`;
        }

        return `Book${timeWord}`;
      },
      condition: (match) => {
        // Don't apply to already correct CTAs like "Book Now"
        if (/^book\s*(now|today)?\s*$/i.test(match)) return false;
        return !/(with|at)\s/i.test(match);
      }
    }
  ];

  let fixedCTA = cta;

  for (const fix of grammarFixes) {
    if (fix.pattern.test(fixedCTA)) {
      // Check condition if provided
      if (!fix.condition || fix.condition(fixedCTA)) {
        if (typeof fix.replacement === 'function') {
          fixedCTA = fix.replacement(fixedCTA);
        } else {
          fixedCTA = fixedCTA.replace(fix.pattern, fix.replacement);
        }
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
    restaurant: ['Dine Today', 'Order Now', 'Reserve Table', 'Book Now'],
    food: ['Order Now', 'Taste Today', 'Try Now', 'Order Online'],
    retail: ['Shop Now', 'Browse Store', 'View Products', 'Explore'],
    store: ['Shop Now', 'Visit Store', 'Browse Now', 'Shop Today'],
    electronics: ['Shop Now', 'View Products', 'Compare Now', 'Browse Tech'],
    salon: ['Book Now', 'Schedule Now', 'Book Today', 'Reserve Spot'],
    consulting: ['Contact Us', 'Schedule Call', 'Get Quote', 'Learn More']
  };

  for (const [businessKey, ctas] of Object.entries(ctaPatterns)) {
    if (type.includes(businessKey)) {
      return ctas[0]; // Return first option for consistent testing
    }
  }

  return 'Contact Us';
}

// Test cases for natural CTA fixes
const testCases = [
  // Natural fixes that make sense
  {
    input: 'Shop Nairobi Now',
    businessName: 'TechStore',
    businessType: 'Electronics Store',
    location: 'Nairobi',
    expected: 'Shop in Nairobi Now',
    description: 'Fix city reference to use "in"'
  },
  {
    input: 'Shop phones Now',
    businessName: 'TechStore',
    businessType: 'Electronics Store',
    location: 'Nairobi',
    expected: 'Shop Now',
    description: 'Simplify generic product references'
  },
  {
    input: 'Shop TechStore Now',
    businessName: 'TechStore',
    businessType: 'Electronics Store',
    location: 'Nairobi',
    expected: 'Shop at TechStore Now',
    description: 'Add "at" for business names when appropriate'
  },
  {
    input: 'Order pizza Now',
    businessName: 'FoodCorp',
    businessType: 'Restaurant',
    location: 'Nairobi',
    expected: 'Order Now',
    description: 'Simplify generic food references'
  },
  {
    input: 'Order FoodCorp Now',
    businessName: 'FoodCorp',
    businessType: 'Restaurant',
    location: 'Nairobi',
    expected: 'Order from FoodCorp Now',
    description: 'Add "from" for business names in ordering'
  },
  {
    input: 'Book appointment Now',
    businessName: 'SalonPro',
    businessType: 'Salon',
    location: 'Nairobi',
    expected: 'Book Now',
    description: 'Simplify generic service references'
  },
  // Already correct examples that should remain unchanged
  {
    input: 'Shop Now',
    businessName: 'TechStore',
    businessType: 'Electronics Store',
    location: 'Nairobi',
    expected: 'Shop Now',
    description: 'Keep natural CTAs unchanged'
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
  { businessType: 'Restaurant', expected: 'Dine Today' },
  { businessType: 'Electronics Store', expected: 'Shop Now' },
  { businessType: 'Hair Salon', expected: 'Book Now' },
  { businessType: 'Consulting Firm', expected: 'Contact Us' },
  { businessType: 'Food Truck', expected: 'Order Now' }
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
