/**
 * Direct Test of Content Generation Functions
 * This tests the functions directly without the API
 */

// Import the functions directly
const { 
  StrategicContentPlanner, 
  generateBusinessSpecificHeadline, 
  generateBusinessSpecificSubheadline, 
  generateBusinessSpecificCaption 
} = require('./src/ai/creative-enhancement.ts');

// Test data
const testBusiness = {
  businessType: 'restaurant',
  businessName: 'Samaki Cookies',
  location: 'Kenya',
  platform: 'Instagram',
  keyFeatures: 'handmade, fresh ingredients, unique flavors',
  services: 'artisan cookies, custom orders, catering',
  targetAudience: 'food lovers, families, professionals'
};

console.log('🧪 Testing Business-Specific Content Generation Directly...\n');

try {
  // Test 1: Strategic Content Planning
  console.log('🎯 Test 1: Strategic Content Planning');
  const contentPlan = StrategicContentPlanner.generateBusinessSpecificContent(
    testBusiness.businessType,
    testBusiness.businessName,
    testBusiness.location,
    {
      experience: '5+ years',
      expertise: testBusiness.keyFeatures,
      services: testBusiness.services,
      location: testBusiness.location,
      targetAudience: testBusiness.targetAudience
    },
    testBusiness.platform,
    'awareness'
  );
  
  console.log('✅ Content Plan Generated:');
  console.log(`- Goal: ${contentPlan.strategy.goal}`);
  console.log(`- Business Strengths: ${contentPlan.businessStrengths.join(', ')}`);
  console.log(`- Market Opportunities: ${contentPlan.marketOpportunities.join(', ')}`);
  console.log(`- Value Proposition: ${contentPlan.valueProposition}\n`);

  // Test 2: Business-Specific Headline
  console.log('🎨 Test 2: Business-Specific Headline Generation');
  const headline = generateBusinessSpecificHeadline(
    testBusiness.businessType,
    testBusiness.businessName,
    testBusiness.location,
    {
      experience: '5+ years',
      expertise: testBusiness.keyFeatures,
      services: testBusiness.services,
      location: testBusiness.location,
      targetAudience: testBusiness.targetAudience
    },
    testBusiness.platform,
    'awareness'
  );
  
  console.log('✅ Headline Generated:');
  console.log(`- Headline: "${headline.headline}"`);
  console.log(`- Approach: ${headline.approach}`);
  console.log(`- Emotional Impact: ${headline.emotionalImpact}\n`);

  // Test 3: Business-Specific Subheadline
  console.log('📝 Test 3: Business-Specific Subheadline Generation');
  const subheadline = generateBusinessSpecificSubheadline(
    testBusiness.businessType,
    testBusiness.businessName,
    testBusiness.location,
    {
      experience: '5+ years',
      expertise: testBusiness.keyFeatures,
      services: testBusiness.services,
      location: testBusiness.location,
      targetAudience: testBusiness.targetAudience
    },
    headline.headline,
    'awareness'
  );
  
  console.log('✅ Subheadline Generated:');
  console.log(`- Subheadline: "${subheadline.subheadline}"`);
  console.log(`- Framework: ${subheadline.framework}`);
  console.log(`- Benefit: ${subheadline.benefit}\n`);

  // Test 4: Business-Specific Caption
  console.log('📱 Test 4: Business-Specific Caption Generation');
  const caption = generateBusinessSpecificCaption(
    testBusiness.businessType,
    testBusiness.businessName,
    testBusiness.location,
    {
      experience: '5+ years',
      expertise: testBusiness.keyFeatures,
      services: testBusiness.services,
      location: testBusiness.location,
      targetAudience: testBusiness.targetAudience
    },
    testBusiness.platform,
    'awareness'
  );
  
  console.log('✅ Caption Generated:');
  console.log(`- Caption: "${caption.caption}"`);
  console.log(`- Call to Action: "${caption.callToAction}"`);
  console.log(`- Engagement Hooks: ${caption.engagementHooks.join(', ')}\n`);

  // Test 5: Content Variety Analysis
  console.log('🔍 Test 5: Content Variety Analysis');
  const allContent = [
    headline.headline,
    subheadline.subheadline,
    caption.caption,
    caption.callToAction
  ].join(' ').toLowerCase();
  
  // Check for repetitive phrases
  const repetitivePhrases = [
    'kenya',
    'expert',
    'years experience',
    'comment below',
    'thoughts',
    'samaki cookies'
  ].filter(phrase => {
    const count = (allContent.match(new RegExp(phrase, 'g')) || []).length;
    return count > 2;
  });
  
  console.log('✅ Content Analysis:');
  console.log(`- Total Content Length: ${allContent.length} characters`);
  console.log(`- Repetitive Elements: ${repetitivePhrases.length > 0 ? repetitivePhrases.join(', ') : 'None detected'}`);
  console.log(`- Content Variety: ${repetitivePhrases.length === 0 ? 'Good' : 'Needs improvement'}\n`);

  console.log('🎉 All tests completed successfully!');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Stack trace:', error.stack);
}
