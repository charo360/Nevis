/**
 * Simple test script to verify Pure AI system functionality
 */

const { PureAIContentGenerator } = require('./src/services/pure-ai-content-generator.ts');

async function testPureAI() {
  console.log('🧪 Testing Pure AI Content Generator...');
  
  const testRequest = {
    businessType: 'Restaurant',
    businessName: 'Mama\'s Kitchen',
    services: 'Traditional African cuisine, catering, takeaway',
    platform: 'Instagram',
    contentType: 'all',
    targetAudience: 'Food lovers and families',
    location: 'Nairobi, Kenya',
    websiteUrl: 'https://mamaskitchen.co.ke',
    brandContext: {
      colors: ['#FF6B35', '#F7931E'],
      personality: 'Warm and welcoming',
      values: ['Authentic flavors', 'Family traditions', 'Quality ingredients']
    }
  };

  try {
    console.log('📝 Test request:', testRequest);
    
    const result = await PureAIContentGenerator.generateContent(testRequest);
    
    console.log('✅ Pure AI Test Results:');
    console.log('📰 Headline:', result.headline);
    console.log('📝 Subheadline:', result.subheadline);
    console.log('🎯 CTA:', result.cta);
    console.log('📖 Caption:', result.caption);
    console.log('🏷️ Hashtags:', result.hashtags);
    console.log('🎯 Confidence:', result.confidence);
    
    // Check for repetitive patterns
    const contentText = `${result.headline} ${result.subheadline} ${result.caption}`.toLowerCase();
    const repetitiveWords = ['upgrade', 'transform', 'solutions', 'excellence'];
    const hasRepetitive = repetitiveWords.some(word => contentText.includes(word));
    
    if (hasRepetitive) {
      console.log('⚠️ WARNING: Content contains repetitive patterns!');
    } else {
      console.log('✅ Content is unique and specific!');
    }
    
  } catch (error) {
    console.error('❌ Pure AI Test Failed:', error.message);
    console.error('🔍 Error details:', error);
  }
}

// Run the test
testPureAI().catch(console.error);