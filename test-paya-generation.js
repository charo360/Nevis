/**
 * Test Paya Content Generation with New Business Data Enforcement
 * This should now generate business-specific content instead of generic templates
 */

async function testPayaGeneration() {
  console.log('🧪 Testing Paya Content Generation with Business Data Enforcement...\n');

  const testPayload = {
    revoModel: 'revo-1.0',
    brandProfile: {
      businessName: 'Paya',
      businessType: 'Financial Services',
      location: 'Nairobi, Kenya',
      services: 'Merchant Float, Fast Disbursement',
      keyFeatures: 'M-Pesa integration, Working capital for SMEs',
      competitiveAdvantages: 'Fast approval, No collateral required',
      targetAudience: 'Kenyan SMEs and merchants',
      primaryColor: '#E4574C',
      accentColor: '#2A2A2A',
      backgroundColor: '#FFFFFF',
      contactInfo: {
        website: 'https://paya.co.ke',
        email: 'support@paya.co.ke'
      }
    },
    platform: 'instagram',
    brandConsistency: {
      strictConsistency: true,
      followBrandColors: true,
      includeContacts: false
    }
  };

  try {
    console.log('📤 Sending request to /api/quick-content...');
    
    const response = await fetch('http://localhost:3001/api/quick-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.log('❌ API Error:', result.error);
      if (result.details) {
        console.log('   Details:', result.details);
      }
      if (result.missingFields) {
        console.log('   Missing Fields:', result.missingFields);
      }
      return;
    }

    console.log('✅ Content Generated Successfully!\n');
    
    // Check for business-specific content
    console.log('📋 Generated Content Analysis:');
    console.log('   Headline:', result.catchyWords);
    console.log('   Subheadline:', result.subheadline);
    console.log('   Caption:', result.content?.substring(0, 100) + '...');
    console.log('   CTA:', result.callToAction);
    console.log('   Hashtags:', result.hashtags?.slice(0, 3));
    
    // Analyze for business specificity
    const content = `${result.catchyWords} ${result.subheadline} ${result.content} ${result.callToAction}`.toLowerCase();
    
    console.log('\n🔍 Business Data Usage Analysis:');
    
    // Check for Paya-specific terms
    const payaTerms = ['paya', 'merchant float', 'fast disbursement', 'm-pesa', 'sme', 'kenya', 'nairobi'];
    const foundTerms = payaTerms.filter(term => content.includes(term));
    console.log('   ✅ Paya-specific terms found:', foundTerms.length > 0 ? foundTerms : 'None');
    
    // Check for generic templates (should be absent)
    const genericTerms = ['master your money', 'creative path', 'financial journey', 'begin your', 'ignite your'];
    const foundGeneric = genericTerms.filter(term => content.includes(term));
    console.log('   🚫 Generic templates found:', foundGeneric.length > 0 ? foundGeneric : 'None (Good!)');
    
    // Check for business name usage
    const mentionsPaya = content.includes('paya');
    console.log('   📝 Mentions business name:', mentionsPaya ? 'Yes ✅' : 'No ❌');
    
    // Check for service specificity
    const mentionsServices = content.includes('merchant') || content.includes('float') || content.includes('disbursement');
    console.log('   🏪 Mentions actual services:', mentionsServices ? 'Yes ✅' : 'No ❌');
    
    // Overall assessment
    const isBusinessSpecific = foundTerms.length > 0 && foundGeneric.length === 0 && mentionsPaya;
    console.log('\n🎯 Overall Assessment:', isBusinessSpecific ? 'BUSINESS-SPECIFIC ✅' : 'STILL GENERIC ❌');
    
    if (isBusinessSpecific) {
      console.log('   🎉 Success! The system is now using actual Paya business data.');
    } else {
      console.log('   ⚠️  The system may still be using generic templates or fallbacks.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPayaGeneration().catch(console.error);
