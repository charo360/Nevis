/**
 * Test Business Profiler System
 * 
 * Tests the new Business Intelligence Profiling System with Samaki Cookies
 */

import { BusinessProfileManager } from '../src/ai/intelligence/business-profile-manager';

async function testBusinessProfiler() {
  console.log('🧪 Testing Business Intelligence Profiling System\n');
  
  const profileManager = new BusinessProfileManager();
  
  // Test with Samaki Cookies
  const samakiCookiesBrand = {
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
  
  try {
    console.log('📋 Step 1: Getting Business Profile...');
    const businessProfile = await profileManager.getBusinessProfile(samakiCookiesBrand);
    
    console.log('✅ Business Profile Generated:');
    console.log(`   🏢 Business: ${businessProfile.businessName}`);
    console.log(`   🎯 Mission: ${businessProfile.mission}`);
    console.log(`   💡 Social Impact: ${businessProfile.socialImpact || 'None specified'}`);
    console.log(`   🌟 Unique Selling Points:`);
    businessProfile.uniqueSellingPoints.forEach(usp => console.log(`      • ${usp}`));
    
    console.log('\n📊 Step 2: Generating Marketing Insights...');
    const marketingInsights = profileManager.generateMarketingInsights(businessProfile);
    
    console.log('✅ Marketing Insights Generated:');
    console.log(`   🎯 Business Essence: ${marketingInsights.businessEssence}`);
    console.log(`   👥 Primary Audience: ${marketingInsights.primaryAudienceProfile}`);
    console.log(`   💭 Audience Motivations:`);
    marketingInsights.audienceMotivations.forEach(motivation => console.log(`      • ${motivation}`));
    console.log(`   😰 Audience Pain Points:`);
    marketingInsights.audiencePainPoints.forEach(pain => console.log(`      • ${pain}`));
    console.log(`   🎨 Recommended Angles:`);
    marketingInsights.recommendedAngles.forEach(angle => console.log(`      • ${angle}`));
    console.log(`   🚫 Avoidance List:`);
    marketingInsights.avoidanceList.forEach(avoid => console.log(`      • ${avoid}`));
    
    console.log('\n📝 Step 3: Generating Prompt Insights...');
    const promptInsights = profileManager.generatePromptInsights(businessProfile);
    
    console.log('✅ Prompt Insights Generated:');
    console.log(promptInsights);
    
    console.log('\n🎉 Business Profiler Test Completed Successfully!');
    
  } catch (error) {
    console.error('❌ Business Profiler Test Failed:', error);
  }
}

// Test with a generic business to see profile generation
async function testGenericBusiness() {
  console.log('\n🧪 Testing with Generic Business...\n');
  
  const profileManager = new BusinessProfileManager();
  
  const genericBusiness = {
    id: 'test-restaurant',
    businessName: 'Mama\'s Kitchen',
    businessType: 'Restaurant',
    industry: 'Food & Beverage',
    description: 'Traditional Kenyan cuisine restaurant serving authentic local dishes',
    services: ['Dine-in', 'Takeout', 'Catering'],
    products: ['Ugali', 'Nyama Choma', 'Sukuma Wiki', 'Traditional Stews'],
    location: 'Nairobi, Kenya',
    targetAudience: 'Local families, office workers, tourists',
    keyFeatures: ['Authentic recipes', 'Fresh ingredients', 'Family atmosphere'],
    valueProposition: 'Authentic Kenyan cuisine in a warm, family atmosphere',
    priceRange: 'KES 300-800 per meal'
  };
  
  try {
    console.log('📋 Getting Business Profile for Generic Business...');
    const businessProfile = await profileManager.getBusinessProfile(genericBusiness);
    
    console.log('✅ Generic Business Profile:');
    console.log(`   🏢 Business: ${businessProfile.businessName}`);
    console.log(`   🎯 Mission: ${businessProfile.mission}`);
    console.log(`   📊 Confidence: ${businessProfile.confidence}%`);
    
    const marketingInsights = profileManager.generateMarketingInsights(businessProfile);
    console.log(`   🎯 Business Essence: ${marketingInsights.businessEssence}`);
    console.log(`   🎨 Top Marketing Angles:`);
    marketingInsights.recommendedAngles.slice(0, 3).forEach(angle => console.log(`      • ${angle}`));
    
  } catch (error) {
    console.error('❌ Generic Business Test Failed:', error);
  }
}

// Run tests
async function runTests() {
  await testBusinessProfiler();
  await testGenericBusiness();
}

runTests().catch(console.error);
