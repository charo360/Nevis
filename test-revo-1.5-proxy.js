/**
 * Test Revo 1.5 API with proxy integration
 */

async function testRevo15Proxy() {
  const baseUrl = 'http://localhost:3001';

  console.log('🔍 Testing Revo 1.5 API with proxy integration...');

  try {
    const testRequest = {
      businessType: 'restaurant',
      platform: 'instagram',
      brandProfile: {
        businessName: 'Test Restaurant',
        businessType: 'restaurant',
        location: 'Kenya',
        visualStyle: 'modern, warm',
        writingTone: 'friendly',
        contentThemes: ['food', 'dining'],
        logoUrl: null,
        logoDataUrl: null
      },
      imageText: '',
      visualStyle: 'modern, warm design',
      scheduledServices: []
    };

    console.log('\n🚀 Calling Revo 1.5 API...');
    const response = await fetch(`${baseUrl}/api/generate-revo-1.5`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testRequest)
    });

    console.log(`Response status: ${response.status}`);

    if (response.ok) {
      const result = await response.json();

      // Debug the imageUrl type
      console.log('🔍 Debug imageUrl:', {
        imageUrl: result.imageUrl,
        imageUrlType: typeof result.imageUrl,
        isString: typeof result.imageUrl === 'string',
        hasSubstring: typeof result.imageUrl?.substring === 'function'
      });

      console.log('✅ Revo 1.5 API success:', {
        hasCaption: !!result.caption,
        hasHashtags: !!result.hashtags,
        hasImageUrl: !!result.imageUrl,
        hasHeadline: !!result.headline,
        hasSubheadline: !!result.subheadline,
        captionLength: result.caption?.length || 0,
        hashtagsCount: result.hashtags?.length || 0,
        imageUrlPrefix: (typeof result.imageUrl === 'string' && result.imageUrl.length > 50)
          ? (result.imageUrl.substring(0, 50) + '...')
          : (result.imageUrl || 'No image URL')
      });

      console.log('\n📝 Generated Content:');
      console.log('Caption:', result.caption);
      console.log('Headline:', result.headline);
      console.log('Subheadline:', result.subheadline);
      console.log('Call to Action:', result.callToAction);
      console.log('Hashtags:', result.hashtags);
      console.log('Image URL type:', typeof result.imageUrl);
      console.log('Image URL value:', result.imageUrl);
    } else {
      const errorText = await response.text();
      console.log('❌ Revo 1.5 API failed:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRevo15Proxy();
