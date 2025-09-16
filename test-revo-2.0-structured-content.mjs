/**
 * Test Revo 2.0 Structured Content Generation
 * Tests the new headlines, subheadlines, CTAs, and 5 caption variations for Instagram
 */

import { generateWithRevo20 } from './src/ai/revo-2.0-service.ts';

async function testRevo20StructuredContent() {
  console.log('🧪 Testing Revo 2.0 Structured Content Generation...\n');

  const testOptions = {
    businessType: 'Restaurant',
    platform: 'instagram',
    visualStyle: 'modern',
    brandProfile: {
      businessName: 'Bella Vista Cafe',
      businessType: 'Restaurant',
      location: 'New York, NY',
      description: 'Authentic Italian cuisine with a modern twist',
      primaryColor: '#d4af37',
      accentColor: '#8b4513',
      backgroundColor: '#f8f5f0',
      services: [
        { name: 'Fine Dining', description: 'Authentic Italian dishes' },
        { name: 'Catering', description: 'Event catering services' }
      ]
    },
    aspectRatio: '1:1',
    includePeopleInDesigns: false,
    useLocalLanguage: false
  };

  try {
    console.log('📊 Test Parameters:');
    console.log(`- Business: ${testOptions.brandProfile.businessName}`);
    console.log(`- Type: ${testOptions.businessType}`);
    console.log(`- Platform: ${testOptions.platform}`);
    console.log(`- Location: ${testOptions.brandProfile.location}\n`);

    const startTime = Date.now();
    const result = await generateWithRevo20(testOptions);
    const endTime = Date.now();

    console.log('✅ Revo 2.0 Structured Content Generation Results:\n');
    
    console.log('📝 STRUCTURED CONTENT:');
    console.log(`📰 Headline: "${result.headline}"`);
    console.log(`📄 Subheadline: "${result.subheadline}"`);
    console.log(`💬 Caption: "${result.caption}"`);
    console.log(`🎯 CTA: "${result.cta}"`);
    
    console.log('\n🏷️ HASHTAGS:');
    result.hashtags.forEach((hashtag, index) => {
      console.log(`   ${index + 1}. ${hashtag}`);
    });

    console.log('\n🧠 BUSINESS INTELLIGENCE:');
    console.log(`📈 Strategy: ${result.businessIntelligence.strategy}`);
    console.log(`👥 Target Audience: ${result.businessIntelligence.targetAudience}`);
    console.log(`💡 Key Message: ${result.businessIntelligence.keyMessage}`);
    console.log(`🏆 Competitive Advantage: ${result.businessIntelligence.competitiveAdvantage}`);

    console.log('\n📊 GENERATION METRICS:');
    console.log(`⏱️  Processing Time: ${endTime - startTime}ms`);
    console.log(`🎯 Quality Score: ${result.qualityScore}/10`);
    console.log(`🔧 Model: ${result.model}`);
    console.log(`✨ Enhancements: ${result.enhancementsApplied.length} applied`);

    console.log('\n🎨 IMAGE GENERATION:');
    console.log(`📸 Image URL: ${result.imageUrl ? 'Generated successfully' : 'Failed to generate'}`);
    console.log(`📏 Image Size: ${result.imageUrl ? `${result.imageUrl.length} characters (base64)` : 'N/A'}`);

    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
    
    // Verify all required fields are present
    const requiredFields = ['headline', 'subheadline', 'caption', 'cta', 'hashtags', 'businessIntelligence'];
    const missingFields = requiredFields.filter(field => !result[field]);
    
    if (missingFields.length === 0) {
      console.log('✅ All structured content fields generated successfully');
    } else {
      console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testRevo20StructuredContent();