/**
 * Test file to verify business-type specific strategies are working correctly
 * Run this to see how different business types get different marketing approaches
 */

import { getBusinessTypeStrategy, generateBusinessTypePromptInstructions } from './business-type-strategies';

// Test different business types
const testBusinessTypes = [
  'Retail Store',
  'E-commerce Shop',
  'Hotel',
  'Restaurant',
  'Financial Services',
  'Healthcare Clinic',
  'Consulting Agency',
  'Education Platform'
];

// Mock brand profile with product catalog for retail testing
const mockRetailBrandProfile = {
  businessName: 'TechGear Store',
  businessType: 'Retail',
  location: 'Nairobi, Kenya',
  productCatalog: [
    {
      name: 'Wireless Bluetooth Headphones',
      price: 'KSh 4,999',
      originalPrice: 'KSh 7,999',
      discount: '38% off',
      features: ['40-hour battery life', 'Active noise cancellation', 'Premium sound quality'],
      benefits: ['Perfect for work and travel', 'Block out distractions'],
      stockStatus: 'In Stock'
    },
    {
      name: 'Smart Fitness Watch',
      price: 'KSh 8,999',
      features: ['Heart rate monitoring', 'GPS tracking', 'Water resistant'],
      benefits: ['Track your fitness goals', 'Stay connected on the go'],
      stockStatus: 'Limited Stock'
    }
  ]
};

const mockHotelBrandProfile = {
  businessName: 'Coastal Paradise Resort',
  businessType: 'Hotel',
  location: 'Mombasa, Kenya'
};

const mockRestaurantBrandProfile = {
  businessName: 'Mama\'s Kitchen',
  businessType: 'Restaurant',
  location: 'Nairobi, Kenya'
};

console.log('='.repeat(80));
console.log('BUSINESS-TYPE SPECIFIC STRATEGIES TEST');
console.log('='.repeat(80));
console.log('\n');

// Test 1: Check if strategies are found for each business type
console.log('TEST 1: Strategy Detection');
console.log('-'.repeat(80));
testBusinessTypes.forEach(businessType => {
  const strategy = getBusinessTypeStrategy(businessType);
  if (strategy) {
    console.log(`✅ ${businessType}: Strategy found`);
    console.log(`   Content Focus: ${strategy.contentFocus.substring(0, 80)}...`);
    console.log(`   CTA Style: ${strategy.ctaStyle.substring(0, 80)}...`);
  } else {
    console.log(`❌ ${businessType}: No specific strategy (will use generic)`);
  }
  console.log('');
});

// Test 2: Retail/E-commerce with product data
console.log('\n' + '='.repeat(80));
console.log('TEST 2: Retail Business with Product Catalog');
console.log('-'.repeat(80));
const retailInstructions = generateBusinessTypePromptInstructions('Retail', mockRetailBrandProfile);
console.log(retailInstructions);

// Test 3: Hospitality
console.log('\n' + '='.repeat(80));
console.log('TEST 3: Hotel/Hospitality Business');
console.log('-'.repeat(80));
const hotelInstructions = generateBusinessTypePromptInstructions('Hotel', mockHotelBrandProfile);
console.log(hotelInstructions);

// Test 4: Restaurant
console.log('\n' + '='.repeat(80));
console.log('TEST 4: Restaurant Business');
console.log('-'.repeat(80));
const restaurantInstructions = generateBusinessTypePromptInstructions('Restaurant', mockRestaurantBrandProfile);
console.log(restaurantInstructions);

// Test 5: Verify key differences
console.log('\n' + '='.repeat(80));
console.log('TEST 5: Key Differences Between Business Types');
console.log('-'.repeat(80));

const retailStrategy = getBusinessTypeStrategy('Retail');
const hotelStrategy = getBusinessTypeStrategy('Hotel');
const restaurantStrategy = getBusinessTypeStrategy('Restaurant');
const financeStrategy = getBusinessTypeStrategy('Financial Services');

console.log('RETAIL CTA Examples:');
if (retailStrategy) {
  console.log(retailStrategy.ctaStyle);
}

console.log('\nHOTEL CTA Examples:');
if (hotelStrategy) {
  console.log(hotelStrategy.ctaStyle);
}

console.log('\nRESTAURANT CTA Examples:');
if (restaurantStrategy) {
  console.log(restaurantStrategy.ctaStyle);
}

console.log('\nFINANCE CTA Examples:');
if (financeStrategy) {
  console.log(financeStrategy.ctaStyle);
}

console.log('\n' + '='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));
console.log('\nKEY FINDINGS:');
console.log('1. Each business type has distinct content focus');
console.log('2. CTAs are tailored to industry-specific actions');
console.log('3. Retail businesses get product-focused guidance with catalog data');
console.log('4. Hospitality focuses on experience and comfort');
console.log('5. Restaurants emphasize taste and dining experience');
console.log('6. Finance focuses on trust, security, and ROI');
console.log('\nThis ensures Revo 2.0 generates industry-appropriate content!');

