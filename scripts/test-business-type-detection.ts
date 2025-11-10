/**
 * Test Business Type Detection for Samaki Cookies
 */

import { detectBusinessType } from '../src/ai/adaptive/business-type-detector';

// Samaki Cookies brand profile (simplified)
const samakiCookies = {
  businessName: 'Samaki Cookies',
  businessType: 'Bakery',
  industry: 'Food & Beverage',
  description: 'Fresh cookies and baked goods',
  services: ['Cookies', 'Baked Goods', 'Fresh Daily'],
  location: 'Kilifi, Kenya',
  targetAudience: 'Local community, students, families',
  keyFeatures: ['Fresh daily', 'Local ingredients', 'Affordable prices'],
};

console.log('🧪 Testing Business Type Detection for Samaki Cookies\n');
console.log('📋 Brand Profile:');
console.log(JSON.stringify(samakiCookies, null, 2));
console.log('\n' + '='.repeat(60) + '\n');

const detection = detectBusinessType(samakiCookies);

console.log('🔍 Detection Results:');
console.log(`   Primary Type: ${detection.primaryType}`);
console.log(`   Secondary Type: ${detection.secondaryType || 'None'}`);
console.log(`   Confidence: ${detection.confidence}%`);
console.log(`   Is Hybrid: ${detection.isHybrid}`);
console.log(`   Detection Signals: ${detection.detectionSignals.join(', ')}`);
console.log('\n' + '='.repeat(60) + '\n');

if (detection.primaryType === 'food') {
  console.log('✅ CORRECT: Detected as "food" business type');
  console.log('   Food Assistant will be used');
} else {
  console.log(`❌ INCORRECT: Detected as "${detection.primaryType}" instead of "food"`);
  console.log('   Food Assistant will NOT be used');
  console.log('\n💡 Recommendation: Add more food-related keywords to brand profile');
  console.log('   Keywords that trigger "food" detection:');
  console.log('   - restaurant, cafe, coffee, bistro, eatery, dining');
  console.log('   - food, menu, cuisine, chef, kitchen, bakery');
  console.log('   - bar, pub, grill, pizzeria, deli, catering');
  console.log('   - delivery, takeout, dine-in, reservation, table');
}

