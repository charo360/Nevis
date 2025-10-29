/**
 * Test Real Paya Data Usage - Zero Hallucination Verification
 * This test verifies the system uses ONLY the actual business data provided
 */

async function testRealPayaData() {
  console.log('🧪 Testing Real Paya Data Usage (Zero Hallucination)...\n');

  const realPayaProfile = {
    businessName: 'Paya',
    businessType: 'Financial Technology (Fintech)',
    description: 'Digital financial services platform bringing financial inclusivity to all citizens across Kenya',
    location: 'Kenya',
    services: [
      {
        name: 'Digital Banking',
        description: 'Full suite of regulated banking products through mobile application'
      },
      {
        name: 'Payment Solutions', 
        description: 'Seamless payment solutions through APIs for businesses'
      },
      {
        name: 'Buy Now Pay Later',
        description: 'Flexible installment plans with no credit checks required'
      }
    ],
    keyFeatures: [
      'No credit checks required',
      'Quick setup - open in minutes',
      '1M+ customers', 
      'Regulated banking partnerships'
    ],
    targetAudience: 'Consumers and businesses across Kenya',
    primaryColor: '#E4574C',
    contactInfo: {
      website: 'https://paya.co.ke'
    }
  };

  const testPayload = {
    revoModel: 'revo-1.0',
    brandProfile: realPayaProfile,
    platform: 'instagram',
    brandConsistency: {
      strictConsistency: true,
      followBrandColors: true,
      includeContacts: false
    }
  };

  try {
    console.log('📤 Sending request with REAL Paya data...');
    
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
      return;
    }

    console.log('✅ Content Generated Successfully!\n');
    
    // Display generated content
    console.log('📋 Generated Content:');
    console.log('   Headline:', result.catchyWords);
    console.log('   Subheadline:', result.subheadline);
    console.log('   Caption:', result.content?.substring(0, 150) + '...');
    console.log('   CTA:', result.callToAction);
    console.log('   Hashtags:', result.hashtags?.slice(0, 5));
    
    // Analyze for data accuracy
    const allContent = `${result.catchyWords} ${result.subheadline} ${result.content} ${result.callToAction}`.toLowerCase();
    
    console.log('\n🔍 ZERO HALLUCINATION VERIFICATION:');
    
    // ✅ Check for ALLOWED content (from real business data)
    const allowedTerms = [
      'paya',
      'digital banking', 
      'payment solutions',
      'buy now pay later',
      'bnpl',
      'fintech',
      'financial technology',
      'no credit checks',
      'quick setup',
      'consumers',
      'businesses',
      'kenya',
      'mobile application',
      'apis',
      'installment plans'
    ];
    
    const foundAllowed = allowedTerms.filter(term => allContent.includes(term));
    console.log('   ✅ Uses real business data:', foundAllowed.length > 0 ? foundAllowed.slice(0, 5) : 'None found');
    
    // ❌ Check for FORBIDDEN content (hallucinated details)
    const forbiddenTerms = [
      'ksh', 'kes', // Specific amounts
      'merchant float', 'fast disbursement', // Services not offered
      'sme', 'small business', // Wrong target audience
      'm-pesa', 'mpesa', // Payment method not confirmed
      'working capital', 'inventory', // Wrong service type
      'nairobi', // Specific city not provided
      'in minutes', 'instant', 'same day', // Speed claims
      'best', 'fastest', 'cheapest', // Competitive claims
      '300,000', '50,000', // Specific amounts
      'collateral', 'approval', // Process details not confirmed
    ];
    
    const foundForbidden = forbiddenTerms.filter(term => allContent.includes(term));
    console.log('   🚫 Contains hallucinations:', foundForbidden.length > 0 ? foundForbidden : 'None (Good!)');
    
    // Check service accuracy
    const mentionsRealServices = allContent.includes('digital banking') || 
                                allContent.includes('payment solutions') || 
                                allContent.includes('buy now pay later') ||
                                allContent.includes('bnpl');
    console.log('   🏪 Mentions actual services:', mentionsRealServices ? 'Yes ✅' : 'No ❌');
    
    // Check target audience accuracy  
    const correctAudience = allContent.includes('consumers') || allContent.includes('businesses');
    console.log('   👥 Correct target audience:', correctAudience ? 'Yes ✅' : 'No ❌');
    
    // Overall assessment
    const isDataAccurate = foundAllowed.length > 0 && foundForbidden.length === 0 && mentionsRealServices;
    
    console.log('\n🎯 FINAL ASSESSMENT:');
    if (isDataAccurate) {
      console.log('   🎉 SUCCESS: Uses only real business data, no hallucinations detected!');
    } else {
      console.log('   ⚠️  ISSUES DETECTED:');
      if (foundForbidden.length > 0) {
        console.log('      - Contains hallucinated details:', foundForbidden);
      }
      if (!mentionsRealServices) {
        console.log('      - Does not mention actual Paya services');
      }
      if (foundAllowed.length === 0) {
        console.log('      - Does not use provided business information');
      }
    }

    console.log('\n📊 Expected vs Actual:');
    console.log('   Expected: Content about Digital Banking, Payment Solutions, BNPL');
    console.log('   Expected: Target consumers and businesses in Kenya');
    console.log('   Expected: No specific amounts, speeds, or unconfirmed claims');
    console.log('   Actual Check: See analysis above');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRealPayaData().catch(console.error);
