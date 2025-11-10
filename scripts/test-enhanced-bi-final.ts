/**
 * Test script for Enhanced Business Intelligence Gatherer
 * Tests the core business understanding for Samaki Cookies
 */

import { enhancedBusinessIntelligenceGatherer } from '../src/ai/intelligence/enhanced-bi-gatherer';

async function testEnhancedBI() {
  console.log('🧪 Testing Enhanced Business Intelligence Gatherer\n');
  console.log('='.repeat(70));
  
  // Samaki Cookies test case
  const request = {
    brandProfile: {
      businessName: 'Samaki Cookies',
      businessType: 'food',
      location: 'Kilifi, Kenya',
      description: 'Local bakery making fresh cookies daily',
      services: ['Fresh baked cookies', 'Fish-based cookies', 'Local snacks'],
      targetAudience: 'Local families, students, workers'
    },
    businessType: 'food' as const,
    platform: 'facebook',
    location: 'Kilifi, Kenya'
  };

  try {
    console.log('\n📋 Testing with: Samaki Cookies (Kilifi, Kenya)\n');
    
    const result = await enhancedBusinessIntelligenceGatherer.gatherBusinessIntelligence(request);
    
    console.log('\n' + '='.repeat(70));
    console.log('🎯 CORE BUSINESS UNDERSTANDING');
    console.log('='.repeat(70));
    console.log('\n📍 What They Do:');
    console.log(`   ${result.coreBusinessUnderstanding.whatTheyDo}`);
    console.log('\n👥 Who It\'s For:');
    console.log(`   ${result.coreBusinessUnderstanding.whoItsFor}`);
    console.log('\n🔧 How They Do It:');
    console.log(`   ${result.coreBusinessUnderstanding.howTheyDoIt}`);
    console.log('\n💡 Why It Matters:');
    console.log(`   ${result.coreBusinessUnderstanding.whyItMatters}`);
    console.log('\n🌍 Local Context:');
    console.log(`   ${result.coreBusinessUnderstanding.localContext}`);
    
    console.log('\n' + '='.repeat(70));
    console.log('👥 CUSTOMER INSIGHTS');
    console.log('='.repeat(70));
    console.log('\n🎯 Primary Audience:');
    console.log(`   ${result.customer.primaryAudience}`);
    console.log('\n😫 Pain Points:');
    result.customer.painPoints.forEach((p, i) => console.log(`   ${i + 1}. ${p}`));
    console.log('\n💪 Motivations:');
    result.customer.motivations.forEach((m, i) => console.log(`   ${i + 1}. ${m}`));
    
    console.log('\n' + '='.repeat(70));
    console.log('📝 CONTENT STRATEGY');
    console.log('='.repeat(70));
    console.log('\n🔑 Key Messages:');
    result.content.keyMessages.forEach((m, i) => console.log(`   ${i + 1}. ${m}`));
    console.log('\n🎨 Tone of Voice:');
    console.log(`   ${result.content.toneOfVoice}`);
    
    console.log('\n' + '='.repeat(70));
    console.log('💡 RECOMMENDATIONS');
    console.log('='.repeat(70));
    console.log('\n📢 Content Recommendations:');
    result.recommendations.content.forEach((r, i) => console.log(`   ${i + 1}. ${r}`));
    
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Test completed successfully!');
    console.log('\n🎯 This business understanding will now inform all ad generation!');
    console.log('   - Headlines will be locally-relevant');
    console.log('   - Messaging will address real pain points');
    console.log('   - Content will avoid generic corporate speak');
    console.log('   - Ads will feel authentic to Kilifi, Kenya\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testEnhancedBI();

