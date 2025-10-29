// Simple test for new direct AI generation
// Run this to verify the system generates unique content

const { generateRevo10Content } = require('./revo-1.0-service.ts');

async function testDirectGeneration() {
  const testInput = {
    businessType: 'restaurant',
    businessName: 'Mama\'s Kitchen',
    location: 'Nairobi, Kenya',
    platform: 'instagram',
    writingTone: 'friendly',
    contentThemes: ['food', 'family'],
    targetAudience: 'food lovers',
    services: 'Traditional Kenyan cuisine, family recipes',
    keyFeatures: 'Fresh ingredients, authentic flavors',
    competitiveAdvantages: 'Family recipes passed down generations',
    dayOfWeek: 'Monday',
    currentDate: new Date().toLocaleDateString(),
    useLocalLanguage: true
  };

  console.log('\n🧪 Testing Direct AI Generation...\n');
  
  // Generate 3 pieces of content to check for uniqueness
  for (let i = 1; i <= 3; i++) {
    console.log(`\n--- Generation ${i} ---`);
    
    try {
      const result = await generateRevo10Content(testInput);
      
      console.log('📰 HEADLINE:', result.headline);
      console.log('📝 SUBHEADLINE:', result.subheadline);
      console.log('💬 CAPTION:', result.content.substring(0, 100) + '...');
      console.log('🎯 CTA:', result.callToAction);
      console.log('🏷️ HASHTAGS:', result.hashtags);
      
      if (result.diversityReport) {
        console.log('🎭 DIVERSITY:', result.diversityReport.isDiverse ? '✅ UNIQUE' : '❌ REPETITIVE');
        if (!result.diversityReport.isDiverse) {
          console.log('⚠️ Issues:', result.diversityReport.duplications);
        }
      }
      
      if (result.qualityReport) {
        console.log('⭐ QUALITY SCORE:', result.qualityReport.score);
        if (result.qualityReport.issues.length > 0) {
          console.log('⚠️ Quality Issues:', result.qualityReport.issues);
        }
      }
      
    } catch (error) {
      console.error(`❌ Generation ${i} failed:`, error.message);
    }
    
    // Wait 2 seconds between generations to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n🏁 Test Complete!\n');
}

// Run the test
testDirectGeneration().catch(console.error);