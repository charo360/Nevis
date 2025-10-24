import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
        GEMINI_API_KEY_REVO_1_5: !!process.env.GEMINI_API_KEY_REVO_1_5,
        GOOGLE_API_KEY: !!process.env.GOOGLE_API_KEY,
        GOOGLE_GENAI_API_KEY: !!process.env.GOOGLE_GENAI_API_KEY,
      },
      apiKeyLengths: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY?.length || 0,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY?.length || 0,
        GEMINI_API_KEY_REVO_1_5: process.env.GEMINI_API_KEY_REVO_1_5?.length || 0,
      },
      issues: [] as string[]
    };

    // Check for missing API keys
    if (!process.env.OPENAI_API_KEY) {
      diagnostics.issues.push('❌ OPENAI_API_KEY is missing - Required for Revo 1.5 content generation');
    }

    if (!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY_REVO_1_5 && !process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GENAI_API_KEY) {
      diagnostics.issues.push('❌ No Gemini API key found - Required for Revo 1.5 image generation');
    }

    // Test OpenAI connection if key exists
    if (process.env.OPENAI_API_KEY) {
      try {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const testResponse = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'Test connection - respond with "OK"' }],
          max_tokens: 5
        });
        
        diagnostics.issues.push('✅ OpenAI connection successful');
      } catch (openaiError) {
        diagnostics.issues.push(`❌ OpenAI connection failed: ${openaiError instanceof Error ? openaiError.message : 'Unknown error'}`);
      }
    }

    // Test Gemini connection if key exists
    const geminiKey = process.env.GEMINI_API_KEY_REVO_1_5 || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (geminiKey) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        const result = await model.generateContent('Test connection - respond with "OK"');
        const response = await result.response;
        
        diagnostics.issues.push('✅ Gemini connection successful');
      } catch (geminiError) {
        diagnostics.issues.push(`❌ Gemini connection failed: ${geminiError instanceof Error ? geminiError.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      diagnostics,
      recommendation: diagnostics.issues.length === 0 
        ? '✅ All systems ready for Revo 1.5'
        : '⚠️ Issues found - check API keys and connections'
    });

  } catch (error) {
    console.error('❌ [Debug] Diagnostic failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      recommendation: '❌ Critical error in diagnostic system'
    }, { status: 500 });
  }
}
