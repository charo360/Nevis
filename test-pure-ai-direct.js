/**
 * Test Pure AI service directly to debug the issue
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const testPureAIDirect = async () => {
  console.log('🧪 Testing Pure AI service directly...\n');

  try {
    // Import the Pure AI service
    const { PureAIContentGenerator } = await import('./src/services/pure-ai-content-generator.ts');

    const request = {
      businessType: 'Restaurant',
      businessName: 'Mama Kitchen',
      services: 'Traditional cuisine, catering',
      platform: 'Instagram',
      contentType: 'all',
      targetAudience: 'Local families',
      location: 'Nairobi, Kenya',
      websiteUrl: 'https://mamakitchen.com',
      brandContext: {
        colors: ['#FF6B35', '#F7931E'],
        personality: 'Warm and welcoming',
        values: ['Authenticity', 'Quality', 'Family']
      }
    };

    console.log('🚀 Testing Pure AI Content Generator...');
    console.log('Request:', request);

    const result = await PureAIContentGenerator.generateContent(request);
    
    console.log('✅ Pure AI Content Generator successful!');
    console.log('Result:', {
      headline: result.headline,
      subheadline: result.subheadline,
      cta: result.cta,
      caption: result.caption?.substring(0, 100) + '...',
      hashtagCount: result.hashtags?.length,
      hashtags: result.hashtags,
      confidence: result.confidence
    });

  } catch (error) {
    console.error('❌ Pure AI Content Generator failed:', error.message);
    console.error('Stack:', error.stack);
  }
};

// Run the test
testPureAIDirect().catch(console.error);


