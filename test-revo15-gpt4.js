const { CustomerCentricContentGenerator } = require('./src/ai/customer-centric-content-generator.ts');
require('dotenv').config();

async function testRevo15GPT4() {
  console.log('🧪 Testing Revo 1.5 with GPT-4...');
  
  // Sample Paya brand profile
  const payaBrandProfile = {
    businessName: 'Paya',
    businessType: 'Financial Technology',
    location: 'Kenya',
    services: ['Digital Banking', 'Payment Solutions', 'Buy Now Pay Later'],
    websiteUrl: 'https://paya.co.ke',
    brandColors: {
      primary: '#E4574C',
      secondary: '#2A2A2A'
    }
  };

  try {
    console.log('🔄 Generating content with GPT-4...');
    
    const content = await CustomerCentricContentGenerator.generateContent(
      payaBrandProfile,
      'instagram',
      {},
      false
    );

    console.log('✅ GPT-4 Content Generation Successful!');
    console.log('📝 Generated Content:');
    console.log('   Headline:', content.headline);
    console.log('   Subheadline:', content.subheadline);
    console.log('   Hook:', content.hook);
    console.log('   Promise:', content.promise);
    console.log('   Proof:', content.proof);
    console.log('   CTA:', content.cta);
    console.log('   Hashtags:', content.hashtags?.slice(0, 3).join(', '));

    // Check for content variety (not repetitive)
    const isUnique = !content.headline.includes('Empower Your Business') && 
                     !content.subheadline.includes('Grow Your Community');
    
    if (isUnique) {
      console.log('🎉 Content appears unique and non-repetitive!');
    } else {
      console.log('⚠️ Content may still be repetitive');
    }

    return true;

  } catch (error) {
    console.error('❌ Revo 1.5 GPT-4 Test Failed:', error.message);
    return false;
  }
}

// Run the test
testRevo15GPT4().then(success => {
  if (success) {
    console.log('\n🚀 Revo 1.5 is now powered by GPT-4!');
  } else {
    console.log('\n❌ GPT-4 integration needs fixing');
  }
  process.exit(0);
});
