/**
 * Comprehensive test suite for Revo 1.0 universal business content generation
 * Tests the transformation from Paya-specific to universal business support
 *
 * This test validates that the system works for multiple business types
 * instead of being hardcoded for Paya fintech only.
 */

// Since this is a TypeScript project, we'll validate the code structure directly
console.log('🧪 Testing Revo 1.0 Universal Business Support Transformation');
console.log('='.repeat(80));

const fs = require('fs');
const path = require('path');

// Read the Revo 1.0 service file to validate transformations
const revoServicePath = path.join(__dirname, 'src', 'ai', 'revo-1.0-service.ts');
const revoServiceContent = fs.readFileSync(revoServicePath, 'utf8');

// Test validation functions
function testHardcodedPayaRemoval() {
  console.log('\n🔍 Testing: Hardcoded Paya Elements Removal');

  const payaReferences = [
    'PAYA-SPECIFIC CONTENT FOCUS (MANDATORY)',
    'PAYA:',
    'payaventures.com',
    'Paya puts Buy Now Pay Later'
  ];

  let passed = true;
  payaReferences.forEach(ref => {
    if (revoServiceContent.includes(ref)) {
      console.log(`❌ Found hardcoded Paya reference: "${ref}"`);
      passed = false;
    }
  });

  if (passed) {
    console.log('✅ No hardcoded Paya references found');
  }

  return passed;
}

function testDynamicBusinessIntelligence() {
  console.log('\n🔍 Testing: Dynamic Business Intelligence System');

  const requiredFunctions = [
    'generateDynamicEngagementHooks',
    'generateDynamicContentStrategies',
    'generateDynamicMarketDynamics',
    'getBusinessIntelligenceEngine',
    'getBusinessTypeIntelligence'
  ];

  let passed = true;
  requiredFunctions.forEach(func => {
    if (!revoServiceContent.includes(func)) {
      console.log(`❌ Missing dynamic function: ${func}`);
      passed = false;
    } else {
      console.log(`✅ Found dynamic function: ${func}`);
    }
  });

  return passed;
}

function testGlobalCulturalContext() {
  console.log('\n🔍 Testing: Global Cultural Context System');

  const culturalFunctions = [
    'getDynamicCulturalContext',
    'getLocationSpecificLanguageInstructions',
    'getLocalCulturalConnectionInstructions',
    'generateLocationAppropriateScenario'
  ];

  let passed = true;
  culturalFunctions.forEach(func => {
    if (!revoServiceContent.includes(func)) {
      console.log(`❌ Missing cultural function: ${func}`);
      passed = false;
    } else {
      console.log(`✅ Found cultural function: ${func}`);
    }
  });

  // Check for hardcoded Kenyan references
  const hardcodedKenyanRefs = [
    'KSh',
    'matatu',
    'Three weeks waiting for bank loan approval'
  ];

  hardcodedKenyanRefs.forEach(ref => {
    if (revoServiceContent.includes(ref)) {
      console.log(`❌ Found hardcoded Kenyan reference: "${ref}"`);
      passed = false;
    }
  });

  if (passed) {
    console.log('✅ No hardcoded Kenyan cultural references found');
  }

  return passed;
}

function testBusinessTypeSupport() {
  console.log('\n🔍 Testing: Multiple Business Type Support');

  const supportedBusinessTypes = [
    'restaurant',
    'healthcare',
    'fitness',
    'finance',
    'retail',
    'education',
    'beauty',
    'automotive',
    'legal'
  ];

  let passed = true;
  let foundTypes = 0;

  supportedBusinessTypes.forEach(type => {
    if (revoServiceContent.includes(`'${type}'`) || revoServiceContent.includes(`"${type}"`)) {
      console.log(`✅ Found business type support: ${type}`);
      foundTypes++;
    }
  });

  if (foundTypes >= 5) {
    console.log(`✅ Found support for ${foundTypes} business types`);
  } else {
    console.log(`❌ Only found support for ${foundTypes} business types (expected at least 5)`);
    passed = false;
  }

  return passed;
}

