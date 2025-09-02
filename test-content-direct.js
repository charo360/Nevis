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


try {
  // Test 1: Strategic Content Planning
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
  

  // Test 2: Business-Specific Headline
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
  

  // Test 3: Business-Specific Subheadline
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
  

  // Test 4: Business-Specific Caption
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
  

  // Test 5: Content Variety Analysis
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
  


} catch (error) {
}
