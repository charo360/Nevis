#!/usr/bin/env tsx

/**
 * Test Revo 2.0 with Business Profiler Integration
 * Tests the full pipeline: Business Profile → Marketing Insights → Content Generation
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

import { generateWithRevo20, type Revo20GenerationOptions } from '../src/ai/revo-2.0-service';

async function testRevo2WithProfiler() {
  console.log('🧪 Testing Revo 2.0 with Business Profiler Integration\n');

  try {
    console.log('🔧 Setting up test environment...');

    // Check environment variables
    console.log('🔍 Environment Check:');
    console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   OPENAI_ASSISTANT_FOOD: ${process.env.OPENAI_ASSISTANT_FOOD ? '✅ Set' : '❌ Missing'}`);
    console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   VERTEX_AI_ENABLED: ${process.env.VERTEX_AI_ENABLED ? '✅ Set' : '❌ Missing'}`);
    console.log('');

    // Test with Samaki Cookies
    console.log('📋 Testing Samaki Cookies Content Generation...');
    
    const brandProfile = {
      businessName: 'Samaki Cookies',
      businessType: 'food',
      description: 'Samaki Cookies is a Kenyan company that produces nutritious fish-based cookies to combat malnutrition. Founded by Francis Thoya in Kilifi County, the company combines the health benefits of fish with the convenience of cookies to provide a unique and nourishing snack option.',
      location: 'Kilifi County, Kenya',
      targetAudience: 'Kenyan families with children, health-conscious individuals',
      services: ['Nutritious fish-based cookies', 'Malnutrition prevention', 'Community health support'],
      website: '',
      logoDataUrl: '',
      colors: {
        primary: '#2563eb',
        accent: '#f59e0b',
        background: '#ffffff'
      }
    };

    const options: Revo20GenerationOptions = {
      brandProfile,
      businessType: 'food',
      platform: 'instagram' as const,
      aspectRatio: '1:1' as const,
      visualStyle: 'modern' as const
    };

    console.log('🚀 Generating content with Business Profiler...');
    console.log('📋 Options:', JSON.stringify(options, null, 2));

    const result = await generateWithRevo20(options);
    console.log('✅ Generation completed!');

    console.log('\n✅ **REVO 2.0 RESULT:**');
    console.log(`🖼️ **Image URL:** ${result.imageUrl ? 'Generated' : 'None'}`);
    console.log(`🤖 **Model:** ${result.model}`);
    console.log(`📊 **Quality Score:** ${result.qualityScore}`);
    console.log(`⏱️ **Processing Time:** ${result.processingTime}ms`);
    console.log(`🔧 **Enhancements:** ${result.enhancementsApplied?.join(', ') || 'None'}`);

    // Check for generic language in the result
    const resultText = JSON.stringify(result).toLowerCase();
    
    const genericPhrases = [
      'fuel your dreams',
      'boost your hustle', 
      'empower your journey',
      'fuel up fast',
      'find clarity in the chaos',
      'shared moments. sweet success'
    ];

    const foundGeneric = genericPhrases.some(phrase =>
      resultText.includes(phrase)
    );

    if (foundGeneric) {
      console.log('\n❌ **ISSUE DETECTED:** Generic language still present');
    } else {
      console.log('\n✅ **SUCCESS:** No generic motivational language detected');
    }

    // Check for business-specific content
    const businessSpecific = [
      'samaki',
      'fish',
      'cookies',
      'kilifi',
      'malnutrition',
      'nutrition',
      'kenya',
      'francis thoya'
    ];

    const foundSpecific = businessSpecific.some(term =>
      resultText.includes(term)
    );

    if (foundSpecific) {
      console.log('✅ **SUCCESS:** Business-specific content detected');
    } else {
      console.log('❌ **ISSUE:** No business-specific content detected');
    }

    console.log('\n🎉 **Revo 2.0 + Business Profiler Test Completed!**');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testRevo2WithProfiler().catch(console.error);