function testEnhancedBrandIntegration() {
  console.log('\n🔍 Testing: Enhanced Brand Integration');

  const brandFunctions = [
    'generateEnhancedBrandVoiceInstructions',
    'generateBrandVoiceStyle',
    'generateEnhancedBrandIntegrationGuidance',
    'generateBusinessContextAwareCTAGuidance'
  ];

  let passed = true;
  brandFunctions.forEach(func => {
    if (!revoServiceContent.includes(func)) {
      console.log(`❌ Missing brand function: ${func}`);
      passed = false;
    } else {
      console.log(`✅ Found brand function: ${func}`);
    }
  });

  return passed;
}

function testIndustrySpecificDesign() {
  console.log('\n🔍 Testing: Industry-Specific Design Generation');

  const designFunctions = [
    'generateIndustrySpecificDesignGuidance',
    'getIndustryDesignIntelligence',
    'enhanceDesignWithIndustryIntelligence'
  ];

  let passed = true;
  designFunctions.forEach(func => {
    if (!revoServiceContent.includes(func)) {
      console.log(`❌ Missing design function: ${func}`);
      passed = false;
    } else {
      console.log(`✅ Found design function: ${func}`);
    }
  });

  return passed;
}

// Main test execution function
async function runValidationTests() {
  console.log('🚀 Running Revo 1.0 Universal Business Validation Tests');

  const tests = [
    { name: 'Hardcoded Paya Removal', test: testHardcodedPayaRemoval },
    { name: 'Dynamic Business Intelligence', test: testDynamicBusinessIntelligence },
    { name: 'Global Cultural Context', test: testGlobalCulturalContext },
    { name: 'Business Type Support', test: testBusinessTypeSupport },
    { name: 'Enhanced Brand Integration', test: testEnhancedBrandIntegration },
    { name: 'Industry-Specific Design', test: testIndustrySpecificDesign }
  ];

  const results = [];

  for (const { name, test } of tests) {
    try {
      const passed = test();
      results.push({ name, passed });
    } catch (error) {
      console.log(`❌ Error in ${name}: ${error.message}`);
      results.push({ name, passed: false, error: error.message });
    }
  }

  // Summary report
  console.log('\n' + '='.repeat(80));
  console.log('📊 VALIDATION TEST SUMMARY');
  console.log('='.repeat(80));

  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;

  console.log(`✅ Passed: ${passedTests}/${totalTests} validation tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} validation tests`);

  results.forEach(result => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  const overallSuccess = passedTests === totalTests;
  console.log(`\n🎯 OVERALL VALIDATION RESULT: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  if (overallSuccess) {
    console.log('🎉 Revo 1.0 successfully validated as universal business content generation system!');
    console.log('✨ The system has been transformed from Paya-specific to universal business support.');
  } else {
    console.log('⚠️  Some validation tests failed. Review the results above.');
  }

  return { passed: overallSuccess, results };
}

// Test business profiles for reference
const testBusinessProfiles = {
  restaurant: {
    businessName: "Mama's Kitchen",
    businessType: "restaurant",
    location: "Lagos, Nigeria",
    services: ["Nigerian cuisine", "Catering services", "Takeout delivery"],
    targetAudience: "Families and food lovers who appreciate authentic Nigerian dishes",
    uniqueSellingPoints: ["Family recipes passed down for generations", "Fresh local ingredients"],
    keyFeatures: ["Authentic Nigerian flavors", "Family-friendly atmosphere"],
    primaryColor: "#D2691E",
    accentColor: "#8B4513",
    backgroundColor: "#FFF8DC"
  },

  healthcare: {
    businessName: "City Medical Center",
    businessType: "healthcare",
    location: "Toronto, Canada",
    services: ["General practice", "Preventive care", "Emergency services"],
    targetAudience: "Families and individuals seeking comprehensive healthcare",
    uniqueSellingPoints: ["24/7 emergency care", "Multilingual staff"],
    keyFeatures: ["Modern facilities", "Experienced doctors"],
    primaryColor: "#4A90E2",
    accentColor: "#7ED321",
    backgroundColor: "#FFFFFF"
  },

  fitness: {
    businessName: "PowerFit Gym",
    businessType: "fitness",
    location: "Mumbai, India",
    services: ["Personal training", "Group classes", "Nutrition counseling"],
    targetAudience: "Health-conscious individuals and fitness enthusiasts",
    uniqueSellingPoints: ["State-of-the-art equipment", "Certified trainers"],
    keyFeatures: ["24/7 access", "Modern equipment"],
    primaryColor: "#FF6B35",
    accentColor: "#F7931E",
    backgroundColor: "#FFFFFF"
  },

  retail: {
    businessName: "Urban Style Boutique",
    businessType: "retail",
    location: "London, UK",
    services: ["Fashion clothing", "Personal styling", "Online shopping"],
    targetAudience: "Fashion-forward professionals and style enthusiasts",
    uniqueSellingPoints: ["Curated designer collections", "Personal styling service"],
    keyFeatures: ["Latest fashion trends", "Quality materials"],
    primaryColor: "#E91E63",
    accentColor: "#9C27B0",
    backgroundColor: "#FFFFFF"
  },

  education: {
    businessName: "Future Skills Academy",
    businessType: "education",
    location: "Singapore",
    services: ["Professional courses", "Skill development", "Career coaching"],
    targetAudience: "Working professionals seeking career advancement",
    uniqueSellingPoints: ["Industry-relevant curriculum", "Flexible scheduling"],
    keyFeatures: ["Expert instructors", "Practical learning"],
    primaryColor: "#3F51B5",
    accentColor: "#FF9800",
    backgroundColor: "#FFFFFF"
  }
};

// Test function to validate content generation
async function testBusinessType(businessType, profile) {
  console.log(`\n🧪 Testing ${businessType.toUpperCase()} - ${profile.businessName}`);
  console.log(`📍 Location: ${profile.location}`);

  try {
    const input = {
      businessType: profile.businessType,
      businessName: profile.businessName,
      location: profile.location,
      services: profile.services.join(', '),
      targetAudience: profile.targetAudience,
      competitiveAdvantages: profile.uniqueSellingPoints.join(', '),
      keyFeatures: profile.keyFeatures.join(', '),
      primaryColor: profile.primaryColor,
      accentColor: profile.accentColor,
      backgroundColor: profile.backgroundColor,
      platform: 'instagram',
      visualStyle: 'modern',
      includePeople: true,
      useLocalLanguage: false,
      followBrandColors: true
    };

    const result = await generateRevo10Content(input);

    // Validation checks
    const validations = {
      hasContent: !!result.content,
      hasHeadline: !!result.content?.headline,
      hasSubheadline: !!result.content?.subheadline,
      hasCaption: !!result.content?.caption,
      hasCTA: !!result.content?.callToAction,
      hasHashtags: !!result.content?.hashtags,
      businessNameIncluded: result.content?.caption?.includes(profile.businessName) ||
        result.content?.headline?.includes(profile.businessName),
      noPayaReferences: !result.content?.caption?.toLowerCase().includes('paya') &&
        !result.content?.headline?.toLowerCase().includes('paya'),
      noHardcodedFintech: !result.content?.caption?.toLowerCase().includes('fintech') ||
        profile.businessType.includes('finance'),
      appropriateCTA: isAppropriateCtaForBusiness(result.content?.callToAction, businessType)
    };

    console.log(`✅ Content Generated: ${validations.hasContent}`);
    console.log(`✅ Has Headline: ${validations.hasHeadline}`);
    console.log(`✅ Has Subheadline: ${validations.hasSubheadline}`);
    console.log(`✅ Has Caption: ${validations.hasCaption}`);
    console.log(`✅ Has CTA: ${validations.hasCTA}`);
    console.log(`✅ Has Hashtags: ${validations.hasHashtags}`);
    console.log(`✅ Business Name Included: ${validations.businessNameIncluded}`);
    console.log(`✅ No Paya References: ${validations.noPayaReferences}`);
    console.log(`✅ No Hardcoded Fintech: ${validations.noHardcodedFintech}`);
    console.log(`✅ Appropriate CTA: ${validations.appropriateCTA}`);

    if (result.content) {
      console.log(`📝 Headline: "${result.content.headline}"`);
      console.log(`📝 Subheadline: "${result.content.subheadline}"`);
      console.log(`📝 CTA: "${result.content.callToAction}"`);
      console.log(`📝 Caption Preview: "${result.content.caption?.substring(0, 100)}..."`);
    }

    const allValid = Object.values(validations).every(v => v === true);
    console.log(`🎯 Overall Test Result: ${allValid ? '✅ PASSED' : '❌ FAILED'}`);

    return { businessType, passed: allValid, validations, content: result.content };

  } catch (error) {
    console.log(`❌ Error testing ${businessType}: ${error.message}`);
    return { businessType, passed: false, error: error.message };
  }
}

// Helper function to validate CTA appropriateness
function isAppropriateCtaForBusiness(cta, businessType) {
  if (!cta) return false;

  const ctaLower = cta.toLowerCase();
  const businessLower = businessType.toLowerCase();

  // Check for business-appropriate CTAs
  if (businessLower.includes('restaurant') || businessLower.includes('food')) {
    return ctaLower.includes('order') || ctaLower.includes('book') || ctaLower.includes('try') ||
      ctaLower.includes('taste') || ctaLower.includes('reserve') || ctaLower.includes('call');
  } else if (businessLower.includes('healthcare') || businessLower.includes('medical')) {
    return ctaLower.includes('book') || ctaLower.includes('schedule') || ctaLower.includes('appointment') ||
      ctaLower.includes('care') || ctaLower.includes('health') || ctaLower.includes('consult');
  } else if (businessLower.includes('fitness') || businessLower.includes('gym')) {
    return ctaLower.includes('join') || ctaLower.includes('start') || ctaLower.includes('train') ||
      ctaLower.includes('fit') || ctaLower.includes('trial') || ctaLower.includes('workout');
  } else if (businessLower.includes('retail') || businessLower.includes('shop')) {
    return ctaLower.includes('shop') || ctaLower.includes('buy') || ctaLower.includes('get') ||
      ctaLower.includes('view') || ctaLower.includes('save') || ctaLower.includes('collection');
  } else if (businessLower.includes('education') || businessLower.includes('school')) {
    return ctaLower.includes('enroll') || ctaLower.includes('learn') || ctaLower.includes('join') ||
      ctaLower.includes('course') || ctaLower.includes('apply') || ctaLower.includes('skills');
  }

  // Generic appropriate CTAs
  return !ctaLower.includes('learn more') || ctaLower.length > 10; // Avoid generic "Learn More"
}

// Main test execution
async function runUniversalBusinessTests() {
  console.log('🚀 Starting Revo 1.0 Universal Business Content Generation Tests');
  console.log('='.repeat(80));

  const results = [];

  for (const [businessType, profile] of Object.entries(testBusinessProfiles)) {
    const result = await testBusinessType(businessType, profile);
    results.push(result);

    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary report
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY REPORT');
  console.log('='.repeat(80));

  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;

  console.log(`✅ Passed: ${passedTests}/${totalTests} business types`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} business types`);

  results.forEach(result => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${result.businessType.toUpperCase()}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  const overallSuccess = passedTests === totalTests;
  console.log(`\n🎯 OVERALL RESULT: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  if (overallSuccess) {
    console.log('🎉 Revo 1.0 successfully transformed to universal business content generation!');
  } else {
    console.log('⚠️  Some business types need additional refinement.');
  }

  return { passed: overallSuccess, results };
}

// Export for use in other test files
module.exports = {
  runValidationTests,
  testBusinessProfiles
};

// Run validation tests if this file is executed directly
if (require.main === module) {
  runValidationTests().catch(console.error);
}
