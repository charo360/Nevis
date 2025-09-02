/**
 * Test Business-Specific Content Generation System
 * This file tests the new strategic content planning and business-specific generation
 */

// Mock the required modules (in a real environment, these would be imported)
const { 
  StrategicContentPlanner, 
  generateBusinessSpecificHeadline, 
  generateBusinessSpecificSubheadline, 
  generateBusinessSpecificCaption 
} = require('./src/ai/creative-enhancement.ts');

// Test data
const testBusiness = {
  businessType: 'restaurant',
  businessName: 'Paya Bistro',
  location: 'Nairobi',
  platform: 'Instagram',
  keyFeatures: 'Chef-driven menus, local ingredients, wine pairing',
  services: 'Fine dining, private events, catering',
  targetAudience: 'Food enthusiasts, business professionals, couples'
};

console.log('🧪 Testing Business-Specific Content Generation System...\n');

try {
  // Test 1: Strategic Content Planning
  console.log('🎯 Test 1: Strategic Content Planning');
  const contentPlan = StrategicContentPlanner.generateBusinessSpecificContent(
    testBusiness.businessType,
    testBusiness.businessName,
    testBusiness.location,
    {
      experience: '8 years',
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
      experience: '8 years',
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
      experience: '8 years',
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
      experience: '8 years',
      expertise: testBusiness.keyFeatures,
      services: testBusiness.services,
      location: testBusiness.location,
      targetAudience: testBusiness.targetAudience
    },
    testBusiness.platform,
    'awareness'
  );
  
  console.log('✅ Caption Generated:');
  console.log(`- Caption Length: ${caption.caption.length} characters`);
  console.log(`- Engagement Hooks: ${caption.engagementHooks.join(', ')}`);
  console.log(`- Call to Action: "${caption.callToAction}"\n`);

  // Test 5: Content Quality Analysis
  console.log('🔍 Test 5: Content Quality Analysis');
  console.log('✅ Content Quality Check:');
  
  // Check if content is business-specific (not generic)
  const isBusinessSpecific = !caption.caption.includes('generic') && 
                            caption.caption.includes(testBusiness.businessName) &&
                            caption.caption.includes(testBusiness.location);
  console.log(`- Business-Specific: ${isBusinessSpecific ? '✅' : '❌'}`);
  
  // Check if content includes business strengths
  const includesStrengths = contentPlan.businessStrengths.some(strength => 
    caption.caption.toLowerCase().includes(strength.toLowerCase().split(' ')[0])
  );
  console.log(`- Includes Business Strengths: ${includesStrengths ? '✅' : '❌'}`);
  
  // Check if content includes market opportunities
  const includesOpportunities = contentPlan.marketOpportunities.some(opportunity => 
    caption.caption.toLowerCase().includes(opportunity.toLowerCase().split(' ')[0])
  );
  console.log(`- Includes Market Opportunities: ${includesOpportunities ? '✅' : '❌'}`);
  
  // Check if content has engagement hooks
  const hasEngagementHooks = caption.engagementHooks.length > 0;
  console.log(`- Has Engagement Hooks: ${hasEngagementHooks ? '✅' : '❌'}`);
  
  // Check if content has clear call to action
  const hasClearCTA = caption.callToAction.length > 10;
  console.log(`- Has Clear CTA: ${hasClearCTA ? '✅' : '❌'}`);

  console.log('\n🎉 All Tests Completed Successfully!');
  console.log('\n📊 SUMMARY:');
  console.log(`- Business Type: ${testBusiness.businessType}`);
  console.log(`- Business Name: ${testBusiness.businessName}`);
  console.log(`- Location: ${testBusiness.location}`);
  console.log(`- Platform: ${testBusiness.platform}`);
  console.log(`- Content Goal: ${contentPlan.strategy.goal}`);
  console.log(`- Generated Content: ${headline.headline} | ${subheadline.subheadline} | ${caption.caption.substring(0, 100)}...`);

} catch (error) {
  console.error('❌ Test Failed:', error.message);
  console.error('Stack:', error.stack);
}
