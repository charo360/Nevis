/**
 * Test Local Language Toggle Integration in Revo 2.0
 * Verifies that when useLocalLanguage=true, local languages are properly integrated
 */

const { generateWithRevo20 } = require('./src/ai/revo-2.0-service');

async function testLocalLanguageToggle() {
  console.log('🌍 Testing Local Language Toggle Integration...\n');

  // Test brand profile for Paya Kenya
  const testBrandProfile = {
    businessName: 'Paya Finance',
    businessType: 'Financial Technology',
    location: 'Kenya',
    description: 'Digital banking and mobile payments for Kenya',
    services: [
      { name: 'Mobile Banking', description: 'Bank on your phone' },
      { name: 'Buy Now Pay Later', description: 'Split payments into installments' },
      { name: 'Instant Payments', description: 'Send money instantly' }
    ],
    keyFeatures: ['No credit checks', 'Open in 3 minutes', 'Bank-level security'],
    competitiveAdvantages: ['98% faster than banks', 'No hidden fees', 'Works offline'],
    targetAudience: 'Young professionals and entrepreneurs in Kenya',
    brandColors: {
      primary: '#E4574C',
      secondary: '#2A2A2A'
    },
    contactInfo: {
      phone: '+254 700 000 000',
      email: 'support@paya.co.ke',
      website: 'https://paya.co.ke'
    }
  };

  // Test different countries with local language toggle ON
  const testCountries = [
    { location: 'Kenya', expectedLanguage: 'Swahili' },
    { location: 'Nigeria', expectedLanguage: 'Pidgin English' },
    { location: 'Ghana', expectedLanguage: 'Twi' },
    { location: 'India', expectedLanguage: 'Hindi' },
    { location: 'Philippines', expectedLanguage: 'Filipino' },
    { location: 'Brazil', expectedLanguage: 'Portuguese' },
    { location: 'France', expectedLanguage: 'French' },
    { location: 'Germany', expectedLanguage: 'German' }
  ];

  for (const country of testCountries) {
    console.log(`\n🌍 Testing ${country.location} with ${country.expectedLanguage}:`);
    console.log('=' .repeat(60));

    // Test with LOCAL LANGUAGE TOGGLE ON
    const optionsWithLocal = {
      businessType: 'Financial Technology',
      platform: 'instagram',
      brandProfile: {
        ...testBrandProfile,
        location: country.location
      },
      aspectRatio: '1:1',
      useLocalLanguage: true  // 🔥 TOGGLE ON
    };

    try {
      const resultWithLocal = await generateWithRevo20(optionsWithLocal);
      
      console.log(`\n✅ LOCAL LANGUAGE ON (${country.expectedLanguage}):`);
      console.log(`📝 Headline: "${resultWithLocal.content.headline}"`);
      console.log(`📝 Subheadline: "${resultWithLocal.content.subheadline}"`);
      console.log(`📝 Caption: "${resultWithLocal.content.caption.substring(0, 150)}..."`);
      console.log(`📝 CTA: "${resultWithLocal.content.cta}"`);

      // Check for local language integration
      const combinedText = `${resultWithLocal.content.headline} ${resultWithLocal.content.subheadline} ${resultWithLocal.content.caption}`;
      
      let hasLocalLanguage = false;
      let detectedWords = [];

      // Check for specific local language elements
      if (country.location === 'Kenya') {
        const swahiliWords = ['karibu', 'asante', 'haraka', 'poa', 'mambo', 'biashara', 'huduma', 'pesa', 'jambo', 'sawa', 'hakuna matata', 'twende', 'malipo', 'salama'];
        detectedWords = swahiliWords.filter(word => combinedText.toLowerCase().includes(word));
        hasLocalLanguage = detectedWords.length > 0;
      } else if (country.location === 'Nigeria') {
        const pidginWords = ['wahala', 'wetin', 'sharp', 'correct', 'bawo', 'ndewo', 'sannu'];
        detectedWords = pidginWords.filter(word => combinedText.toLowerCase().includes(word));
        hasLocalLanguage = detectedWords.length > 0;
      } else if (country.location === 'India') {
        const hindiWords = ['namaste', 'dhanyawad', 'accha', 'jaldi', 'chalo', 'bahut'];
        detectedWords = hindiWords.filter(word => combinedText.toLowerCase().includes(word));
        hasLocalLanguage = detectedWords.length > 0;
      } else if (country.location === 'Brazil') {
        const portugueseWords = ['olá', 'obrigado', 'bom', 'rápido', 'vamos lá', 'sem problema'];
        detectedWords = portugueseWords.filter(word => combinedText.toLowerCase().includes(word));
        hasLocalLanguage = detectedWords.length > 0;
      } else if (country.location === 'France') {
        const frenchWords = ['bonjour', 'merci', 'bon', 'rapide', 'allons-y', 'pas de problème'];
        detectedWords = frenchWords.filter(word => combinedText.toLowerCase().includes(word));
        hasLocalLanguage = detectedWords.length > 0;
      }

      if (hasLocalLanguage) {
        console.log(`🎯 ✅ LOCAL LANGUAGE DETECTED: ${detectedWords.join(', ')}`);
      } else {
        console.log(`⚠️  NO LOCAL LANGUAGE DETECTED - May be using English-only approach`);
      }

    } catch (error) {
      console.error(`❌ Error testing ${country.location}:`, error.message);
    }

    // Test with LOCAL LANGUAGE TOGGLE OFF for comparison
    const optionsWithoutLocal = {
      ...optionsWithLocal,
      useLocalLanguage: false  // 🔥 TOGGLE OFF
    };

    try {
      const resultWithoutLocal = await generateWithRevo20(optionsWithoutLocal);
      
      console.log(`\n🔄 LOCAL LANGUAGE OFF (English Only):`);
      console.log(`📝 Headline: "${resultWithoutLocal.content.headline}"`);
      console.log(`📝 Subheadline: "${resultWithoutLocal.content.subheadline}"`);
      console.log(`📝 Caption: "${resultWithoutLocal.content.caption.substring(0, 150)}..."`);

    } catch (error) {
      console.error(`❌ Error testing ${country.location} without local language:`, error.message);
    }

    console.log('\n' + '-'.repeat(60));
  }

  console.log('\n🎉 Local Language Toggle Test Complete!');
  console.log('\n📊 EXPECTED BEHAVIOR:');
  console.log('✅ useLocalLanguage=true → Mix English (70%) + Local Language (30%)');
  console.log('✅ useLocalLanguage=false → English only');
  console.log('✅ Natural integration without forcing');
  console.log('✅ Business-appropriate tone maintained');
  console.log('✅ Cultural authenticity with professional standards');
}

// Run the test
testLocalLanguageToggle().catch(console.error);
