/**
 * Test Enhanced Revo 2.0 Content Generation
 * Tests the new sophisticated content generation with business intelligence
 */

const testBrandProfile = {
  businessName: "Bella Vista Restaurant",
  businessType: "restaurant",
  location: "New York, NY",
  targetAudience: "Food lovers and families",
  brandVoice: "warm and inviting",
  services: ["Fine dining", "Catering", "Private events"],
  keyFeatures: ["Fresh ingredients", "Authentic recipes", "Cozy atmosphere"],
  competitiveAdvantages: ["Chef expertise", "Local sourcing", "Customer satisfaction"]
};

async function testEnhancedRevo20() {
  console.log('Testing Enhanced Revo 2.0 content generation...\n');

  try {
    const response = await fetch('http://localhost:3001/api/generate-revo-2.0', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessType: testBrandProfile.businessType,
        platform: 'instagram',
        brandProfile: testBrandProfile,
        visualStyle: 'modern',
        aspectRatio: '1:1'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('=== ENHANCED REVO 2.0 RESULTS ===');
    console.log('Success:', result.success);
    console.log('Model:', result.model);
    console.log('Quality Score:', result.qualityScore);
    console.log('Processing Time:', result.processingTime + 'ms');
    console.log('Enhancements Applied:', result.enhancementsApplied?.length || 0);
    
    console.log('\n=== STRUCTURED CONTENT ===');
    console.log('📰 Headline:', result.headline || 'Not generated');
    console.log('📝 Subheadline:', result.subheadline || 'Not generated');
    console.log('💬 Caption:', result.caption || 'Not generated');
    console.log('🎯 CTA:', result.cta || 'Not generated');
    
    console.log('\n=== HASHTAGS ===');
    if (result.hashtags && result.hashtags.length > 0) {
      console.log('Generated hashtags:', result.hashtags);
      console.log('Total hashtags:', result.hashtags.length);
    } else {
      console.log('❌ No hashtags generated');
    }
    
    console.log('\n=== BUSINESS INTELLIGENCE ===');
    if (result.businessIntelligence) {
      console.log('Content Goal:', result.businessIntelligence.contentGoal);
      console.log('Business Strengths:', result.businessIntelligence.businessStrengths);
      console.log('Market Opportunities:', result.businessIntelligence.marketOpportunities);
      console.log('Value Proposition:', result.businessIntelligence.valueProposition);
    } else {
      console.log('❌ No business intelligence data');
    }
    
    console.log('\n=== QUALITY ANALYSIS ===');
    const hasHeadline = !!result.headline;
    const hasSubheadline = !!result.subheadline;
    const hasCaption = !!result.caption;
    const hasCTA = !!result.cta;
    const hasHashtags = result.hashtags && result.hashtags.length > 0;
    const hasBusinessIntel = !!result.businessIntelligence;
    
    console.log('✅ Has Headline:', hasHeadline);
    console.log('✅ Has Subheadline:', hasSubheadline);
    console.log('✅ Has Caption:', hasCaption);
    console.log('✅ Has CTA:', hasCTA);
    console.log('✅ Has Hashtags:', hasHashtags);
    console.log('✅ Has Business Intelligence:', hasBusinessIntel);
    
    const completeness = [hasHeadline, hasSubheadline, hasCaption, hasCTA, hasHashtags, hasBusinessIntel]
      .filter(Boolean).length;
    console.log(`\n🎯 Content Completeness: ${completeness}/6 components generated`);
    
    if (completeness === 6) {
      console.log('🎉 SUCCESS: Enhanced Revo 2.0 is working perfectly!');
    } else {
      console.log('⚠️  PARTIAL: Some components missing, but system is functional');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEnhancedRevo20();
