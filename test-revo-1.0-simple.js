/**
 * Simple test for Revo 1.0 API without complex dependencies
 */

const testPayload = {
  businessType: 'Financial Technology',
  platform: 'Instagram',
  visualStyle: 'modern',
  imageText: '',
  brandProfile: {
    businessName: 'Paya Finance',
    businessType: 'Financial Technology',
    location: 'Nairobi, Kenya',
    description: 'Mobile banking and Buy Now Pay Later services for Kenyan entrepreneurs',
    keyFeatures: ['Mobile Banking', 'Buy Now Pay Later', 'Instant Payments', 'No Credit Checks'],
    competitiveAdvantages: ['Zero hidden fees', 'Instant account opening', '24/7 mobile access'],
    services: ['Mobile Banking', 'BNPL Services', 'Business Payments', 'Money Transfers'],
    targetAudience: 'Small business owners and entrepreneurs in Kenya'
  },
  aspectRatio: '1:1',
  includePeopleInDesigns: true,
  useLocalLanguage: true
};

async function testSimpleAPI() {
  console.log('🧪 Simple Revo 1.0 API Test...\n');
  
  try {
    console.log('🚀 Making request to http://localhost:3001/api/generate-revo-1.0');
    
    const response = await fetch('http://localhost:3001/api/generate-revo-1.0', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('📡 Status:', response.status);
    console.log('📡 Status Text:', response.statusText);
    
    if (response.status === 500) {
      const errorText = await response.text();
      console.log('❌ Server Error Response:', errorText);
      return false;
    }
    
    if (!response.ok) {
      console.log('❌ HTTP Error:', response.status, response.statusText);
      return false;
    }
    
    const data = await response.json();
    console.log('✅ Response received');
    
    if (data.success) {
      console.log('🎉 SUCCESS! Content generated successfully');
      console.log('📊 Generated Content:');
      console.log('- Headline:', data.data.catchyWords || data.data.headline);
      console.log('- Subheadline:', data.data.subheadline);
      console.log('- Caption:', data.data.content);
      console.log('- CTA:', data.data.callToAction);
      console.log('- Hashtags:', data.data.hashtags);
      
      // Check for placeholder content
      const content = data.data;
      const hasPlaceholders = 
        (content.catchyWords && content.catchyWords.includes('Dynamic')) ||
        (content.headline && content.headline.includes('Dynamic')) ||
        (content.subheadline && content.subheadline.includes('Quality')) ||
        (content.content && content.content.includes('Dynamic'));
      
      console.log('\n🔍 Quality Check:');
      console.log('- Placeholder Content:', hasPlaceholders ? '❌ FOUND' : '✅ CLEAN');
      
      const hasBusinessSpecific = 
        (content.catchyWords && content.catchyWords.includes('Paya')) ||
        (content.content && (content.content.includes('Paya') || content.content.includes('mobile')));
      
      console.log('- Business-Specific:', hasBusinessSpecific ? '✅ FOUND' : '❌ MISSING');
      
      return !hasPlaceholders && hasBusinessSpecific;
    } else {
      console.log('❌ API Error:', data.error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Request Failed:', error.message);
    
    if (error.message.includes('fetch failed')) {
      console.log('\n💡 Server might not be running on port 3001');
      console.log('Try: npm run dev');
    }
    
    return false;
  }
}

// Run test
testSimpleAPI().then(success => {
  console.log('\n📋 Result:', success ? '✅ PASSED' : '❌ FAILED');
}).catch(error => {
  console.error('❌ Test failed:', error);
});
