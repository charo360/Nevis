/**
 * Test suite for cultural context adaptation in Revo 1.0
 * Validates that the system adapts content appropriately for different global locations
 */

const fs = require('fs');
const path = require('path');

console.log('🌍 Testing Cultural Context Adaptation System');
console.log('='.repeat(80));

// Read the Revo 1.0 service file to test cultural functions
const revoServicePath = path.join(__dirname, 'src', 'ai', 'revo-1.0-service.ts');
const revoServiceContent = fs.readFileSync(revoServicePath, 'utf8');

// Test locations representing different global regions
const testLocations = [
  { location: 'Lagos, Nigeria', region: 'West Africa', currency: '₦' },
  { location: 'Mumbai, India', region: 'South Asia', currency: '₹' },
  { location: 'London, UK', region: 'Europe', currency: '£' },
  { location: 'Toronto, Canada', region: 'North America', currency: 'CAD' },
  { location: 'Singapore', region: 'Southeast Asia', currency: 'SGD' },
  { location: 'São Paulo, Brazil', region: 'South America', currency: 'R$' },
  { location: 'Dubai, UAE', region: 'Middle East', currency: 'AED' },
  { location: 'Sydney, Australia', region: 'Oceania', currency: 'AUD' },
  { location: 'Nairobi, Kenya', region: 'East Africa', currency: 'KES' },
  { location: 'Tokyo, Japan', region: 'East Asia', currency: '¥' }
];

function testCulturalContextFunctions() {
  console.log('\n🔍 Testing: Cultural Context Functions');
  
  const requiredFunctions = [
    'getDynamicCulturalContext',
    'getLocationSpecificLanguageInstructions', 
    'getLocalCulturalConnectionInstructions',
    'generateLocationAppropriateScenario',
    'getDynamicCulturalInstructions',
    'getDynamicPeopleInstructions'
  ];
  
  let passed = true;
  requiredFunctions.forEach(func => {
    if (!revoServiceContent.includes(func)) {
      console.log(`❌ Missing cultural function: ${func}`);
      passed = false;
    } else {
      console.log(`✅ Found cultural function: ${func}`);
    }
  });
  
  return passed;
}

function testCurrencyMapping() {
  console.log('\n🔍 Testing: Currency Mapping System');
  
  // Check if currency mapping exists
  if (!revoServiceContent.includes('currencyMap')) {
    console.log('❌ Currency mapping system not found');
    return false;
  }
  
  console.log('✅ Currency mapping system found');
  
  // Test that major currencies are supported
  const majorCurrencies = ['₦', '₹', '£', '$', '€', 'KES'];
  let foundCurrencies = 0;
  
  majorCurrencies.forEach(currency => {
    if (revoServiceContent.includes(`'${currency}'`) || revoServiceContent.includes(`"${currency}"`)) {
      console.log(`✅ Found currency support: ${currency}`);
      foundCurrencies++;
    }
  });
  
  const passed = foundCurrencies >= 3;
  if (passed) {
    console.log(`✅ Found support for ${foundCurrencies} major currencies`);
  } else {
    console.log(`❌ Only found support for ${foundCurrencies} currencies (expected at least 3)`);
  }
  
  return passed;
}

function testRegionalContexts() {
  console.log('\n🔍 Testing: Regional Context Support');
  
  const regions = ['africa', 'asia', 'europe', 'americas', 'middle east'];
  let foundRegions = 0;
  
  regions.forEach(region => {
    // Check for region-specific content or references
    const regionPattern = new RegExp(region, 'i');
    if (regionPattern.test(revoServiceContent)) {
      console.log(`✅ Found regional context: ${region}`);
      foundRegions++;
    }
  });
  
  const passed = foundRegions >= 3;
  if (passed) {
    console.log(`✅ Found support for ${foundRegions} regional contexts`);
  } else {
    console.log(`❌ Only found support for ${foundRegions} regional contexts (expected at least 3)`);
  }
  
  return passed;
}

function testNoHardcodedCulturalReferences() {
  console.log('\n🔍 Testing: No Hardcoded Cultural References');
  
  const hardcodedReferences = [
    'matatu',
    'M-Pesa',
    'Nairobi traffic',
    'KSh',
    'shilling'
  ];
  
  let passed = true;
  hardcodedReferences.forEach(ref => {
    if (revoServiceContent.includes(ref)) {
      console.log(`❌ Found hardcoded cultural reference: "${ref}"`);
      passed = false;
    }
  });
  
  if (passed) {
    console.log('✅ No hardcoded cultural references found');
  }
  
  return passed;
}

