// Test OpenAI Key from Next.js server context
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    console.log('🔍 [Test OpenAI] Checking API key...');
    console.log('🔍 [Test OpenAI] Key exists:', !!apiKey);
    console.log('🔍 [Test OpenAI] Key length:', apiKey?.length || 0);
    console.log('🔍 [Test OpenAI] Key preview:', apiKey ? apiKey.substring(0, 20) + '...' + apiKey.substring(apiKey.length - 4) : 'MISSING');

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY not found in environment',
        keyExists: false
      });
    }

    // Test the key
    const openai = new OpenAI({ apiKey });
    
    console.log('🧪 [Test OpenAI] Testing API key validity...');
    const models = await openai.models.list();
    
    console.log('✅ [Test OpenAI] API key is valid! Models:', models.data.length);

    // Quick GPT test
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Say "working"' }],
      max_tokens: 10
    });

    const response = completion.choices[0].message.content;
    console.log('✅ [Test OpenAI] GPT-4 response:', response);

    return NextResponse.json({
      success: true,
      keyExists: true,
      keyLength: apiKey.length,
      keyPreview: apiKey.substring(0, 20) + '...' + apiKey.substring(apiKey.length - 4),
      modelsAvailable: models.data.length,
      gpt4Response: response,
      message: 'OpenAI API key is valid and working!'
    });

  } catch (error) {
    console.error('❌ [Test OpenAI] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const is401 = errorMessage.includes('401');
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      is401Error: is401,
      keyExists: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length || 0,
      keyPreview: process.env.OPENAI_API_KEY ? 
        process.env.OPENAI_API_KEY.substring(0, 20) + '...' + process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 4) : 
        'MISSING',
      suggestion: is401 ? 'API key is invalid or expired' : 'Check server logs for details'
    });
  }
}
