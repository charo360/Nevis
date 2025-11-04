/**
 * Test script to verify Revo 1.0 generates dynamic content without hardcoded templates
 */

// Mock the required modules and functions
const mockBrandProfile = {
  businessName: "TechFlow Solutions",
  businessType: "technology",
  location: "Nairobi, Kenya",
  targetAudience: "small businesses",
  brandVoice: "professional",
  uniqueSellingPoints: ["AI-powered solutions"],
  services: ["software development"],
  keyFeatures: ["custom solutions"],
  brandColors: {
    primary: "#1a73e8",
    secondary: "#34a853",
    background: "#ffffff"
  }
};

// Test input that should NOT generate "Kamau" content
const testInput = {
  businessType: "technology",
  businessName: "TechFlow Solutions", 
  location: "Nairobi, Kenya",
  platform: "instagram",
  writingTone: "professional",
  contentThemes: ["innovation"],
  targetAudience: "small businesses",
  services: "software development",
  keyFeatures: "custom solutions",
  competitiveAdvantages: "AI-powered",
  dayOfWeek: "Monday",
  currentDate: "2024-01-15",
  primaryColor: "#1a73e8",
  visualStyle: "modern",
  includeContacts: false,
  websiteUrl: "https://techflow.com",
  followBrandColors: true,
  useLocalLanguage: false,
  scheduledServices: [],
  includePeople: false
};

async function testRevo10DynamicContent() {
  try {
    console.log('🧪 Testing Revo 1.0 Dynamic Content Generation...');
    console.log('📋 Test Input:', JSON.stringify(testInput, null, 2));
    
    // Import the Revo 1.0 service
    const { generateRevo10Content } = await import('./src/ai/revo-1.0-service.ts');
    
    console.log('⏳ Generating content...');
    const result = await generateRevo10Content(testInput);
    
    console.log('✅ Content Generated Successfully!');
    console.log('📄 Generated Content:');
    console.log('  📰 Headline:', result.headline);
    console.log('  📝 Subheadline:', result.subheadline);
    console.log('  💬 Caption:', result.content);
    console.log('  🎯 CTA:', result.callToAction);
    console.log('  🏷️ Hashtags:', result.hashtags);
    
    // Check for hardcoded template indicators
    const contentText = `${result.headline} ${result.subheadline} ${result.content} ${result.callToAction}`.toLowerCase();
    
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
    const businessName = testInput.businessName.toLowerCase();
    const businessType = testInput.businessType.toLowerCase();
    
    if (contentText.includes(businessName) || contentText.includes(businessType)) {
      console.log('✅ PASSED: Content is business-specific');
    } else {
      console.log('⚠️ WARNING: Content may not be business-specific enough');
    }
    
    // Check content structure
    if (result.headline && result.subheadline && result.content && result.callToAction && result.hashtags) {
      console.log('✅ PASSED: All required content fields present');
    } else {
      console.log('❌ FAILED: Missing required content fields');
      return false;
    }
    
    console.log('\n🎉 SUCCESS: Revo 1.0 is generating dynamic, template-free content!');
    console.log('📊 Processing Time:', result.processingTime + 'ms');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test Failed:', error);
    return false;
  }
}

// Run the test
testRevo10DynamicContent()
  .then(success => {
    if (success) {
      console.log('\n✅ ALL TESTS PASSED: Revo 1.0 unified architecture is working correctly!');
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
