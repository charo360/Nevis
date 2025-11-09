/**
 * Integration Test: Deep Business Understanding with Revo 2.0
 * 
 * Tests the full integration of deep business understanding
 * with the Revo 2.0 content generation system.
 */

import { analyzeBusinessAndGetGuidelines } from './index';

// Test business: Samaki Cookies
const samakiCookiesData = {
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
    }
  ]
};

async function testIntegration() {
  console.log('🧪 Integration Test: Deep Business Understanding + Revo 2.0\n');
  console.log('='.repeat(80));

  try {
    // Step 1: Analyze business
    console.log('\n📊 STEP 1: Analyzing Samaki Cookies...\n');
    const result = await analyzeBusinessAndGetGuidelines(samakiCookiesData, {
      contentType: 'social_post',
      platform: 'instagram',
      objective: 'Raise awareness about the product and its impact'
    });

    // Step 2: Display insights
    console.log('✅ Analysis Complete!\n');
    console.log('BUSINESS INSIGHTS:');
    console.log('------------------');
    console.log(`Business Model: ${result.businessInsight.businessModel.type}`);
    console.log(`Innovation: ${result.businessInsight.innovation.uniqueApproach}`);
    console.log(`Differentiator: ${result.businessInsight.innovation.keyDifferentiator}`);
    console.log(`Social Impact: ${result.businessInsight.mission.socialImpact ? 'YES' : 'NO'}`);
    console.log(`Mission: ${result.businessInsight.mission.corePurpose}`);
    console.log(`\nTarget Audience: ${result.businessInsight.targetAudience.primary.segment}`);
    console.log(`Decision Maker: ${result.businessInsight.targetAudience.decisionMaker}`);
    console.log(`End User: ${result.businessInsight.targetAudience.endUser}`);
    console.log(`\nCore Value: ${result.businessInsight.valueProposition.coreValue}`);

    // Step 3: Display content guidelines
    console.log('\n\nCONTENT GUIDELINES:');
    console.log('-------------------');
    console.log(`Target: ${result.contentGuidelines.targetAudience.who}`);
    console.log(`Pain Point: ${result.contentGuidelines.targetAudience.painPoint}`);
    console.log(`Core Message: ${result.contentGuidelines.messaging.coreMessage}`);
    console.log(`\nKey Points:`);
    result.contentGuidelines.messaging.keyPoints.forEach((point, i) => {
      console.log(`  ${i + 1}. ${point}`);
    });
    console.log(`\nVisual Scene: ${result.contentGuidelines.visual.sceneType}`);
    console.log(`Characters: ${result.contentGuidelines.visual.characters.join(', ')}`);
    console.log(`Setting: ${result.contentGuidelines.visual.setting}`);
    console.log(`Mood: ${result.contentGuidelines.visual.mood}`);
    console.log(`\nMust Show:`);
    result.contentGuidelines.visual.mustShow.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item}`);
    });
    console.log(`\nMust Avoid:`);
    result.contentGuidelines.visual.mustAvoid.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item}`);
    });
    console.log(`\nAvoid Saying:`);
    result.contentGuidelines.messaging.avoidances.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item}`);
    });

    // Step 4: Show prompt guidelines
    console.log('\n\nPROMPT GUIDELINES FOR AI:');
    console.log('-------------------------');
    console.log(result.promptGuidelines.substring(0, 500) + '...\n');

    // Step 5: Validation
    console.log('\n' + '='.repeat(80));
    console.log('VALIDATION CHECKS:');
    console.log('='.repeat(80));

    const checks = [
      {
        name: 'Identified as social impact business',
        pass: result.businessInsight.mission.socialImpact === true,
        expected: 'true',
        actual: String(result.businessInsight.mission.socialImpact)
      },
      {
        name: 'Target is parents (not office workers)',
        pass: result.businessInsight.targetAudience.primary.segment.toLowerCase().includes('parent'),
        expected: 'Contains "parent"',
        actual: result.businessInsight.targetAudience.primary.segment
      },
      {
        name: 'Innovation mentions fish/protein',
        pass: result.businessInsight.innovation.uniqueApproach.toLowerCase().includes('fish') || 
              result.businessInsight.innovation.uniqueApproach.toLowerCase().includes('protein'),
        expected: 'Contains "fish" or "protein"',
        actual: result.businessInsight.innovation.uniqueApproach
      },
      {
        name: 'Mission mentions malnutrition',
        pass: result.businessInsight.mission.corePurpose.toLowerCase().includes('malnutrition'),
        expected: 'Contains "malnutrition"',
        actual: result.businessInsight.mission.corePurpose
      },
      {
        name: 'Avoids productivity/office messaging',
        pass: result.contentGuidelines.messaging.avoidances.some(a => 
          a.toLowerCase().includes('productivity') || 
          a.toLowerCase().includes('office') ||
          a.toLowerCase().includes('professional')
        ),
        expected: 'Includes avoidance of office/productivity themes',
        actual: result.contentGuidelines.messaging.avoidances.join(', ')
      },
      {
        name: 'Visual shows children (not office workers)',
        pass: result.contentGuidelines.visual.characters.some(c => c.toLowerCase().includes('child')),
        expected: 'Includes children',
        actual: result.contentGuidelines.visual.characters.join(', ')
      }
    ];

    let passed = 0;
    let failed = 0;

    checks.forEach((check, i) => {
      const status = check.pass ? '✅ PASS' : '❌ FAIL';
      console.log(`\n${i + 1}. ${check.name}: ${status}`);
      if (!check.pass) {
        console.log(`   Expected: ${check.expected}`);
        console.log(`   Actual: ${check.actual}`);
        failed++;
      } else {
        passed++;
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log(`RESULTS: ${passed}/${checks.length} checks passed`);
    console.log('='.repeat(80));

    if (failed === 0) {
      console.log('\n🎉 ALL CHECKS PASSED! Deep Business Understanding is working correctly!');
      console.log('\nThe system correctly:');
      console.log('✅ Identified Samaki Cookies as a social impact business');
      console.log('✅ Targeted parents instead of office workers');
      console.log('✅ Highlighted fish-protein innovation');
      console.log('✅ Emphasized malnutrition mission');
      console.log('✅ Avoided generic productivity messaging');
      console.log('✅ Showed children in visuals instead of professionals');
    } else {
      console.log(`\n⚠️  ${failed} checks failed. Review the analysis above.`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('COMPARISON WITH OLD APPROACH:');
    console.log('='.repeat(80));
    console.log('\n❌ OLD (Template-Based):');
    console.log('   - Headline: "Fuel Your Focus"');
    console.log('   - Target: Office workers');
    console.log('   - Message: Productivity snack');
    console.log('   - Visual: Person at desk with laptop');
    console.log('\n✅ NEW (Deep Understanding):');
    console.log(`   - Headline: Should mention nutrition/malnutrition`);
    console.log(`   - Target: ${result.businessInsight.targetAudience.primary.segment}`);
    console.log(`   - Message: ${result.contentGuidelines.messaging.coreMessage}`);
    console.log(`   - Visual: ${result.contentGuidelines.visual.sceneType}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ Integration Test Complete!');
    console.log('='.repeat(80));

    return {
      success: failed === 0,
      passed,
      failed,
      total: checks.length
    };

  } catch (error) {
    console.error('\n❌ Integration test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run test
if (require.main === module) {
  testIntegration()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { testIntegration };
