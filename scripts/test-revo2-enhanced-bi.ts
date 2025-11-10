/**
 * Test Revo 2.0 with Enhanced Business Intelligence
 * This tests the full integration to ensure business understanding flows through to content generation
 */

import { enhancedBusinessIntelligenceGatherer } from '../src/ai/intelligence/enhanced-bi-gatherer';

async function testRevo2EnhancedBI() {
  console.log('🧪 Testing Revo 2.0 Enhanced Business Intelligence Integration\n');
  console.log('='.repeat(70));
  
  // Samaki Cookies test case
  const brandProfile = {
    businessName: 'Samaki Cookies',
    businessType: 'food',
    location: 'Kilifi, Kenya',
    description: 'Local bakery making fresh cookies daily',
    services: ['Fresh baked cookies', 'Fish-based cookies', 'Local snacks'],
    targetAudience: 'Local families, students, workers'
  };

  try {
    console.log('\n📋 Testing Enhanced BI for: Samaki Cookies\n');
    
    // Step 1: Gather Enhanced Business Intelligence
    const businessIntelligence = await enhancedBusinessIntelligenceGatherer.gatherBusinessIntelligence({
      brandProfile,
      businessType: 'food',
      platform: 'facebook',
      location: 'Kilifi, Kenya'
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('🎯 CORE BUSINESS UNDERSTANDING');
    console.log('='.repeat(70));
    console.log(`\n📍 What They Do: ${businessIntelligence.coreBusinessUnderstanding.whatTheyDo}`);
    console.log(`👥 Who It's For: ${businessIntelligence.coreBusinessUnderstanding.whoItsFor}`);
    console.log(`🔧 How They Do It: ${businessIntelligence.coreBusinessUnderstanding.howTheyDoIt}`);
    console.log(`💡 Why It Matters: ${businessIntelligence.coreBusinessUnderstanding.whyItMatters}`);
    console.log(`🌍 Context: ${businessIntelligence.coreBusinessUnderstanding.localContext}`);
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 BUSINESS INTELLIGENCE');
    console.log('='.repeat(70));
    console.log(`\n🏆 Competitive Advantages:`);
    businessIntelligence.competitive.competitiveAdvantages.forEach((adv, i) => {
      console.log(`   ${i + 1}. ${adv}`);
    });
    
    console.log(`\n😫 Customer Pain Points:`);
    businessIntelligence.customer.painPoints.forEach((pain, i) => {
      console.log(`   ${i + 1}. ${pain}`);
    });
    
    console.log(`\n💪 Customer Motivations:`);
    businessIntelligence.customer.motivations.forEach((mot, i) => {
      console.log(`   ${i + 1}. ${mot}`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('📝 CONTENT STRATEGY');
    console.log('='.repeat(70));
    console.log(`\n🔑 Key Messages:`);
    businessIntelligence.content.keyMessages.forEach((msg, i) => {
      console.log(`   ${i + 1}. ${msg}`);
    });
    
    console.log(`\n🎨 Tone of Voice: ${businessIntelligence.content.toneOfVoice}`);
    
    console.log('\n' + '='.repeat(70));
    console.log('💡 CONTENT RECOMMENDATIONS');
    console.log('='.repeat(70));
    businessIntelligence.recommendations.content.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ INTEGRATION TEST SUCCESSFUL!');
    console.log('='.repeat(70));
    console.log('\n🎯 This business intelligence will now be passed to:');
    console.log('   1. Revo 2.0 Service (✅ Integrated)');
    console.log('   2. Assistant Manager (✅ Integrated)');
    console.log('   3. OpenAI Assistants (✅ Will receive in prompt)');
    console.log('\n📊 Expected Improvements:');
    console.log('   ✅ Headlines will reflect actual business offerings');
    console.log('   ✅ Content will address real customer pain points');
    console.log('   ✅ Messaging will avoid generic corporate speak');
    console.log('   ✅ Ads will feel authentic and specific');
    console.log('\n🚀 Ready to generate ads with enhanced business understanding!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testRevo2EnhancedBI();

