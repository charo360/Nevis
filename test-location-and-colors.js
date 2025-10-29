/**
 * Test Location-Based People and Strict Brand Colors
 */

async function testLocationAndColors() {
  console.log('🧪 Testing Location-Based People & Strict Brand Colors...\n');

  const testPayload = {
    revoModel: 'revo-1.0',
    brandProfile: {
      businessName: 'Paya',
      businessType: 'Financial Technology (Fintech)',
      location: 'Kenya', // Should trigger African representation
      services: [
        { name: 'Digital Banking', description: 'Mobile banking services' },
        { name: 'Buy Now Pay Later', description: 'Flexible payment plans' }
      ],
      primaryColor: '#E4574C', // Paya's actual brand color
      accentColor: '#2A2A2A',
      backgroundColor: '#FFFFFF',
      contactInfo: {
        website: 'https://paya.co.ke'
      }
    },
    platform: 'instagram',
    brandConsistency: {
      strictConsistency: true,
      followBrandColors: true, // STRICT MODE - should use ONLY provided colors
      includeContacts: false
    },
    includePeopleInDesigns: true // Should show African people
  };

  try {
    console.log('📤 Testing with Kenya location + Strict brand colors...');
    
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
    
    console.log('📋 Generated Content:');
    console.log('   Headline:', result.catchyWords);
    console.log('   Subheadline:', result.subheadline);
    console.log('   CTA:', result.callToAction);
    
    console.log('\n🔍 Verification Checks:');
    
    // Check for Kenya/African context
    const content = `${result.catchyWords} ${result.subheadline} ${result.content}`.toLowerCase();
    const hasAfricanContext = content.includes('kenya') || content.includes('african') || content.includes('nairobi');
    console.log('   🌍 African/Kenya context:', hasAfricanContext ? 'Present ✅' : 'Missing ❌');
    
    // Check for business-specific content
    const hasPayaServices = content.includes('digital banking') || content.includes('buy now pay later') || content.includes('bnpl');
    console.log('   🏪 Paya services mentioned:', hasPayaServices ? 'Yes ✅' : 'No ❌');
    
    // Image URL check (should be generated)
    const hasImage = !!result.imageUrl;
    console.log('   🖼️  Image generated:', hasImage ? 'Yes ✅' : 'No ❌');
    
    console.log('\n🎨 Expected Image Features:');
    console.log('   - Should show Black/African people with natural features');
    console.log('   - Should use Paya brand colors: #E4574C (primary), #2A2A2A (accent)');
    console.log('   - Should show modern African urban lifestyle');
    console.log('   - Should avoid stereotypes, show tech-savvy professionals');
    
    console.log('\n🎯 Brand Colors Test:');
    console.log('   - Strict mode enabled (followBrandColors: true)');
    console.log('   - Should use ONLY provided colors: #E4574C, #2A2A2A, #FFFFFF');
    console.log('   - Should NOT use default blue colors (#3B82F6)');
    
    if (hasImage) {
      console.log('\n📸 Image URL generated - check manually for:');
      console.log('   1. African people representation');
      console.log('   2. Paya brand colors usage');
      console.log('   3. Modern, professional appearance');
      console.log('   4. Kenya/Nairobi urban context');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testLocationAndColors().catch(console.error);
