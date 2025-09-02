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


try {
  // Test 1: Strategic Content Planning
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
  

  // Test 2: Business-Specific Headline
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
  

  // Test 3: Business-Specific Subheadline
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
  

  // Test 4: Business-Specific Caption
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
  

  // Test 5: Content Quality Analysis
  
  // Check if content is business-specific (not generic)
  const isBusinessSpecific = !caption.caption.includes('generic') && 
                            caption.caption.includes(testBusiness.businessName) &&
                            caption.caption.includes(testBusiness.location);
  
  // Check if content includes business strengths
  const includesStrengths = contentPlan.businessStrengths.some(strength => 
    caption.caption.toLowerCase().includes(strength.toLowerCase().split(' ')[0])
  );
  
  // Check if content includes market opportunities
  const includesOpportunities = contentPlan.marketOpportunities.some(opportunity => 
    caption.caption.toLowerCase().includes(opportunity.toLowerCase().split(' ')[0])
  );
  
  // Check if content has engagement hooks
  const hasEngagementHooks = caption.engagementHooks.length > 0;
  
  // Check if content has clear call to action
  const hasClearCTA = caption.callToAction.length > 10;


} catch (error) {
}
