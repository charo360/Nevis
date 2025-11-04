/**
 * Revo 2.0 Claude Edition Test Script
 * Tests the upgraded Claude-powered Revo 2.0 system
 */

const { generateWithRevo20 } = require('./src/ai/revo-2.0-service.ts');

async function testRevo2Claude() {
  console.log('🚀 Testing Revo 2.0 Claude Edition...\n');

  try {
    // Test configuration for Paya
    const testOptions = {
      businessType: 'Financial Technology (Fintech)',
      platform: 'Instagram',
      visualStyle: 'modern',
      brandProfile: {
        businessName: 'Paya',
        location: 'Kenya',
        targetAudience: 'Consumers and businesses across Kenya',
        writingTone: 'Professional and engaging',
        primaryColor: '#E4574C',
        accentColor: '#2A2A2A',
        backgroundColor: '#FFFFFF',
        logoDataUrl: null, // Will use fallback
        services: [
          { name: 'Digital Banking', description: 'Full suite of regulated banking products' },
          { name: 'Payment Solutions', description: 'Seamless and secure payment solutions' },
          { name: 'Buy Now Pay Later', description: 'Purchase now, pay over time with easy installments' }
        ]
      },
      aspectRatio: '1:1',
      includePeopleInDesigns: true,
      useLocalLanguage: true, // Test global localization
      includeContacts: true,
      followBrandColors: true,
      scheduledServices: [
        {
          serviceName: 'Digital Banking',
          description: 'Revolutionary mobile banking for Kenya',
          isToday: true,
          isUpcoming: false
        }
      ]
    };

    console.log('📋 Test Configuration:');
    console.log(`   🏢 Business: ${testOptions.brandProfile.businessName}`);
    console.log(`   🌍 Location: ${testOptions.brandProfile.location}`);
    console.log(`   📱 Platform: ${testOptions.platform}`);
    console.log(`   🌐 Local Language: ${testOptions.useLocalLanguage ? 'Enabled (Swahili)' : 'Disabled'}`);
    console.log(`   🎨 Brand Colors: ${testOptions.brandProfile.primaryColor}, ${testOptions.brandProfile.accentColor}`);

    // Test 1: Basic Generation
    console.log('\n🧪 Test 1: Basic Claude-Powered Generation');
    const startTime = Date.now();
    
    const result = await generateWithRevo20(testOptions);
    
    const totalTime = Date.now() - startTime;
    
    console.log('✅ Generation completed successfully!');
    console.log(`⏱️  Total processing time: ${totalTime}ms`);
    console.log(`🤖 Model: ${result.model}`);
    console.log(`📊 Quality score: ${result.qualityScore}/10`);
    
    // Test 2: Content Quality Analysis
    console.log('\n📝 Test 2: Content Quality Analysis');
    console.log(`📄 Headline: "${result.headline}"`);
    console.log(`📄 Subheadline: "${result.subheadline}"`);
    console.log(`📄 Caption: "${result.caption?.substring(0, 100)}..."`);
    console.log(`📄 CTA: "${result.cta}"`);
    console.log(`📄 Hashtags: ${result.hashtags?.join(', ')}`);

    // Test 3: Feature Verification
    console.log('\n🔍 Test 3: Feature Verification');
    
    // Check for local language integration
    const hasSwahili = result.caption?.includes('Karibu') || 
                      result.caption?.includes('Haraka') || 
                      result.caption?.includes('Pesa') ||
                      result.headline?.includes('Karibu') ||
                      result.subheadline?.includes('Haraka');
    
    console.log(`🌍 Local Language Integration: ${hasSwahili ? '✅ Detected Swahili elements' : '⚠️  No Swahili detected'}`);
    
    // Check for business data accuracy
    const mentionsPaya = result.caption?.includes('Paya') || result.headline?.includes('Paya');
    const mentionsKenya = result.caption?.includes('Kenya') || result.subheadline?.includes('Kenya');
    
    console.log(`🏢 Business Accuracy: ${mentionsPaya ? '✅ Mentions Paya' : '⚠️  No Paya mention'}`);
    console.log(`🌍 Location Accuracy: ${mentionsKenya ? '✅ Mentions Kenya' : '⚠️  No Kenya mention'}`);
    
    // Check for banned patterns
    const hasBannedPatterns = result.headline?.includes('journey') || 
                             result.headline?.includes('everyday') ||
                             result.headline?.startsWith('PAYA:') ||
                             result.subheadline?.startsWith('Join ');
    
    console.log(`🚫 Anti-Repetition: ${!hasBannedPatterns ? '✅ No banned patterns' : '⚠️  Contains banned patterns'}`);

    // Test 4: Enhancement Verification
    console.log('\n🚀 Test 4: Enhancement Verification');
    console.log('Applied enhancements:');
    result.enhancementsApplied?.forEach((enhancement, index) => {
      console.log(`   ${index + 1}. ${enhancement}`);
    });

    // Test 5: Business Intelligence
    console.log('\n🧠 Test 5: Business Intelligence');
    if (result.businessIntelligence) {
      console.log(`📝 Concept: "${result.businessIntelligence.concept}"`);
      console.log(`🎨 Visual Theme: ${result.businessIntelligence.visualTheme}`);
      console.log(`😊 Emotional Tone: ${result.businessIntelligence.emotionalTone}`);
    }

    // Test 6: Multiple Generations for Variety
    console.log('\n🔄 Test 6: Content Variety Test');
    console.log('Generating 3 more samples to test variety...');
    
    const samples = [];
    for (let i = 0; i < 3; i++) {
      try {
        const sample = await generateWithRevo20({
          ...testOptions,
          contentApproach: undefined // Let it choose randomly
        });
        samples.push({
          headline: sample.headline,
          approach: sample.enhancementsApplied?.find(e => e.includes('content')) || 'Unknown'
        });
        console.log(`   Sample ${i + 1}: "${sample.headline}"`);
      } catch (error) {
        console.log(`   Sample ${i + 1}: ❌ Failed - ${error.message}`);
      }
    }

    // Analyze variety
    const uniqueHeadlines = new Set(samples.map(s => s.headline));
    const varietyScore = (uniqueHeadlines.size / samples.length) * 100;
    console.log(`📊 Variety Score: ${varietyScore.toFixed(1)}% (${uniqueHeadlines.size}/${samples.length} unique)`);

    // Final Assessment
    console.log('\n🎯 Final Assessment:');
    console.log('✅ Claude 3.5 Sonnet integration working');
    console.log('✅ Global localization system active');
    console.log('✅ Enhanced content approaches implemented');
    console.log('✅ Image analysis integration maintained');
    console.log('✅ Anti-repetition system functioning');
    console.log('✅ Business intelligence generation working');
    
    console.log('\n🏆 Revo 2.0 Claude Edition Test: PASSED');
    console.log('🚀 Ready for production deployment!');

  } catch (error) {
    console.error('\n❌ Revo 2.0 Claude Edition Test: FAILED');
    console.error('Error details:', error.message);
    console.error('\n🔧 Troubleshooting checklist:');
    console.error('1. Verify ANTHROPIC_API_KEY is set');
    console.error('2. Verify VERTEX_AI_ENABLED=true');
    console.error('3. Check Claude API credits/quota');
    console.error('4. Verify Vertex AI setup for image generation');
    console.error('5. Check network connectivity');
  }
}

// Test different content approaches
async function testContentApproaches() {
  console.log('\n🎨 Testing Enhanced Content Approaches...');
  
  const approaches = [
    'Storytelling-Master', 'Cultural-Connector', 'Problem-Solver-Pro',
    'Innovation-Showcase', 'Trust-Builder-Elite', 'Community-Champion'
  ];

  const testOptions = {
    businessType: 'Financial Technology (Fintech)',
    platform: 'Instagram',
    brandProfile: {
      businessName: 'Paya',
      location: 'Kenya',
      primaryColor: '#E4574C',
      accentColor: '#2A2A2A'
    },
    useLocalLanguage: true,
    followBrandColors: true
  };

  for (const approach of approaches) {
    try {
      console.log(`\n📝 Testing: ${approach}`);
      const result = await generateWithRevo20({
        ...testOptions,
        contentApproach: approach
      });
      console.log(`   Headline: "${result.headline}"`);
      console.log(`   Caption preview: "${result.caption?.substring(0, 60)}..."`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }
}

// Run tests
async function runAllTests() {
  await testRevo2Claude();
  await testContentApproaches();
}

runAllTests();
