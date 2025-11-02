// Test Vertex AI connection
const { generateContentDirect } = require('./src/ai/revo-2.0-service');

async function testVertexAI() {
  try {
    console.log('🧪 Testing Vertex AI connection...');
    
    const prompt = `Generate a simple JSON response with this format:
{
  "headline": "Test Headline",
  "subheadline": "Test Subheadline", 
  "caption": "Test caption for a financial technology business",
  "cta": "Learn More",
  "hashtags": ["#test", "#fintech"]
}`;

    console.log('📤 Sending prompt to Vertex AI...');
    const response = await generateContentDirect(prompt, 'gemini-2.5-flash', false);
    
    console.log('📥 Vertex AI Response:', response);
    
    if (response && response.text) {
      console.log('✅ Vertex AI is working!');
      console.log('📝 Response text:', response.text);
    } else {
      console.log('❌ Vertex AI returned empty response');
    }
    
  } catch (error) {
    console.error('❌ Vertex AI test failed:', error.message);
    console.error('🔍 Full error:', error);
  }
}

testVertexAI();
