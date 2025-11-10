#!/usr/bin/env tsx

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testBrandColors() {
  console.log('🎨 Testing Brand Colors for Samaki Cookies\n');

  try {
    // Test the Business Profile Manager to see if colors are loaded
    const { BusinessProfileManager } = await import('../src/ai/intelligence/business-profile-manager');
    const profileManager = new BusinessProfileManager();

    const brandProfile = {
      businessName: 'Samaki Cookies',
      businessType: 'food',
      description: 'Samaki Cookies is a Kenyan company that produces nutritious fish-based cookies to combat malnutrition.',
      location: 'Kilifi County, Kenya',
      targetAudience: 'Kenyan families with children',
      services: ['Nutritious fish-based cookies'],
      website: '',
      logoDataUrl: ''
    };

    console.log('🔍 Testing Business Profile Loading...');
    const businessProfile = await profileManager.getBusinessProfile(brandProfile);
    
    console.log('✅ **BUSINESS PROFILE LOADED:**');
    console.log(`📋 Business Name: ${businessProfile.businessName}`);
    console.log(`🎨 Primary Color: ${businessProfile.primaryColor || 'NOT SET'}`);
    console.log(`🎨 Accent Color: ${businessProfile.accentColor || 'NOT SET'}`);
    console.log(`🎨 Background Color: ${businessProfile.backgroundColor || 'NOT SET'}`);
    console.log(`📞 Phone: ${businessProfile.contactInfo?.phone || 'NOT SET'}`);
    console.log(`📧 Email: ${businessProfile.contactInfo?.email || 'NOT SET'}`);
    console.log(`🌐 Website: ${businessProfile.contactInfo?.website || 'NOT SET'}`);
    console.log(`📍 Address: ${businessProfile.contactInfo?.address || 'NOT SET'}`);
    
    if (businessProfile.avoidanceList && businessProfile.avoidanceList.length > 0) {
      console.log(`🚫 Avoidance List: ${businessProfile.avoidanceList.join(', ')}`);
    }

    // Test if colors are properly passed to the prompt generation
    console.log('\n🧪 Testing Prompt Generation with Brand Colors...');
    const { buildEnhancedPrompt } = await import('../src/ai/revo-2.0-service');
    
    const options = {
      businessType: 'food',
      platform: 'instagram' as const,
      brandProfile: {
        ...brandProfile,
        primaryColor: businessProfile.primaryColor,
        accentColor: businessProfile.accentColor,
        backgroundColor: businessProfile.backgroundColor,
        contactInfo: businessProfile.contactInfo
      },
      aspectRatio: '1:1' as const,
      visualStyle: 'modern' as const,
      followBrandColors: true,
      includeContacts: true
    };

    const concept = {
      concept: 'Test concept for brand colors',
      visualTheme: 'modern',
      emotionalTone: 'professional'
    };

    // This should trigger the brand colors debug log
    const prompt = buildEnhancedPrompt(options, concept);
    
    console.log('\n✅ **PROMPT GENERATION COMPLETE**');
    console.log('📝 Check the logs above for "🎨 [Revo 2.0] Brand Colors Debug" to see if colors are being used');
    
    // Check if contact info is in the prompt
    if (prompt.includes('📞 MANDATORY CONTACT FOOTER')) {
      console.log('✅ **CONTACT INFO**: Found in prompt');
    } else {
      console.log('❌ **CONTACT INFO**: NOT found in prompt');
    }
    
    // Check if brand colors are in the prompt
    if (prompt.includes('#1E40AF') && prompt.includes('#F59E0B')) {
      console.log('✅ **BRAND COLORS**: Found in prompt (Ocean Blue + Amber)');
    } else {
      console.log('❌ **BRAND COLORS**: NOT found in prompt');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
}

// Run the test
testBrandColors().catch(console.error);
