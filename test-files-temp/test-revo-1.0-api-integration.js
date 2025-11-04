/**
 * Integration test for Revo 1.0 API endpoint
 * Tests the complete content generation pipeline
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
    targetAudience: 'Small business owners and entrepreneurs in Kenya',
    competitors: []
  },
  aspectRatio: '1:1',
  includePeopleInDesigns: true,
  useLocalLanguage: true
};

async function testRevo10API() {
  console.log('🧪 Testing Revo 1.0 API Integration...\n');
  console.log('📋 Test Payload:');
  console.log('- Business:', testPayload.brandProfile.businessName);
  console.log('- Type:', testPayload.businessType);
  console.log('- Location:', testPayload.brandProfile.location);
  console.log('- Platform:', testPayload.platform);
  console.log('- Local Language:', testPayload.useLocalLanguage);

  try {
    console.log('\n🚀 Making API request to /api/generate-revo-1.0...');

    const response = await fetch('http://localhost:3001/api/generate-revo-1.0', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    console.log('📡 Response Status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ API Response received successfully');

    if (data.success && data.data) {
      const content = data.data;

      console.log('\n📊 Generated Content Analysis:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📰 Headline:', content.catchyWords || content.headline || 'N/A');
      console.log('📝 Subheadline:', content.subheadline || 'N/A');
      console.log('💬 Caption:', content.content || 'N/A');
      console.log('🎯 CTA:', content.callToAction || 'N/A');
      console.log('🏷️ Hashtags:', content.hashtags || 'N/A');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Quality checks
      console.log('\n🔍 Content Quality Analysis:');

      // Check for placeholder content
      const headline = content.catchyWords || content.headline || '';
      const subheadline = content.subheadline || '';
      const caption = content.content || '';
      const cta = content.callToAction || '';

      const hasPlaceholders =
        headline.includes('Dynamic') ||
        headline.includes('Your') && headline.includes('Solution') ||
        subheadline.includes('Quality') && subheadline.includes('services you can trust') ||
        caption.includes('Dynamic') ||
        cta === 'Learn More';

      console.log('🚨 Placeholder Check:', hasPlaceholders ? '❌ FOUND PLACEHOLDERS' : '✅ NO PLACEHOLDERS');

      // Check for business-specific content
      const hasBusinessSpecific =
        headline.includes('Paya') ||
        caption.includes('Paya') ||
        caption.includes('mobile') ||
        caption.includes('banking') ||
        caption.includes('Kenya') ||
        caption.includes('payment');

      console.log('🏢 Business-Specific Content:', hasBusinessSpecific ? '✅ FOUND' : '❌ MISSING');

      // Check for local language integration
      const hasLocalLanguage =
        caption.includes('Karibu') ||
        caption.includes('Poa') ||
        caption.includes('Haraka') ||
        caption.includes('Asante') ||
        caption.includes('M-Pesa') ||
        caption.includes('matatu') ||
        caption.includes('Nairobi');

      console.log('🌍 Local Language Integration:', hasLocalLanguage ? '✅ FOUND' : '⚠️ NOT DETECTED');

      // Check content structure
      const headlineWordCount = headline.split(' ').length;
      const subheadlineWordCount = subheadline.split(' ').length;
      const captionLength = caption.length;

      console.log('📏 Content Structure:');
      console.log(`- Headline: ${headlineWordCount} words (target: ≤6)`, headlineWordCount <= 6 ? '✅' : '❌');
      console.log(`- Subheadline: ${subheadlineWordCount} words (target: ≤25)`, subheadlineWordCount <= 25 ? '✅' : '❌');
      console.log(`- Caption: ${captionLength} chars (target: ≥50)`, captionLength >= 50 ? '✅' : '❌');

      // Check hashtags
      const hashtags = Array.isArray(content.hashtags) ? content.hashtags :
        typeof content.hashtags === 'string' ? content.hashtags.split(' ').filter(h => h.startsWith('#')) : [];

      console.log(`- Hashtags: ${hashtags.length} tags (target: 3-5)`, hashtags.length >= 3 && hashtags.length <= 5 ? '✅' : '❌');

      // Overall assessment
      const isHighQuality = !hasPlaceholders && hasBusinessSpecific &&
        headlineWordCount <= 6 && subheadlineWordCount <= 25 &&
        captionLength >= 50 && hashtags.length >= 3;

      console.log('\n🎯 Overall Quality Assessment:', isHighQuality ? '✅ HIGH QUALITY' : '❌ NEEDS IMPROVEMENT');

      if (isHighQuality) {
        console.log('\n🎉 SUCCESS! Revo 1.0 is generating high-quality, business-specific content!');
        console.log('\n🔧 Confirmed Improvements:');
        console.log('- ✅ No placeholder content detected');
        console.log('- ✅ Business-specific content generated');
        console.log('- ✅ Proper content structure (word limits)');
        console.log('- ✅ Appropriate hashtag count');
        console.log('- ✅ Advanced prompt system working');

        if (hasLocalLanguage) {
          console.log('- ✅ Local language integration active');
        }
      } else {
        console.log('\n⚠️ Content quality needs improvement. Check the issues above.');
      }

      // Metadata analysis
      if (data.data.metadata) {
        console.log('\n📈 Generation Metadata:');
        console.log('- Model:', data.data.metadata.model || 'N/A');
        console.log('- Processing Time:', data.data.metadata.processingTime || 'N/A');
        console.log('- Quality Score:', data.data.metadata.qualityScore || 'N/A');
      }

    } else {
      console.log('❌ API returned unsuccessful response:', data.error || 'Unknown error');
      return false;
    }

    return true;

  } catch (error) {
    console.error('❌ API Test Failed:', error.message);

    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Troubleshooting:');
      console.log('- Make sure the development server is running: npm run dev');
      console.log('- Check if the server is accessible at http://localhost:3001');
      console.log('- Verify the API endpoint exists: /api/generate-revo-1.0');
    }

    return false;
  }
}

// Run the test
console.log('🚀 Starting Revo 1.0 API Integration Test...\n');

testRevo10API().then(success => {
  console.log('\n📋 Test Result:', success ? '✅ PASSED' : '❌ FAILED');

  if (success) {
    console.log('\n🎯 Next Steps:');
    console.log('- Test with different business types');
    console.log('- Test with different platforms (Facebook, LinkedIn)');
    console.log('- Test with local language disabled');
    console.log('- Monitor for content repetition over multiple generations');
  }
}).catch(error => {
  console.error('❌ Test execution failed:', error);
});
