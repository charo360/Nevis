/**
 * Test file for Enhanced AI Caption and Hashtag Generation
 * 
 * This file can be used to test the enhanced AI generation system
 * with sample data to verify all features are working correctly.
 */

import { generatePostFromProfile } from './flows/generate-post-from-profile';
import type { GeneratePostFromProfileInput } from './flows/generate-post-from-profile';

/**
 * Sample test data for different business types
 */
const testProfiles = {
  restaurant: {
    businessType: 'restaurant',
    location: 'New York, NY',
    writingTone: 'friendly and appetizing',
    contentThemes: 'fresh ingredients, local sourcing, comfort food',
    dayOfWeek: 'Friday',
    currentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    variants: [{ platform: 'instagram', aspectRatio: '1:1' as const }],
    services: 'Farm-to-table dining, craft cocktails, weekend brunch, private events',
    targetAudience: 'Food enthusiasts, young professionals, families',
    keyFeatures: 'Locally sourced ingredients, seasonal menu, cozy atmosphere',
    competitiveAdvantages: 'Only restaurant in the area with 100% local sourcing'
  },
  fitness: {
    businessType: 'fitness',
    location: 'Los Angeles, CA',
    writingTone: 'motivational and energetic',
    contentThemes: 'strength training, wellness, community',
    dayOfWeek: 'Monday',
    currentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    variants: [{ platform: 'instagram', aspectRatio: '1:1' as const }],
    services: 'Personal training, group classes, nutrition coaching, recovery services',
    targetAudience: 'Fitness enthusiasts, busy professionals, beginners',
    keyFeatures: 'Certified trainers, modern equipment, flexible scheduling',
    competitiveAdvantages: '24/7 access, personalized workout plans, community support'
  },
  technology: {
    businessType: 'technology',
    location: 'San Francisco, CA',
    writingTone: 'innovative and professional',
    contentThemes: 'AI solutions, digital transformation, efficiency',
    dayOfWeek: 'Wednesday',
    currentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    variants: [{ platform: 'linkedin', aspectRatio: '16:9' as const }],
    services: 'AI consulting, software development, digital transformation, cloud migration',
    targetAudience: 'CTOs, IT managers, startup founders, enterprise clients',
    keyFeatures: 'Cutting-edge AI, scalable solutions, expert team',
    competitiveAdvantages: 'Proprietary AI algorithms, 99.9% uptime guarantee, rapid deployment'
  }
};

/**
 * Test function to verify enhanced AI generation
 */
export async function testEnhancedGeneration(businessType: keyof typeof testProfiles = 'restaurant') {
  console.log(`🧪 Testing Enhanced AI Generation for ${businessType}...`);
  
  try {
    const testInput: GeneratePostFromProfileInput = testProfiles[businessType];
    
    console.log('📝 Input:', {
      businessType: testInput.businessType,
      platform: testInput.variants[0].platform,
      location: testInput.location,
      writingTone: testInput.writingTone
    });
    
    const result = await generatePostFromProfile(testInput);
    
    console.log('✅ Enhanced AI Generation Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n📱 PRIMARY CAPTION:');
    console.log(result.content);
    
    console.log('\n🖼️ IMAGE TEXT:');
    console.log(result.imageText);
    
    console.log('\n#️⃣ HASHTAGS:');
    console.log(result.hashtags);
    
    if (result.contentVariants && result.contentVariants.length > 0) {
      console.log('\n🔄 CONTENT VARIANTS:');
      result.contentVariants.forEach((variant, index) => {
        console.log(`\n   Variant ${index + 1} (${variant.approach}):`);
        console.log(`   ${variant.content}`);
        console.log(`   💡 Rationale: ${variant.rationale}`);
      });
    }
    
    if (result.hashtagAnalysis) {
      console.log('\n📊 HASHTAG ANALYSIS:');
      console.log(`   🔥 Trending: ${result.hashtagAnalysis.trending.join(', ')}`);
      console.log(`   🎯 Niche: ${result.hashtagAnalysis.niche.join(', ')}`);
      console.log(`   📍 Location: ${result.hashtagAnalysis.location.join(', ')}`);
      console.log(`   👥 Community: ${result.hashtagAnalysis.community.join(', ')}`);
    }
    
    console.log('\n🖼️ GENERATED VARIANTS:');
    result.variants.forEach((variant, index) => {
      console.log(`   ${index + 1}. ${variant.platform}: ${variant.imageUrl ? '✅ Generated' : '❌ Failed'}`);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Test completed successfully!');
    
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Test all business types
 */
export async function testAllBusinessTypes() {
  console.log('🚀 Testing Enhanced AI Generation for All Business Types...\n');
  
  for (const businessType of Object.keys(testProfiles) as Array<keyof typeof testProfiles>) {
    try {
      await testEnhancedGeneration(businessType);
      console.log(`\n✅ ${businessType} test passed\n`);
    } catch (error) {
      console.error(`❌ ${businessType} test failed:`, error);
    }
  }
  
  console.log('🏁 All tests completed!');
}

// Export test profiles for use in other tests
export { testProfiles };
