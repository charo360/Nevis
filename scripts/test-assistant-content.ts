#!/usr/bin/env tsx

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testAssistantContent() {
  console.log('🧪 Testing Food Assistant Content Generation\n');

  try {
    // Import Business Profile Manager
    const { BusinessProfileManager } = await import('../src/ai/intelligence/business-profile-manager');
    const profileManager = new BusinessProfileManager();

    // Get Samaki Cookies profile
    console.log('📋 Loading Samaki Cookies profile...');
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

    const businessProfile = await profileManager.getBusinessProfile(brandProfile);
    const marketingInsights = profileManager.generateMarketingInsights(businessProfile, 'Kenyan families with children');
    
    console.log('✅ Business profile loaded');
    console.log(`🎯 Business essence: ${marketingInsights.businessEssence.substring(0, 100)}...`);

    // Test Assistant Manager
    console.log('\n🤖 Testing Food Assistant...');
    const { assistantManager } = await import('../src/ai/assistants/assistant-manager');
    
    const request = {
      businessType: 'food' as const,
      brandProfile: brandProfile,
      concept: {
        concept: 'Family nutrition with fish-based cookies',
        dimensions: { tone: 'caring', audience: 'families', focus: 'nutrition' }
      },
      imagePrompt: '',
      platform: 'instagram',
      marketingAngle: 'health-focused',
      businessIntelligence: {
        coreBusinessUnderstanding: {
          whatTheyDo: businessProfile.offerings[0]?.description || businessProfile.mission,
          whoItsFor: marketingInsights.primaryAudienceProfile,
          whyItMatters: businessProfile.mission
        }
      }
    };

    console.log('🚀 Generating content with Food Assistant...');
    
    // Set a timeout for the assistant call
    const assistantPromise = assistantManager.generateContent(request);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Assistant timeout after 30 seconds')), 30000)
    );

    const result = await Promise.race([assistantPromise, timeoutPromise]);

    console.log('\n✅ **FOOD ASSISTANT RESULT:**');
    console.log(`📝 **Headline:** "${result.content.headline}"`);
    console.log(`📄 **Caption:** "${result.content.caption?.substring(0, 200)}..."`);
    console.log(`🎯 **CTA:** "${result.content.cta}"`);
    console.log(`🏷️ **Hashtags:** ${result.content.hashtags?.join(', ')}`);

    // Check for business-specific content
    const contentText = JSON.stringify(result.content).toLowerCase();
    const businessTerms = ['samaki', 'fish', 'cookies', 'nutrition', 'malnutrition', 'kenya', 'kilifi'];
    const foundTerms = businessTerms.filter(term => contentText.includes(term));

    console.log(`\n🎯 **Business-specific terms found:** ${foundTerms.join(', ')}`);
    
    if (foundTerms.length > 0) {
      console.log('✅ **SUCCESS:** Food Assistant generated business-specific content!');
    } else {
      console.log('❌ **ISSUE:** Content seems generic');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
}

// Run the test
testAssistantContent().catch(console.error);
