const OpenAI = require('openai');
require('dotenv').config();

async function testOpenAIConnection() {
  console.log('🧪 Testing OpenAI Connection...');
  
  // Check if API key is configured
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    console.log('💡 Please add OPENAI_API_KEY to your .env.local file');
    return false;
  }
  
  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');
  
  try {
    const openai = new OpenAI({
      apiKey: apiKey,
      timeout: 30000,
      maxRetries: 2,
    });
    
    console.log('🔄 Testing GPT-4 text generation...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: 'Generate a short, creative headline for a Kenyan fintech company called Paya. Make it unique and engaging.'
        }
      ],
      max_tokens: 100,
      temperature: 0.8
    });
    
    const content = response.choices[0]?.message?.content;
    
    if (content) {
      console.log('✅ GPT-4 Connection Successful!');
      console.log('📝 Sample Response:', content);
      console.log('💰 Tokens Used:', response.usage?.total_tokens || 'Unknown');
      return true;
    } else {
      console.error('❌ No content received from GPT-4');
      return false;
    }
    
  } catch (error) {
    console.error('❌ OpenAI Connection Failed:', error.message);
    
    if (error.code === 'invalid_api_key') {
      console.log('💡 Please check your OPENAI_API_KEY is correct');
    } else if (error.code === 'insufficient_quota') {
      console.log('💡 Your OpenAI account has insufficient credits');
    } else if (error.code === 'model_not_found') {
      console.log('💡 GPT-4 model not available, trying GPT-3.5-turbo...');
      
      try {
        const fallbackResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test message' }],
          max_tokens: 50
        });
        console.log('✅ GPT-3.5-turbo works as fallback');
        return 'fallback';
      } catch (fallbackError) {
        console.error('❌ Even GPT-3.5-turbo failed:', fallbackError.message);
        return false;
      }
    }
    
    return false;
  }
}

// Run the test
testOpenAIConnection().then(result => {
  if (result === true) {
    console.log('\n🎉 OpenAI is ready for Revo 1.5 integration!');
  } else if (result === 'fallback') {
    console.log('\n⚠️ GPT-4 not available, but GPT-3.5-turbo works');
  } else {
    console.log('\n❌ OpenAI integration needs configuration');
  }
  process.exit(0);
});
