/**
 * Test Regional Communication Engine
 * Demonstrates authentic local communication for different regions
 */

import { advancedContentGenerator } from '../ai/advanced-content-generator';
import { regionalEngine } from '../ai/regional-communication-engine';

// Test business profiles for different regions
const testBusinesses = [
  {
    businessName: 'Samaki Cookies',
    businessType: 'Bakery',
    location: 'Nairobi, Kenya',
    description: 'Local bakery specializing in fresh cookies and pastries',
    targetAudience: 'Local families and young professionals',
    uniqueSellingPoints: ['Fresh daily baking', 'Local ingredients', 'Family recipes'],
    competitors: ['Java House', 'Artcaffe'],
    brandVoice: 'friendly, community-focused, authentic',
  },
  {
    businessName: 'Lagos Spice Kitchen',
    businessType: 'Restaurant',
    location: 'Lagos, Nigeria',
    description: 'Authentic Nigerian cuisine with modern twist',
    targetAudience: 'Food lovers and professionals',
    uniqueSellingPoints: ['Authentic recipes', 'Fresh ingredients', 'Fast service'],
    competitors: ['Bukka Hut', 'Chicken Republic'],
    brandVoice: 'bold, confident, quality-focused',
  },
  {
    businessName: 'Cape Town Coffee Co',
    businessType: 'Coffee Shop',
    location: 'Cape Town, South Africa',
    description: 'Artisan coffee roastery and cafe',
    targetAudience: 'Coffee enthusiasts and remote workers',
    uniqueSellingPoints: ['Single origin beans', 'Expert roasting', 'Cozy atmosphere'],
    competitors: ['Truth Coffee', 'Origin Coffee'],
    brandVoice: 'laid-back, artisanal, welcoming',
  },
];

async function testRegionalCommunication() {

  for (const business of testBusinesses) {

    // Test regional profile detection
    const regionalProfile = regionalEngine.getRegionalProfile(business.location);
    if (regionalProfile) {
    } else {
    }


    try {
      // Generate content using the advanced content generator
      const content = await advancedContentGenerator.generateEngagingContent(
        business,
        'instagram',
        'promotional'
      );


      // Test individual components

      if (regionalProfile) {
        const testHeadline = regionalEngine.generateRegionalContent(
          business.businessType,
          business.businessName,
          business.location,
          'headline'
        );

        const testCTA = regionalEngine.generateRegionalContent(
          business.businessType,
          business.businessName,
          business.location,
          'cta'
        );

        const testHashtags = regionalEngine.getRegionalHashtags(
          business.location,
          business.businessType
        );
      }

    } catch (error) {
    }

  }

  // Test regional communication patterns

  const regions = ['kenya', 'nigeria', 'south_africa'];

  for (const region of regions) {
    const profile = regionalEngine.getRegionalProfile(region);
    if (profile) {

      // Show advertising patterns
      profile.advertisingPatterns.forEach((pattern, index) => {
      });
    }
  }

}

// Export for use in other tests
export { testRegionalCommunication };

// Run test if this file is executed directly
if (require.main === module) {
  testRegionalCommunication().catch(console.error);
}
