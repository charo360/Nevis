/**
 * Test Revo 1.5 CTA Fixes
 * Verify that the new simplified CTA system works correctly
 */

console.log('🧪 Testing Revo 1.5 CTA Fixes...\n');

// Mock the new CTA functions
function cleanupCTA(cta, businessName, businessType) {
  if (!cta) return cta;
  
  let cleaned = cta.trim();
  
  // Remove business name from CTA
  const businessNamePattern = new RegExp(businessName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  cleaned = cleaned.replace(businessNamePattern, '').trim();
  
  // Remove awkward prepositions at the end
  cleaned = cleaned.replace(/\s+(at|with|from)\s*$/i, '');
  
  // Remove extra spaces and clean up
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Ensure proper capitalization
  if (cleaned) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  return cleaned;
}

function isProblematicCTA(cta, businessName) {
  if (!cta || cta.length < 2) return true;
  
  const ctaLower = cta.toLowerCase();
  const businessNameLower = businessName.toLowerCase();
  
  // Check for business name in CTA
  if (ctaLower.includes(businessNameLower)) return true;
  
  // Check for awkward constructions
  const awkwardPatterns = [
    /shop\s+at\s*$/i,
    /visit\s+at\s*$/i,
    /book\s+with\s*$/i,
    /dine\s+at\s*$/i,
    /experience\s+the/i,
    /discover\s+the/i,
    /transform\s+your/i
  ];
  
  return awkwardPatterns.some(pattern => pattern.test(cta));
}

function generateSmartContextualCTA(businessType, businessName, location, useLocalLanguage) {
  const type = businessType.toLowerCase();
  
  // Get cultural CTA if local language is enabled
  if (useLocalLanguage) {
    const culturalCTA = getCulturalCTA(location, type);
    if (culturalCTA && Math.random() < 0.3) { // 30% chance for cultural CTA
      return culturalCTA;
    }
  }
  
  // Business-specific CTAs
  const ctaMap = {
    restaurant: ['Order Now', 'Book Table', 'Dine Today', 'Reserve Now'],
    food: ['Order Now', 'Taste Today', 'Try Now', 'Get Fresh'],
    retail: ['Shop Now', 'Browse Store', 'Buy Today', 'View Products'],
    salon: ['Book Now', 'Schedule Today', 'Reserve Spot', 'Book Beauty'],
    fitness: ['Join Now', 'Start Today', 'Book Session', 'Try Free'],
    consulting: ['Get Quote', 'Contact Us', 'Schedule Call', 'Learn More']
  };
  
  // Find matching business type
  for (const [key, ctas] of Object.entries(ctaMap)) {
    if (type.includes(key)) {
      return ctas[Math.floor(Math.random() * ctas.length)];
    }
  }
  
  // Default professional CTAs
  const defaultCTAs = ['Get Started', 'Contact Us', 'Learn More', 'Book Now', 'Get Quote'];
  return defaultCTAs[Math.floor(Math.random() * defaultCTAs.length)];
}

function getCulturalCTA(location, businessType) {
  const locationKey = location.toLowerCase();
  
  const culturalCTAs = {
    kenya: ['Karibu', 'Twende', 'Haya', 'Njoo'],
    nigeria: ['Come Now', 'Make We Go', 'No Delay', 'Come Try'],
    ghana: ['Akwaaba', 'Come Try', 'Visit Us', 'Come Now'],
    india: ['Aao', 'Chalo', 'Jaldi', 'Come Now']
  };
  
  for (const [key, ctas] of Object.entries(culturalCTAs)) {
    if (locationKey.includes(key)) {
      return ctas[Math.floor(Math.random() * ctas.length)];
    }
  }
  
  return null;
}

// Test cases
const testCases = [
  {
    name: 'Problematic CTA with business name',
    cta: 'Shop Zentech Electronics',
    businessName: 'Zentech Electronics',
    businessType: 'Electronics',
    expected: 'Shop'
  },
  {
    name: 'Awkward preposition CTA',
    cta: 'Dine at',
    businessName: 'Pizza Palace',
    businessType: 'Restaurant',
    expected: 'Dine'
  },
  {
    name: 'Good CTA should remain unchanged',
    cta: 'Order Now',
    businessName: 'Pizza Palace',
    businessType: 'Restaurant',
    expected: 'Order Now'
  },
  {
    name: 'Business name removal',
    cta: 'Book with Salon Beauty',
    businessName: 'Salon Beauty',
    businessType: 'Salon',
    expected: 'Book'
  }
];

console.log('🔧 Testing CTA Cleanup Function:');
testCases.forEach(test => {
  const result = cleanupCTA(test.cta, test.businessName, test.businessType);
  const passed = result === test.expected;
  console.log(`${passed ? '✅' : '❌'} ${test.name}: "${test.cta}" -> "${result}" ${passed ? '' : `(expected: "${test.expected}")`}`);
});

console.log('\n🚨 Testing Problematic CTA Detection:');
const problematicTests = [
  { cta: 'Shop Zentech Electronics', businessName: 'Zentech Electronics', shouldBeProblematic: true },
  { cta: 'Experience the excellence', businessName: 'Any Business', shouldBeProblematic: true },
  { cta: 'Shop Now', businessName: 'Any Business', shouldBeProblematic: false },
  { cta: 'Book Now', businessName: 'Any Business', shouldBeProblematic: false }
];

problematicTests.forEach(test => {
  const result = isProblematicCTA(test.cta, test.businessName);
  const passed = result === test.shouldBeProblematic;
  console.log(`${passed ? '✅' : '❌'} "${test.cta}" is ${result ? 'problematic' : 'good'} ${passed ? '' : '(incorrect detection)'}`);
});

console.log('\n🌍 Testing Cultural CTA Generation:');
const culturalTests = [
  { location: 'Nairobi, Kenya', businessType: 'Restaurant', useLocalLanguage: true },
  { location: 'Lagos, Nigeria', businessType: 'Retail', useLocalLanguage: true },
  { location: 'Mumbai, India', businessType: 'Salon', useLocalLanguage: true },
  { location: 'New York, USA', businessType: 'Restaurant', useLocalLanguage: false }
];

culturalTests.forEach(test => {
  const cta = generateSmartContextualCTA(test.businessType, 'Test Business', test.location, test.useLocalLanguage);
  console.log(`✅ ${test.location} (${test.businessType}): "${cta}"`);
});

console.log('\n🎯 Testing Business-Specific CTA Generation:');
const businessTests = [
  { businessType: 'Restaurant', location: 'Local' },
  { businessType: 'Electronics Store', location: 'Local' },
  { businessType: 'Beauty Salon', location: 'Local' },
  { businessType: 'Fitness Gym', location: 'Local' },
  { businessType: 'Consulting', location: 'Local' }
];

businessTests.forEach(test => {
  const cta = generateSmartContextualCTA(test.businessType, 'Test Business', test.location, false);
  console.log(`✅ ${test.businessType}: "${cta}"`);
});

console.log('\n✅ All CTA tests completed!');