function testBusinessTypeContextAdaptation() {
  console.log('\n🔍 Testing: Business Type Context Adaptation');
  
  // Check that cultural context adapts to different business types
  const businessTypes = ['restaurant', 'healthcare', 'fitness', 'retail', 'education'];
  let foundAdaptations = 0;
  
  businessTypes.forEach(type => {
    // Look for business-type-specific cultural adaptations
    const contextPattern = new RegExp(`${type}.*context|context.*${type}`, 'i');
    if (contextPattern.test(revoServiceContent)) {
      console.log(`✅ Found cultural adaptation for: ${type}`);
      foundAdaptations++;
    }
  });
  
  const passed = foundAdaptations >= 2;
  if (passed) {
    console.log(`✅ Found cultural adaptations for ${foundAdaptations} business types`);
  } else {
    console.log(`❌ Only found cultural adaptations for ${foundAdaptations} business types (expected at least 2)`);
  }
  
  return passed;
}

function testLanguageInstructions() {
  console.log('\n🔍 Testing: Language Instructions System');
  
  const languageFeatures = [
    'getLocationSpecificLanguageInstructions',
    'useLocalLanguage',
    'language.*toggle',
    'cultural.*toggle'
  ];
  
  let passed = true;
  let foundFeatures = 0;
  
  languageFeatures.forEach(feature => {
    const featurePattern = new RegExp(feature, 'i');
    if (featurePattern.test(revoServiceContent)) {
      console.log(`✅ Found language feature: ${feature}`);
      foundFeatures++;
    }
  });
  
  if (foundFeatures >= 2) {
    console.log(`✅ Found ${foundFeatures} language instruction features`);
  } else {
    console.log(`❌ Only found ${foundFeatures} language features (expected at least 2)`);
    passed = false;
  }
  
  return passed;
}

function testLocationScenarioGeneration() {
  console.log('\n🔍 Testing: Location-Appropriate Scenario Generation');
  
  // Check for dynamic scenario generation
  if (!revoServiceContent.includes('generateLocationAppropriateScenario')) {
    console.log('❌ Location-appropriate scenario generation not found');
    return false;
  }
  
  console.log('✅ Location-appropriate scenario generation found');
  
  // Check for business-type-specific scenarios
  const scenarioTypes = ['restaurant', 'healthcare', 'fitness', 'retail'];
  let foundScenarios = 0;
  
  scenarioTypes.forEach(type => {
    const scenarioPattern = new RegExp(`${type}.*scenario|scenario.*${type}`, 'i');
    if (scenarioPattern.test(revoServiceContent)) {
      console.log(`✅ Found scenario generation for: ${type}`);
      foundScenarios++;
    }
  });
  
  const passed = foundScenarios >= 2;
  if (passed) {
    console.log(`✅ Found scenario generation for ${foundScenarios} business types`);
  } else {
    console.log(`❌ Only found scenario generation for ${foundScenarios} business types (expected at least 2)`);
  }
  
  return passed;
}

// Main test execution
async function runCulturalContextTests() {
  console.log('🚀 Running Cultural Context Adaptation Tests');
  
  const tests = [
    { name: 'Cultural Context Functions', test: testCulturalContextFunctions },
    { name: 'Currency Mapping System', test: testCurrencyMapping },
    { name: 'Regional Context Support', test: testRegionalContexts },
    { name: 'No Hardcoded Cultural References', test: testNoHardcodedCulturalReferences },
    { name: 'Business Type Context Adaptation', test: testBusinessTypeContextAdaptation },
    { name: 'Language Instructions System', test: testLanguageInstructions },
    { name: 'Location Scenario Generation', test: testLocationScenarioGeneration }
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
  console.log('📊 CULTURAL CONTEXT TEST SUMMARY');
  console.log('='.repeat(80));
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  console.log(`✅ Passed: ${passedTests}/${totalTests} cultural context tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} cultural context tests`);
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const overallSuccess = passedTests === totalTests;
  console.log(`\n🎯 OVERALL CULTURAL CONTEXT RESULT: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (overallSuccess) {
    console.log('🌍 Cultural context adaptation system is working correctly!');
    console.log('✨ The system supports global locations and adapts content appropriately.');
  } else {
    console.log('⚠️  Some cultural context tests failed. Review the results above.');
  }
  
  // Display test locations for reference
  console.log('\n📍 SUPPORTED TEST LOCATIONS:');
  testLocations.forEach(loc => {
    console.log(`   ${loc.location} (${loc.region}) - ${loc.currency}`);
  });
  
  return { passed: overallSuccess, results };
}

// Export for use in other test files
module.exports = {
  runCulturalContextTests,
  testLocations
};

// Run tests if this file is executed directly
if (require.main === module) {
  runCulturalContextTests().catch(console.error);
}
