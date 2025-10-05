/**
 * Debug script to test CTA grammar fixes in server context
 */

console.log('🔍 Testing CTA Grammar Fixes in Server Context...\n');

// Mock the functions as they would appear in the server
function fixCTAGrammar(cta, businessName, businessType, location) {
  if (!cta) return cta;

  const ctaLower = cta.toLowerCase();
  const type = businessType.toLowerCase();
  
  // Smart grammar fixes that use natural English
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
          return `Shop in ${target}${timeWord}`;
        }
        
        // Generic products - keep simple (exact matches or starts with)
        const genericProducts = ['phones', 'electronics', 'clothes', 'shoes', 'books', 'gadgets', 'fashion'];
        if (genericProducts.some(product => target.toLowerCase() === product || target.toLowerCase().startsWith(product + ' '))) {
          return `Shop${timeWord}`;
        }
        
        // If it looks like a business name (contains business words), use "at"
        const businessWords = ['store', 'shop', 'mart', 'center', 'mall', 'outlet', 'boutique', 'emporium'];
        if (businessWords.some(word => target.toLowerCase().includes(word))) {
          return `Shop at ${target}${timeWord}`;
        }
        
        // If it's clearly a brand/business name (capitalized), use "at"
        if (target !== target.toLowerCase()) {
          return `Shop at ${target}${timeWord}`;
        }
        
        // Default: keep it simple
        return `Shop${timeWord}`;
      },
      condition: (match) => {
        // Don't apply to already correct CTAs like "Shop Now"
        if (/^shop\s*(now|today)?\s*$/i.test(match)) return false;
        // Only if no preposition exists
        return !/(at|in|with|from)\s/i.test(match);
      }
    }
  ];

  let fixedCTA = cta;
  
  for (const fix of grammarFixes) {
    if (fix.pattern.test(fixedCTA)) {
      // Check condition if provided
      if (!fix.condition || fix.condition(fixedCTA)) {
        const originalCTA = fixedCTA;
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

// Test cases that might be causing server issues
const testCases = [
  {
    input: 'Shop Now',
    businessName: 'Zentech Electronics Kenya',
    businessType: 'ecommerce',
    location: 'Kenya',
    description: 'Should remain unchanged'
  },
  {
    input: 'Shop Zentech Now',
    businessName: 'Zentech Electronics Kenya',
    businessType: 'ecommerce',
    location: 'Kenya',
    description: 'Should add "at"'
  },
  {
    input: 'Shop Kenya Now',
    businessName: 'Zentech Electronics Kenya',
    businessType: 'ecommerce',
    location: 'Kenya',
    description: 'Should add "in" for location'
  },
  {
    input: 'Shop electronics Now',
    businessName: 'Zentech Electronics Kenya',
    businessType: 'ecommerce',
    location: 'Kenya',
    description: 'Should simplify to "Shop Now"'
  }
];

console.log('🧪 Testing CTA fixes with server-like data:\n');

testCases.forEach((testCase, index) => {
  try {
    console.log(`Test ${index + 1}: ${testCase.description}`);
    console.log(`Input: "${testCase.input}"`);
    
    const result = fixCTAGrammar(
      testCase.input,
      testCase.businessName,
      testCase.businessType,
      testCase.location
    );
    
    console.log(`Output: "${result}"`);
    console.log('✅ Success\n');
    
  } catch (error) {
    console.error(`❌ Error in test ${index + 1}:`, error);
    console.error('Stack:', error.stack);
    console.log('');
  }
});

console.log('🎯 All tests completed. If no errors above, the CTA grammar fixes should work in the server.');
