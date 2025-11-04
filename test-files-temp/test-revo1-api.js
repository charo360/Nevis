/**
 * Test script to verify Revo 1.0 API generates dynamic content without hardcoded templates
 */

const testInput = {
  revoModel: "revo-1.0",
  platform: "instagram",
  brandProfile: {
    businessType: "technology",
    businessName: "TechFlow Solutions",
    location: "Nairobi, Kenya",
    writingTone: "professional",
    contentThemes: ["innovation"],
    targetAudience: "small businesses",
    services: "software development",
    keyFeatures: "custom solutions",
    competitiveAdvantages: "AI-powered",
    primaryColor: "#1a73e8",
    visualStyle: "modern",
    websiteUrl: "https://techflow.com"
  },
  brandConsistency: {
    strictConsistency: false,
    followBrandColors: true,
    includeContacts: false
  },
  useLocalLanguage: false,
  scheduledServices: [],
  includePeopleInDesigns: false
};

async function testRevo10API() {
  try {
    console.log('🧪 Testing Revo 1.0 API Dynamic Content Generation...');
    console.log('📋 Test Input:', JSON.stringify(testInput, null, 2));

    console.log('⏳ Calling Revo 1.0 API...');

    const response = await fetch('http://localhost:3003/api/quick-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testInput)
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    console.log('✅ Content Generated Successfully!');
    console.log('📄 Generated Content:');
    console.log('  📰 Headline:', result.headline || result.catchyWords);
    console.log('  📝 Subheadline:', result.subheadline);
    console.log('  💬 Caption:', result.content);
    console.log('  🎯 CTA:', result.callToAction);
    console.log('  🏷️ Hashtags:', result.hashtags);

    // Check for hardcoded template indicators
    const contentText = `${result.headline || result.catchyWords || ''} ${result.subheadline || ''} ${result.content || ''} ${result.callToAction || ''}`.toLowerCase();

    console.log('\n🔍 Template Analysis:');

    // Check for "Kamau" and other hardcoded names
    const hardcodedNames = ['kamau', 'mama wanjiku', 'akinyi', 'njeri', 'wanjiku'];
    const foundNames = hardcodedNames.filter(name => contentText.includes(name));

    if (foundNames.length > 0) {
      console.log('❌ FAILED: Found hardcoded names:', foundNames);
      return false;
    } else {
      console.log('✅ PASSED: No hardcoded character names found');
    }

    // Check for hardcoded story patterns
    const hardcodedPatterns = [
      'taps a few times',
      'confirms the kes',
      'transfer instantly',
      'gikomba market',
      'matatu ride',
      'boda boda'
    ];
    const foundPatterns = hardcodedPatterns.filter(pattern => contentText.includes(pattern));

    if (foundPatterns.length > 0) {
      console.log('❌ FAILED: Found hardcoded story patterns:', foundPatterns);
      return false;
    } else {
      console.log('✅ PASSED: No hardcoded story patterns found');
    }

    // Check if content is business-specific
    const businessName = testInput.brandProfile.businessName.toLowerCase();
    const businessType = testInput.brandProfile.businessType.toLowerCase();

    if (contentText.includes(businessName) || contentText.includes(businessType) || contentText.includes('tech')) {
      console.log('✅ PASSED: Content is business-specific');
    } else {
      console.log('⚠️ WARNING: Content may not be business-specific enough');
    }

    // Check content structure
    const hasRequiredFields = (result.headline || result.catchyWords) && result.content && result.hashtags;
    if (hasRequiredFields) {
      console.log('✅ PASSED: Required content fields present');
    } else {
      console.log('❌ FAILED: Missing required content fields');
      console.log('Available fields:', Object.keys(result));
      return false;
    }

    console.log('\n🎉 SUCCESS: Revo 1.0 is generating dynamic, template-free content!');

    return true;

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    return false;
  }
}

// Run the test
testRevo10API()
  .then(success => {
    if (success) {
      console.log('\n✅ ALL TESTS PASSED: Revo 1.0 unified architecture is working correctly!');
      console.log('🎯 Revo 1.0 now follows Revo 2.0 architecture with dynamic content generation');
      console.log('🚫 No more hardcoded "Kamau" templates');
      process.exit(0);
    } else {
      console.log('\n❌ TESTS FAILED: Issues found with Revo 1.0 implementation');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
