/**
 * Test script to verify AIML API with FLUX Kontext Max
 * Run with: node test-aiml-api.js
 */

async function testAIMLAPI() {
  console.log('🧪 Testing AIML API with FLUX Kontext Max...');

  // Your AIML API key from .env.local
  const apiKey = 'fa736f2cd7fe42829d2196c15357ae6e';

  if (!apiKey) {
    console.error('❌ AIML_API_KEY not found in .env.local');
    return;
  }

  console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');

  try {
    // Create a test prompt for Paya (Technology Company)
    const imagePrompt = 'Professional technology company social media post for Instagram, modern tech workspace, sleek devices, digital innovation, blue and white color scheme, square aspect ratio, Instagram-style composition, vibrant colors, high quality, professional photography, clean composition, modern design, no text overlay, photorealistic, 4K resolution, marketing ready';

    console.log('🎨 Image prompt:', imagePrompt);
    console.log('🚀 Making API call to AIML...');

    const response = await fetch('https://api.aimlapi.com/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'flux/kontext-max/text-to-image',
        prompt: imagePrompt,
        size: '1024x1024',
        quality: 'high',
        n: 1
      })
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ AIML API SUCCESS!');
      console.log('📊 Response data:', JSON.stringify(data, null, 2));

      if (data.data && data.data[0] && data.data[0].url) {
        console.log('🖼️ Generated image URL:', data.data[0].url);
        console.log('🎉 FLUX Kontext Max is working perfectly with your API key!');
      }
    } else {
      const errorText = await response.text();
      console.error('❌ AIML API Error:', response.status, errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAIMLAPI();
