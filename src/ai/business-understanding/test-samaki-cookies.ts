/**
 * Test: Deep Business Understanding with Samaki Cookies
 * 
 * This demonstrates how the system analyzes a business deeply
 * and generates appropriate marketing content.
 */

import { analyzeBusinessAndGetGuidelines } from './index';

async function testSamakiCookies() {
  console.log('🧪 Testing Deep Business Understanding with Samaki Cookies\n');

  // Samaki Cookies business data
  const businessData = {
    businessName: 'Samaki Cookies',
    website: 'https://samakicookies.co.ke/',
    description: 'Samaki Cookies combines the nutritional benefits of fish with delicious cookies to combat malnutrition in Kenya.',
    industry: 'Food & Beverage',
    about: `Samaki Cookies is a social enterprise founded by Francis Thoya in Kilifi County, Kenya. 
    We create nutritious fish-based cookies that help fight childhood malnutrition while supporting 
    local fishing communities. Our innovative approach combines traditional cookie-making with 
    fish protein to create a product that children love and parents trust.`,
    mission: 'To combat malnutrition in Kenya by providing affordable, nutritious, and delicious fish-based cookies.',
    values: [
      'Nutrition for all',
      'Community empowerment',
      'Sustainable sourcing',
      'Innovation in food security',
      'Local impact'
    ],
    products: [
      {
        name: 'Samaki Original Cookies',
        description: 'Our flagship fish-protein enriched cookies made with locally sourced fish from Kilifi County',
        features: ['High protein', 'Rich in Omega-3', 'No artificial preservatives', 'Made with local fish']
      },
      {
        name: 'Samaki Chocolate Cookies',
        description: 'Chocolate-flavored fish cookies that kids love',
        features: ['Protein-rich', 'Great taste', 'Nutritious snack']
      }
    ],
    services: [
      {
        name: 'School Nutrition Programs',
        description: 'Bulk supply of nutritious cookies for school feeding programs'
      },
      {
        name: 'Retail Distribution',
        description: 'Available at select retailers across Kenya'
      }
    ]
  };

  // Content request for social media ad
  const contentRequest = {
    contentType: 'social_post' as const,
    platform: 'instagram',
    objective: 'Raise awareness about the product and its impact on child nutrition',
    specificFocus: 'Highlight the innovation and social impact'
  };

  try {
    // Analyze and get guidelines
    const result = await analyzeBusinessAndGetGuidelines(businessData, contentRequest);

    console.log('\n📊 BUSINESS INSIGHT ANALYSIS:');
    console.log('================================\n');
    
    console.log('Business Model:', result.businessInsight.businessModel.type);
    console.log('Revenue Streams:', result.businessInsight.businessModel.revenueStreams);
    console.log('\nCore Innovation:', result.businessInsight.innovation.uniqueApproach);
    console.log('Key Differentiator:', result.businessInsight.innovation.keyDifferentiator);
    console.log('\nMission:', result.businessInsight.mission.corePurpose);
    console.log('Social Impact:', result.businessInsight.mission.socialImpact ? 'YES' : 'NO');
    console.log('\nPrimary Target:', result.businessInsight.targetAudience.primary.segment);
    console.log('Decision Maker:', result.businessInsight.targetAudience.decisionMaker);
    console.log('End User:', result.businessInsight.targetAudience.endUser);
    console.log('\nCore Value:', result.businessInsight.valueProposition.coreValue);
    console.log('Unique Selling Points:', result.businessInsight.valueProposition.uniqueSellingPoints);

    console.log('\n\n🎯 CONTENT GUIDELINES:');
    console.log('================================\n');
    
    console.log('Target Audience:', result.contentGuidelines.targetAudience.who);
    console.log('Pain Point:', result.contentGuidelines.targetAudience.painPoint);
    console.log('\nCore Message:', result.contentGuidelines.messaging.coreMessage);
    console.log('Key Points:', result.contentGuidelines.messaging.keyPoints);
    console.log('\nVisual Scene:', result.contentGuidelines.visual.sceneType);
    console.log('Characters:', result.contentGuidelines.visual.characters);
    console.log('Setting:', result.contentGuidelines.visual.setting);
    console.log('Mood:', result.contentGuidelines.visual.mood);
    console.log('\nMust Show:', result.contentGuidelines.visual.mustShow);
    console.log('Must Avoid:', result.contentGuidelines.visual.mustAvoid);
    console.log('\nAvoid Saying:', result.contentGuidelines.messaging.avoidances);

    console.log('\n\n📝 PROMPT GUIDELINES FOR AI:');
    console.log('================================\n');
    console.log(result.promptGuidelines);

    console.log('\n\n✅ Test Complete!');
    console.log('\nCOMPARISON:');
    console.log('❌ OLD APPROACH: Generic "Fuel your focus" ads targeting office workers');
    console.log('✅ NEW APPROACH: Nutrition-focused ads targeting parents, highlighting fish-protein innovation and social impact');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
if (require.main === module) {
  testSamakiCookies();
}

export { testSamakiCookies };
