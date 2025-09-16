// Test regional caption examples to show the difference
import fetch from 'node-fetch';

async function testRegionalCaptionExamples() {
  console.log('🎭 Regional Caption System Examples\n');
  console.log('Showing how the same business gets different captions for different regions:\n');

  const testBusiness = {
    businessName: 'Fresh Bites Restaurant',
    businessType: 'restaurant',
    description: 'Local restaurant serving fresh, quality food'
  };

  const regions = [
    {
      location: 'Kenya, Nairobi',
      expectedStyle: 'Community-focused with Swahili elements'
    },
    {
      location: 'Nigeria, Lagos', 
      expectedStyle: 'Energetic with Naija spirit'
    },
    {
      location: 'Ghana, Accra',
      expectedStyle: 'Warm hospitality with local welcome'
    },
    {
      location: 'USA, New York',
      expectedStyle: 'Results-driven and competitive'
    },
    {
      location: 'Canada, Toronto',
      expectedStyle: 'Polite and inclusive'
    },
    {
      location: 'India, Mumbai',
      expectedStyle: 'Family-focused with traditional respect'
    }
  ];

  console.log('🏷️ Example Regional Hashtag Combinations:\n');

  regions.forEach(region => {
    console.log(`📍 ${region.location}:`);
    
    // Simulate what the enhanced system would generate
    const mockGeneration = generateMockRegionalContent(testBusiness, region.location);
    
    console.log(`   📝 Headline: "${mockGeneration.headline}"`);
    console.log(`   📄 Subheadline: "${mockGeneration.subheadline}"`);
    console.log(`   💬 Caption style: ${region.expectedStyle}`);
    console.log(`   🏷️  Hashtags: ${mockGeneration.hashtags.join(' ')}`);
    console.log(`   📢 CTA: "${mockGeneration.cta}"`);
    console.log(`   🌍 Local flavor: ${mockGeneration.localElement}`);
    console.log('');
  });

  console.log('🔥 Key Improvements Over Generic Captions:\n');
  console.log('✅ REGIONAL INTELLIGENCE:');
  console.log('   - Real Google Trends RSS for each country');
  console.log('   - Local news RSS (Nation.co.ke, Times of India, etc.)');
  console.log('   - Reddit regional communities for social buzz');
  console.log('   - Country-specific business trends');
  console.log('');
  console.log('✅ CULTURAL AUTHENTICITY:');
  console.log('   - Safe local language usage (only certain terms)');
  console.log('   - Regional communication patterns');
  console.log('   - Local business customs and expectations');
  console.log('   - Cultural reference integration');
  console.log('');
  console.log('✅ CURRENT EVENTS INTEGRATION:');
  console.log('   - Regional news and events woven into captions');
  console.log('   - Seasonal/weather context for each region');
  console.log('   - Local cultural moments and celebrations');
  console.log('   - Business-relevant regional trends');
  console.log('');
  console.log('✅ PLATFORM OPTIMIZATION:');
  console.log('   - Different hashtag counts per platform');
  console.log('   - Regional-appropriate tone and style'); 
  console.log('   - Local language mixing where safe');
  console.log('   - Cultural communication preferences');
}

function generateMockRegionalContent(business, location) {
  const locationLower = location.toLowerCase();
  
  if (locationLower.includes('kenya')) {
    return {
      headline: 'Karibu Fresh Bites Family',
      subheadline: 'Authentic flavors that remind you of home, served with Harambee spirit',
      hashtags: ['#Kenya', '#NairobiFoodie', '#FreshBites', '#Harambee', '#LocalEats'],
      cta: 'Karibu - come taste the difference today!',
      localElement: 'Harambee community spirit + current Nairobi food trends'
    };
  }
  
  if (locationLower.includes('nigeria')) {
    return {
      headline: 'Naija Fresh Bites Experience',
      subheadline: 'No wahala - just fresh, delicious food that makes Lagos proud',
      hashtags: ['#Nigeria', '#NaijaFoodie', '#LagosFresh', '#NoBe SmallThing', '#QualityFood'],
      cta: 'Oya now - come chop with us today!',
      localElement: 'Naija pride + Lagos food scene trends'
    };
  }
  
  if (locationLower.includes('ghana')) {
    return {
      headline: 'Akwaaba Fresh Bites Ghana',
      subheadline: 'Ghanaian hospitality meets fresh flavors in the heart of Accra',
      hashtags: ['#Ghana', '#AccraEats', '#Akwaaba', '#GhanaianHospitality', '#FreshFood'],
      cta: 'Akwaaba! Come experience true Ghanaian hospitality!',
      localElement: 'Ghanaian hospitality culture + Accra dining trends'
    };
  }
  
  if (locationLower.includes('usa')) {
    return {
      headline: 'Game-Changing Fresh Food',
      subheadline: 'Level up your dining experience with results-driven freshness and quality',
      hashtags: ['#USA', '#GameChanger', '#QualityFood', '#Results', '#Excellence'],
      cta: 'Ready to level up? Let\'s make this happen!',
      localElement: 'American achievement culture + competitive food market trends'
    };
  }
  
  if (locationLower.includes('canada')) {
    return {
      headline: 'Beauty Fresh Food, Eh',
      subheadline: 'Friendly neighborhood restaurant serving quality with Canadian hospitality',
      hashtags: ['#Canada', '#FriendlyService', '#CommunityFirst', '#QualityFood', '#LocalEats'],
      cta: 'Come on by and give us a try, eh!',
      localElement: 'Canadian politeness + inclusive community focus'
    };
  }
  
  if (locationLower.includes('india')) {
    return {
      headline: 'Fresh Bites Family Restaurant',
      subheadline: 'Namaste! Quality food that brings families together with traditional values',
      hashtags: ['#India', '#FamilyFirst', '#TraditionalValues', '#QualityFood', '#CommunityTrust'],
      cta: 'Namaste! Aaiye, experience food made with family love!',
      localElement: 'Family-first culture + traditional Indian dining values'
    };
  }
  
  return {
    headline: 'Fresh Bites Restaurant',
    subheadline: 'Quality food served with care in your local community',
    hashtags: ['#QualityFood', '#LocalRestaurant', '#FreshFood'],
    cta: 'Visit us today for great food!',
    localElement: 'Generic approach'
  };
}

testRegionalCaptionExamples();
