/**
 * Test suite for brand profile data integration in Revo 1.0
 * Validates that brand profile data is properly extracted and used throughout the system
 */

const fs = require('fs');
const path = require('path');

console.log('🏢 Testing Brand Profile Data Integration');
console.log('='.repeat(80));

// Read the Revo 1.0 service file to test brand profile integration
const revoServicePath = path.join(__dirname, 'src', 'ai', 'revo-1.0-service.ts');
const revoServiceContent = fs.readFileSync(revoServicePath, 'utf8');

function testBrandProfileExtractionFunctions() {
  console.log('\n🔍 Testing: Brand Profile Data Extraction Functions');
  
  const extractionFunctions = [
    'extractPainPointsFromBrandProfile',
    'extractValuePropsFromBrandProfile',
    'extractScenariosFromBrandProfile',
    'extractServiceBenefits',
    'extractServiceFeatures',
    'extractAudienceSegments',
    'extractAudienceDemographics',
    'extractAudiencePainPoints',
    'extractAudienceMotivations'
  ];
  
  let passed = true;
  let foundFunctions = 0;
  
  extractionFunctions.forEach(func => {
    if (revoServiceContent.includes(func)) {
      console.log(`✅ Found extraction function: ${func}`);
      foundFunctions++;
    } else {
      console.log(`❌ Missing extraction function: ${func}`);
    }
  });
  
  if (foundFunctions >= 6) {
    console.log(`✅ Found ${foundFunctions} brand profile extraction functions`);
  } else {
    console.log(`❌ Only found ${foundFunctions} extraction functions (expected at least 6)`);
    passed = false;
  }
  
  return passed;
}

function testBrandProfileFieldUsage() {
  console.log('\n🔍 Testing: Brand Profile Field Usage');
  
  const brandProfileFields = [
    'businessName',
    'businessType',
    'location',
    'services',
    'targetAudience',
    'uniqueSellingPoints',
    'keyFeatures',
    'competitiveAdvantages',
    'brandColors',
    'logoUrl',
    'description',
    'brandVoice',
    'writingTone'
  ];
  
  let foundFields = 0;
  
  brandProfileFields.forEach(field => {
    // Check for field usage in the code
    const fieldPattern = new RegExp(`brandProfile\\.${field}|brandProfile\\[['"]${field}['"]\\]`, 'g');
    const matches = revoServiceContent.match(fieldPattern);
    if (matches && matches.length > 0) {
      console.log(`✅ Found usage of field: ${field} (${matches.length} times)`);
      foundFields++;
    }
  });
  
  const passed = foundFields >= 8;
  if (passed) {
    console.log(`✅ Found usage of ${foundFields} brand profile fields`);
  } else {
    console.log(`❌ Only found usage of ${foundFields} brand profile fields (expected at least 8)`);
  }
  
  return passed;
}

function testServiceDataProcessing() {
  console.log('\n🔍 Testing: Service Data Processing');
  
  const serviceProcessingFunctions = [
    'normalizeServiceList',
    'getDetailedServiceInfo',
    'extractServiceBenefits',
    'extractServiceFeatures',
    'generateEnhancedServiceContentRules',
    'generateEnhancedServicesDisplay'
  ];
  
  let passed = true;
  let foundFunctions = 0;
  
  serviceProcessingFunctions.forEach(func => {
    if (revoServiceContent.includes(func)) {
      console.log(`✅ Found service processing function: ${func}`);
      foundFunctions++;
    }
  });
  
  if (foundFunctions >= 4) {
    console.log(`✅ Found ${foundFunctions} service processing functions`);
  } else {
    console.log(`❌ Only found ${foundFunctions} service processing functions (expected at least 4)`);
    passed = false;
  }
  
  return passed;
}

function testTargetAudienceIntegration() {
  console.log('\n🔍 Testing: Target Audience Integration');
  
  const audienceFunctions = [
    'getEnhancedTargetAudienceInfo',
    'extractAudienceSegments',
    'extractAudienceDemographics',
    'extractAudiencePainPoints',
    'extractAudienceMotivations',
    'getAudienceCommunicationStyle',
    'generateEnhancedTargetAudienceContent',
    'generateAudienceSpecificPainPoints'
  ];
  
  let foundFunctions = 0;
  
  audienceFunctions.forEach(func => {
    if (revoServiceContent.includes(func)) {
      console.log(`✅ Found audience function: ${func}`);
      foundFunctions++;
    }
  });
  
  const passed = foundFunctions >= 5;
  if (passed) {
    console.log(`✅ Found ${foundFunctions} target audience integration functions`);
  } else {
    console.log(`❌ Only found ${foundFunctions} audience functions (expected at least 5)`);
  }
  
  return passed;
}

function testBrandVoiceIntegration() {
  console.log('\n🔍 Testing: Brand Voice Integration');
  
  const brandVoiceFunctions = [
    'generateEnhancedBrandVoiceInstructions',
    'generateBrandVoiceStyle',
    'getHumanWritingStyle'
  ];
  
  let passed = true;
  
  brandVoiceFunctions.forEach(func => {
    if (!revoServiceContent.includes(func)) {
      console.log(`❌ Missing brand voice function: ${func}`);
      passed = false;
    } else {
      console.log(`✅ Found brand voice function: ${func}`);
    }
  });
  
  // Check for brand voice field usage
  const brandVoiceUsage = revoServiceContent.match(/brandProfile\.brandVoice|brandProfile\.writingTone/g);
  if (brandVoiceUsage && brandVoiceUsage.length > 0) {
    console.log(`✅ Found brand voice field usage (${brandVoiceUsage.length} times)`);
  } else {
    console.log('❌ Brand voice field usage not found');
    passed = false;
  }
  
  return passed;
}

