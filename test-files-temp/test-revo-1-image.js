/**
 * Test Revo 1.0 image generation directly
 */

// Import the function we need to test
const { getVertexAIClient } = require('./src/lib/services/vertex-ai-client.ts');

async function testRevo1ImageGeneration() {
  try {
    console.log('🧪 Testing Revo 1.0 image generation...');
    
    const client = getVertexAIClient();
    console.log('✅ Vertex AI client created successfully');
    
    const prompt = "Create a professional financial services social media post design for Instagram. Include text 'Paya Finance - Your Financial Partner' with modern blue colors (#1E40AF, #3B82F6). Show a professional African person using a mobile banking app in Nairobi, Kenya. 1:1 aspect ratio, clean modern design.";
    
    console.log('🖼️ Calling generateImage...');
    const result = await client.generateImage(prompt, 'gemini-2.5-flash-image-preview', {
      temperature: 0.7,
      maxOutputTokens: 8192
    });
    
    console.log('✅ Image generation successful!');
    console.log('📊 Result keys:', Object.keys(result));
    console.log('📊 Image data length:', result.imageData?.length || 0);
    console.log('📊 MIME type:', result.mimeType);
    console.log('📊 Finish reason:', result.finishReason);
    
    if (result.imageData) {
      console.log('✅ Image data received successfully');
      const dataUrl = `data:${result.mimeType || 'image/png'};base64,${result.imageData}`;
      console.log('📊 Data URL length:', dataUrl.length);
      console.log('📊 Data URL preview:', dataUrl.substring(0, 100) + '...');
    } else {
      console.log('❌ No image data in result');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
  }
}

testRevo1ImageGeneration();
