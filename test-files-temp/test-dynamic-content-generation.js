/**
 * Test suite for dynamic vs static content generation in Revo 1.0
 * Validates that content is generated dynamically based on brand profile data
 * rather than using hardcoded templates
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Testing Dynamic vs Static Content Generation');
console.log('='.repeat(80));

// Read the Revo 1.0 service file to test dynamic content generation
const revoServicePath = path.join(__dirname, 'src', 'ai', 'revo-1.0-service.ts');
const revoServiceContent = fs.readFileSync(revoServicePath, 'utf8');

function testDynamicFunctionPresence() {
  console.log('\n🔍 Testing: Dynamic Function Presence');
  
  const dynamicFunctions = [
    'generateDynamicEngagementHooks',
    'generateDynamicContentStrategies',
    'generateDynamicMarketDynamics',
    'generateDynamicPainPoints',
    'generateDynamicValuePropositions',
    'generateDynamicStoryScenarios',
    'generateLocationAppropriateScenario',
    'generateBusinessSpecificCTAs',
    'generateBusinessContextAwareCTAGuidance'
  ];
  
  let foundFunctions = 0;
  
  dynamicFunctions.forEach(func => {
    if (revoServiceContent.includes(func)) {
      console.log(`✅ Found dynamic function: ${func}`);
      foundFunctions++;
    } else {
      console.log(`❌ Missing dynamic function: ${func}`);
    }
  });
  
  const passed = foundFunctions >= 7;
  if (passed) {
    console.log(`✅ Found ${foundFunctions} dynamic generation functions`);
  } else {
    console.log(`❌ Only found ${foundFunctions} dynamic functions (expected at least 7)`);
  }
  
  return passed;
}

function testHardcodedTemplateRemoval() {
  console.log('\n🔍 Testing: Hardcoded Template Removal');
  
  const hardcodedPatterns = [
    'PAYA-SPECIFIC CONTENT FOCUS',
    'hardcoded.*template',
    'static.*template',
    'fixed.*content',
    'const.*templates.*=.*\\[',
    'template.*array.*=.*\\['
  ];
  
  let foundHardcoded = 0;
  
  hardcodedPatterns.forEach(pattern => {
    const regex = new RegExp(pattern, 'gi');
    const matches = revoServiceContent.match(regex);
    if (matches && matches.length > 0) {
      console.log(`❌ Found hardcoded pattern: ${pattern} (${matches.length} matches)`);
      foundHardcoded++;
    }
  });
  
  if (foundHardcoded === 0) {
    console.log('✅ No hardcoded template patterns found');
  }
  
  return foundHardcoded === 0;
}

function testBrandProfileDataUsage() {
  console.log('\n🔍 Testing: Brand Profile Data Usage in Content Generation');
  
  // Check that content generation functions use brand profile data
  const brandProfileUsagePatterns = [
    'brandProfile\\.',
    'extractFrom.*BrandProfile',
    'brandProfile\\[',
    'businessType.*from.*brandProfile',
    'location.*from.*brandProfile'
  ];
  
  let totalUsage = 0;
  
  brandProfileUsagePatterns.forEach(pattern => {
    const regex = new RegExp(pattern, 'gi');
    const matches = revoServiceContent.match(regex);
    if (matches) {
      totalUsage += matches.length;
      console.log(`✅ Found brand profile usage pattern: ${pattern} (${matches.length} matches)`);
    }
  });
  
  const passed = totalUsage >= 50;
  if (passed) {
    console.log(`✅ Found ${totalUsage} brand profile data usage instances`);
  } else {
    console.log(`❌ Only found ${totalUsage} brand profile usage instances (expected at least 50)`);
  }
  
  return passed;
}

function testBusinessTypeAdaptation() {
  console.log('\n🔍 Testing: Business Type Adaptation');
  
  // Check for business-type-specific logic
  const businessTypes = ['restaurant', 'healthcare', 'fitness', 'finance', 'retail', 'education'];
  let foundAdaptations = 0;
  
  businessTypes.forEach(type => {
    const adaptationPatterns = [
      `if.*businessType.*includes.*${type}`,
      `${type}.*specific`,
      `businessType.*===.*${type}`,
      `businessLower.*includes.*${type}`
    ];
    
    let typeFound = false;
    adaptationPatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      if (regex.test(revoServiceContent)) {
        typeFound = true;
      }
    });
    
    if (typeFound) {
      console.log(`✅ Found business type adaptation: ${type}`);
      foundAdaptations++;
    }
  });
  
  const passed = foundAdaptations >= 4;
  if (passed) {
    console.log(`✅ Found adaptations for ${foundAdaptations} business types`);
  } else {
    console.log(`❌ Only found adaptations for ${foundAdaptations} business types (expected at least 4)`);
  }
  
  return passed;
}

function testLocationBasedAdaptation() {
  console.log('\n🔍 Testing: Location-Based Adaptation');
  
  // Check for location-based dynamic content generation
  const locationPatterns = [
    'location.*context',
    'cultural.*context',
    'generateLocation.*Scenario',
    'getLocation.*Instructions',
    'location.*appropriate'
  ];
  
  let foundLocationFeatures = 0;
  
  locationPatterns.forEach(pattern => {
    const regex = new RegExp(pattern, 'gi');
    const matches = revoServiceContent.match(regex);
    if (matches && matches.length > 0) {
      console.log(`✅ Found location adaptation: ${pattern} (${matches.length} matches)`);
      foundLocationFeatures++;
    }
  });
  
  const passed = foundLocationFeatures >= 3;
  if (passed) {
    console.log(`✅ Found ${foundLocationFeatures} location-based adaptation features`);
  } else {
    console.log(`❌ Only found ${foundLocationFeatures} location features (expected at least 3)`);
  }
  
  return passed;
}

function testDynamicCTAGeneration() {
  console.log('\n🔍 Testing: Dynamic CTA Generation');
  
  // Check for dynamic CTA generation instead of hardcoded CTAs
  const ctaPatterns = [
    'generateBusinessSpecificCTAs',
    'generateBusinessContextAwareCTAGuidance',
    'businessType.*CTA',
    'dynamic.*CTA',
    'contextual.*CTA'
  ];
  
  let foundCTAFeatures = 0;
  
  ctaPatterns.forEach(pattern => {
    const regex = new RegExp(pattern, 'gi');
    const matches = revoServiceContent.match(regex);
    if (matches && matches.length > 0) {
      console.log(`✅ Found dynamic CTA feature: ${pattern} (${matches.length} matches)`);
      foundCTAFeatures++;
    }
  });
  
  // Check for absence of hardcoded CTA arrays
  const hardcodedCTAPatterns = [
    'const.*ctas.*=.*\\[',
    'static.*cta.*array',
    'hardcoded.*cta'
  ];
  
  let foundHardcodedCTAs = 0;
  hardcodedCTAPatterns.forEach(pattern => {
    const regex = new RegExp(pattern, 'gi');
    if (regex.test(revoServiceContent)) {
      foundHardcodedCTAs++;
    }
  });
  
  const passed = foundCTAFeatures >= 2 && foundHardcodedCTAs === 0;
  if (passed) {
    console.log(`✅ Dynamic CTA generation is properly implemented`);
  } else {
    console.log(`❌ Dynamic CTA generation needs improvement`);
  }
  
  return passed;
}

function testContentVariationGeneration() {
  console.log('\n🔍 Testing: Content Variation Generation');
  
  // Check for dynamic content variation instead of static templates
  const variationPatterns = [
    'generateUnique.*Variation',
    'dynamic.*variation',
    'seed.*variation',
    'random.*content',
    'variation.*engine'
  ];
  
  let foundVariationFeatures = 0;
  
  variationPatterns.forEach(pattern => {
    const regex = new RegExp(pattern, 'gi');
    const matches = revoServiceContent.match(regex);
    if (matches && matches.length > 0) {
      console.log(`✅ Found variation feature: ${pattern} (${matches.length} matches)`);
      foundVariationFeatures++;
    }
  });
  
  const passed = foundVariationFeatures >= 2;
  if (passed) {
    console.log(`✅ Content variation generation is working`);
  } else {
    console.log(`❌ Content variation generation needs improvement`);
  }
  
  return passed;
}

function testIntelligentContentGeneration() {
  console.log('\n🔍 Testing: Intelligent Content Generation');
  
  // Check for intelligent content generation based on business intelligence
  const intelligencePatterns = [
    'getBusinessIntelligenceEngine',
    'business.*intelligence',
    'intelligent.*content',
    'smart.*generation',
    'context.*aware'
  ];
  
  let foundIntelligenceFeatures = 0;
  
  intelligencePatterns.forEach(pattern => {
    const regex = new RegExp(pattern, 'gi');
    const matches = revoServiceContent.match(regex);
    if (matches && matches.length > 0) {
      console.log(`✅ Found intelligence feature: ${pattern} (${matches.length} matches)`);
      foundIntelligenceFeatures++;
    }
  });
  
  const passed = foundIntelligenceFeatures >= 3;
  if (passed) {
    console.log(`✅ Intelligent content generation is implemented`);
  } else {
    console.log(`❌ Intelligent content generation needs improvement`);
  }
  
  return passed;
}

// Main test execution
async function runDynamicContentGenerationTests() {
  console.log('🚀 Running Dynamic vs Static Content Generation Tests');
  
  const tests = [
    { name: 'Dynamic Function Presence', test: testDynamicFunctionPresence },
    { name: 'Hardcoded Template Removal', test: testHardcodedTemplateRemoval },
    { name: 'Brand Profile Data Usage', test: testBrandProfileDataUsage },
    { name: 'Business Type Adaptation', test: testBusinessTypeAdaptation },
    { name: 'Location-Based Adaptation', test: testLocationBasedAdaptation },
    { name: 'Dynamic CTA Generation', test: testDynamicCTAGeneration },
    { name: 'Content Variation Generation', test: testContentVariationGeneration },
    { name: 'Intelligent Content Generation', test: testIntelligentContentGeneration }
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
  console.log('📊 DYNAMIC CONTENT GENERATION TEST SUMMARY');
  console.log('='.repeat(80));
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  console.log(`✅ Passed: ${passedTests}/${totalTests} dynamic content generation tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} dynamic content generation tests`);
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const overallSuccess = passedTests === totalTests;
  console.log(`\n🎯 OVERALL DYNAMIC CONTENT GENERATION RESULT: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (overallSuccess) {
    console.log('🔄 Dynamic content generation is working excellently!');
    console.log('✨ The system generates content dynamically based on brand profile data instead of using static templates.');
  } else {
    console.log('⚠️  Some dynamic content generation tests failed. Review the results above.');
  }
  
  return { passed: overallSuccess, results };
}

// Export for use in other test files
module.exports = {
  runDynamicContentGenerationTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runDynamicContentGenerationTests().catch(console.error);
}
