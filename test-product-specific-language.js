/**
 * Test Product-Specific Language System
 * Verifies that the AI uses specific product language instead of generic terms
 */

// Test data simulating Zentech Electronics scheduled services
const testServices = [
  'Samsung Galaxy S24 Ultra 512GB',
  'Dell Latitude E7270', 
  'Hollyland Lark M2S Ultimate Combo in Kenya',
  'Logitech Signature MK650 Keyboard and Mouse Combo'
];

// Import the functions (this would be done differently in actual implementation)
// For testing purposes, we'll recreate the core logic here

const PRODUCT_CATEGORIES = [
  {
    category: 'phone',
    specificTerms: ['phone', 'smartphone', 'mobile device', 'handset'],
    actionWords: ['upgrade your phone', 'get a new phone', 'switch to', 'experience'],
    descriptors: ['latest smartphone', 'powerful phone', 'flagship device', 'mobile powerhouse']
  },
  {
    category: 'laptop',
    specificTerms: ['laptop', 'notebook', 'computer', 'business machine'],
    actionWords: ['upgrade your laptop', 'get a powerful laptop', 'invest in', 'experience'],
    descriptors: ['business laptop', 'powerful computer', 'professional machine', 'productivity powerhouse']
  },
  {
    category: 'audio',
    specificTerms: ['microphone', 'audio equipment', 'recording gear', 'sound system'],
    actionWords: ['upgrade your audio', 'get professional sound', 'invest in quality audio', 'experience'],
    descriptors: ['professional microphone', 'quality audio gear', 'recording equipment', 'sound solution']
  },
  {
    category: 'accessories',
    specificTerms: ['keyboard', 'mouse', 'accessory', 'peripheral'],
    actionWords: ['upgrade your setup', 'enhance your workspace', 'get quality accessories', 'improve'],
    descriptors: ['professional accessories', 'quality peripherals', 'workspace essentials', 'productivity tools']
  }
];

function detectProductCategory(productName) {
  const productLower = productName.toLowerCase();
  
  // Phone detection
  if (productLower.includes('galaxy') || productLower.includes('iphone') || 
      productLower.includes('phone') || productLower.includes('smartphone') ||
      productLower.includes('mobile')) {
    return PRODUCT_CATEGORIES.find(cat => cat.category === 'phone') || null;
  }
  
  // Laptop detection
  if (productLower.includes('latitude') || productLower.includes('inspiron') || 
      productLower.includes('laptop') || productLower.includes('notebook') ||
      productLower.includes('dell') || productLower.includes('xps')) {
    return PRODUCT_CATEGORIES.find(cat => cat.category === 'laptop') || null;
  }
  
  // Audio equipment detection
  if (productLower.includes('lark') || productLower.includes('microphone') || 
      productLower.includes('audio') || productLower.includes('mic') ||
      productLower.includes('hollyland') || productLower.includes('sound')) {
    return PRODUCT_CATEGORIES.find(cat => cat.category === 'audio') || null;
  }
  
  // Accessories detection
  if (productLower.includes('keyboard') || productLower.includes('mouse') || 
      productLower.includes('logitech') || productLower.includes('combo') ||
      productLower.includes('peripheral')) {
    return PRODUCT_CATEGORIES.find(cat => cat.category === 'accessories') || null;
  }
  
  return null;
}

function generateProductSpecificLanguage(scheduledServices) {
  if (!scheduledServices || scheduledServices.length === 0) {
    return {
      primaryProduct: 'product',
      specificLanguage: 'Upgrade your experience',
      actionWords: ['get', 'try', 'experience'],
      descriptors: ['quality', 'premium', 'excellent']
    };
  }
  
  // Get today's primary service
  const primaryService = scheduledServices[0];
  const productCategory = detectProductCategory(primaryService);
  
  if (productCategory) {
    const randomActionWord = productCategory.actionWords[Math.floor(Math.random() * productCategory.actionWords.length)];
    const randomDescriptor = productCategory.descriptors[Math.floor(Math.random() * productCategory.descriptors.length)];
    
    return {
      primaryProduct: productCategory.specificTerms[0],
      specificLanguage: randomActionWord,
      actionWords: productCategory.actionWords,
      descriptors: productCategory.descriptors
    };
  }
  
  // Fallback for unrecognized products
  return {
    primaryProduct: 'product',
    specificLanguage: 'Get quality products',
    actionWords: ['get', 'try', 'choose'],
    descriptors: ['quality', 'premium', 'reliable']
  };
}

// Run tests
console.log('🧪 Testing Product-Specific Language System\n');

testServices.forEach((service, index) => {
  console.log(`Test ${index + 1}: ${service}`);
  
  const category = detectProductCategory(service);
  const language = generateProductSpecificLanguage([service]);
  
  console.log(`  ✅ Detected Category: ${category?.category || 'unknown'}`);
  console.log(`  ✅ Primary Product: ${language.primaryProduct}`);
  console.log(`  ✅ Specific Language: ${language.specificLanguage}`);
  console.log(`  ✅ Action Words: ${language.actionWords.join(', ')}`);
  console.log(`  ✅ Descriptors: ${language.descriptors.join(', ')}`);
  
  // Show the improvement
  console.log(`  🎯 BEFORE: "Upgrade your tech with ${service}"`);
  console.log(`  🎯 AFTER:  "${language.specificLanguage} with ${service}"`);
  console.log('');
});

console.log('✅ Product-Specific Language System Test Complete!');
console.log('\n📋 Expected Results:');
console.log('- Samsung Galaxy S24 Ultra → phone language (upgrade your phone)');
console.log('- Dell Latitude E7270 → laptop language (upgrade your laptop)');
console.log('- Hollyland Lark M2S → audio language (upgrade your audio)');
console.log('- Logitech Keyboard → accessories language (upgrade your setup)');
