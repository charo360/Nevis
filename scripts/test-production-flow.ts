#!/usr/bin/env tsx

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testProductionFlow() {
  console.log('🧪 Testing Production Flow for Samaki Cookies\n');

  try {
    // Test the exact same flow as production
    const { generateWithRevo20 } = await import('../src/ai/revo-2.0-service');

    const brandProfile = {
      businessName: 'Samaki Cookies',
      businessType: 'food',
      description: 'Samaki Cookies is a Kenyan company that produces nutritious fish-based cookies to combat malnutrition.',
      location: 'Kilifi County, Kenya',
      targetAudience: 'Kenyan families with children',
      services: ['Nutritious fish-based cookies'],

      // TESTING: Specific website URL that should be used (not hardcoded)
      websiteUrl: 'https://realsamakicookies.co.ke',

      // TESTING: Contact information that should be used
      contactInfo: {
        phone: '+254 701 234 567',
        email: 'hello@realsamakicookies.co.ke',
        address: 'Kilifi County, Kenya'
      },

      // Brand colors
      primaryColor: '#1E40AF',
      accentColor: '#F59E0B',
      backgroundColor: '#F8FAFC',

      website: '',
      logoDataUrl: ''
    };

    const options = {
      businessType: 'food',
      platform: 'instagram',
      visualStyle: 'modern' as const,
      imageText: '',
      brandProfile: brandProfile,
      aspectRatio: '1:1' as const,
      includePeopleInDesigns: false,
      useLocalLanguage: false,
      includeContacts: true  // TESTING: Enable contacts to test website URL fix
    };

    console.log('🚀 Starting Revo 2.0 generation...');
    console.log(`📋 Business: ${brandProfile.businessName}`);
    console.log(`🏢 Type: ${options.businessType}`);
    console.log(`📱 Platform: ${options.platform}`);
    console.log('');

    // Set a timeout for the generation
    const generationPromise = generateWithRevo20(options);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Generation timeout after 60 seconds')), 60000)
    );

    const result = await Promise.race([generationPromise, timeoutPromise]);

    console.log('\n✅ **PRODUCTION RESULT:**');
    console.log(`📝 **Headline:** "${result.headline}"`);
    console.log(`📄 **Caption:** "${result.caption?.substring(0, 200)}..."`);
    console.log(`🎯 **CTA:** "${result.cta}"`);
    console.log(`🏷️ **Hashtags:** ${result.hashtags?.join(', ')}`);
    console.log(`🤖 **Model:** ${result.model}`);
    console.log(`⏱️ **Processing Time:** ${result.processingTime}ms`);

    console.log('\n📞 **EXPECTED CONTACT INFO IN FOOTER:**');
    console.log(`  Phone: 📞 +254 701 234 567`);
    console.log(`  Email: 📧 hello@realsamakicookies.co.ke`);
    console.log(`  Website: 🌐 www.realsamakicookies.co.ke`);

    console.log('\n🎨 **IMAGE CONTENT CHECK:**');
    console.log(`  ✅ Should include: Headline, Subheadline, CTA`);
    console.log(`  ❌ Should NOT include: Caption text on image`);
    console.log(`  📞 Should include: Contact footer with correct website`);

    if (result.imageUrl) {
      console.log('\n🖼️ **Generated Image URL:**');
      console.log(`  ${result.imageUrl}`);
    }

    // Check for business-specific content vs generic
    const contentText = JSON.stringify(result).toLowerCase();
    const businessTerms = ['samaki', 'fish', 'cookies', 'nutrition', 'malnutrition', 'kenya', 'kilifi'];
    const genericTerms = ['fuel your dreams', 'fuel your day', 'fuel your focus', 'boost your hustle', 'empower your journey'];

    const foundBusinessTerms = businessTerms.filter(term => contentText.includes(term));
    const foundGenericTerms = genericTerms.filter(term => contentText.includes(term));

    console.log(`\n🎯 **Business-specific terms found:** ${foundBusinessTerms.join(', ') || 'NONE'}`);
    console.log(`⚠️ **Generic terms found:** ${foundGenericTerms.join(', ') || 'NONE'}`);

    if (foundBusinessTerms.length > 0 && foundGenericTerms.length === 0) {
      console.log('✅ **SUCCESS:** Using Business Profiler + Food Assistant!');
    } else if (foundGenericTerms.length > 0) {
      console.log('❌ **ISSUE:** Generic "Fuel Your" language detected - NOT using assistants');
    } else {
      console.log('🤔 **UNCLEAR:** No clear indicators found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
}

// Run the test
testProductionFlow().catch(console.error);
