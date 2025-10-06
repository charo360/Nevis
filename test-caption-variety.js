/**
 * Test Caption Variety for Revo 1.5
 * Verify that captions don't all start with "Jambo!" or other repetitive patterns
 */

console.log('🧪 Testing Caption Variety for Revo 1.5...\n');

// Mock the functions
function getLocalGreeting(location) {
  const greetings = {
    'kenya': ['Jambo! ', 'Karibu! ', 'Habari! ', 'Hey! ', 'Hello! ', '', '', '', ''], // More empty strings for variety
    'nigeria': ['How far! ', 'Wetin dey happen! ', 'Good day! ', 'Hey! ', 'Hello! ', '', '', ''],
    'south africa': ['Sawubona! ', 'Hello! ', 'Good day! ', 'Hey! ', '', '', ''],
    'ghana': ['Akwaaba! ', 'Hello! ', 'Good morning! ', 'Hey! ', '', '', '']
  };

  const locationKey = location.toLowerCase();
  for (const [key, greetingList] of Object.entries(greetings)) {
    if (locationKey.includes(key)) {
      const randomGreeting = greetingList[Math.floor(Math.random() * greetingList.length)];
      return randomGreeting;
    }
  }
  
  return Math.random() < 0.15 ? 'Hello! ' : '';
}

function generateDynamicFallbackCaption(businessName, businessType, location, useLocalLanguage) {
  const captionSeed = Date.now() + Math.random();
  const varietyIndex = Math.floor(captionSeed % 18);
  
  // Only use greeting 20% of the time when local language is enabled
  const shouldUseGreeting = useLocalLanguage && Math.random() < 0.2;
  const localGreeting = shouldUseGreeting ? getLocalGreeting(location) : '';
  
  const captionPatterns = [
    // Story-driven (no greeting)
    `At ${businessName}, every client's success story matters. We're transforming ${businessType.toLowerCase()} experiences in ${location} one customer at a time.`,
    
    // Community-focused (no greeting)
    `Proudly serving the ${location} community with exceptional ${businessType.toLowerCase()} services. Your local success is our mission.`,
    
    // Problem-solution (no greeting)
    `Tired of unreliable ${businessType.toLowerCase()} services? ${businessName} delivers the quality and consistency you deserve in ${location}.`,
    
    // Value-proposition (no greeting)
    `Why choose ${businessName}? Because your ${businessType.toLowerCase()} needs deserve more than ordinary. Experience the difference in ${location}.`,
    
    // Behind-the-scenes (no greeting)
    `Behind every great ${businessType.toLowerCase()} service is a team that cares. Meet ${businessName} - your trusted partner in ${location}.`,
    
    // Results-focused (no greeting)
    `Real results, real impact. ${businessName} is changing how ${location} experiences ${businessType.toLowerCase()} services.`,
    
    // Educational/Expert (no greeting)
    `Years of expertise, countless satisfied clients. ${businessName} brings professional ${businessType.toLowerCase()} excellence to ${location}.`,
    
    // Seasonal/Timely (no greeting)
    `This is the perfect time to experience premium ${businessType.toLowerCase()} services. ${businessName} is ready to serve ${location}.`,
    
    // Trust-building (no greeting)
    `Building trust through exceptional service. ${businessName} has become ${location}'s go-to choice for ${businessType.toLowerCase()}.`,
    
    // Innovation-focused (no greeting)
    `Innovation meets reliability at ${businessName}. Discover modern ${businessType.toLowerCase()} solutions designed for ${location}.`,
    
    // Customer-centric (no greeting)
    `Your satisfaction drives everything we do. ${businessName} puts ${location} customers first in every ${businessType.toLowerCase()} interaction.`,
    
    // Achievement-focused (no greeting)
    `Celebrating another milestone in ${businessType.toLowerCase()} excellence. ${businessName} continues to raise the bar in ${location}.`,
    
    // NEW: Direct approach patterns (no greeting)
    `${businessName} delivers exceptional ${businessType.toLowerCase()} services that exceed expectations. Quality you can trust in ${location}.`,
    
    `Looking for reliable ${businessType.toLowerCase()} services in ${location}? ${businessName} combines expertise with genuine care for every client.`,
    
    `${businessName} stands out in ${location}'s ${businessType.toLowerCase()} industry. Professional service, personal attention, proven results.`,
    
    `Quality ${businessType.toLowerCase()} services shouldn't be hard to find. ${businessName} makes excellence accessible in ${location}.`,
    
    // Greeting patterns (only when shouldUseGreeting is true)
    `${localGreeting}Meet ${businessName}, transforming ${businessType.toLowerCase()} experiences in ${location} with personalized service and proven expertise.`,
    
    `${localGreeting}Discover why ${location} trusts ${businessName} for premium ${businessType.toLowerCase()} services. Quality that speaks for itself.`
  ];
  
  return captionPatterns[varietyIndex].trim();
}

// Test greeting frequency
console.log('🌍 Testing Local Greeting Frequency (should be varied, not always "Jambo!"):');
const greetingCounts = {};
const totalTests = 100;

for (let i = 0; i < totalTests; i++) {
  const greeting = getLocalGreeting('Nairobi, Kenya');
  const key = greeting || 'NO_GREETING';
  greetingCounts[key] = (greetingCounts[key] || 0) + 1;
}

console.log('Greeting distribution over 100 tests:');
Object.entries(greetingCounts).forEach(([greeting, count]) => {
  const percentage = ((count / totalTests) * 100).toFixed(1);
  console.log(`  ${greeting === 'NO_GREETING' ? '(No greeting)' : `"${greeting.trim()}"`}: ${count} times (${percentage}%)`);
});

// Test caption variety
console.log('\n📝 Testing Caption Variety (should have different openings):');
const captionStarts = {};
const businessName = 'Paya Solutions';
const businessType = 'Payment Services';
const location = 'Nairobi, Kenya';

for (let i = 0; i < 20; i++) {
  const caption = generateDynamicFallbackCaption(businessName, businessType, location, true);
  const firstWords = caption.split(' ').slice(0, 3).join(' ');
  captionStarts[firstWords] = (captionStarts[firstWords] || 0) + 1;
  console.log(`${i + 1}. ${caption.substring(0, 80)}...`);
}

console.log('\n📊 Caption Opening Patterns:');
Object.entries(captionStarts).forEach(([start, count]) => {
  console.log(`  "${start}...": ${count} time(s)`);
});

// Check for "Jambo!" dominance
const jamboCount = Object.entries(captionStarts).reduce((sum, [start, count]) => {
  return start.toLowerCase().includes('jambo') ? sum + count : sum;
}, 0);

console.log(`\n🚨 "Jambo!" Analysis:`);
console.log(`  Captions starting with "Jambo!": ${jamboCount}/20 (${(jamboCount/20*100).toFixed(1)}%)`);
console.log(`  Expected: Should be around 10-20% or less for variety`);

if (jamboCount <= 4) {
  console.log('✅ GOOD: Caption variety is working - not dominated by "Jambo!"');
} else {
  console.log('❌ PROBLEM: Too many captions still starting with "Jambo!"');
}

console.log('\n✅ Caption variety test completed!');
