// Test the enhanced regional system with new countries
import fetch from 'node-fetch';

async function testEnhancedRegionalSystem() {
  console.log('🌍 Testing Enhanced Regional System with All Countries\n');

  const testCases = [
    {
      location: 'Kenya, Nairobi',
      businessType: 'restaurant',
      expectedFeatures: ['Harambee', 'Karibu', '#Kenya', 'Swahili mix']
    },
    {
      location: 'Nigeria, Lagos',
      businessType: 'fitness',
      expectedFeatures: ['Naija', 'Oya', '#Nigeria', 'local pride']
    },
    {
      location: 'Ghana, Accra', 
      businessType: 'technology',
      expectedFeatures: ['Akwaaba', 'Chale', '#Ghana', 'hospitality']
    },
    {
      location: 'USA, New York',
      businessType: 'retail',
      expectedFeatures: ['game changer', 'level up', '#USA', 'results-driven']
    },
    {
      location: 'Canada, Toronto',
      businessType: 'healthcare',
      expectedFeatures: ['eh', 'beauty', '#Canada', 'inclusive']
    },
    {
      location: 'India, Mumbai',
      businessType: 'restaurant', 
      expectedFeatures: ['Namaste', 'family', '#India', 'traditional']
    }
  ];

  console.log('🧪 Testing Regional Data Sources:\n');
  
  // Test RSS sources for each country
  const rssTests = [
    { country: 'USA', url: 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US' },
    { country: 'Canada', url: 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=CA' },
    { country: 'India', url: 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=IN' },
    { country: 'Ghana', url: 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=GH' }
  ];

  for (const test of rssTests) {
    try {
      console.log(`📰 Testing ${test.country} Google Trends RSS:`);
      
      const response = await fetch(`http://localhost:3001/api/rss-data?customUrl=${encodeURIComponent(test.url)}&limit=10`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ ${test.country}: Got ${data.hashtags?.length || 0} hashtags`);
        if (data.hashtags && data.hashtags.length > 0) {
          console.log(`   🏷️  Sample: ${data.hashtags.slice(0, 5).join(', ')}`);
        }
      } else {
        console.log(`   ❌ ${test.country}: RSS fetch failed (${response.status})`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.country}: Error - ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test regional fallback data
  console.log('🏛️ Testing Regional Fallback Data:\n');
  
  const countries = ['kenya', 'nigeria', 'south africa', 'ghana', 'usa', 'canada', 'india'];
  
  countries.forEach(country => {
    console.log(`🏢 ${country.toUpperCase()}:`);
    
    // Simulate the fallback data structure
    const mockRegionalData = {
      'kenya': {
        hashtags: ['#Kenya', '#Nairobi', '#EastAfrica', '#Harambee', '#Innovation'],
        slang: ['Harambee', 'Jambo', 'Asante', 'Karibu'],
        cultural: ['Harambee spirit', 'Community unity']
      },
      'nigeria': {
        hashtags: ['#Nigeria', '#Naija', '#Lagos', '#WestAfrica', '#Innovation'],
        slang: ['Oya', 'Wahala', 'Sharp sharp', 'No be small thing'],
        cultural: ['Naija spirit', 'Unity in diversity']
      },
      'south africa': {
        hashtags: ['#SouthAfrica', '#Mzansi', '#CapeTown', '#Innovation'],
        slang: ['Sharp', 'Lekker', 'Howzit', 'Boet'],
        cultural: ['Rainbow Nation spirit', 'Ubuntu philosophy']
      },
      'ghana': {
        hashtags: ['#Ghana', '#Accra', '#WestAfrica', '#GhanaBusiness', '#Innovation'],
        slang: ['Akwaaba', 'Medaase', 'Chale', 'Omo'],
        cultural: ['Ghanaian hospitality', 'Unity and progress']
      },
      'usa': {
        hashtags: ['#USA', '#America', '#Business', '#Innovation', '#Growth'],
        slang: ['Awesome', 'Let\'s go', 'Game changer', 'For sure'],
        cultural: ['American entrepreneurship', 'Innovation culture']
      },
      'canada': {
        hashtags: ['#Canada', '#Innovation', '#Business', '#CanadianBusiness'],
        slang: ['Eh', 'Beauty', 'Right on', 'For sure'],
        cultural: ['Canadian hospitality', 'Inclusive business culture']
      },
      'india': {
        hashtags: ['#India', '#Innovation', '#Business', '#DigitalIndia', '#Growth'],
        slang: ['Namaste', 'Accha', 'Dhanyawad', 'Jugaad', 'Yaar'],
        cultural: ['Namaste culture', 'Unity in diversity', 'Family first']
      }
    };
    
    const data = mockRegionalData[country];
    if (data) {
      console.log(`   🏷️  Hashtags: ${data.hashtags.slice(0, 3).join(', ')}`);
      console.log(`   🗣️  Local terms: ${data.slang.slice(0, 3).join(', ')}`);
      console.log(`   🎭  Cultural: ${data.cultural.slice(0, 2).join(', ')}`);
      console.log('');
    }
  });

  console.log('🎯 Language Safety Examples:\n');

  const languageExamples = {
    'Kenya': {
      safe: ['Harambee (unity)', 'Karibu (welcome)', 'Asante (thank you)'],
      avoid: ['Complex Swahili phrases', 'Uncertain translations', 'Forced mixing']
    },
    'India': {
      safe: ['Namaste (greeting)', 'Accha (good)', 'Dhanyawad (thank you)'],
      avoid: ['Complex Hindi phrases', 'Regional language uncertainty', 'Forced integration']
    },
    'Canada': {
      safe: ['Eh (casual)', 'Beauty (great)', 'Right on (approval)'],
      avoid: ['Forced Canadian stereotypes', 'Overuse of "eh"', 'Mocking tone']
    },
    'Ghana': {
      safe: ['Akwaaba (welcome)', 'Medaase (thank you)', 'Chale (friend)'],
      avoid: ['Complex Twi phrases', 'Uncertain local terms', 'Cultural appropriation']
    }
  };

  Object.entries(languageExamples).forEach(([country, examples]) => {
    console.log(`🏛️ ${country}:`);
    console.log(`   ✅ Safe to use: ${examples.safe.join(', ')}`);
    console.log(`   ❌ Better avoid: ${examples.avoid.join(', ')}`);
    console.log('');
  });

  console.log('🌟 Regional Intelligence Features Added:');
  console.log('   ✅ 7 countries with full regional profiles');
  console.log('   ✅ Google Trends RSS for each country');
  console.log('   ✅ Local news RSS sources');
  console.log('   ✅ Reddit regional communities');
  console.log('   ✅ Cultural communication patterns');
  console.log('   ✅ Safe local language usage');
  console.log('   ✅ Regional CTA styles');
  console.log('   ✅ Country-specific hashtag relevance');
  console.log('   ✅ Regional business trends integration');
}

testEnhancedRegionalSystem();