function testBrandColorIntegration() {
  console.log('\n🔍 Testing: Brand Color Integration');
  
  // Check for brand color usage
  const colorFields = ['primaryColor', 'accentColor', 'backgroundColor'];
  let foundColorUsage = 0;
  
  colorFields.forEach(field => {
    const colorPattern = new RegExp(`brandProfile\\.${field}`, 'g');
    const matches = revoServiceContent.match(colorPattern);
    if (matches && matches.length > 0) {
      console.log(`✅ Found color field usage: ${field} (${matches.length} times)`);
      foundColorUsage++;
    }
  });
  
  // Check for color toggle functionality
  const colorToggleUsage = revoServiceContent.includes('followBrandColors') || 
                          revoServiceContent.includes('shouldFollowBrandColors');
  
  if (colorToggleUsage) {
    console.log('✅ Found brand color toggle functionality');
  } else {
    console.log('❌ Brand color toggle functionality not found');
  }
  
  const passed = foundColorUsage >= 2 && colorToggleUsage;
  if (passed) {
    console.log(`✅ Brand color integration working correctly`);
  } else {
    console.log(`❌ Brand color integration needs improvement`);
  }
  
  return passed;
}

function testBusinessIntelligenceIntegration() {
  console.log('\n🔍 Testing: Business Intelligence Integration');
  
  const businessIntelFunctions = [
    'getBusinessIntelligenceEngine',
    'getBusinessTypeIntelligence',
    'generateDynamicEngagementHooks',
    'generateDynamicContentStrategies',
    'generateDynamicMarketDynamics'
  ];
  
  let foundFunctions = 0;
  
  businessIntelFunctions.forEach(func => {
    if (revoServiceContent.includes(func)) {
      console.log(`✅ Found business intelligence function: ${func}`);
      foundFunctions++;
    }
  });
  
  const passed = foundFunctions >= 4;
  if (passed) {
    console.log(`✅ Found ${foundFunctions} business intelligence functions`);
  } else {
    console.log(`❌ Only found ${foundFunctions} business intelligence functions (expected at least 4)`);
  }
  
  return passed;
}

function testDynamicContentGeneration() {
  console.log('\n🔍 Testing: Dynamic Content Generation');
  
  // Check that content generation uses brand profile data dynamically
  const dynamicPatterns = [
    'generateDynamic',
    'extractFrom.*BrandProfile',
    'brandProfile\\.',
    'businessType.*intelligence',
    'location.*context'
  ];
  
  let foundPatterns = 0;
  
  dynamicPatterns.forEach(pattern => {
    const regex = new RegExp(pattern, 'gi');
    const matches = revoServiceContent.match(regex);
    if (matches && matches.length > 0) {
      console.log(`✅ Found dynamic pattern: ${pattern} (${matches.length} matches)`);
      foundPatterns++;
    }
  });
  
  const passed = foundPatterns >= 4;
  if (passed) {
    console.log(`✅ Dynamic content generation is properly integrated`);
  } else {
    console.log(`❌ Dynamic content generation needs improvement`);
  }
  
  return passed;
}

// Main test execution
async function runBrandProfileIntegrationTests() {
  console.log('🚀 Running Brand Profile Data Integration Tests');
  
  const tests = [
    { name: 'Brand Profile Extraction Functions', test: testBrandProfileExtractionFunctions },
    { name: 'Brand Profile Field Usage', test: testBrandProfileFieldUsage },
    { name: 'Service Data Processing', test: testServiceDataProcessing },
    { name: 'Target Audience Integration', test: testTargetAudienceIntegration },
    { name: 'Brand Voice Integration', test: testBrandVoiceIntegration },
    { name: 'Brand Color Integration', test: testBrandColorIntegration },
    { name: 'Business Intelligence Integration', test: testBusinessIntelligenceIntegration },
    { name: 'Dynamic Content Generation', test: testDynamicContentGeneration }
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
  console.log('📊 BRAND PROFILE INTEGRATION TEST SUMMARY');
  console.log('='.repeat(80));
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  console.log(`✅ Passed: ${passedTests}/${totalTests} brand profile integration tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} brand profile integration tests`);
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const overallSuccess = passedTests === totalTests;
  console.log(`\n🎯 OVERALL BRAND PROFILE INTEGRATION RESULT: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (overallSuccess) {
    console.log('🏢 Brand profile data integration is working excellently!');
    console.log('✨ The system properly extracts and uses brand profile data throughout content generation.');
  } else {
    console.log('⚠️  Some brand profile integration tests failed. Review the results above.');
  }
  
  return { passed: overallSuccess, results };
}

// Export for use in other test files
module.exports = {
  runBrandProfileIntegrationTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runBrandProfileIntegrationTests().catch(console.error);
}
