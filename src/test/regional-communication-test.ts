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
  console.log('🌍 Testing Regional Communication Engine\n');
  console.log('='.repeat(80));

  for (const business of testBusinesses) {
    console.log(`\n🏢 BUSINESS: ${business.businessName} (${business.location})`);
    console.log('-'.repeat(60));

    // Test regional profile detection
    const regionalProfile = regionalEngine.getRegionalProfile(business.location);
    if (regionalProfile) {
      console.log(`✅ Regional Profile: ${regionalProfile.region}`);
      console.log(`📱 Communication Style: ${regionalProfile.communicationStyle.directness}, ${regionalProfile.communicationStyle.formality}`);
      console.log(`🎯 Humor Style: ${regionalProfile.communicationStyle.humorStyle.join(', ')}`);
      console.log(`🗣️  Sample Greetings: ${regionalProfile.localSlang.greetings.slice(0, 3).join(', ')}`);
      console.log(`🎉 Excitement Words: ${regionalProfile.localSlang.excitement.slice(0, 3).join(', ')}`);
    } else {
      console.log('❌ No regional profile found - using generic content');
    }

    console.log('\n📝 GENERATED CONTENT:');

    try {
      // Generate content using the advanced content generator
      const content = await advancedContentGenerator.generateEngagingContent(
        business,
        'instagram',
        'promotional'
      );

      console.log(`\n📰 Headline: "${content.headline}"`);
      console.log(`📄 Subheadline: "${content.subheadline}"`);
      console.log(`💬 Caption: "${content.caption}"`);
      console.log(`🎯 CTA: "${content.cta}"`);
      console.log(`🏷️  Hashtags: ${content.hashtags.join(' ')}`);

      // Test individual components
      console.log('\n🔍 INDIVIDUAL COMPONENT TESTS:');

      if (regionalProfile) {
        const testHeadline = regionalEngine.generateRegionalContent(
          business.businessType,
          business.businessName,
          business.location,
          'headline'
        );
        console.log(`🎯 Regional Headline: "${testHeadline}"`);

        const testCTA = regionalEngine.generateRegionalContent(
          business.businessType,
          business.businessName,
          business.location,
          'cta'
        );
        console.log(`📢 Regional CTA: "${testCTA}"`);

        const testHashtags = regionalEngine.getRegionalHashtags(
          business.location,
          business.businessType
        );
        console.log(`🏷️  Regional Hashtags: ${testHashtags.join(' ')}`);
      }

    } catch (error) {
      console.error('❌ Error generating content:', error);
    }

    console.log('\n' + '='.repeat(80));
  }

  // Test regional communication patterns
  console.log('\n🎨 REGIONAL COMMUNICATION PATTERNS:');
  console.log('-'.repeat(60));

  const regions = ['kenya', 'nigeria', 'south_africa'];

  for (const region of regions) {
    const profile = regionalEngine.getRegionalProfile(region);
    if (profile) {
      console.log(`\n🌍 ${profile.region.toUpperCase()}:`);
      console.log(`   Directness: ${profile.communicationStyle.directness}`);
      console.log(`   Formality: ${profile.communicationStyle.formality}`);
      console.log(`   Persuasion Tactics: ${profile.communicationStyle.persuasionTactics.join(', ')}`);
      console.log(`   Attention Grabbers: ${profile.communicationStyle.attentionGrabbers.join(', ')}`);
      console.log(`   Trust Builders: ${profile.businessCommunication.trustBuilders.slice(0, 2).join(', ')}`);

      // Show advertising patterns
      console.log(`   Advertising Approaches:`);
      profile.advertisingPatterns.forEach((pattern, index) => {
        console.log(`     ${index + 1}. ${pattern.type}: ${pattern.approach}`);
        console.log(`        Example: "${pattern.examples[0]}"`);
      });
    }
  }

  console.log('\n✅ Regional Communication Test Complete!');
}

// Export for use in other tests
export { testRegionalCommunication };

// Run test if this file is executed directly
if (require.main === module) {
  testRegionalCommunication().catch(console.error);
}
