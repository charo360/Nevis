/**
 * Test Real Ad Generation for Samaki Cookies
 * This will call the actual API to see what's happening
 */

import { detectBusinessType } from '../src/ai/adaptive/business-type-detector';

// Exact brand profile that might be used in the app
const samakiCookiesBrandProfile = {
  id: 'samaki-cookies-test',
  businessName: 'Samaki Cookies',
  businessType: 'Bakery',
  industry: 'Food & Beverage',
  description: 'Fresh fish-shaped cookies made daily with local ingredients',
  services: ['Fresh Cookies', 'Daily Baking', 'Local Snacks'],
  products: ['Fish Cookies', 'Sweet Treats', 'Baked Goods'],
  location: 'Kilifi, Kenya',
  targetAudience: 'Local families, students, workers',
  keyFeatures: ['Fresh daily', 'Local ingredients', 'Affordable prices', 'Unique fish shape'],
  valueProposition: 'Delicious fish-shaped cookies made fresh daily with local ingredients',
  website: '',
  socialMedia: {},
  contactInfo: {},
  operatingHours: 'Daily 8AM - 6PM',
  priceRange: 'KES 20-50 per cookie'
};

console.log('🧪 Testing Real Generation Path for Samaki Cookies\n');

// Test 1: Business Type Detection
console.log('📋 Step 1: Business Type Detection');
console.log('Brand Profile:', JSON.stringify(samakiCookiesBrandProfile, null, 2));
console.log('\n' + '='.repeat(60));

const detection = detectBusinessType(samakiCookiesBrandProfile);
console.log('\n🔍 Detection Results:');
console.log(`   Primary Type: ${detection.primaryType}`);
console.log(`   Secondary Type: ${detection.secondaryType || 'None'}`);
console.log(`   Confidence: ${detection.confidence}%`);
console.log(`   Detection Signals: ${detection.detectionSignals.join(', ')}`);

if (detection.primaryType === 'food') {
  console.log('\n✅ GOOD: Detected as "food" - Food Assistant should be used');
} else {
  console.log(`\n❌ BAD: Detected as "${detection.primaryType}" - Will use Claude fallback`);
}

console.log('\n' + '='.repeat(60));

// Test 2: Make actual API call
console.log('\n📡 Step 2: Making Real API Call');
console.log('Calling /api/generate-revo-2.0...\n');

const testPayload = {
  businessType: 'food',
  platform: 'instagram',
  brandProfile: samakiCookiesBrandProfile,
  designSpecs: {
    style: 'modern',
    colorScheme: 'warm',
    layout: 'standard'
  },
  revoModel: 'revo-2.0'
};

// Make the API call
fetch('http://localhost:3001/api/generate-revo-2.0', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testPayload)
})
.then(response => response.json())
.then(data => {
  console.log('📝 API Response:');
  console.log(JSON.stringify(data, null, 2));
  
  if (data.content) {
    console.log('\n🎯 Generated Content Analysis:');
    console.log(`   Headline: "${data.content.headline}"`);
    console.log(`   Caption: "${data.content.caption?.substring(0, 100)}..."`);
    
    // Check for generic patterns
    const headline = data.content.headline?.toLowerCase() || '';
    const caption = data.content.caption?.toLowerCase() || '';
    
    const genericPatterns = [
      'fuel your', 'boost your', 'empower your', 'transform your',
      'shared moments', 'sweet success', 'unlock your', 'discover the'
    ];
    
    const foundPatterns = genericPatterns.filter(pattern => 
      headline.includes(pattern) || caption.includes(pattern)
    );
    
    if (foundPatterns.length > 0) {
      console.log('\n❌ GENERIC PATTERNS DETECTED:');
      foundPatterns.forEach(pattern => {
        console.log(`   - "${pattern}"`);
      });
      console.log('\n💡 This suggests the Food Assistant is NOT being used');
    } else {
      console.log('\n✅ NO GENERIC PATTERNS - Content looks specific!');
    }
  }
})
.catch(error => {
  console.error('❌ API Call Failed:', error.message);
  console.log('\n💡 Make sure the dev server is running on port 3001');
});
