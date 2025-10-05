/**
 * Test runtime errors that might be causing the 500 error
 */

console.log('🔍 Testing Server Runtime Environment...\n');

// Test the exact data structure from the browser logs
const testBrandProfile = {
  businessName: 'Zentech Electronics Kenya',
  businessType: 'ecommerce',
  location: 'Kenya',
  services: 'ecommerce\nLogitech Signature MK650 Keyboard and Mouse Combo For Business (920-011004)\nLogitech MeetUp Mic Extension Cable 10m (950-000005)-Price in Kenya\nLogitech Rally Bar Video Conferencing -Price in Kenya\nLogitech MeetUp 2 Conferencing System-Price in Kenya\nDell Latitude 5490\nDell Latitude 3189\nDell Latitude E7270\nDell Latitude 5290\nDell Latitude E5480\nSamsung Galaxy Note 20 Ultra\nSamsung Galaxy Note 20\nSamsung Galaxy S23 Ultra\nSamsung Galaxy S24 Ultra 512GB\nHollyland Lark M2S Ultimate Combo in Kenya\nHollyland Lark A1 Wireless Microphone\nRefurbished Dell Latitude 7280\nDell Latitude E7450\nRefurbished Dell Latitude E7240\nDell Inspiron 7440\nDell XPS 13 9370\nDell Latitude 7420 x360\nDell Latitude 7410\nDell Latitude 7400\nDell Latitude 7300\niPhone 16e\nSamsung Galaxy S25 Series\nLipa Pole Pole Phones\nSpeakers\nSmartwatches'
};

// Test the CTA grammar function with various inputs
function testCTAGrammar() {
  console.log('🧪 Testing CTA Grammar Function...\n');

  const testCases = [
    'Shop Now',
    'Shop Zentech Now',
    'Shop Kenya Now',
    'Shop electronics Now',
    'Order Now',
    'Order FoodCorp Now',
    'Book Now',
    'Contact Us',
    null,
    undefined,
    '',
    'Shop',
    'Order',
    'Book'
  ];

  testCases.forEach((testCTA, index) => {
    try {
      console.log(`Test ${index + 1}: Testing CTA "${testCTA}"`);
      
      // Mock the fixCTAGrammar function logic
      if (!testCTA) {
        console.log(`  Result: "${testCTA}" (unchanged - falsy value)`);
        return;
      }

      // Test regex patterns
      const shopPattern = /^shop\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i;
      const orderPattern = /^order\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i;
      const bookPattern = /^book\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i;

      if (shopPattern.test(testCTA)) {
        console.log(`  Matches shop pattern`);
        const match = testCTA.match(shopPattern);
        if (match) {
          console.log(`  Target: "${match[1]}", Time: "${match[2] || 'none'}"`);
        }
      } else if (orderPattern.test(testCTA)) {
        console.log(`  Matches order pattern`);
      } else if (bookPattern.test(testCTA)) {
        console.log(`  Matches book pattern`);
      } else {
        console.log(`  No pattern match - would remain unchanged`);
      }

      console.log(`  ✅ Success\n`);

    } catch (error) {
      console.error(`  ❌ Error in test ${index + 1}:`, error.message);
      console.error(`  Stack:`, error.stack);
      console.log('');
    }
  });
}

// Test JSON parsing and object access
function testDataStructures() {
  console.log('🧪 Testing Data Structure Access...\n');

  try {
    console.log('Testing brand profile access:');
    console.log(`  businessName: "${testBrandProfile.businessName}"`);
    console.log(`  businessType: "${testBrandProfile.businessType}"`);
    console.log(`  location: "${testBrandProfile.location}"`);
    console.log(`  services length: ${testBrandProfile.services?.length || 0}`);
    console.log('  ✅ Brand profile access successful\n');

    // Test potential undefined access
    console.log('Testing potential undefined access:');
    console.log(`  logoDataUrl: ${testBrandProfile.logoDataUrl || 'undefined'}`);
    console.log(`  logoUrl: ${testBrandProfile.logoUrl || 'undefined'}`);
    console.log(`  primaryColor: ${testBrandProfile.primaryColor || 'undefined'}`);
    console.log('  ✅ Undefined access handled correctly\n');

  } catch (error) {
    console.error('❌ Error in data structure test:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Test array operations
function testArrayOperations() {
  console.log('🧪 Testing Array Operations...\n');

  try {
    const genericProducts = ['phones', 'electronics', 'clothes', 'shoes', 'books', 'gadgets', 'fashion'];
    const testTargets = ['phones', 'electronics', 'TechStore', 'FoodCorp', 'Kenya'];

    testTargets.forEach(target => {
      const isGeneric = genericProducts.some(product => 
        target.toLowerCase() === product || target.toLowerCase().startsWith(product + ' ')
      );
      console.log(`  "${target}" is generic: ${isGeneric}`);
    });

    console.log('  ✅ Array operations successful\n');

  } catch (error) {
    console.error('❌ Error in array operations:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run all tests
console.log('🚀 Starting Runtime Tests...\n');

testCTAGrammar();
testDataStructures();
testArrayOperations();

console.log('🎯 All runtime tests completed. If no errors above, the issue might be elsewhere.');
